#ifndef SNAKE_OS_MEMORY_H
#define SNAKE_OS_MEMORY_H

/* Global virtual RAM block used by the custom allocator. */
extern char VRAM[8192] __attribute__((aligned(sizeof(void *))));

/* Initializes VRAM and resets allocator state. */
void memory_init(void);

/* Allocates a chunk from VRAM using a simple block reuse allocator. */
void *my_alloc(int size);

/* Returns a chunk previously obtained via my_alloc to the VRAM pool. */
void my_dealloc(void *ptr);

/* Debug helper: prints the number of used vs available blocks on screen. */
void memory_dump(void);

#endif /* SNAKE_OS_MEMORY_H */
