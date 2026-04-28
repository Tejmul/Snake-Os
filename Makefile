# Makefile for Snake-Os with WebSocket support

CC = gcc
CFLAGS = -Wall -Wextra -O2 -Iinclude
CFLAGS_HEADLESS = -Wall -Wextra -O2 -Iinclude -DHEADLESS_MODE
LDFLAGS =

SRC_DIR = src
BUILD_DIR = build
INCLUDE_DIR = include

# Source files for asteroid_server (WebSocket-enabled game server)
ASTEROID_SERVER_SRCS = $(SRC_DIR)/asteroid_server.c \
                       $(SRC_DIR)/memory.c \
                       $(SRC_DIR)/math.c \
                       $(SRC_DIR)/string.c

# Object files
ASTEROID_SERVER_OBJS = $(ASTEROID_SERVER_SRCS:$(SRC_DIR)/%.c=$(BUILD_DIR)/%.o)

# Target executable
ASTEROID_SERVER = $(BUILD_DIR)/asteroid_server

.PHONY: all clean asteroid_server

all: $(ASTEROID_SERVER)

# Create build directory
$(BUILD_DIR):
	mkdir -p $(BUILD_DIR)

# Compile object files (with HEADLESS_MODE flag)
$(BUILD_DIR)/%.o: $(SRC_DIR)/%.c | $(BUILD_DIR)
	$(CC) $(CFLAGS_HEADLESS) -c $< -o $@

# Link asteroid_server
$(ASTEROID_SERVER): $(ASTEROID_SERVER_OBJS)
	$(CC) $(LDFLAGS) $^ -o $@
	@echo "✅ Built $(ASTEROID_SERVER)"
	@echo "🎮 Run: node snake-asteroid/websocket-server.js"

asteroid_server: $(ASTEROID_SERVER)

clean:
	rm -rf $(BUILD_DIR)
	@echo "🧹 Cleaned build directory"

# Help
help:
	@echo "Available targets:"
	@echo "  make asteroid_server  - Build the C backend server (uses math.c!)"
	@echo "  make clean            - Remove build artifacts"
	@echo "  make all              - Build everything (default)"
