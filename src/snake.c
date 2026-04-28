#include "../include/keyboard.h"
#include "../include/math.h"
#include "../include/memory.h"
#include "../include/screen.h"
#include "../include/string.h"

#include <stdlib.h>
#include <unistd.h>
#include <fcntl.h>

#define BOARD_WIDTH 78
#define BOARD_HEIGHT 20

#define SCORE_ROW 1
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

/* --- Theme System --- */
typedef struct Theme {
    int head;
    int tail[4];         /* Array of 4 colors for fading effect */
    int food;
    int static_wall;
    int moving_enemy;
    int border;
    int text;
} Theme;

static Theme g_themes[3] = {
    /* Neon (Default) */
    { 92, {96, 36, 94, 34}, 91, 35, 91, 35, 93 },
    /* Matrix Green */
    { 97, {92, 32, 32, 32}, 92, 32, 92, 32, 32 },
    /* Classic B&W */
    { 97, {97, 37, 90, 30}, 37, 37, 37, 37, 37 }
};
static int g_current_theme_idx = 0;

/* Draws all tail segments as 'o'. (The snake head '@' is drawn separately.) */
void tail_draw(void)
{
    Segment *cur;
    int index = 0;
    int color_idx;

    cur = snake_head;
    while (cur != 0) {
        color_idx = my_clamp(my_div(index, 4), 0, 3);
        screen_set_color(g_themes[g_current_theme_idx].tail[color_idx]);
        screen_draw_char(cur->x, cur->y, 'o');
        cur = cur->next;
        index++;
    }
    screen_reset_color();
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

/* --- New Obstacle System --- */
typedef struct Obstacle {
    int type;         /* 0: static, 1: horizontal moving, 2: vertical moving */
    int x;
    int y;
    int dir;          /* 1 or -1 for moving obstacles */
    int min_val;      /* Minimum x or y bound */
    int max_val;      /* Maximum x or y bound */
    struct Obstacle *next;
} Obstacle;

static Obstacle *g_obstacles = 0;
static int current_level = 1;

/* Draws all obstacles. */
void obstacles_draw(void)
{
    Obstacle *obs = g_obstacles;
    Theme *t = &g_themes[g_current_theme_idx];
    while (obs != 0) {
        if (obs->type == 0) {
            screen_set_color(t->static_wall);
            screen_draw_char(obs->x, obs->y, '#');
        } else {
            screen_set_color(t->moving_enemy);
            screen_draw_char(obs->x, obs->y, 'M');
        }
        screen_reset_color();
        obs = obs->next;
    }
}


/* Global tick counter used as pseudo-random seed for food placement. */
static int g_tick = 0;

/* Global food pointer, heap-allocated via my_alloc(). */
static Food *g_food = 0;

/* Global game state flags. */
static int game_over = 0;
static int score = 0;
static int foods_eaten = 0;

/* High score tracking — persists across restarts via file. */
static int g_high_score = 0;
#define HIGHSCORE_FILE ".snake_highscore"

/* Loads high score from file using POSIX I/O (no stdio). */
static void highscore_load(void)
{
    int fd;
    int val;
    int bytes_read;

    fd = open(HIGHSCORE_FILE, O_RDONLY);
    if (fd < 0) {
        g_high_score = 0;
        return;
    }
    val = 0;
    bytes_read = (int)read(fd, &val, (int)sizeof(int));
    close(fd);
    if (bytes_read == (int)sizeof(int) && val > 0) {
        g_high_score = val;
    } else {
        g_high_score = 0;
    }
}

/* Saves high score to file using POSIX I/O (no stdio). */
static void highscore_save(void)
{
    int fd;

    fd = open(HIGHSCORE_FILE, O_WRONLY | O_CREAT | O_TRUNC, 0644);
    if (fd < 0) {
        return;
    }
    write(fd, &g_high_score, (int)sizeof(int));
    close(fd);
}

/* Updates high score if current score beats it. Returns 1 if new record. */
static int highscore_update(void)
{
    if (score > g_high_score) {
        g_high_score = score;
        highscore_save();
        return 1;
    }
    return 0;
}

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

    /* Step 1: clear the score row. */
    x = 1;
    while (x <= BOARD_WIDTH) {
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

    /* Step 5: append "  HIGH: <n>" to show the all-time high score. */
    len = my_strlen(buf);
    my_strcpy(buf + len, "  HIGH: ");
    len = my_strlen(buf);
    my_int_to_str(g_high_score, num);
    my_strcpy(buf + len, num);

    /* Step 6: draw the combined string on the score row. */
    screen_set_color(g_themes[g_current_theme_idx].text);
    screen_draw_string(2, SCORE_ROW, buf);
    screen_reset_color();
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
        x = my_mod(my_mul(g_tick, 37) + 17, range_x) + PLAY_MIN_X;
        y = my_mod(my_mul(g_tick, 53) + 11, range_y) + PLAY_MIN_Y;
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

/* Returns 1 if position (x, y) overlaps any obstacle. */
static int hits_obstacle(int x, int y)
{
    Obstacle *obs = g_obstacles;
    while (obs != 0) {
        if (my_abs(x - obs->x) == 0 && my_abs(y - obs->y) == 0) {
            return 1;
        }
        obs = obs->next;
    }
    return 0;
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

    if (hits_obstacle(x, y)) {
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
    Obstacle *obs;
    Obstacle *next_obs;

    cur = snake_head;
    while (cur != 0) {
        next = cur->next;
        my_dealloc((void *)cur);
        cur = next;
    }
    snake_head = 0;
    snake_length = 0;

    obs = g_obstacles;
    while (obs != 0) {
        next_obs = obs->next;
        my_dealloc((void *)obs);
        obs = next_obs;
    }
    g_obstacles = 0;

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
 * Obstacle Generation & Updating System
 */
static void obstacle_push(int type, int x, int y, int dir, int min_val, int max_val)
{
    Obstacle *obs = (Obstacle *)my_alloc((int)sizeof(Obstacle));
    if (obs == 0) return;
    obs->type = type;
    obs->x = x;
    obs->y = y;
    obs->dir = dir;
    obs->min_val = min_val;
    obs->max_val = max_val;
    obs->next = g_obstacles;
    g_obstacles = obs;
}

static void level_generate(int level)
{
    int i, x, y;
    int num_static = 0;
    int num_moving = 0;
    int range_x = (BOARD_WIDTH - 1) - PLAY_MIN_X + 1;
    int range_y = (BOARD_HEIGHT - 1) - PLAY_MIN_Y + 1;

    if (level <= 1) return;
    if (level == 2) { num_static = 10; }
    else if (level == 3) { num_static = 15; num_moving = 2; }
    else { num_static = 20; num_moving = 4; }

    /* Generate static obstacles */
    for (i = 0; i < num_static; i++) {
        int attempts = 0;
        while (attempts < 100) {
            g_tick++;
            x = my_mod(my_mul(g_tick, 37) + 17, range_x) + PLAY_MIN_X;
            y = my_mod(my_mul(g_tick, 53) + 11, range_y) + PLAY_MIN_Y;
            attempts++;
            /* Prevent spawning on snake head */
            if (g_snake != 0 && my_abs(x - g_snake->x) == 0 && my_abs(y - g_snake->y) == 0) continue;
            /* Prevent spawning on tail */
            if (tail_collides(x, y)) continue;
            /* Prevent spawning on food */
            if (g_food != 0 && g_food->active && hits_food(x, y, g_food)) continue;
            /* Prevent spawning on other obstacles */
            if (hits_obstacle(x, y)) continue;

            obstacle_push(0, x, y, 0, 0, 0);
            break;
        }
    }

    /* Generate moving obstacles */
    for (i = 0; i < num_moving; i++) {
        g_tick++;
        /* Pick a random row or column for the moving obstacle track */
        y = my_mod(my_mul(g_tick, 41) + 7, range_y) + PLAY_MIN_Y;
        /* Start from middle of board horizontally */
        x = BOARD_WIDTH / 2;
        /* Avoid overlapping snake roughly */
        if (g_snake != 0 && my_abs(y - g_snake->y) <= 2) {
            y = PLAY_MIN_Y + 2; /* Force it to top if too close to head y */
        }
        obstacle_push(1, x, y, 1, PLAY_MIN_X + 2, PLAY_MAX_X - 2);
    }
}

static void obstacles_update(void)
{
    Obstacle *obs = g_obstacles;
    /* Move every 2 ticks to make dodging fair */
    if (my_mod(g_tick, 2) != 0) return;

    while (obs != 0) {
        if (obs->type == 1) { /* Horizontal */
            /* Erase old position */
            screen_draw_char(obs->x, obs->y, ' ');
            obs->x += obs->dir;
            if (obs->x >= obs->max_val || obs->x <= obs->min_val) {
                obs->dir = my_mul(obs->dir, -1); /* Invert direction */
            }
            /* If it moves into the snake head or tail, trigger game over */
            if (g_snake != 0 && my_abs(obs->x - g_snake->x) == 0 && my_abs(obs->y - g_snake->y) == 0) {
                game_over = 1;
            } else if (tail_collides(obs->x, obs->y)) {
                game_over = 1;
            }
        }
        obs = obs->next;
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
    current_level = 1;

    /* Three tail cells behind the head, opposite movement direction. */
    k = 3;
    while (k >= 1) {
        tail_push_front(g_snake->x - my_mul(k, dir_x), g_snake->y - my_mul(k, dir_y));
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
    char line_hi[40];
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
    int is_new_record;

    /* Update high score before displaying. */
    is_new_record = highscore_update();

    my_strcpy(line0, "  GAME OVER  ");

    my_strcpy(line1, "  SCORE: ");
    my_int_to_str(score, num);
    my_strcpy(line1 + my_strlen(line1), num);
    my_strcpy(line1 + my_strlen(line1), " ");

    my_strcpy(line2, "  LENGTH: ");
    my_int_to_str(snake_length + 1, num);
    my_strcpy(line2 + my_strlen(line2), num);
    my_strcpy(line2 + my_strlen(line2), " ");

    /* High score line — show NEW RECORD or the existing high. */
    if (is_new_record) {
        my_strcpy(line_hi, " ** NEW HIGH SCORE! ** ");
    } else {
        my_strcpy(line_hi, "  BEST: ");
        my_int_to_str(g_high_score, num);
        my_strcpy(line_hi + my_strlen(line_hi), num);
        my_strcpy(line_hi + my_strlen(line_hi), " ");
    }

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
    i = my_strlen(line_hi);
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
    box_h = 2 + 6;  /* One extra line for the high score */
    box_x = (BOARD_WIDTH - (inner_w + 2)) / 2 + 1;
    box_y = (BOARD_HEIGHT - box_h) / 2 + 1;
    if (box_x < 2) {
        box_x = 2;
    }
    if (box_y < 2) {
        box_y = 2;
    }

    screen_clear();
    screen_set_color(g_themes[g_current_theme_idx].border);
    screen_draw_border(BOARD_WIDTH, BOARD_HEIGHT);

    i = 0;
    while (i < inner_w + 2) {
        screen_draw_char(box_x + i, box_y, '|');
        screen_draw_char(box_x + i, box_y + box_h - 1, '|');
        i++;
    }

    i = 1;
    while (i < box_h - 1) {
        screen_draw_char(box_x, box_y + i, '|');
        screen_draw_char(box_x + inner_w + 1, box_y + i, '|');
        i++;
    }
    screen_reset_color();

    screen_set_color(g_themes[g_current_theme_idx].text);

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
    /* High score line — use head color for NEW RECORD highlight. */
    if (is_new_record) {
        screen_set_color(g_themes[g_current_theme_idx].head);
    }
    lx = box_x + 1 + (inner_w - my_strlen(line_hi)) / 2;
    screen_draw_string(lx, y, line_hi);
    if (is_new_record) {
        screen_set_color(g_themes[g_current_theme_idx].text);
    }
    y++;
    lx = box_x + 1 + (inner_w - my_strlen(line3)) / 2;
    screen_draw_string(lx, y, line3);
    y++;
    lx = box_x + 1 + (inner_w - my_strlen(line4)) / 2;
    screen_draw_string(lx, y, line4);
    screen_reset_color();

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
    screen_set_color(g_themes[g_current_theme_idx].border);
    screen_draw_border(BOARD_WIDTH, BOARD_HEIGHT);
    screen_reset_color();
    tail_draw();
    obstacles_draw();
    if (g_food->active) {
        screen_set_color(g_themes[g_current_theme_idx].food);
        screen_draw_char(g_food->x, g_food->y, FOOD_CHAR);
        screen_reset_color();
    }
    screen_set_color(g_themes[g_current_theme_idx].head);
    screen_draw_char(g_snake->x, g_snake->y, '@');
    screen_reset_color();
    score_draw();
    screen_move_cursor(1, BOARD_HEIGHT + 1);
    screen_present();

    while (running) {
        g_tick++;

        /* 1. Input: read key and update direction (blocks reverse). */
        if (key_pressed()) {
            char key;

            key = read_key();
            if (key == 't' || key == 'T') {
                g_current_theme_idx = my_mod(g_current_theme_idx + 1, 3);
                /* Full redraw instantly */
                screen_clear();
                screen_set_color(g_themes[g_current_theme_idx].border);
                screen_draw_border(BOARD_WIDTH, BOARD_HEIGHT);
                screen_reset_color();
                continue;
            }
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

        /* Level Transition check */
        {
            int expected_level = my_div(score, 200) + 1;
            if (expected_level > current_level) {
                /* Free old obstacles */
                Obstacle *obs = g_obstacles;
                Obstacle *next_obs;
                while (obs != 0) {
                    next_obs = obs->next;
                    /* Erase from screen */
                    screen_draw_char(obs->x, obs->y, ' ');
                    my_dealloc((void *)obs);
                    obs = next_obs;
                }
                g_obstacles = 0;
                
                current_level = expected_level;
                level_generate(current_level);
                
                /* Redraw screen border just to be safe */
                screen_clear();
                screen_set_color(g_themes[g_current_theme_idx].border);
                screen_draw_border(BOARD_WIDTH, BOARD_HEIGHT);
                screen_reset_color();
            }
        }

        obstacles_update();

        /* 6. Render: tail -> food -> head -> score. (No screen_clear to avoid flickering) */
        tail_draw();
        obstacles_draw();
        if (g_food->active) {
            screen_set_color(g_themes[g_current_theme_idx].food);
            screen_draw_char(g_food->x, g_food->y, FOOD_CHAR);
            screen_reset_color();
        }
        screen_set_color(g_themes[g_current_theme_idx].head);
        screen_draw_char(g_snake->x, g_snake->y, '@');
        screen_reset_color();
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
    screen_init();

    /* Load high score from file before starting. */
    highscore_load();

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
