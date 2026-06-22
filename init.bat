@echo off
REM Project initialization script for Windows

echo 🚀 Initializing Plagiarism Checker Project...

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    exit /b 1
)

echo.
echo Creating backend environment file...
if not exist "backend\.env" (
    copy backend\.env.example backend\.env
    echo ✓ Backend .env created
) else (
    echo ✓ Backend .env already exists
)

echo.
echo Creating frontend environment file...
if not exist "frontend\.env" (
    copy frontend\.env.example frontend\.env
    echo ✓ Frontend .env created
) else (
    echo ✓ Frontend .env already exists
)

echo.
echo Installing backend dependencies...
cd backend
call npm install
echo ✓ Backend dependencies installed
cd ..

echo.
echo Installing frontend dependencies...
cd frontend
call npm install
echo ✓ Frontend dependencies installed
cd ..

echo.
echo Creating directories...
if not exist "backend\src\uploads" mkdir backend\src\uploads
if not exist "backend\logs" mkdir backend\logs
echo ✓ Directories created

echo.
echo ✅ Project initialization complete!
echo.
echo 📋 Next steps:
echo 1. Update backend\.env with your database credentials
echo 2. Update frontend\.env with your API URL if needed
echo 3. Create MySQL database and import schema:
echo    mysql -u root -p ^< backend\database\schema.sql
echo 4. Start backend: cd backend ^&^& npm run dev
echo 5. Start frontend: cd frontend ^&^& npm start
echo.
