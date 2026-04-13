#ifndef SNAKE_OS_STRING_H
#define SNAKE_OS_STRING_H

/* Returns the length of a null-terminated string. */
int my_strlen(const char *s);

/* Copies src into dst including the terminating null byte. */
void my_strcpy(char *dst, const char *src);

/* Lexicographic compare of two C strings (libc-style). */
int my_strcmp(const char *a, const char *b);

/* Converts an integer value to a null-terminated string. */
void my_int_to_str(int n, char *buf);

/* Reverses a null-terminated string in place. */
void my_str_reverse(char *s);

#endif /* SNAKE_OS_STRING_H */
