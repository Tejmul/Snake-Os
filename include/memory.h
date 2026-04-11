#ifndef SNAKE_OS_MEMORY_H
#define SNAKE_OS_MEMORY_H

/* Global virtual RAM block used by the custom allocator. */
extern char VRAM[8192] __attribute__((aligned(sizeof(void *))));

/* Initializes VRAM and resets allocator state. */
void memory_init(void);

/* Allocates a chunk from VRAM using a simple free-list allocator. */
void *my_alloc(int size);

/* Frees a chunk previously returned by my_alloc by marking its block as free. */
void my_dealloc(void *ptr);

/* Debug helper: prints the number of used vs free blocks on screen. */
void memory_dump(void);

#endif /* SNAKE_OS_MEMORY_H */
