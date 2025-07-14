# Database Setup Guide

## Current Status: ✅ SQLite Working

The application is now configured to use **SQLite** by default, which requires **no setup** and works immediately!

### Current Configuration
- **Database**: SQLite (file-based, no server needed)
- **Location**: `backend/finance_app.db` (created automatically)
- **Status**: ✅ Ready to use

## Quick Start (SQLite - Recommended)

Your app is ready to use! Just:

1. **Run the backend**: `./restart-backend.sh`
2. **Start frontend**: `npm run dev`
3. **Open browser**: `http://localhost:5173`

## Advanced: PostgreSQL Setup (Optional)

If you want to use PostgreSQL instead of SQLite:

## Prerequisites

- PostgreSQL 12 or higher
- Python 3.8 or higher

## Installation

### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
```

### macOS
```bash
brew install postgresql
brew services start postgresql
```

### Windows
Download and install from [PostgreSQL official website](https://www.postgresql.org/download/windows/)

## Database Setup

### Automatic Setup (Recommended)
Run the provided setup script:
```bash
./setup-db.sh
```

This script will:
- Create a database named `finance_db`
- Create a user named `finance_user` with password `finance_password`
- Set up proper permissions
- Update the `.env` file with the correct database URL

### Manual Setup
If you prefer to set up the database manually:

1. **Access PostgreSQL as the postgres user:**
   ```bash
   sudo -u postgres psql
   ```

2. **Create the database and user:**
   ```sql
   CREATE DATABASE finance_db;
   CREATE USER finance_user WITH PASSWORD 'finance_password';
   GRANT ALL PRIVILEGES ON DATABASE finance_db TO finance_user;
   ALTER DATABASE finance_db OWNER TO finance_user;
   \q
   ```

3. **Update the `.env` file:**
   ```bash
   echo "DATABASE_URL=postgresql://finance_user:finance_password@localhost:5432/finance_db" > backend/.env
   ```

## Database Schema

The application automatically creates the following tables:

### Transactions Table
- `id` (Primary Key)
- `date` (Transaction date)
- `title` (Transaction description)
- `type` (income/expense)
- `amount` (Transaction amount)
- `category` (Transaction category)
- `notes` (Optional notes)
- `created_at` (Timestamp)

### Budgets Table
- `id` (Primary Key)
- `name` (Budget category name)
- `budgetLimit` (Budget limit amount)
- `color` (Visual color for the budget)
- `period` (Budget period, e.g., "Monthly")
- `created_at` (Timestamp)

## Configuration

### Environment Variables
The backend uses the following environment variables (stored in `backend/.env`):

```env
DATABASE_URL=postgresql://finance_user:finance_password@localhost:5432/finance_db
FLASK_ENV=development
FLASK_DEBUG=True
```

### Database Connection
The Flask application automatically:
- Connects to the database on startup
- Creates tables if they don't exist
- Handles database errors gracefully

## API Endpoints

### Transactions
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create a new transaction
- `PUT /api/transactions/{id}` - Update a transaction
- `DELETE /api/transactions/{id}` - Delete a transaction

### Budgets
- `GET /api/budgets` - Get all budgets
- `POST /api/budgets` - Create a new budget
- `PUT /api/budgets/{id}` - Update a budget
- `DELETE /api/budgets/{id}` - Delete a budget

## Troubleshooting

### Common Issues

1. **Connection refused errors:**
   - Ensure PostgreSQL is running: `sudo systemctl status postgresql`
   - Start PostgreSQL if stopped: `sudo systemctl start postgresql`

2. **Authentication errors:**
   - Verify database credentials in `.env` file
   - Check if user has proper permissions

3. **Database not found:**
   - Run the setup script again: `./setup-db.sh`
   - Or create the database manually as shown above

4. **Permission denied:**
   - Ensure the database user has proper permissions
   - Grant all privileges: `GRANT ALL PRIVILEGES ON DATABASE finance_db TO finance_user;`

### Resetting the Database
To start fresh:
```bash
sudo -u postgres psql -c "DROP DATABASE IF EXISTS finance_db;"
./setup-db.sh
```

## Security Notes

- Change default passwords in production
- Use environment variables for sensitive data
- Consider using SSL connections for production deployments
- Regularly backup your database

## Backup and Restore

### Backup
```bash
pg_dump -U finance_user -h localhost finance_db > backup.sql
```

### Restore
```bash
psql -U finance_user -h localhost finance_db < backup.sql
```
