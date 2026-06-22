#!/bin/bash
# Project initialization script for development

echo "🚀 Initializing Plagiarism Checker Project..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo "⚠️  MySQL is not found in PATH. Make sure it's installed and running."
fi

# Create backend environment file
echo -e "${BLUE}Creating backend environment file...${NC}"
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo -e "${GREEN}✓ Backend .env created${NC}"
else
    echo -e "${GREEN}✓ Backend .env already exists${NC}"
fi

# Create frontend environment file
echo -e "${BLUE}Creating frontend environment file...${NC}"
if [ ! -f frontend/.env ]; then
    cp frontend/.env.example frontend/.env
    echo -e "${GREEN}✓ Frontend .env created${NC}"
else
    echo -e "${GREEN}✓ Frontend .env already exists${NC}"
fi

# Install backend dependencies
echo -e "${BLUE}Installing backend dependencies...${NC}"
cd backend
npm install
echo -e "${GREEN}✓ Backend dependencies installed${NC}"
cd ..

# Install frontend dependencies
echo -e "${BLUE}Installing frontend dependencies...${NC}"
cd frontend
npm install
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
cd ..

# Create uploads directory
echo -e "${BLUE}Creating uploads directory...${NC}"
mkdir -p backend/src/uploads
mkdir -p backend/logs
echo -e "${GREEN}✓ Directories created${NC}"

echo -e "${GREEN}✅ Project initialization complete!${NC}"
echo ""
echo "📋 Next steps:"
echo "1. Update backend/.env with your database credentials"
echo "2. Update frontend/.env with your API URL if needed"
echo "3. Create MySQL database and import schema:"
echo "   mysql -u root -p < backend/database/schema.sql"
echo "4. Start backend: cd backend && npm run dev"
echo "5. Start frontend: cd frontend && npm start"
echo ""
