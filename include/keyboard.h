#ifndef SNAKE_OS_KEYBOARD_H
#define SNAKE_OS_KEYBOARD_H

/* Initializes terminal raw mode for real-time non-blocking input. */
void keyboard_init(void);

/* Restores original terminal settings before process exit. */
void keyboard_restore(void);

/* Returns 1 if at least one key is pending, otherwise 0. */
int key_pressed(void);

/* Reads one key without blocking; returns 0 if no key is available. */
char read_key(void);

#endif /* SNAKE_OS_KEYBOARD_H */
