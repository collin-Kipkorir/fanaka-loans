#!/bin/bash
# Development setup script for Fanaka Loans

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Fanaka Loans Development Setup${NC}"
echo -e "${BLUE}================================${NC}"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}Installing dependencies...${NC}"
  npm install
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
  echo -e "${YELLOW}Warning: .env.local not found!${NC}"
  echo -e "${YELLOW}Please create .env.local with PayHero credentials:${NC}"
  echo ""
  echo "VITE_PAYHERO_BASE_URL=https://backend.payhero.co.ke"
  echo "VITE_PAYHERO_ACCOUNT_ID=3278"
  echo "VITE_PAYHERO_CHANNEL_ID=3838"
  echo "VITE_PAYHERO_AUTH_TOKEN=Basic ..."
  echo "VITE_PAYHERO_CALLBACK_URL=http://localhost:8080/api/payment-callback"
  echo ""
fi

# Install server dependencies if needed
if [ ! -d "server/node_modules" ] && [ -f "server/package.json" ]; then
  echo -e "${YELLOW}Installing server dependencies...${NC}"
  cd server && npm install && cd ..
fi

# Start backend and frontend
echo -e "${GREEN}Starting backend server (port 4100)...${NC}"
node server/payhero-example.js &
BACKEND_PID=$!

sleep 2

echo -e "${GREEN}Starting frontend development server (port 8080)...${NC}"
npm run dev &
FRONTEND_PID=$!

echo ""
echo -e "${GREEN}✓ Both servers are running!${NC}"
echo ""
echo -e "${BLUE}Frontend:  http://localhost:8080${NC}"
echo -e "${BLUE}Backend:   http://localhost:4100${NC}"
echo ""
echo "Press Ctrl+C to stop both servers"

# Cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID" EXIT

wait
