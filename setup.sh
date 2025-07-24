#!/bin/bash

echo "🚀 Setting up Neo Finance Bloom with AI Chat Integration & SQLite"
echo "=============================================================="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama is not installed."
    echo "📥 Please install Ollama from: https://ollama.ai"
    echo "   Then run: ollama pull gemma:2b"
    exit 1
fi

echo "✅ Python and Ollama found!"
echo "✅ SQLite is built into Python - no separate installation needed!"

# Setup SQLite database
echo "🗄️ Setting up SQLite database..."
./setup-db.sh

# Setup Python backend
echo "🐍 Setting up Python backend..."
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Install Python dependencies
echo "📚 Installing Python dependencies..."
pip install -r requirements.txt

echo "✅ Python backend setup complete!"

# Check if gemma:2b model is available
echo "🤖 Checking gemma:2b model..."
if ollama list | grep -q "gemma:2b"; then
    echo "✅ gemma:2b model is available!"
else
    echo "📥 Downloading gemma:2b model (this may take a few minutes)..."
    ollama pull gemma:2b
    echo "✅ gemma:2b model downloaded!"
fi

echo ""
echo "🎉 Setup Complete!"
echo "==================="
echo ""
echo "To start the application:"
echo "1. Start the Python backend:"
echo "   cd backend && source venv/bin/activate && python app.py"
echo ""
echo "2. In another terminal, start the frontend:"
echo "   npm install && npm run dev"
echo ""
echo "3. Make sure Ollama is running:"
echo "   ollama serve"
echo ""
echo "📝 The AI chat will be available in the dashboard!"
echo "💡 You can ask questions about your finances and get AI-powered insights."
