#include "../include/math.h"

/* Returns the absolute value of an integer. */
int my_abs(int a)
{
	if (a < 0) {
		return -a;
	}

	return a;
}

/* Multiplies two integers using repeated addition/subtraction. */
int my_mul(int a, int b)
{
	int i;
	int result;
	int sign;
	int abs_b;

	result = 0;
	sign = 1;

	if (a < 0) {
		a = -a;
		sign = -sign;
	}

	if (b < 0) {
		b = -b;
		sign = -sign;
	}

	abs_b = b;
	i = 0;
	while (i < abs_b) {
		result += a;
		i++;
	}

	if (sign < 0) {
		return -result;
	}

	return result;
}

/* Divides two integers using repeated subtraction. */
int my_div(int a, int b)
{
	int sign;
	int abs_a;
	int abs_b;
	int quotient;

	if (b == 0) {
		return 0;
	}

	sign = 1;
	abs_a = a;
	abs_b = b;

	if (abs_a < 0) {
		abs_a = -abs_a;
		sign = -sign;
	}

	if (abs_b < 0) {
		abs_b = -abs_b;
		sign = -sign;
	}

	quotient = 0;
	while (abs_a >= abs_b) {
		abs_a -= abs_b;
		quotient++;
	}

	if (sign < 0) {
		return -quotient;
	}

	return quotient;
}

/* Computes remainder using repeated subtraction. */
int my_mod(int a, int b)
{
	int abs_a;
	int abs_b;
	int remainder;

	if (b == 0) {
		return 0;
	}

	abs_a = a;
	abs_b = b;

	if (abs_a < 0) {
		abs_a = -abs_a;
	}

	if (abs_b < 0) {
		abs_b = -abs_b;
	}

	remainder = abs_a;
	while (remainder >= abs_b) {
		remainder -= abs_b;
	}

	if (a < 0) {
		return -remainder;
	}

	return remainder;
}

/* Clamps a value to the inclusive range [min, max]. */
int my_clamp(int val, int min, int max)
{
	if (val < min) {
		return min;
	}

	if (val > max) {
		return max;
	}

	return val;
}
