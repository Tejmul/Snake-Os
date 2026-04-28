#include "../include/keyboard.h"
#include "../include/math.h"
#include "../include/memory.h"
#include "../include/string.h"

#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <fcntl.h>
#include <time.h>

#define BOARD_SIZE 30
#define SPD0 145
#define SPDMIN 50
#define SPDINC 4

typedef struct Segment {
    int x;
    int y;
    struct Segment *next;
} Segment;

typedef struct Snake {
    int x;
    int y;
} Snake;

typedef struct Food {
    int x;
    int y;
    int active;
    int type; // 0=normal, 1=golden, 2=speed, 3=shrink
    int pts;
} Food;

// Global state
Segment *snake_head = 0;
int snake_length = 0;
static Snake *g_snake = 0;
static Food *g_food = 0;

static int dir_x = 1;
static int dir_y = 0;
static int game_over = 0;
static int score = 0;
static int g_tick = 0;
static int speed = SPD0;
static int combo = 0;
static int max_combo = 0;
static int foods_eaten = 0;
static long last_eat_time = 0;

// Tail management (using math.c functions)
void tail_push_front(int x, int y) {
    Segment *node = (Segment *)my_alloc((int)sizeof(Segment));
    if (node == 0) return;
    node->x = x;
    node->y = y;
    node->next = snake_head;
    snake_head = node;
    snake_length += 1;
}

void tail_pop_back(void) {
    if (snake_head == 0) return;
    if (snake_head->next == 0) {
        my_dealloc((void *)snake_head);
        snake_head = 0;
        snake_length = 0;
        return;
    }
    Segment *prev = snake_head;
    Segment *cur = snake_head->next;
    while (cur->next != 0) {
        prev = cur;
        cur = cur->next;
    }
    prev->next = 0;
    my_dealloc((void *)cur);
    snake_length -= 1;
}

int tail_collides(int x, int y) {
    Segment *cur = snake_head;
    while (cur != 0) {
        // Using my_abs from math.c for comparison
        if (my_abs(cur->x - x) == 0 && my_abs(cur->y - y) == 0) return 1;
        cur = cur->next;
    }
    return 0;
}

// Food spawning using math.c functions
static void food_spawn(void) {
    if (g_food == 0) return;
    
    int attempts = 0;
    int x, y;
    
    while (attempts < 400) {
        g_tick++;
        // Using my_mod and my_mul from math.c
        x = my_mod(my_mul(g_tick, 37) + 17, BOARD_SIZE);
        y = my_mod(my_mul(g_tick, 53) + 11, BOARD_SIZE);
        attempts++;
        
        if (g_snake != 0 && my_abs(x - g_snake->x) == 0 && my_abs(y - g_snake->y) == 0) continue;
        if (tail_collides(x, y)) continue;
        
        g_food->x = x;
        g_food->y = y;
        g_food->active = 1;
        
        // Determine food type using math.c (pseudo-random)
        int type_rand = my_mod(g_tick, 100);
        if (type_rand < 60) {
            g_food->type = 0; // normal (60%)
            g_food->pts = 10;
        } else if (type_rand < 70) {
            g_food->type = 1; // golden (10%)
            g_food->pts = 50;
        } else if (type_rand < 85) {
            g_food->type = 2; // speed (15%)
            g_food->pts = 20;
        } else {
            g_food->type = 3; // shrink (15%)
            g_food->pts = 30;
        }
        return;
    }
    g_food->active = 0;
}

// Output JSON state using string.c functions
static void output_state(void) {
    char buf[4096];
    char num[32];
    int pos = 0;
    
    // Build JSON manually using string.c functions
    my_strcpy(buf, "{\"alive\":");
    pos = my_strlen(buf);
    my_strcpy(buf + pos, game_over ? "false" : "true");
    pos = my_strlen(buf);
    
    my_strcpy(buf + pos, ",\"score\":");
    pos = my_strlen(buf);
    my_int_to_str(score, num);
    my_strcpy(buf + pos, num);
    pos = my_strlen(buf);
    
    my_strcpy(buf + pos, ",\"length\":");
    pos = my_strlen(buf);
    my_int_to_str(snake_length + 1, num);
    my_strcpy(buf + pos, num);
    pos = my_strlen(buf);
    
    my_strcpy(buf + pos, ",\"speed\":");
    pos = my_strlen(buf);
    my_int_to_str(speed, num);
    my_strcpy(buf + pos, num);
    pos = my_strlen(buf);
    
    my_strcpy(buf + pos, ",\"combo\":");
    pos = my_strlen(buf);
    my_int_to_str(combo, num);
    my_strcpy(buf + pos, num);
    pos = my_strlen(buf);
    
    my_strcpy(buf + pos, ",\"maxCombo\":");
    pos = my_strlen(buf);
    my_int_to_str(max_combo, num);
    my_strcpy(buf + pos, num);
    pos = my_strlen(buf);
    
    my_strcpy(buf + pos, ",\"eaten\":");
    pos = my_strlen(buf);
    my_int_to_str(foods_eaten, num);
    my_strcpy(buf + pos, num);
    pos = my_strlen(buf);
    
    my_strcpy(buf + pos, ",\"head\":{\"x\":");
    pos = my_strlen(buf);
    my_int_to_str(g_snake->x, num);
    my_strcpy(buf + pos, num);
    pos = my_strlen(buf);
    my_strcpy(buf + pos, ",\"y\":");
    pos = my_strlen(buf);
    my_int_to_str(g_snake->y, num);
    my_strcpy(buf + pos, num);
    pos = my_strlen(buf);
    my_strcpy(buf + pos, "}");
    pos = my_strlen(buf);
    
    my_strcpy(buf + pos, ",\"dir\":\"");
    pos = my_strlen(buf);
    if (dir_x == 0 && dir_y == -1) my_strcpy(buf + pos, "UP");
    else if (dir_x == 0 && dir_y == 1) my_strcpy(buf + pos, "DOWN");
    else if (dir_x == -1 && dir_y == 0) my_strcpy(buf + pos, "LEFT");
    else my_strcpy(buf + pos, "RIGHT");
    pos = my_strlen(buf);
    my_strcpy(buf + pos, "\"");
    pos = my_strlen(buf);
    
    my_strcpy(buf + pos, ",\"food\":{\"x\":");
    pos = my_strlen(buf);
    my_int_to_str(g_food->x, num);
    my_strcpy(buf + pos, num);
    pos = my_strlen(buf);
    my_strcpy(buf + pos, ",\"y\":");
    pos = my_strlen(buf);
    my_int_to_str(g_food->y, num);
    my_strcpy(buf + pos, num);
    pos = my_strlen(buf);
    my_strcpy(buf + pos, ",\"type\":");
    pos = my_strlen(buf);
    my_int_to_str(g_food->type, num);
    my_strcpy(buf + pos, num);
    pos = my_strlen(buf);
    my_strcpy(buf + pos, ",\"pts\":");
    pos = my_strlen(buf);
    my_int_to_str(g_food->pts, num);
    my_strcpy(buf + pos, num);
    pos = my_strlen(buf);
    my_strcpy(buf + pos, ",\"active\":");
    pos = my_strlen(buf);
    my_strcpy(buf + pos, g_food->active ? "true" : "false");
    pos = my_strlen(buf);
    my_strcpy(buf + pos, "}");
    pos = my_strlen(buf);
    
    my_strcpy(buf + pos, ",\"tail\":[");
    pos = my_strlen(buf);
    
    Segment *cur = snake_head;
    int first = 1;
    while (cur != 0) {
        if (!first) {
            my_strcpy(buf + pos, ",");
            pos = my_strlen(buf);
        }
        my_strcpy(buf + pos, "{\"x\":");
        pos = my_strlen(buf);
        my_int_to_str(cur->x, num);
        my_strcpy(buf + pos, num);
        pos = my_strlen(buf);
        my_strcpy(buf + pos, ",\"y\":");
        pos = my_strlen(buf);
        my_int_to_str(cur->y, num);
        my_strcpy(buf + pos, num);
        pos = my_strlen(buf);
        my_strcpy(buf + pos, "}");
        pos = my_strlen(buf);
        first = 0;
        cur = cur->next;
    }
    
    my_strcpy(buf + pos, "]}\n");
    
    printf("%s", buf);
    fflush(stdout);
}

static void game_free(void) {
    Segment *cur = snake_head;
    while (cur != 0) {
        Segment *next = cur->next;
        my_dealloc((void *)cur);
        cur = next;
    }
    snake_head = 0;
    snake_length = 0;
    if (g_food) { my_dealloc((void *)g_food); g_food = 0; }
    if (g_snake) { my_dealloc((void *)g_snake); g_snake = 0; }
}

static void game_init(void) {
    game_free();
    memory_init();
    
    g_snake = (Snake *)my_alloc((int)sizeof(Snake));
    g_food = (Food *)my_alloc((int)sizeof(Food));
    
    // Using my_div from math.c
    g_snake->x = my_div(BOARD_SIZE, 2);
    g_snake->y = my_div(BOARD_SIZE, 2);
    dir_x = 1;
    dir_y = 0;
    game_over = 0;
    score = 0;
    g_tick = 0;
    speed = SPD0;
    combo = 0;
    max_combo = 0;
    foods_eaten = 0;
    last_eat_time = 0;
    
    // Create initial tail (4 segments)
    int k = 3;
    while (k >= 1) {
        tail_push_front(g_snake->x - k, g_snake->y);
        k--;
    }
    
    food_spawn();
}

static void update_direction(char key) {
    int new_dx = 0, new_dy = 0;
    
    if (key == 'w' || key == 'W') { new_dx = 0; new_dy = -1; }
    if (key == 'a' || key == 'A') { new_dx = -1; new_dy = 0; }
    if (key == 's' || key == 'S') { new_dx = 0; new_dy = 1; }
    if (key == 'd' || key == 'D') { new_dx = 1; new_dy = 0; }
    
    if (new_dx == 0 && new_dy == 0) return;
    
    // Prevent reverse using my_abs from math.c
    if (my_abs(new_dx + dir_x) == 0 && my_abs(new_dy + dir_y) == 0) return;
    
    dir_x = new_dx;
    dir_y = new_dy;
}

static void game_tick(long current_time) {
    if (game_over) return;
    
    int nx = g_snake->x + dir_x;
    int ny = g_snake->y + dir_y;
    
    // WRAPPING (using my_mod from math.c for wraparound)
    nx = my_mod(nx + BOARD_SIZE, BOARD_SIZE);
    ny = my_mod(ny + BOARD_SIZE, BOARD_SIZE);
    
    // Check self collision
    if (tail_collides(nx, ny)) {
        game_over = 1;
        return;
    }
    
    // Check food collision
    int ate = 0;
    if (g_food->active && my_abs(nx - g_food->x) == 0 && my_abs(ny - g_food->y) == 0) {
        ate = 1;
        
        // Combo system (using my_div from math.c)
        long time_since_eat = current_time - last_eat_time;
        if (time_since_eat < 3000) {
            combo = my_clamp(combo + 1, 1, 5);
        } else {
            combo = 1;
        }
        
        // Update max combo using my_clamp
        if (combo > max_combo) max_combo = combo;
        
        // Calculate score with combo multiplier (using my_mul from math.c)
        score += my_mul(g_food->pts, combo);
        
        foods_eaten += 1;
        last_eat_time = current_time;
        
        // Update speed (using my_clamp from math.c)
        speed = my_clamp(speed - SPDINC, SPDMIN, SPD0);
        
        g_food->active = 0;
        food_spawn();
    }
    
    tail_push_front(g_snake->x, g_snake->y);
    g_snake->x = nx;
    g_snake->y = ny;
    
    if (!ate) {
        tail_pop_back();
    }
}

int main(void) {
    int flags = fcntl(STDIN_FILENO, F_GETFL, 0);
    fcntl(STDIN_FILENO, F_SETFL, flags | O_NONBLOCK);
    
    game_init();
    output_state();
    
    char buf[256];
    while (1) {
        int n = read(STDIN_FILENO, buf, sizeof(buf) - 1);
        if (n > 0) {
            buf[n] = '\0';
            
            // Get current time in milliseconds
            struct timespec ts;
            clock_gettime(CLOCK_MONOTONIC, &ts);
            long current_time = ts.tv_sec * 1000 + ts.tv_nsec / 1000000;
            
            for (int i = 0; i < n; i++) {
                char c = buf[i];
                if (c == 'r' || c == 'R') {
                    game_init();
                } else if (c == 'q' || c == 'Q') {
                    game_free();
                    return 0;
                } else if (c == 't' || c == 'T') {
                    game_tick(current_time);
                } else {
                    update_direction(c);
                }
            }
            output_state();
        }
        usleep(1000);
    }
    
    return 0;
}
