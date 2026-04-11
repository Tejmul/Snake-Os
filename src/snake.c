#include "keyboard.h"
#include "math.h"
#include "memory.h"
#include "screen.h"
#include "string.h"

#define BOARD_WIDTH 40
#define BOARD_HEIGHT 20
#define SCORE_X 2
#define SCORE_Y 1
#define FRAME_DELAY_SPIN 2500000

typedef struct Snake {
    int x;
    int y;
    char direction;
} Snake;

static void delay_one_tick(void)
{
    volatile int i;

    i = 0;
    while (i < FRAME_DELAY_SPIN) {
        i++;
    }
}

static void update_direction(Snake *snake, char key)
{
    if (key == 'w' || key == 'W') {
        snake->direction = 'W';
    }

    if (key == 'a' || key == 'A') {
        snake->direction = 'A';
    }

    if (key == 's' || key == 'S') {
        snake->direction = 'S';
    }

    if (key == 'd' || key == 'D') {
        snake->direction = 'D';
    }
}

static void move_snake(Snake *snake)
{
    if (snake->direction == 'W') {
        snake->y -= 1;
    }

    if (snake->direction == 'A') {
        snake->x -= 1;
    }

    if (snake->direction == 'S') {
        snake->y += 1;
    }

    if (snake->direction == 'D') {
        snake->x += 1;
    }

    snake->x = my_clamp(snake->x, 2, BOARD_WIDTH - 1);
    snake->y = my_clamp(snake->y, 2, BOARD_HEIGHT - 1);
}

int main(void)
{
    Snake *snake;

    memory_init();
    keyboard_init();

    snake = (Snake *)my_alloc((int)sizeof(Snake));
    if (snake == 0) {
        return 1;
    }

    snake->x = BOARD_WIDTH / 2;
    snake->y = BOARD_HEIGHT / 2;
    snake->direction = 'D';

    while (1) {
        char key;

        if (key_pressed()) {
            key = read_key();
            update_direction(snake, key);
        }

        move_snake(snake);

        screen_clear();
        screen_draw_border(BOARD_WIDTH, BOARD_HEIGHT);
        screen_draw_string(SCORE_X, SCORE_Y, "SCORE: 0");
        screen_draw_char(snake->x, snake->y, '@');
        screen_move_cursor(1, BOARD_HEIGHT + 1);

        delay_one_tick();
    }
}
