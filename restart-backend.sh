#!/bin/bash

echo "🔧 Fixing Database Connection Issues..."

# Kill any existing backend processes
echo "Stopping existing backend processes..."
pkill -f "python.*app.py" || true

# Navigate to backend directory
cd backend

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install any missing dependencies
echo "Installing dependencies..."
pip install flask flask-cors requests python-dotenv flask-sqlalchemy

# Start the backend
echo "Starting backend with SQLite..."
echo "Database will be created automatically at: $(pwd)/finance_app.db"
python app.py
