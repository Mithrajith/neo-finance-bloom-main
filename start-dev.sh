#!/bin/bash

echo "🚀 Starting Neo Finance Bloom with AI Chat"
echo "=========================================="

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1
}

# Check dependencies
echo "🔍 Checking dependencies..."

if ! command_exists python3; then
    echo "❌ Python 3 not found. Please install Python 3.8+"
    exit 1
fi

if ! command_exists ollama; then
    echo "❌ Ollama not found. Please install from: https://ollama.ai"
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm not found. Please install Node.js"
    exit 1
fi

echo "✅ All dependencies found!"

# Start Ollama if not running
echo "🤖 Checking Ollama service..."
if ! port_in_use 11434; then
    echo "🚀 Starting Ollama..."
    ollama serve &
    OLLAMA_PID=$!
    sleep 3
    echo "✅ Ollama started (PID: $OLLAMA_PID)"
else
    echo "✅ Ollama is already running"
fi

# Check if gemma:2b model is available
echo "🔍 Checking gemma:2b model..."
if ! ollama list | grep -q "gemma:2b"; then
    echo "📥 Pulling gemma:2b model..."
    ollama pull gemma:2b
fi
echo "✅ gemma:2b model ready!"

# Start Python backend
echo "🐍 Starting Python backend..."
cd backend

if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt > /dev/null 2>&1

echo "🚀 Starting Flask backend on port 5000..."
python app.py &
BACKEND_PID=$!

# Go back to root directory
cd ..

# Install frontend dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Start frontend
echo "🌐 Starting frontend on port 5173..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "🎉 All services started!"
echo "======================="
echo "📱 Frontend: http://localhost:5173"
echo "🐍 Backend: http://localhost:5000"
echo "🤖 Ollama: http://localhost:11434"
echo ""
echo "💡 Open your browser and go to http://localhost:5173"
echo "🤖 Click 'AI Chat' in the dashboard to start chatting!"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo "✅ Frontend stopped"
    fi
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo "✅ Backend stopped"
    fi
    if [ ! -z "$OLLAMA_PID" ]; then
        kill $OLLAMA_PID 2>/dev/null
        echo "✅ Ollama stopped"
    fi
    exit 0
}

# Set trap to cleanup on exit
trap cleanup SIGINT SIGTERM

# Wait for all background processes
wait
