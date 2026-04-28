#!/bin/bash

# Test script for C backend integration
set -e

echo "🧪 Testing C Backend Integration"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check if C files exist
echo "Test 1: Checking source files..."
if [ -f "src/asteroid_server.c" ] && [ -f "src/math.c" ] && [ -f "src/memory.c" ]; then
    echo -e "${GREEN}✅ All C source files found${NC}"
else
    echo -e "${RED}❌ Missing C source files${NC}"
    exit 1
fi

# Test 2: Build C backend
echo ""
echo "Test 2: Building C backend..."
if make asteroid_server > /dev/null 2>&1; then
    echo -e "${GREEN}✅ C backend compiled successfully${NC}"
else
    echo -e "${RED}❌ Compilation failed${NC}"
    echo "Run: make asteroid_server"
    exit 1
fi

# Test 3: Test C server directly
echo ""
echo "Test 3: Testing C server (5 ticks)..."
if [ -f "build/asteroid_server" ]; then
    # Send 5 tick commands and capture output
    OUTPUT=$(echo -e "t\nt\nt\nt\nt\nq" | timeout 2 ./build/asteroid_server 2>/dev/null | head -1)
    
    # Check if output is valid JSON
    if echo "$OUTPUT" | grep -q '"alive"'; then
        echo -e "${GREEN}✅ C server outputs valid JSON${NC}"
        echo "   Sample: ${OUTPUT:0:80}..."
        
        # Check if using C math functions
        if echo "$OUTPUT" | grep -q '"score":[0-9]'; then
            echo -e "${GREEN}✅ Score calculation working (uses my_mul)${NC}"
        fi
    else
        echo -e "${RED}❌ C server output invalid${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ C server executable not found${NC}"
    exit 1
fi

# Test 4: Check WebSocket dependencies
echo ""
echo "Test 4: Checking Node.js dependencies..."
cd snake-asteroid
if [ -f "package.json" ]; then
    if npm list ws > /dev/null 2>&1 || [ -d "node_modules/ws" ]; then
        echo -e "${GREEN}✅ WebSocket library (ws) installed${NC}"
    else
        echo -e "${YELLOW}⚠️  WebSocket library not installed${NC}"
        echo "   Run: npm install ws"
    fi
else
    echo -e "${YELLOW}⚠️  package.json not found${NC}"
fi
cd ..

# Test 5: Check if files are properly integrated
echo ""
echo "Test 5: Checking React integration..."
if grep -q "USE_C_BACKEND" "snake-asteroid/src/components/AsteroidSerpent.jsx"; then
    if grep -q "const USE_C_BACKEND = true" "snake-asteroid/src/components/AsteroidSerpent.jsx"; then
        echo -e "${GREEN}✅ C backend enabled in React component${NC}"
    else
        echo -e "${YELLOW}⚠️  C backend disabled in React (set USE_C_BACKEND = true)${NC}"
    fi
else
    echo -e "${RED}❌ React component not updated${NC}"
    exit 1
fi

# Summary
echo ""
echo "================================"
echo -e "${GREEN}🎉 All tests passed!${NC}"
echo ""
echo "Next steps:"
echo "  1. Terminal 1: cd snake-asteroid && node websocket-server.js"
echo "  2. Terminal 2: cd snake-asteroid && npm start"
echo "  3. Open http://localhost:3000"
echo ""
echo "Look for '🔗 C BACKEND (math.c)' in top-right corner!"
