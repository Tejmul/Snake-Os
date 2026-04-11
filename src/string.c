#include "string.h"

/* Returns the length of a null-terminated string. */
int my_strlen(const char *s)
{
	const char *p;

	p = s;
	while (*p != '\0') {
		p++;
	}

	return (int)(p - s);
}

/* Copies src into dst including the terminating null byte. */
void my_strcpy(char *dst, const char *src)
{
	while (*src != '\0') {
		*dst = *src;
		dst++;
		src++;
	}

	*dst = '\0';
}

/* Compares two strings similarly to strcmp. */
int my_strcmp(const char *a, const char *b)
{
	while (*a != '\0' && *b != '\0' && *a == *b) {
		a++;
		b++;
	}

	return (int)((unsigned char)*a - (unsigned char)*b);
}

/* Reverses a null-terminated string in place. */
void my_str_reverse(char *s)
{
	char *left;
	char *right;
	char tmp;

	left = s;
	right = s;

	while (*right != '\0') {
		right++;
	}

	if (right == left) {
		return;
	}

	right--;
	while (left < right) {
		tmp = *left;
		*left = *right;
		*right = tmp;
		left++;
		right--;
	}
}

/* Converts an integer value to a null-terminated string. */
void my_int_to_str(int n, char *buf)
{
	char *p;
	unsigned int value;

	p = buf;
	if (n == 0) {
		*p = '0';
		p++;
		*p = '\0';
		return;
	}

	if (n < 0) {
		*p = '-';
		p++;
		value = (unsigned int)(-(n + 1)) + 1U;
	} else {
		value = (unsigned int)n;
	}

	while (value > 0U) {
		*p = (char)('0' + (value % 10U));
		p++;
		value /= 10U;
	}

	*p = '\0';

	if (*buf == '-') {
		my_str_reverse(buf + 1);
	} else {
		my_str_reverse(buf);
	}
}
