@echo off
REM Development startup script for Which Character Are You (Windows)

echo 🚀 Starting Which Character Are You Development Environment

REM Check if virtual environment exists
if not exist "backend\venv" (
    echo 📦 Creating Python virtual environment...
    cd backend
    python -m venv venv
    cd ..
)

REM Activate virtual environment and install dependencies
echo 📦 Installing Python dependencies...
cd backend
call venv\Scripts\activate
pip install -r requirements.txt
cd ..

REM Install frontend dependencies
echo 📦 Installing Node.js dependencies...
cd frontend
npm install
cd ..

echo ✅ Dependencies installed successfully!
echo.
echo 🔧 Make sure to:
echo 1. Copy env.example to backend\.env and configure your settings
echo 2. Copy env.example to frontend\.env.local and configure your settings
echo 3. Run the seed script: cd seed ^&^& python seed_mongo.py ..\characters.json ..\questions.json
echo.
echo 🚀 To start the development servers:
echo Backend:  cd backend ^&^& python app.py
echo Frontend: cd frontend ^&^& npm run dev
echo.
echo 📱 Application will be available at:
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:5000
pause
