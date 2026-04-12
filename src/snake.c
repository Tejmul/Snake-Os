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

/* Direction vectors for snake movement. */
static int dir_x = 1;
static int dir_y = 0;

/* Flag set by food_eat() when food is consumed; cleared after tail update. */
static int just_ate = 0;

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
    just_ate = 1;
    g_food->active = 0;
    food_spawn(BOARD_WIDTH, BOARD_HEIGHT);
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

/*
 * Updates snake direction from keyboard input.
 * Prevents reverse direction using my_abs(): if new + old cancel to zero, block it.
 */
static void update_direction(char key)
{
    int new_dx;
    int new_dy;

    new_dx = 0;
    new_dy = 0;

    if (key == 'w' || key == 'W') {
        new_dx = 0;
        new_dy = -1;
    }

    if (key == 'a' || key == 'A') {
        new_dx = -1;
        new_dy = 0;
    }

    if (key == 's' || key == 'S') {
        new_dx = 0;
        new_dy = 1;
    }

    if (key == 'd' || key == 'D') {
        new_dx = 1;
        new_dy = 0;
    }

    /* Ignore if no valid direction key was pressed. */
    if (new_dx == 0 && new_dy == 0) {
        return;
    }

    /* Block reverse direction using my_abs() from math.c. */
    if (my_abs(new_dx + dir_x) == 0 && my_abs(new_dy + dir_y) == 0) {
        return;
    }

    dir_x = new_dx;
    dir_y = new_dy;
}

int main(void)
{
    Snake *snake;
    int running;

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
    running = 1;
    dir_x = 1;
    dir_y = 0;
    just_ate = 0;
    game_over = 0;
    score = 0;
    foods_eaten = 0;
    food_spawn(BOARD_WIDTH, BOARD_HEIGHT);

    /* Initial render. */
    screen_clear();
    screen_draw_border(BOARD_WIDTH, BOARD_HEIGHT);
    tail_draw();
    if (g_food->active) {
        screen_draw_char(g_food->x, g_food->y, FOOD_CHAR);
    }
    screen_draw_char(snake->x, snake->y, '@');
    score_draw();
    screen_move_cursor(1, BOARD_HEIGHT + 1);
    screen_present();

    while (running) {
        int nx;
        int ny;

        g_tick++;

        /* 1. Input: read key and update direction (blocks reverse). */
        if (key_pressed()) {
            char key;

            key = read_key();
            if (key == 'q' || key == 'Q') {
                running = 0;
                break;
            }
            update_direction(key);
        }

        /* 2. Calculate next head position using direction vectors. */
        nx = snake->x + dir_x;
        ny = snake->y + dir_y;

        /* 3. Collision checks (Prompt 12) — before moving. */
        check_all_collisions(nx, ny, g_food, BOARD_WIDTH, BOARD_HEIGHT);
        if (game_over) {
            running = 0;
            break;
        }

        /* 4. Move snake: old head becomes tail, update head position. */
        tail_push_front(snake->x, snake->y);
        snake->x = nx;
        snake->y = ny;
        if (!just_ate) {
            while (snake_length > foods_eaten) {
                tail_pop_back();
            }
        }
        just_ate = 0;

        /* 5. Survival bonus: +1 score per tick. */
        score_add(1);

        /* 6. Render: clear -> border -> tail -> food -> head -> score. */
        screen_clear();
        screen_draw_border(BOARD_WIDTH, BOARD_HEIGHT);
        tail_draw();
        if (g_food->active) {
            screen_draw_char(g_food->x, g_food->y, FOOD_CHAR);
        }
        screen_draw_char(snake->x, snake->y, '@');
        score_draw();
        screen_move_cursor(1, BOARD_HEIGHT + 1);
        screen_present();

        usleep(120000);
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
