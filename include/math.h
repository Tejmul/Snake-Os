#ifndef SNAKE_OS_MATH_H
#define SNAKE_OS_MATH_H

/* Returns the absolute value of an integer. */
int my_abs(int a);

/* Multiplies two integers using repeated addition/subtraction. */
int my_mul(int a, int b);

/* Divides two integers using repeated subtraction. */
int my_div(int a, int b);

/* Computes remainder using repeated subtraction. */
int my_mod(int a, int b);

/* Clamps a value to the inclusive range [min, max]. */
int my_clamp(int val, int min, int max);

#endif /* SNAKE_OS_MATH_H */
