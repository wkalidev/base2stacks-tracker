#!/bin/bash

# 🚀 Base2Stacks Bridge Tracker - Auto Setup Script
# Run this script to set everything up automatically!

echo "🌉 Base2Stacks Bridge Tracker - Installation"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

echo "${BLUE}Step 1/6:${NC} Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "${YELLOW}⚠️  Node.js not found. Please install Node.js 18+ from https://nodejs.org${NC}"
    exit 1
fi
echo "${GREEN}✅ Node.js version: $(node --version)${NC}"
echo ""

echo "${BLUE}Step 2/6:${NC} Checking npm installation..."
if ! command -v npm &> /dev/null; then
    echo "${YELLOW}⚠️  npm not found. Please install npm${NC}"
    exit 1
fi
echo "${GREEN}✅ npm version: $(npm --version)${NC}"
echo ""

echo "${BLUE}Step 3/6:${NC} Installing dependencies..."
npm install
if [ $? -eq 0 ]; then
    echo "${GREEN}✅ Dependencies installed successfully!${NC}"
else
    echo "${YELLOW}⚠️  Some dependencies failed to install. Check the errors above.${NC}"
fi
echo ""

echo "${BLUE}Step 4/6:${NC} Setting up environment variables..."
if [ ! -f ".env.local" ]; then
    cp .env.example .env.local
    echo "${GREEN}✅ Created .env.local from .env.example${NC}"
else
    echo "${GREEN}✅ .env.local already exists${NC}"
fi
echo ""

echo "${BLUE}Step 5/6:${NC} Checking Clarinet installation (optional)..."
if command -v clarinet &> /dev/null; then
    echo "${GREEN}✅ Clarinet version: $(clarinet --version)${NC}"
    echo "${BLUE}   Running contract tests...${NC}"
    clarinet test
else
    echo "${YELLOW}⚠️  Clarinet not found. Install it from: https://github.com/hirosystems/clarinet${NC}"
    echo "${YELLOW}   You can skip this for now and install it later.${NC}"
fi
echo ""

echo "${BLUE}Step 6/6:${NC} Initializing Git repository..."
if [ ! -d ".git" ]; then
    git init
    git add .
    git commit -m "feat: initial commit - Base2Stacks Bridge Tracker with \$B2S token"
    echo "${GREEN}✅ Git repository initialized with first commit${NC}"
else
    echo "${GREEN}✅ Git repository already initialized${NC}"
fi
echo ""

echo ""
echo "🎉 ${GREEN}Installation Complete!${NC}"
echo "=============================================="
echo ""
echo "📋 Next steps:"
echo ""
echo "1️⃣  Start development server:"
echo "   ${BLUE}npm run dev${NC}"
echo ""
echo "2️⃣  Open browser to:"
echo "   ${BLUE}http://localhost:3000${NC}"
echo ""
echo "3️⃣  Create GitHub repository:"
echo "   ${BLUE}gh repo create base2stacks-tracker --public --source=. --remote=origin${NC}"
echo "   or go to: https://github.com/new"
echo ""
echo "4️⃣  Push to GitHub:"
echo "   ${BLUE}git remote add origin https://github.com/wkalidev/base2stacks-tracker.git${NC}"
echo "   ${BLUE}git branch -M main${NC}"
echo "   ${BLUE}git push -u origin main${NC}"
echo ""
echo "5️⃣  Deploy to Vercel:"
echo "   ${BLUE}npm install -g vercel${NC}"
echo "   ${BLUE}vercel${NC}"
echo ""
echo "📚 Read QUICKSTART.md for detailed instructions"
echo "📈 Read STRATEGY.md for marketing strategy"
echo ""
echo "🚀 ${GREEN}Ready to build! Let's go!${NC}"
echo ""
