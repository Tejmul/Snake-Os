#include "memory.h"

#include <stdlib.h>

char VRAM[8192];

static int g_alloc_offset = 0;
static char *g_startup_vram = 0;

/*
 * Initializes allocator state and clears VRAM.
 * The offset tracks the next free byte inside VRAM.
 */
void memory_init(void)
{
	int i;

	if (g_startup_vram == 0) {
		g_startup_vram = (char *)malloc(8192);
	}

	g_alloc_offset = 0;
	i = 0;
	while (i < 8192) {
		VRAM[i] = 0;
		i++;
	}
}

/*
 * Allocates memory from VRAM by returning current offset,
 * then bumping the offset forward by the requested size.
 */
void *my_alloc(int size)
{
	int start;

	if (size <= 0) {
		return 0;
	}

	if (g_alloc_offset + size > 8192) {
		return 0;
	}

	start = g_alloc_offset;
	g_alloc_offset += size;

	return (void *)&VRAM[start];
}

/*
 * Phase 1 stub: bump allocator does not free individual blocks.
 * Memory is reclaimed only when memory_init resets the offset.
 */
void my_dealloc(void *ptr)
{
	(void)ptr;
}
