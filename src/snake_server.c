#include "../include/keyboard.h"
#include "../include/math.h"
#include "../include/memory.h"
#include "../include/string.h"

#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <fcntl.h>

#define BOARD_WIDTH 25
#define BOARD_HEIGHT 25

typedef struct Segment {
    int x;
    int y;
    struct Segment *next;
} Segment;

Segment *snake_head = 0;
int snake_length = 0;

static int dir_x = 1;
static int dir_y = 0;
static int game_over = 0;
static int score = 0;
static int g_tick = 0;

typedef struct Snake {
    int x;
    int y;
} Snake;

typedef struct Food {
    int x;
    int y;
    int active;
} Food;

static Snake *g_snake = 0;
static Food *g_food = 0;

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
        if (cur->x == x && cur->y == y) return 1;
        cur = cur->next;
    }
    return 0;
}

static void food_spawn(void) {
    if (g_food == 0) return;
    int range_x = BOARD_WIDTH - 2;
    int range_y = BOARD_HEIGHT - 2;
    int attempts = 0;
    int x, y;
    while (attempts < 1000) {
        g_tick++;
        x = my_mod(my_mul(g_tick, 37) + 17, range_x) + 1;
        y = my_mod(my_mul(g_tick, 53) + 11, range_y) + 1;
        attempts++;
        if (g_snake != 0 && x == g_snake->x && y == g_snake->y) continue;
        if (tail_collides(x, y)) continue;
        g_food->x = x;
        g_food->y = y;
        g_food->active = 1;
        return;
    }
    g_food->active = 0;
}

static int hits_wall(int x, int y) {
    if (x < 1 || x >= BOARD_WIDTH - 1 || y < 1 || y >= BOARD_HEIGHT - 1) return 1;
    return 0;
}

static void output_state(void) {
    printf("{\"alive\":%s,\"score\":%d,\"length\":%d,", game_over ? "false" : "true", score, snake_length + 1);
    printf("\"head\":{\"x\":%d,\"y\":%d},", g_snake->x, g_snake->y);
    printf("\"dirX\":%d,\"dirY\":%d,", dir_x, dir_y);
    printf("\"food\":{\"x\":%d,\"y\":%d,\"active\":%s},", g_food->x, g_food->y, g_food->active ? "true" : "false");
    printf("\"tail\":[");
    Segment *cur = snake_head;
    int first = 1;
    while (cur != 0) {
        if (!first) printf(",");
        printf("{\"x\":%d,\"y\":%d}", cur->x, cur->y);
        first = 0;
        cur = cur->next;
    }
    printf("]}\n");
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
    
    g_snake->x = BOARD_WIDTH / 2;
    g_snake->y = BOARD_HEIGHT / 2;
    dir_x = 1;
    dir_y = 0;
    game_over = 0;
    score = 0;
    g_tick = 0;
    
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
    if (my_abs(new_dx + dir_x) == 0 && my_abs(new_dy + dir_y) == 0) return;
    
    dir_x = new_dx;
    dir_y = new_dy;
}

static void game_tick(void) {
    if (game_over) return;
    
    int nx = g_snake->x + dir_x;
    int ny = g_snake->y + dir_y;
    
    if (hits_wall(nx, ny) || tail_collides(nx, ny)) {
        game_over = 1;
        return;
    }
    
    int ate = 0;
    if (g_food->active && nx == g_food->x && ny == g_food->y) {
        ate = 1;
        score += 10;
        g_food->active = 0;
        food_spawn();
    }
    
    tail_push_front(g_snake->x, g_snake->y);
    g_snake->x = nx;
    g_snake->y = ny;
    
    if (!ate) {
        tail_pop_back();
    }
    
    score += 1;
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
            for (int i = 0; i < n; i++) {
                char c = buf[i];
                if (c == 'r' || c == 'R') {
                    game_init();
                } else if (c == 'q' || c == 'Q') {
                    game_free();
                    return 0;
                } else if (c == 't' || c == 'T') {
                    game_tick();
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
