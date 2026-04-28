#ifndef SNAKE_OS_SCREEN_H
#define SNAKE_OS_SCREEN_H

/* Initializes the terminal viewport, alternate screen buffer, and hides cursor. */
void screen_init(void);

/* Restores the original terminal state. */
void screen_restore(void);

/* Clears the terminal using ANSI escape codes. */
void screen_clear(void);

/* Moves the cursor to column x and row y using ANSI escape codes. */
void screen_move_cursor(int x, int y);

/* Draws one character at the given screen position. */
void screen_draw_char(int x, int y, char c);

/* Draws a null-terminated string at the given screen position. */
void screen_draw_string(int x, int y, const char *s);

/* Draws a rectangular border using Unicode box-drawing characters. */
void screen_draw_border(int width, int height);

/* Draws a Unicode double-line box at arbitrary position. */
void screen_draw_box(int bx, int by, int bw, int bh);

/* Draws a horizontal separator inside a box using ╠═══╣. */
void screen_draw_box_separator(int bx, int by, int bw);

/* Flushes pending terminal output for the current frame. */
void screen_present(void);

/* Sets the ANSI foreground color for subsequent drawing operations. */
void screen_set_color(int fg_color);

/* Resets the ANSI color to terminal default. */
void screen_reset_color(void);

#endif /* SNAKE_OS_SCREEN_H */
