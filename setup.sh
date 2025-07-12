#!/bin/bash

echo "🚀 Setting up Neo Finance Bloom with AI Chat Integration & PostgreSQL"
echo "=================================================================="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed."
    echo "📥 Please install PostgreSQL:"
    echo "   Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib"
    echo "   macOS: brew install postgresql"
    echo "   Windows: Download from https://www.postgresql.org/download/"
    exit 1
fi

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama is not installed."
    echo "📥 Please install Ollama from: https://ollama.ai"
    echo "   Then run: ollama pull mistral"
    exit 1
fi

echo "✅ Python, PostgreSQL, and Ollama found!"

# Setup PostgreSQL database
echo "🗄️ Setting up PostgreSQL database..."
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

# Check if Mistral model is available
echo "🤖 Checking Mistral model..."
if ollama list | grep -q "mistral"; then
    echo "✅ Mistral model is available!"
else
    echo "📥 Downloading Mistral model (this may take a few minutes)..."
    ollama pull mistral
    echo "✅ Mistral model downloaded!"
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
