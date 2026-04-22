#include "../include/keyboard.h"

#include <stdio.h>
#include <termios.h>
#include <unistd.h>

int atexit(void (*function)(void));

static struct termios g_original_termios;
static int g_keyboard_initialized = 0;
static int g_restore_registered = 0;
static int g_has_buffered_key = 0;
static char g_buffered_key = 0;

/* Converts raw escape sequences for arrow keys into WASD controls. */
static char map_key(char first)
{
	char second;
	char third;
	ssize_t n;

	if (first != 27) {
		return first;
	}

	n = read(STDIN_FILENO, &second, 1);
	if (n != 1) {
		return 0;
	}

	if (second != '[') {
		return 0;
	}

	n = read(STDIN_FILENO, &third, 1);
	if (n != 1) {
		return 0;
	}

	if (third == 'A') {
		return 'W';
	}

	if (third == 'B') {
		return 'S';
	}

	if (third == 'C') {
		return 'D';
	}

	if (third == 'D') {
		return 'A';
	}

	return 0;
}

/* Restores original terminal settings before process exit. */
void keyboard_restore(void)
{
	if (!g_keyboard_initialized) {
		return;
	}

	tcsetattr(STDIN_FILENO, TCSANOW, &g_original_termios);
	g_keyboard_initialized = 0;
}

/* Initializes terminal raw mode for real-time non-blocking input. */
void keyboard_init(void)
{
	struct termios raw;

	if (g_keyboard_initialized) {
		return;
	}

	if (tcgetattr(STDIN_FILENO, &g_original_termios) != 0) {
		return;
	}

	raw = g_original_termios;
	raw.c_lflag &= (unsigned int)~(ICANON | ECHO);
	raw.c_iflag &= (unsigned int)~(IXON | ICRNL);
	raw.c_oflag &= (unsigned int)~(OPOST);
	raw.c_cc[VMIN] = 0;
	raw.c_cc[VTIME] = 0;

	if (tcsetattr(STDIN_FILENO, TCSANOW, &raw) != 0) {
		return;
	}

	g_keyboard_initialized = 1;
	g_has_buffered_key = 0;

	if (!g_restore_registered) {
		atexit(keyboard_restore);
		g_restore_registered = 1;
	}
}

/* Returns 1 if input exists; key is buffered for the next read_key call. */
int key_pressed(void)
{
	char c;
	char mapped;
	ssize_t n;

	if (g_has_buffered_key) {
		return 1;
	}

	n = read(STDIN_FILENO, &c, 1);
	if (n != 1) {
		return 0;
	}

	mapped = map_key(c);
	if (mapped == 0) {
		return 0;
	}

	g_buffered_key = mapped;
	g_has_buffered_key = 1;
	return 1;
}

/* Reads one key without blocking; arrow keys are mapped to WASD. */
char read_key(void)
{
	char c;
	ssize_t n;

	if (g_has_buffered_key) {
		g_has_buffered_key = 0;
		return g_buffered_key;
	}

	n = read(STDIN_FILENO, &c, 1);
	if (n != 1) {
		return 0;
	}

	return map_key(c);
}
