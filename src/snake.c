#include "keyboard.h"
#include "math.h"
#include "memory.h"
#include "screen.h"
#include "string.h"

#include <stdlib.h>
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

    /* Step 1: empty list => nothing to pop (and nothing to free). */
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
    if (cur == 0) {
        return;
    }
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
    Segment *next;

    if (snake_head == 0) {
        return 0;
    }

    cur = snake_head;
    while (cur != 0) {
        if (cur->x == x && cur->y == y) {
            return 1;
        }
        next = cur->next;
        cur = next;
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

/* Global snake pointer so food_spawn can check the head position. */
static Snake *g_snake = 0;

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
 * Tick delay in microseconds: faster as score rises (math.c only for scaling).
 */
static int get_delay(int total_score)
{
    int steps;
    int reduction;
    int delay;

    steps = my_div(total_score, 50);
    reduction = my_mul(steps, 10000);
    delay = 150000 - reduction;
    return my_clamp(delay, 60000, 150000);
}

/*
 * Draws the top score bar showing "SCORE: X  LENGTH: Y  SPEED: Z".
 * Uses my_int_to_str() and my_strcpy() from string.c only — no formatted int printing.
 */
static void score_draw(void)
{
    int x;
    int len;
    char buf[96];
    char num[16];
    int d;
    int speed_level;

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

    /* Step 4: append "  SPEED: <1..5>" from delay (math.c only). */
    d = get_delay(score);
    speed_level = my_div(my_div(150000 - d, 10000), 1);
    speed_level = speed_level + 1;
    speed_level = my_clamp(speed_level, 1, 5);
    len = my_strlen(buf);
    my_strcpy(buf + len, "  SPEED: ");
    len = my_strlen(buf);
    my_int_to_str(speed_level, num);
    my_strcpy(buf + len, num);

    /* Step 5: draw the combined string on the score row. */
    screen_draw_string(3, SCORE_ROW, buf);
}

/*
 * Spawns food at a pseudo-random position using a tick-based formula.
 * Uses my_mod() from math.c — no standard library RNG.
 * Retries with an incremented tick if the position overlaps any snake segment.
 */
static void food_spawn(int board_w, int board_h)
{
    int x;
    int y;
    int range_x;
    int range_y;
    int max_cells;
    int attempts;

    if (g_food == 0) {
        return;
    }

    range_x = (board_w - 1) - PLAY_MIN_X + 1;
    range_y = (board_h - 1) - PLAY_MIN_Y + 1;
    if (range_x <= 0 || range_y <= 0) {
        g_food->active = 0;
        return;
    }

    max_cells = my_mul(range_x, range_y);
    attempts = 0;
    while (attempts < max_cells) {
        g_tick++;
        x = my_mod(g_tick * 37 + 17, range_x) + PLAY_MIN_X;
        y = my_mod(g_tick * 53 + 11, range_y) + PLAY_MIN_Y;
        attempts++;

        /* Make sure food does not spawn on the snake head or any tail segment. */
        if (g_snake != 0 && my_abs(x - g_snake->x) == 0 && my_abs(y - g_snake->y) == 0) {
            continue;
        }
        if (tail_collides(x, y)) {
            continue;
        }

        g_food->x = x;
        g_food->y = y;
        g_food->active = 1;
        return;
    }

    /* Board full of snake — no free cell for food. */
    g_food->active = 0;
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
    if (f == 0) {
        return 0;
    }

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
    if (g_food == 0) {
        return;
    }

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

    if (f != 0 && f->active && hits_food(x, y, f)) {
        food_eat();
    }
}

/*
 * Frees all Segment nodes, Food, and Snake from VRAM (matches every my_alloc).
 */
static void game_free_allocations(void)
{
    Segment *cur;
    Segment *next;

    cur = snake_head;
    while (cur != 0) {
        next = cur->next;
        my_dealloc((void *)cur);
        cur = next;
    }
    snake_head = 0;
    snake_length = 0;

    if (g_food != 0) {
        my_dealloc((void *)g_food);
        g_food = 0;
    }

    if (g_snake != 0) {
        my_dealloc((void *)g_snake);
        g_snake = 0;
    }
}

/*
 * Frees every allocation, resets the allocator, then reallocates snake and food.
 * Spawns a starting snake in the board center with up to three tail segments;
 * foods_eaten matches actual tail length so the trim loop stays consistent.
 */
void game_reset(void)
{
    int k;

    game_free_allocations();

    memory_init();

    g_snake = (Snake *)my_alloc((int)sizeof(Snake));
    if (g_snake == 0) {
        keyboard_restore();
        exit(1);
    }

    g_food = (Food *)my_alloc((int)sizeof(Food));
    if (g_food == 0) {
        my_dealloc((void *)g_snake);
        g_snake = 0;
        keyboard_restore();
        exit(1);
    }

    g_food->active = 0;

    g_snake->x = BOARD_WIDTH / 2;
    g_snake->y = BOARD_HEIGHT / 2;
    dir_x = 1;
    dir_y = 0;
    just_ate = 0;
    game_over = 0;
    score = 0;
    g_tick = 0;

    /* Three tail cells behind the head, opposite movement direction. */
    k = 3;
    while (k >= 1) {
        tail_push_front(g_snake->x - k * dir_x, g_snake->y - k * dir_y);
        k--;
    }
    foods_eaten = snake_length;

    food_spawn(BOARD_WIDTH, BOARD_HEIGHT);

    memory_dump();
}

/*
 * Draws a centered frame and game-over text using screen_draw_string() and
 * my_int_to_str() for numeric fields.
 */
void show_game_over(void)
{
    char line0[32];
    char line1[40];
    char line2[40];
    char line3[32];
    char line4[32];
    char num[16];
    int maxw;
    int box_x;
    int box_y;
    int box_h;
    int inner_w;
    int i;
    int y;
    int lx;

    my_strcpy(line0, "  GAME OVER  ");

    my_strcpy(line1, "  SCORE: ");
    my_int_to_str(score, num);
    my_strcpy(line1 + my_strlen(line1), num);
    my_strcpy(line1 + my_strlen(line1), " ");

    my_strcpy(line2, "  LENGTH: ");
    my_int_to_str(snake_length + 1, num);
    my_strcpy(line2 + my_strlen(line2), num);
    my_strcpy(line2 + my_strlen(line2), " ");

    my_strcpy(line3, " [R] Restart ");
    my_strcpy(line4, " [Q]  Quit   ");

    maxw = my_strlen(line0);
    i = my_strlen(line1);
    if (i > maxw) {
        maxw = i;
    }
    i = my_strlen(line2);
    if (i > maxw) {
        maxw = i;
    }
    i = my_strlen(line3);
    if (i > maxw) {
        maxw = i;
    }
    i = my_strlen(line4);
    if (i > maxw) {
        maxw = i;
    }

    inner_w = maxw;
    box_h = 2 + 5;
    box_x = (BOARD_WIDTH - (inner_w + 2)) / 2 + 1;
    box_y = (BOARD_HEIGHT - box_h) / 2 + 1;
    if (box_x < 2) {
        box_x = 2;
    }
    if (box_y < 2) {
        box_y = 2;
    }

    screen_clear();
    screen_draw_border(BOARD_WIDTH, BOARD_HEIGHT);

    i = 0;
    while (i < inner_w + 2) {
        screen_draw_char(box_x + i, box_y, '#');
        screen_draw_char(box_x + i, box_y + box_h - 1, '#');
        i++;
    }

    i = 1;
    while (i < box_h - 1) {
        screen_draw_char(box_x, box_y + i, '#');
        screen_draw_char(box_x + inner_w + 1, box_y + i, '#');
        i++;
    }

    y = box_y + 1;
    lx = box_x + 1 + (inner_w - my_strlen(line0)) / 2;
    screen_draw_string(lx, y, line0);
    y++;
    lx = box_x + 1 + (inner_w - my_strlen(line1)) / 2;
    screen_draw_string(lx, y, line1);
    y++;
    lx = box_x + 1 + (inner_w - my_strlen(line2)) / 2;
    screen_draw_string(lx, y, line2);
    y++;
    lx = box_x + 1 + (inner_w - my_strlen(line3)) / 2;
    screen_draw_string(lx, y, line3);
    y++;
    lx = box_x + 1 + (inner_w - my_strlen(line4)) / 2;
    screen_draw_string(lx, y, line4);

    memory_dump();
    screen_move_cursor(1, BOARD_HEIGHT + 1);
    screen_present();
}

/*
 * Updates snake direction from keyboard input.
 * Prevents reverse direction using my_abs(): if new + old cancel to zero, block it.
 */
static void update_direction(char key)
{
    int new_dx;
    int new_dy;

    if (key == 0) {
        return;
    }

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

/*
 * Runs the main tick loop until game_over or the player quits with Q.
 * Returns 0 if the player quit during play, 1 if the snake died (game_over).
 */
static int game_loop(void)
{
    int running;
    int nx;
    int ny;

    if (g_snake == 0 || g_food == 0) {
        return 1;
    }

    running = 1;

    /* Initial render for this session (also used after restart). */
    screen_clear();
    screen_draw_border(BOARD_WIDTH, BOARD_HEIGHT);
    tail_draw();
    if (g_food->active) {
        screen_draw_char(g_food->x, g_food->y, FOOD_CHAR);
    }
    screen_draw_char(g_snake->x, g_snake->y, '@');
    score_draw();
    screen_move_cursor(1, BOARD_HEIGHT + 1);
    screen_present();

    while (running) {
        g_tick++;

        /* 1. Input: read key and update direction (blocks reverse). */
        if (key_pressed()) {
            char key;

            key = read_key();
            if (key == 'q' || key == 'Q') {
                running = 0;
                return 0;
            }
            update_direction(key);
        }

        /* 2. Calculate next head position using direction vectors. */
        nx = g_snake->x + dir_x;
        ny = g_snake->y + dir_y;

        /* 3. Collision checks — before moving. */
        check_all_collisions(nx, ny, g_food, BOARD_WIDTH, BOARD_HEIGHT);
        if (game_over) {
            running = 0;
            break;
        }

        /* 4. Move snake: old head becomes tail, update head position. */
        tail_push_front(g_snake->x, g_snake->y);
        g_snake->x = nx;
        g_snake->y = ny;
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
        screen_draw_char(g_snake->x, g_snake->y, '@');
        score_draw();
        screen_move_cursor(1, BOARD_HEIGHT + 1);
        screen_present();

        usleep(get_delay(score));
    }

    return 1;
}

int main(void)
{
    int outcome;

    keyboard_init();

    game_reset();

    for (;;) {
        outcome = game_loop();
        if (outcome == 0) {
            break;
        }

        show_game_over();

        for (;;) {
            char key;

            if (!key_pressed()) {
                usleep(50000);
                continue;
            }

            key = read_key();
            if (key == 'r' || key == 'R') {
                game_reset();
                break;
            }

            if (key == 'q' || key == 'Q') {
                game_free_allocations();
                keyboard_restore();
                exit(0);
            }
        }
    }

    game_free_allocations();
    keyboard_restore();
    return 0;
}
