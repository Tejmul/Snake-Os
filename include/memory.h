#ifndef SNAKE_OS_MEMORY_H
#define SNAKE_OS_MEMORY_H

/* Global virtual RAM block used by the custom allocator. */
extern char VRAM[8192];

/* Initializes VRAM and resets allocator offset to the start. */
void memory_init(void);

/* Allocates a chunk from VRAM using a bump offset strategy. */
void *my_alloc(int size);

/* Phase 1 deallocation stub; does not reclaim individual chunks. */
void my_dealloc(void *ptr);

#endif /* SNAKE_OS_MEMORY_H */
