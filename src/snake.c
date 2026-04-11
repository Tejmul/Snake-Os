#include "keyboard.h"
#include "math.h"
#include "memory.h"
#include "screen.h"
#include "string.h"

#include <unistd.h>

#define BOARD_WIDTH 40
#define BOARD_HEIGHT 20
#define SCORE_X 2
#define SCORE_Y 1

typedef struct Snake {
    int x;
    int y;
    char direction;
} Snake;

static void delay_one_tick(void)
{
	usleep(100000);
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
    int running;
    int old_x;
    int old_y;

    memory_init();
    keyboard_init();

    snake = (Snake *)my_alloc((int)sizeof(Snake));
    if (snake == 0) {
        return 1;
    }

    snake->x = BOARD_WIDTH / 2;
    snake->y = BOARD_HEIGHT / 2;
    snake->direction = 'D';
    running = 1;
    old_x = snake->x;
    old_y = snake->y;

    screen_clear();
    screen_draw_border(BOARD_WIDTH, BOARD_HEIGHT);
    screen_draw_string(SCORE_X, SCORE_Y, "SCORE: 0");
    screen_draw_char(snake->x, snake->y, '@');
    screen_move_cursor(1, BOARD_HEIGHT + 1);
    screen_present();

    while (running) {
        char key;

        if (key_pressed()) {
            key = read_key();
            if (key == 'q' || key == 'Q') {
                running = 0;
            }
            update_direction(snake, key);
        }

        if (!running) {
            break;
        }

        old_x = snake->x;
        old_y = snake->y;
        move_snake(snake);

        if (old_x != snake->x || old_y != snake->y) {
            screen_draw_char(old_x, old_y, ' ');
        }
        screen_draw_char(snake->x, snake->y, '@');
        screen_move_cursor(1, BOARD_HEIGHT + 1);
        screen_present();

        delay_one_tick();
    }

    keyboard_restore();
    return 0;
}
