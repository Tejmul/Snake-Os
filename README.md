# Snake Game — Custom OS Libraries (C)

## Project Description

Snake-Os is a terminal Snake game written in C as a stack of small “OS-style” libraries that drive movement, collisions, food, score, speed scaling, game-over, and restart. For **strings, heap memory, and integer math** the project uses **zero standard C library** routines—those jobs are done only by `string.c`, `memory.c`, and `math.c` (no `malloc`/`free`, `strlen`/`strcpy`, `abs`, `rand`, or formatted `printf` for game data). The terminal still needs a thin POSIX/stdio layer for raw keyboard input and character output.

## Custom Libraries Built

| Library | Key Functions |
|---------|---------------|
| math.c | `my_mul`, `my_div`, `my_mod`, `my_abs`, `my_clamp` |
| string.c | `my_strlen`, `my_strcpy`, `my_strcmp`, `my_str_reverse`, `my_int_to_str` |
| memory.c | `memory_init`, `my_alloc`, `my_dealloc`, `memory_dump` |
| screen.c | `screen_clear`, `screen_move_cursor`, `screen_draw_char`, `screen_draw_string`, `screen_draw_border`, `screen_present` |
| keyboard.c | `keyboard_init`, `keyboard_restore`, `key_pressed`, `read_key` |

## Controls

| Key | Action |
|-----|--------|
| W | Move Up |
| A | Move Left |
| S | Move Down |
| D | Move Right |
| R | Restart (on Game Over) |
| Q | Quit |

## How to Build & Run

```bash
make
./snake
```

## Architecture: Library Pipeline

keyboard.c → captures input  
string.c   → formats score display  
memory.c   → manages snake segments  
math.c     → collision + speed logic  
screen.c   → renders everything  

## Known Issues

- [ ] Terminal I/O still depends on POSIX/stdio (`read`, `tcsetattr`, `putchar`, etc.); only game-facing string, heap, and math are custom.
- [ ] If every playable cell is occupied by the snake, food spawning stops and food may stay inactive until the snake shrinks.
- [ ] Raw escape sequences from keys other than arrows may be partially consumed or ignored in raw mode.

## Phase Completion

- [x] Phase 1: Libraries + basic movement
- [x] Phase 2: Full game with food, score, game-over, restart

## Submission Package (ZIP contents)

Pack the project as source + headers + build files only (omit build artifacts and binaries). Recommended tree:

```text
Snake-Os/
├── Makefile
├── README.md
├── include/
│   ├── keyboard.h
│   ├── math.h
│   ├── memory.h
│   ├── screen.h
│   └── string.h
└── src/
    ├── keyboard.c
    ├── math.c
    ├── memory.c
    ├── screen.c
    ├── snake.c
    └── string.c
```

**Do not include in the ZIP (regenerate with `make`):** `snake`, `*.o`, editor folders (e.g. `.cursor/`), or local build caches.

To create the archive from the repo root:

```bash
zip -r Snake-Os-submission.zip Makefile README.md include src
```
