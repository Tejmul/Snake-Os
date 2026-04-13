#include "memory.h"

#include "screen.h"
#include "string.h"

/*
 * NOTE:
 * - No libc heap allocation is used anywhere.
 * - All allocations live inside the global VRAM[8192] byte array.
 * - Every block begins with a tiny header: { int size; int is_free; }
 */

#define VRAM_SIZE 8192

/* Keep the global VRAM[8192] array as required, but ensure it's aligned. */
char VRAM[8192] __attribute__((aligned(sizeof(void *))));

/*
 * Each allocation is stored as:
 *   [BlockHeader][payload bytes...]
 *
 * size    = payload size in bytes (aligned up).
 * is_free = 1 if the payload is available for reuse.
 */
typedef struct BlockHeader {
	int size;
	int is_free;
} BlockHeader;

/* We keep an implicit list of blocks by walking from VRAM[0] to g_heap_end. */
static int g_heap_end = 0;

/* Align sizes so that each header/payload starts at a safe boundary. */
static int align_up(int n)
{
	int alignment;
	int rem;

	alignment = (int)sizeof(void *);
	if (alignment <= 0) {
		alignment = 4;
	}

	rem = n % alignment;
	if (rem == 0) {
		return n;
	}

	return n + (alignment - rem);
}

static int header_size(void)
{
	return align_up((int)sizeof(BlockHeader));
}

/* Returns 1 if the header pointer is inside the carved heap region. */
static int header_in_heap(const BlockHeader *hdr)
{
	const char *p;

	p = (const char *)hdr;
	return (p >= &VRAM[0]) && (p < &VRAM[g_heap_end]);
}

/*
 * Coalesces adjacent free blocks starting at hdr.
 * This reduces fragmentation after frees.
 */
static void coalesce_forward(BlockHeader *hdr)
{
	BlockHeader *next;
	char *next_addr;
	int hsz;

	hsz = header_size();

	while (1) {
		next_addr = (char *)hdr + hsz + hdr->size;
		if (next_addr >= &VRAM[g_heap_end]) {
			return;
		}

		next = (BlockHeader *)next_addr;
		if (!next->is_free) {
			return;
		}

		/* Merge next into hdr: grow payload to cover next header + payload. */
		hdr->size += hsz + next->size;
	}
}

/*
 * Initializes allocator state and clears VRAM.
 * g_heap_end tracks the end of the carved heap region inside VRAM.
 */
void memory_init(void)
{
	int i;

	/* Reset heap state (no blocks carved yet). */
	g_heap_end = 0;

	/* Clear VRAM for predictable debugging output. */
	i = 0;
	while (i < VRAM_SIZE) {
		VRAM[i] = 0;
		i++;
	}
}

/*
 * Allocates memory from VRAM.
 * - First tries to reuse a previously freed block (first-fit).
 * - If none fits, carves a new block at the end of the heap.
 */
void *my_alloc(int size)
{
	int need;
	int hsz;
	int offset;
	BlockHeader *hdr;

	/* Step 1: validate and align request. */
	if (size <= 0) {
		return 0;
	}

	hsz = header_size();
	need = align_up(size);

	/* Step 2: first-fit scan for a free block. */
	offset = 0;
	while (offset < g_heap_end) {
		hdr = (BlockHeader *)(&VRAM[offset]);

		if (hdr->is_free && hdr->size >= need) {
			int remaining;

			/* Step 2a: optionally split if there is room for another block. */
			remaining = hdr->size - need;
			if (remaining >= hsz + (int)sizeof(void *)) {
				BlockHeader *split;
				char *split_addr;

				split_addr = (char *)hdr + hsz + need;
				split = (BlockHeader *)split_addr;
				split->size = remaining - hsz;
				split->is_free = 1;

				hdr->size = need;
			}

			hdr->is_free = 0;
			return (void *)((char *)hdr + hsz);
		}

		offset += hsz + hdr->size;
	}

	/* Step 3: no reusable block found; carve a new block at the end. */
	if (g_heap_end + hsz + need > VRAM_SIZE) {
		return 0;
	}

	hdr = (BlockHeader *)(&VRAM[g_heap_end]);
	hdr->size = need;
	hdr->is_free = 0;

	g_heap_end += hsz + need;
	return (void *)((char *)hdr + hsz);
}

/*
 * Frees memory previously returned by my_alloc().
 * - Marks the block header as free.
 * - Coalesces adjacent free blocks to reduce fragmentation.
 */
void my_dealloc(void *ptr)
{
	BlockHeader *hdr;
	int hsz;
	int offset;
	BlockHeader *prev;
	BlockHeader *cur;
	char *payload;

	/* Step 1: ignore NULL frees. */
	if (ptr == 0) {
		return;
	}

	hsz = header_size();
	payload = (char *)ptr;

	/* Step 2: basic range check (must point inside carved heap area). */
	if (payload < &VRAM[hsz] || payload >= &VRAM[g_heap_end]) {
		return;
	}

	/* Step 3: recover the header and mark it free. */
	hdr = (BlockHeader *)(payload - hsz);
	if (!header_in_heap(hdr)) {
		return;
	}

	hdr->is_free = 1;

	/* Step 4: merge with any free blocks immediately after this one. */
	coalesce_forward(hdr);

	/* Step 5: merge with a free previous block (requires a scan). */
	prev = 0;
	offset = 0;
	while (offset < g_heap_end) {
		cur = (BlockHeader *)(&VRAM[offset]);
		if (cur == hdr) {
			break;
		}
		prev = cur;
		offset += hsz + cur->size;
	}

	if (prev != 0 && prev->is_free) {
		coalesce_forward(prev);
	}
}

/*
 * Prints allocator summary for debugging.
 * Uses screen_draw_string to keep output consistent with the rest of Snake-OS.
 */
void memory_dump(void)
{
	int used_blocks;
	int free_blocks;
	int offset;
	int hsz;
	BlockHeader *hdr;
	char used_buf[16];
	char free_buf[16];
	char msg[80];
	const char *p1;
	const char *p2;
	int len;
	int x;

	used_blocks = 0;
	free_blocks = 0;
	hsz = header_size();

	offset = 0;
	while (offset < g_heap_end) {
		hdr = (BlockHeader *)(&VRAM[offset]);
		if (hdr->is_free) {
			free_blocks += 1;
		} else {
			used_blocks += 1;
		}
		offset += hsz + hdr->size;
	}

	/* Build: "MEM: used=<n> free=<m>" without sprintf. */
	my_int_to_str(used_blocks, used_buf);
	my_int_to_str(free_blocks, free_buf);

	p1 = "MEM: used=";
	p2 = " free=";
	len = 0;
	my_strcpy(msg + len, p1);
	len += my_strlen(p1);
	my_strcpy(msg + len, used_buf);
	len += my_strlen(used_buf);
	my_strcpy(msg + len, p2);
	len += my_strlen(p2);
	my_strcpy(msg + len, free_buf);
	len += my_strlen(free_buf);
	msg[len] = '\0';

	/* Clear the line first so shrinking messages don't leave stale chars. */
	x = 1;
	while (x <= 80) {
		screen_draw_char(x, 22, ' ');
		x++;
	}
	/* Default debug location: just below the 20-row board used by snake. */
	screen_draw_string(1, 22, msg);
}
