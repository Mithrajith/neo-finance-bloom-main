#!/bin/bash

# PostgreSQL Database Setup Script for Neo Finance Bloom
echo "Setting up PostgreSQL database for Neo Finance Bloom..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "PostgreSQL is not installed. Please install it first:"
    echo "Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib"
    echo "macOS: brew install postgresql"
    echo "Windows: Download from https://www.postgresql.org/download/"
    exit 1
fi

# Database configuration
DB_NAME="finance_db"
DB_USER="finance_user"
DB_PASSWORD="finance_password"

echo "Creating PostgreSQL database and user..."

# Create database and user (run as postgres user)
sudo -u postgres psql << EOF
-- Create database
CREATE DATABASE $DB_NAME;

-- Create user with password
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;

-- Make user owner of the database
ALTER DATABASE $DB_NAME OWNER TO $DB_USER;

-- Exit
\q
EOF

if [ $? -eq 0 ]; then
    echo "✓ Database '$DB_NAME' and user '$DB_USER' created successfully!"
    echo "✓ Database connection string: postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"
    
    # Update .env file with the correct database URL
    echo "Updating backend/.env file..."
    sed -i "s|DATABASE_URL=.*|DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME|" backend/.env
    
    echo "✓ Database setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Install Python dependencies: cd backend && pip install -r requirements.txt"
    echo "2. Start the backend server: cd backend && python app.py"
    echo "3. Start the frontend: npm install && npm run dev"
else
    echo "✗ Error creating database. Please check PostgreSQL installation and permissions."
    exit 1
fi
