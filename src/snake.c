#include "keyboard.h"
#include "math.h"
#include "memory.h"
#include "screen.h"
#include "string.h"

#include <unistd.h>

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
    int active;
} Food;

/* Global tick counter used as pseudo-random seed for food placement. */
static int g_tick = 0;

/* Global food pointer, heap-allocated via my_alloc(). */
static Food *g_food = 0;

/* Global game state flags. */
static int game_over = 0;
static int score = 0;
static int foods_eaten = 0;

/* Adds points to the global score. */
static void score_add(int points)
{
    score += points;
}

/*
 * Draws the top score bar showing "SCORE: X  LENGTH: Y".
 * Uses my_int_to_str() and my_strcpy() from string.c only — no printf("%d").
 */
static void score_draw(void)
{
    int x;
    int len;
    char buf[40];
    char num[16];

    /* Step 1: clear the score row (between borders). */
    screen_draw_char(1, SCORE_ROW, '#');
    screen_draw_char(BOARD_WIDTH, SCORE_ROW, '#');

    x = 2;
    while (x <= BOARD_WIDTH - 1) {
        screen_draw_char(x, SCORE_ROW, ' ');
        x++;
    }

    /* Step 2: build "SCORE: <n>" using manual string concat. */
    my_strcpy(buf, "SCORE: ");
    my_int_to_str(score, num);
    my_strcpy(buf + my_strlen(buf), num);

    /* Step 3: append "  LENGTH: <n>" to the same buffer. */
    len = my_strlen(buf);
    my_strcpy(buf + len, "  LENGTH: ");
    len = my_strlen(buf);
    my_int_to_str(snake_length + 1, num);
    my_strcpy(buf + len, num);

    /* Step 4: draw the combined string on the score row. */
    screen_draw_string(3, SCORE_ROW, buf);
}

/*
 * Spawns food at a pseudo-random position using a tick-based formula.
 * Uses my_mod() from math.c — no rand() or srand() allowed.
 * Retries with an incremented tick if the position overlaps any snake segment.
 */
static void food_spawn(int board_w, int board_h)
{
    int x;
    int y;

    while (1) {
        g_tick++;
        x = my_mod(g_tick * 37 + 17, board_w - 2) + 1;
        y = my_mod(g_tick * 53 + 11, board_h - 2) + 1;

        /* Make sure food does not spawn on the snake using tail_collides(). */
        if (tail_collides(x, y)) {
            continue;
        }

        g_food->x = x;
        g_food->y = y;
        g_food->active = 1;
        return;
    }
}

/*
 * Returns 1 if (x, y) is outside the playable area.
 * Uses my_clamp() from math.c: if clamping changes the value, it was out of bounds.
 */
static int hits_wall(int x, int y, int board_w, int board_h)
{
    int cx;
    int cy;

    cx = my_clamp(x, PLAY_MIN_X, board_w - 1);
    cy = my_clamp(y, PLAY_MIN_Y, board_h - 1);

    /* If clamped value differs from original, the position was outside. */
    if (my_abs(cx - x) != 0 || my_abs(cy - y) != 0) {
        return 1;
    }

    return 0;
}

/*
 * Returns 1 if the snake head overlaps any tail segment.
 * Delegates to tail_collides() from the tail linked-list implementation.
 */
static int hits_self(int x, int y)
{
    return tail_collides(x, y);
}

/*
 * Returns 1 if position (x, y) matches the food position.
 * Uses my_abs() from math.c instead of direct == comparison.
 */
static int hits_food(int x, int y, Food *f)
{
    if (my_abs(x - f->x) == 0 && my_abs(y - f->y) == 0) {
        return 1;
    }

    return 0;
}

/*
 * Handles food eating: grows the snake, respawns food, and adds 10 to score.
 */
static void food_eat(void)
{
    score_add(10);
    foods_eaten += 1;
    g_food->active = 0;
    food_spawn(BOARD_WIDTH, BOARD_HEIGHT);
    score_draw();
    screen_draw_char(g_food->x, g_food->y, FOOD_CHAR);
}

/*
 * Checks all collision types and updates game state accordingly.
 * Sets game_over = 1 on wall or self collision.
 * Calls food_eat() if the snake head is on food.
 */
static void check_all_collisions(int x, int y, Food *f, int board_w, int board_h)
{
    if (hits_wall(x, y, board_w, board_h)) {
        game_over = 1;
        return;
    }

    if (hits_self(x, y)) {
        game_over = 1;
        return;
    }

    if (f->active && hits_food(x, y, f)) {
        food_eat();
    }
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

/* Moves the snake one step in its current direction. */
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

    /* Allocate Food with my_alloc() at game start. */
    g_food = (Food *)my_alloc((int)sizeof(Food));
    if (g_food == 0) {
        my_dealloc((void *)snake);
        return 1;
    }
    g_food->active = 0;

    snake->x = BOARD_WIDTH / 2;
    snake->y = BOARD_HEIGHT / 2;
    snake->direction = 'D';
    running = 1;
    old_x = snake->x;
    old_y = snake->y;
    game_over = 0;
    score = 0;
    foods_eaten = 0;
    food_spawn(BOARD_WIDTH, BOARD_HEIGHT);

    screen_clear();
    screen_draw_border(BOARD_WIDTH, BOARD_HEIGHT);
    score_draw();
    screen_draw_char(snake->x, snake->y, '@');
    screen_draw_char(g_food->x, g_food->y, FOOD_CHAR);
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

        /* Only update tail when the head actually moved. */
        if (old_x != snake->x || old_y != snake->y) {
            int old_score;

            /* Step 1: old head becomes the newest tail segment. */
            tail_push_front(old_x, old_y);

            /* Step 2: remember food count before collision check. */
            old_score = foods_eaten;

            /* Step 3: check all collisions using math.c functions. */
            check_all_collisions(snake->x, snake->y, g_food,
                                 BOARD_WIDTH, BOARD_HEIGHT);

            if (game_over) {
                running = 0;
            }

            /* Step 4: trim tail if no food was eaten. */
            if (foods_eaten == old_score) {
                while (snake_length > foods_eaten) {
                    tail_pop_back();
                }
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

        /* Survival bonus: +1 score per tick. */
        score_add(1);
        score_draw();

        g_tick++;
        delay_one_tick();
    }

    /* Free any remaining tail segments before exit (true runtime free). */
    while (snake_head != 0) {
        tail_pop_back();
    }

    /* Deallocate Food with my_dealloc() on game over. */
    my_dealloc((void *)g_food);
    my_dealloc((void *)snake);
    keyboard_restore();
    return 0;
}
