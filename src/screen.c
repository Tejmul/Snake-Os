#include "../include/screen.h"
#include "../include/string.h"

#include <stdio.h>

/* Writes a null-terminated string to stdout using character output only. */
static void write_text(const char *s)
{
    while (*s != '\0') {
        putchar(*s);
        s++;
    }
}

/* Clears terminal screen and places cursor at the top-left corner. */
void screen_clear(void)
{
	write_text("\033[2J");
	write_text("\033[1;1H");
}

/* Moves the cursor to column x and row y. */
void screen_move_cursor(int x, int y)
{
	char xbuf[12];
	char ybuf[12];

	if (x < 1) {
		x = 1;
	}

	if (y < 1) {
		y = 1;
	}

	my_int_to_str(y, ybuf);
	my_int_to_str(x, xbuf);

	write_text("\033[");
	write_text(ybuf);
	putchar(';');
	write_text(xbuf);
	putchar('H');
}

/* Draws a single character at the given coordinate. */
void screen_draw_char(int x, int y, char c)
{
	screen_move_cursor(x, y);
	putchar(c);
}

/* Draws a string at the given coordinate. */
void screen_draw_string(int x, int y, const char *s)
{
	screen_move_cursor(x, y);
	while (*s != '\0') {
		putchar(*s);
		s++;
	}
}

/* Draws a border box of the requested width and height using '#'. */
void screen_draw_border(int width, int height)
{
	int x;
	int y;

	if (width < 2 || height < 2) {
		return;
	}

	x = 1;
	while (x <= width) {
		screen_draw_char(x, 1, '+');
		screen_draw_char(x, height, '+');
		x++;
	}

	y = 2;
	while (y < height) {
		screen_draw_char(1, y, '+');
		screen_draw_char(width, y, '+');
		y++;
	}
}

/* Flushes pending terminal output for the current frame. */
void screen_present(void)
{
	fflush(stdout);
}

/* Sets the ANSI foreground colour for subsequent drawing operations. */
void screen_set_color(int fg_color)
{
	char color[12];
	
	my_int_to_str(fg_color, color);

	write_text("\033[");
	write_text(color);
	write_text("m");
}

/* Resets the ANSI color to terminal default. */
void screen_reset_color(void)
{
	write_text("\033[0m");
}
