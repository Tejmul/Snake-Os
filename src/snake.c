#include "keyboard.h"
#include "memory.h"
#include "screen.h"
#include "string.h"

#include <unistd.h>
#include <time.h>

#define BOARD_WIDTH 40
#define BOARD_HEIGHT 20

#define SCORE_ROW 2
#define PLAY_MIN_X 2
#define PLAY_MAX_X (BOARD_WIDTH - 1)
#define PLAY_MIN_Y 3
#define PLAY_MAX_Y (BOARD_HEIGHT - 1)

#define FOOD_CHAR '*'

/*
 * Tail linked-list implementation (no arrays):
 * Each Segment node is allocated from VRAM via my_alloc() and freed via my_dealloc().
 */
typedef struct Segment {
    int x;
    int y;
    struct Segment *next;
} Segment;

/* Required globals */
Segment *snake_head = 0;
int snake_length = 0;

/* Adds a new segment at the front of the list (closest to the snake head). */
void tail_push_front(int x, int y)
{
    Segment *node;

    /* Step 1: allocate a new node from our custom allocator. */
    node = (Segment *)my_alloc((int)sizeof(Segment));
    if (node == 0) {
        return;
    }

    /* Step 2: fill the node and link it as the new list head. */
    node->x = x;
    node->y = y;
    node->next = snake_head;
    snake_head = node;
    snake_length += 1;
}

/* Removes the last segment (furthest from the snake head) and frees it. */
void tail_pop_back(void)
{
    Segment *prev;
    Segment *cur;

    /* Step 1: empty list => nothing to pop. */
    if (snake_head == 0) {
        return;
    }

    /* Step 2: single-element list. */
    if (snake_head->next == 0) {
        /* Clear the last drawn tail character from the board. */
        screen_draw_char(snake_head->x, snake_head->y, ' ');
        my_dealloc((void *)snake_head);
        snake_head = 0;
        snake_length = 0;
        return;
    }

    /* Step 3: walk to the last node, keeping track of the previous. */
    prev = snake_head;
    cur = snake_head->next;
    while (cur->next != 0) {
        prev = cur;
        cur = cur->next;
    }

    /* Step 4: unlink, erase from screen, then free the node. */
    prev->next = 0;
    screen_draw_char(cur->x, cur->y, ' ');
    my_dealloc((void *)cur);
    snake_length -= 1;
}

/* Draws all tail segments as 'o'. (The snake head '@' is drawn separately.) */
void tail_draw(void)
{
    Segment *cur;

    cur = snake_head;
    while (cur != 0) {
        screen_draw_char(cur->x, cur->y, 'o');
        cur = cur->next;
    }
}

/* Returns 1 if any tail segment occupies (x, y). */
int tail_collides(int x, int y)
{
    Segment *cur;

    cur = snake_head;
    while (cur != 0) {
        if (cur->x == x && cur->y == y) {
            return 1;
        }
        cur = cur->next;
    }

    return 0;
}

typedef struct Snake {
    int x;
    int y;
    char direction;
} Snake;

typedef struct Food {
    int x;
    int y;
} Food;

static unsigned int g_rng_state = 1U;

static unsigned int next_rand(void)
{
    g_rng_state = g_rng_state * 1103515245U + 12345U;
    return g_rng_state;
}

static void seed_rng(void)
{
    unsigned int seed;

    seed = (unsigned int)time(0);
    if (seed == 0U) {
        seed = 1U;
    }
    g_rng_state = seed;
}

static void draw_score_row(int width, int score)
{
    int x;
    char score_num[16];
    char score_text[32];
    const char *label;
    int label_len;
    int num_len;

    label = "SCORE: ";
    label_len = my_strlen(label);

    my_int_to_str(score, score_num);
    num_len = my_strlen(score_num);

    my_strcpy(score_text, label);
    my_strcpy(score_text + label_len, score_num);
    score_text[label_len + num_len] = '\0';

    screen_draw_char(1, SCORE_ROW, '#');
    screen_draw_char(width, SCORE_ROW, '#');

    x = 2;
    while (x <= width - 1) {
        screen_draw_char(x, SCORE_ROW, ' ');
        x++;
    }

    screen_draw_string(3, SCORE_ROW, score_text);
}

/* Returns 1 if a free cell was found, 0 if the board has no empty cell. */
static int place_food(Food *food, const Snake *snake)
{
    int x;
    int y;
    int tries;
    int total;

    total = (PLAY_MAX_X - PLAY_MIN_X + 1) * (PLAY_MAX_Y - PLAY_MIN_Y + 1);

    tries = 0;
    while (tries < total) {
        tries += 1;
        x = (int)(next_rand() % (unsigned int)(PLAY_MAX_X - PLAY_MIN_X + 1)) + PLAY_MIN_X;
        y = (int)(next_rand() % (unsigned int)(PLAY_MAX_Y - PLAY_MIN_Y + 1)) + PLAY_MIN_Y;

        if ((x == snake->x && y == snake->y) || tail_collides(x, y)) {
            continue;
        }

        food->x = x;
        food->y = y;
        return 1;
    }

    y = PLAY_MIN_Y;
    while (y <= PLAY_MAX_Y) {
        x = PLAY_MIN_X;
        while (x <= PLAY_MAX_X) {
            if ((x != snake->x || y != snake->y) && !tail_collides(x, y)) {
                food->x = x;
                food->y = y;
                return 1;
            }
            x += 1;
        }
        y += 1;
    }

    return 0;
}

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

/* Returns 0 if the next step would leave the play area (game over). */
static int move_snake(Snake *snake)
{
    int nx;
    int ny;

    nx = snake->x;
    ny = snake->y;

    if (snake->direction == 'W') {
        ny -= 1;
    }

    if (snake->direction == 'A') {
        nx -= 1;
    }

    if (snake->direction == 'S') {
        ny += 1;
    }

    if (snake->direction == 'D') {
        nx += 1;
    }

    if (nx < PLAY_MIN_X || nx > PLAY_MAX_X || ny < PLAY_MIN_Y || ny > PLAY_MAX_Y) {
        return 0;
    }

    snake->x = nx;
    snake->y = ny;
    return 1;
}

int main(void)
{
    Snake *snake;
    Food food;
    int running;
    int old_x;
    int old_y;
	int score;

    memory_init();
    keyboard_init();
	seed_rng();

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
	score = 0;
	if (!place_food(&food, snake)) {
		my_dealloc((void *)snake);
		keyboard_restore();
		return 1;
	}

    screen_clear();
    screen_draw_border(BOARD_WIDTH, BOARD_HEIGHT);
	draw_score_row(BOARD_WIDTH, score);
    screen_draw_char(snake->x, snake->y, '@');
	screen_draw_char(food.x, food.y, FOOD_CHAR);
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
        if (!move_snake(snake)) {
            running = 0;
        }

        /* Only update tail when the head actually moved. */
        if (old_x != snake->x || old_y != snake->y) {
            int ate;

            ate = 0;
            if (snake->x == food.x && snake->y == food.y) {
                score += 1;
                ate = 1;
                draw_score_row(BOARD_WIDTH, score);
                if (!place_food(&food, snake)) {
                    running = 0;
                } else {
                    screen_draw_char(food.x, food.y, FOOD_CHAR);
                }
            }

            /* Step 1: old head becomes the newest tail segment. */
            tail_push_front(old_x, old_y);

            /* Step 2: keep tail length equal to score (grow by 1 per food). */
            if (!ate) {
                while (snake_length > score) {
                    tail_pop_back();
                }
            }

            /* Step 3: collision check after tail update (allows stepping into old tail-end). */
            if (tail_collides(snake->x, snake->y)) {
                running = 0;
            }
        }

        /* Redraw tail (segments) and then the head. */
        tail_draw();
        screen_draw_char(snake->x, snake->y, '@');
        screen_move_cursor(1, BOARD_HEIGHT + 1);
        screen_present();

        if (!running) {
            break;
        }

        delay_one_tick();
    }

    /* Free any remaining tail segments before exit (true runtime free). */
    while (snake_head != 0) {
        tail_pop_back();
    }

    my_dealloc((void *)snake);
    keyboard_restore();
    return 0;
}
