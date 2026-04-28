#include "../include/screen.h"
#include "../include/string.h"

#include <stdio.h>

static int g_screen_initialized = 0;
int atexit(void (*function)(void));

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

void screen_restore(void) {
	if (!g_screen_initialized) return;
	write_text("\033[?7h");      /* Re-enable line wrapping */
	write_text("\033[r");        /* Reset scroll region */
	write_text("\033[?25h");     /* Show cursor */
	write_text("\033[?1049l");   /* Restore main screen buffer */
	g_screen_initialized = 0;
}

void screen_init(void) {
	if (g_screen_initialized) return;
	write_text("\033[?1049h");   /* Switch to alternate screen buffer */
	write_text("\033[?25l");     /* Hide cursor */
	write_text("\033[?7l");      /* Disable line wrapping */
	write_text("\033[1;999r");   /* Set scroll region to full screen (locks it) */
	screen_clear();
	atexit(screen_restore);
	g_screen_initialized = 1;
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

/* Draws a UTF-8 string at the given screen position. */
static void draw_utf8_at(int x, int y, const char *s)
{
	screen_move_cursor(x, y);
	write_text(s);
}

/*
 * Draws the game board border using Unicode double-line box-drawing characters.
 * ╔═══════╗
 * ║ SCORE ║
 * ╠═══════╣
 * ║       ║
 * ╚═══════╝
 */
void screen_draw_border(int width, int height)
{
	int x;
	int y;

	if (width < 2 || height < 2) {
		return;
	}

	/* Top-left corner */
	draw_utf8_at(1, 1, "\xe2\x95\x94");  /* ╔ */
	/* Top-right corner */
	draw_utf8_at(width, 1, "\xe2\x95\x97");  /* ╗ */
	/* Middle-left tee */
	draw_utf8_at(1, 3, "\xe2\x95\xa0");  /* ╠ */
	/* Middle-right tee */
	draw_utf8_at(width, 3, "\xe2\x95\xa3");  /* ╣ */
	/* Bottom-left corner */
	draw_utf8_at(1, height, "\xe2\x95\x9a");  /* ╚ */
	/* Bottom-right corner */
	draw_utf8_at(width, height, "\xe2\x95\x9d");  /* ╝ */

	/* Top, middle, and bottom horizontal edges */
	x = 2;
	while (x < width) {
		draw_utf8_at(x, 1, "\xe2\x95\x90");  /* ═ */
		draw_utf8_at(x, 3, "\xe2\x95\x90");  /* ═ */
		draw_utf8_at(x, height, "\xe2\x95\x90");  /* ═ */
		x++;
	}

	/* Left and right vertical edges (score area) */
	draw_utf8_at(1, 2, "\xe2\x95\x91");  /* ║ */
	draw_utf8_at(width, 2, "\xe2\x95\x91");  /* ║ */

	/* Left and right vertical edges (play area) */
	y = 4;
	while (y < height) {
		draw_utf8_at(1, y, "\xe2\x95\x91");  /* ║ */
		draw_utf8_at(width, y, "\xe2\x95\x91");  /* ║ */
		y++;
	}
}

/*
 * Draws a Unicode double-line box at arbitrary position.
 * Used for the game-over card.
 */
void screen_draw_box(int bx, int by, int bw, int bh)
{
	int x;
	int y;

	if (bw < 2 || bh < 2) {
		return;
	}

	/* Corners */
	draw_utf8_at(bx, by, "\xe2\x95\x94");  /* ╔ */
	draw_utf8_at(bx + bw - 1, by, "\xe2\x95\x97");  /* ╗ */
	draw_utf8_at(bx, by + bh - 1, "\xe2\x95\x9a");  /* ╚ */
	draw_utf8_at(bx + bw - 1, by + bh - 1, "\xe2\x95\x9d");  /* ╝ */

	/* Horizontal edges */
	x = bx + 1;
	while (x < bx + bw - 1) {
		draw_utf8_at(x, by, "\xe2\x95\x90");  /* ═ */
		draw_utf8_at(x, by + bh - 1, "\xe2\x95\x90");  /* ═ */
		x++;
	}

	/* Vertical edges */
	y = by + 1;
	while (y < by + bh - 1) {
		draw_utf8_at(bx, y, "\xe2\x95\x91");  /* ║ */
		draw_utf8_at(bx + bw - 1, y, "\xe2\x95\x91");  /* ║ */
		y++;
	}
}

/*
 * Draws a horizontal separator inside a box using ╠═══╣.
 */
void screen_draw_box_separator(int bx, int by, int bw)
{
	int x;

	draw_utf8_at(bx, by, "\xe2\x95\xa0");  /* ╠ */
	draw_utf8_at(bx + bw - 1, by, "\xe2\x95\xa3");  /* ╣ */

	x = bx + 1;
	while (x < bx + bw - 1) {
		draw_utf8_at(x, by, "\xe2\x95\x90");  /* ═ */
		x++;
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
