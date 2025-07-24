# Database Setup Guide

## Current Status: ✅ SQLite Ready

The application is configured to use **SQLite** - a lightweight, file-based database that requires **no setup** and works immediately!

### Current Configuration
- **Database**: SQLite (file-based, no server needed)
- **Location**: `backend/finance_app.db` (created automatically)
- **Status**: ✅ Ready to use - no installation required

## Quick Start (SQLite - Default)

Your app is ready to use! Just:

1. **Run the backend**: `./restart-backend.sh`
2. **Start frontend**: `npm run dev`
3. **Open browser**: `http://localhost:5173`

## Why SQLite?

✅ **Zero Configuration**: No database server setup required
✅ **Built into Python**: No additional installations needed
✅ **Portable**: Single file database - easy backup and migration
✅ **Fast**: Excellent performance for single-user applications
✅ **Reliable**: Battle-tested, used by millions of applications
✅ **Perfect for Personal Finance**: Ideal for single-user desktop apps

## Database Schema

### Transactions Table
```sql
CREATE TABLE transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    title TEXT NOT NULL,
    type TEXT NOT NULL,  -- 'income' or 'expense'
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Budgets Table
```sql
CREATE TABLE budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    budgetLimit REAL NOT NULL,
    color TEXT NOT NULL,
    period TEXT DEFAULT 'Monthly',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Manual Database Operations

If you need to inspect or modify the database directly:

### Using SQLite CLI
```bash
# Install SQLite CLI (if not already installed)
# Ubuntu/Debian: sudo apt-get install sqlite3
# macOS: brew install sqlite
# Windows: Download from https://sqlite.org/download.html

# Open database
sqlite3 backend/finance_app.db

# Common commands:
.tables                    # List all tables
.schema                    # Show table schemas
SELECT * FROM transactions;   # View all transactions
SELECT * FROM budgets;        # View all budgets
.quit                      # Exit
```

### Database File Management
```bash
# Backup database
cp backend/finance_app.db backup/finance_app_backup.db

# Reset database (delete and recreate)
rm backend/finance_app.db
# Database will be recreated when you restart the backend

# View database size
ls -lh backend/finance_app.db
```

## Troubleshooting

### Database File Not Found
If you get a "database file not found" error:
1. Make sure you're in the project root directory
2. Run the backend server - it will create the database automatically
3. Check that the `backend/` directory exists

### Permission Issues
If you get permission errors:
```bash
# Make sure the backend directory is writable
chmod 755 backend/
```

### Database Corruption
If the database becomes corrupted:
```bash
# Check database integrity
sqlite3 backend/finance_app.db "PRAGMA integrity_check;"

# If corrupted, backup and recreate
mv backend/finance_app.db backend/finance_app_corrupted.db
# Restart backend to create new database
```

## Migration from Other Databases

If you're migrating from another database system:

1. **Export your data** from the old database
2. **Create CSV files** with your transactions and budgets
3. **Use the import functionality** in the web interface, or
4. **Write a Python script** to populate the SQLite database

## Advanced Configuration

### Custom Database Location
Set the `DATABASE_URL` environment variable:
```bash
# In backend/.env
DATABASE_URL=sqlite:///path/to/custom/database.db
```

### Database Performance Tuning
For better performance with large datasets:
```sql
-- Create indexes (run these in SQLite CLI)
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_category ON transactions(category);
CREATE INDEX idx_transactions_type ON transactions(type);
```

## Next Steps

Your SQLite database is ready to use! The backend will automatically:
- Create the database file on first run
- Set up all required tables
- Handle all database operations

Just run your application and start managing your finances!
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

1. **File permission errors:**
   - Ensure the backend directory is writable: `chmod 755 backend/`
   - Check disk space availability

2. **Database locked errors:**
   - Ensure no other processes are accessing the database
   - Restart the backend application

3. **Database corruption:**
   - Check integrity: `sqlite3 backend/finance_app.db "PRAGMA integrity_check;"`
   - Restore from backup if needed

### Resetting the Database
To start fresh:
```bash
rm backend/finance_app.db
# Database will be recreated when you restart the backend
```

## Security Notes

- Keep your database file secure (it's already ignored in .gitignore)
- Consider encrypting the database file for sensitive data
- Regular backups are just file copies - simple and reliable
- Regularly backup your database

## Backup and Restore

### Backup
```bash
cp backend/finance_app.db backup/finance_app_backup.db
```

### Restore
```bash
cp backup/finance_app_backup.db backend/finance_app.db
```
