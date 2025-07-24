#!/bin/bash

# SQLite Database Setup Script for Neo Finance Bloom
echo "Setting up SQLite database for Neo Finance Bloom..."

# SQLite is built into Python, no installation required
echo "✅ SQLite is built into Python - no installation required!"

# Database configuration
DB_FILE="backend/finance_app.db"

# Create backend directory if it doesn't exist
if [ ! -d "backend" ]; then
    mkdir -p backend
    echo "✓ Created backend directory"
fi

# SQLite database file will be created automatically by the application
echo "✓ Database file will be created at: $DB_FILE"
echo "✓ No manual database setup required - SQLite handles everything automatically!"

# Create or update .env file for backend
ENV_FILE="backend/.env"
echo "Updating $ENV_FILE file..."

# Create .env file if it doesn't exist
if [ ! -f "$ENV_FILE" ]; then
    echo "Creating $ENV_FILE file..."
    cat > "$ENV_FILE" << EOF
# SQLite Database Configuration
DATABASE_URL=sqlite:///finance_app.db

# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=True
EOF
else
    # Update existing .env file
    sed -i.bak "s|DATABASE_URL=.*|DATABASE_URL=sqlite:///finance_app.db|" "$ENV_FILE" && rm -f "$ENV_FILE.bak"
fi

echo "✓ Environment configuration updated!"
echo "✓ Database setup complete!"
echo ""
echo "Next steps:"
echo "1. Install Python dependencies: cd backend && pip install -r requirements.txt"
echo "2. Start the backend server: cd backend && python app.py"
echo "3. Start the frontend: npm install && npm run dev"
echo ""
echo "📝 The SQLite database will be created automatically when you first run the application!"
