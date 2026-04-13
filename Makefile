CC = gcc
CFLAGS = -Wall -Wextra -Wshadow -Iinclude
TARGET = snake
SRC = src/snake.c src/math.c src/string.c src/memory.c src/screen.c src/keyboard.c

all: $(TARGET)

$(TARGET): $(SRC)
	$(CC) $(CFLAGS) -o $(TARGET) $(SRC)

clean:
	rm -f $(TARGET)

.PHONY: all clean
