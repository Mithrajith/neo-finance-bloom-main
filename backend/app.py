from flask import Flask, request, jsonify, session
from flask_cors import CORS
import requests
import json
import logging
import os
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
from datetime import datetime
import hashlib
import secrets
from functools import wraps

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, supports_credentials=True)  # Enable CORS for all routes with credentials

# Session configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', secrets.token_hex(16))
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SECURE'] = False  # Set to True in production with HTTPS

# Database configuration - SQLite only
database_url = os.getenv('DATABASE_URL', 'sqlite:///finance_app.db')
app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Create the database directory if needed
db_path = database_url.replace('sqlite:///', '')
db_dir = os.path.dirname(db_path)
if db_dir and not os.path.exists(db_dir):
    os.makedirs(db_dir)

db = SQLAlchemy(app)

# Authentication decorator
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function

# Database Models
class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # User settings
    currency = db.Column(db.String(3), default='USD')
    language = db.Column(db.String(5), default='en')
    budget_alerts = db.Column(db.Boolean, default=True)
    monthly_reports = db.Column(db.Boolean, default=True)
    transaction_updates = db.Column(db.Boolean, default=False)
    security_alerts = db.Column(db.Boolean, default=True)
    
    # Relationships
    transactions = db.relationship('Transaction', backref='user', lazy=True, cascade='all, delete-orphan')
    budgets = db.relationship('Budget', backref='user', lazy=True, cascade='all, delete-orphan')

    def set_password(self, password):
        """Hash and set the password"""
        self.password_hash = hashlib.sha256((password + 'salt').encode()).hexdigest()
    
    def check_password(self, password):
        """Check if the provided password matches the stored hash"""
        return self.password_hash == hashlib.sha256((password + 'salt').encode()).hexdigest()
    
    def to_dict(self):
        return {
            'id': self.id,
            'full_name': self.full_name,
            'email': self.email,
            'currency': self.currency,
            'language': self.language,
            'notifications': {
                'budget_alerts': self.budget_alerts,
                'monthly_reports': self.monthly_reports,
                'transaction_updates': self.transaction_updates,
                'security_alerts': self.security_alerts,
            },
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Transaction(db.Model):
    __tablename__ = 'transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    date = db.Column(db.String(10), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    type = db.Column(db.String(10), nullable=False)  # 'income' or 'expense'
    amount = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(100), nullable=False)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'date': self.date,
            'title': self.title,
            'type': self.type,
            'amount': self.amount,
            'category': self.category,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Budget(db.Model):
    __tablename__ = 'budgets'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    budgetLimit = db.Column(db.Float, nullable=False)
    color = db.Column(db.String(7), nullable=False)
    period = db.Column(db.String(20), default='Monthly')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        # Calculate spent amount from expenses for this user and category
        expenses = db.session.query(db.func.sum(Transaction.amount)).filter(
            Transaction.user_id == self.user_id,
            Transaction.category == self.name,
            Transaction.type == 'expense'
        ).scalar() or 0
        
        # Calculate income for this category for this user
        category_income = db.session.query(db.func.sum(Transaction.amount)).filter(
            Transaction.user_id == self.user_id,
            Transaction.category == self.name,
            Transaction.type == 'income'
        ).scalar() or 0
        
        # Calculate total income from all transactions for this user
        total_user_income = db.session.query(db.func.sum(Transaction.amount)).filter(
            Transaction.user_id == self.user_id,
            Transaction.type == 'income'
        ).scalar() or 0
        
        # Calculate remaining: budget + total income - expenses
        remaining = self.budgetLimit + total_user_income - expenses
        
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'budgetLimit': self.budgetLimit,
            'spent': float(expenses),
            'category_income': float(category_income),
            'total_income': float(total_user_income),
            'remaining': float(remaining),
            'color': self.color,
            'period': self.period,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Ollama configuration
OLLAMA_BASE_URL = "http://localhost:11434"
MODEL_NAME = "gemma:2b"

def check_ollama_connection():
    """Check if Ollama is running and the model is available"""
    try:
        response = requests.get(f"{OLLAMA_BASE_URL}/api/tags")
        if response.status_code == 200:
            models = response.json().get('models', [])
            model_names = [model['name'] for model in models]
            if any(MODEL_NAME in name for name in model_names):
                logger.info(f"Ollama is running and {MODEL_NAME} model is available")
                return True
            else:
                logger.warning(f"{MODEL_NAME} model not found. Available models: {model_names}")
                return False
        else:
            logger.error(f"Failed to connect to Ollama: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        logger.error(f"Error connecting to Ollama: {e}")
        return False

def generate_response(prompt, context=""):
    """Generate response using Ollama gemma:2b model"""
    try:
        # Enhance the prompt with financial context and formatting instructions
        enhanced_prompt = f"""You are a helpful AI financial assistant. You help users manage their finances, analyze spending patterns, create budgets, and provide financial advice.

IMPORTANT FORMATTING RULES:
- Use clear headings with ## or ### for main topics
- Use bullet points (- ) for lists and key points
- Use numbered lists (1. 2. 3.) for step-by-step instructions
- Use **bold text** for important concepts or warnings
- Use "Key Point:" format for highlighting critical information
- Break information into digestible paragraphs
- When providing financial advice, structure it clearly with sections

Context: {context}

User question: {prompt}

Please provide a helpful, accurate, and well-structured response about personal finance management. Format your response with clear headings, bullet points, and organized sections for better readability."""

        payload = {
            "model": MODEL_NAME,
            "prompt": enhanced_prompt,
            "stream": False,
            "options": {
                "temperature": 0.7,
                "top_p": 0.9,
                "max_tokens": 500
            }
        }

        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json=payload,
            timeout=30
        )

        if response.status_code == 200:
            result = response.json()
            return result.get('response', 'Sorry, I could not generate a response.')
        else:
            logger.error(f"Ollama API error: {response.status_code} - {response.text}")
            return "Sorry, I'm having trouble connecting to the AI service right now."

    except requests.exceptions.Timeout:
        logger.error("Timeout waiting for Ollama response")
        return "Sorry, the request timed out. Please try again."
    except requests.exceptions.RequestException as e:
        logger.error(f"Error calling Ollama API: {e}")
        return "Sorry, I'm having trouble connecting to the AI service right now."
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return "Sorry, an unexpected error occurred."

# Database API Endpoints

# Authentication endpoints
@app.route('/api/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not all(k in data for k in ('full_name', 'email', 'password')):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Check if user already exists
        existing_user = User.query.filter_by(email=data['email']).first()
        if existing_user:
            return jsonify({'error': 'Email already registered'}), 400
        
        # Create new user
        user = User(
            full_name=data['full_name'],
            email=data['email']
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        # Log the user in
        session['user_id'] = user.id
        
        return jsonify({
            'message': 'User registered successfully',
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Registration error: {e}")
        return jsonify({'error': 'Registration failed'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    """Login user"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not all(k in data for k in ('email', 'password')):
            return jsonify({'error': 'Missing email or password'}), 400
        
        # Find user
        user = User.query.filter_by(email=data['email']).first()
        if not user or not user.check_password(data['password']):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Create session
        session['user_id'] = user.id
        
        return jsonify({
            'message': 'Login successful',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Login error: {e}")
        return jsonify({'error': 'Login failed'}), 500

@app.route('/api/logout', methods=['POST'])
def logout():
    """Logout user"""
    session.pop('user_id', None)
    return jsonify({'message': 'Logout successful'}), 200

@app.route('/api/me', methods=['GET'])
@login_required
def get_current_user():
    """Get current user information"""
    user = User.query.get(session['user_id'])
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({'user': user.to_dict()}), 200

@app.route('/api/settings', methods=['PUT'])
@login_required
def update_settings():
    """Update user settings"""
    try:
        data = request.get_json()
        user = User.query.get(session['user_id'])
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Update user fields
        if 'full_name' in data:
            user.full_name = data['full_name']
        if 'email' in data:
            # Check if email is already taken by another user
            existing_user = User.query.filter(
                User.email == data['email'],
                User.id != user.id
            ).first()
            if existing_user:
                return jsonify({'error': 'Email already in use'}), 400
            user.email = data['email']
        
        if 'currency' in data:
            user.currency = data['currency']
        if 'language' in data:
            user.language = data['language']
            
        # Update notifications
        if 'notifications' in data:
            notifications = data['notifications']
            user.budget_alerts = notifications.get('budget_alerts', user.budget_alerts)
            user.monthly_reports = notifications.get('monthly_reports', user.monthly_reports)
            user.transaction_updates = notifications.get('transaction_updates', user.transaction_updates)
            user.security_alerts = notifications.get('security_alerts', user.security_alerts)
        
        # Update password if provided
        if 'current_password' in data and 'new_password' in data:
            if not user.check_password(data['current_password']):
                return jsonify({'error': 'Current password is incorrect'}), 400
            user.set_password(data['new_password'])
        
        db.session.commit()
        
        return jsonify({
            'message': 'Settings updated successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Settings update error: {e}")
        return jsonify({'error': 'Failed to update settings'}), 500

# Transaction endpoints
@app.route('/api/transactions', methods=['GET'])
@login_required
def get_transactions():
    """Get all transactions for the current user"""
    try:
        user_id = session['user_id']
        transactions = Transaction.query.filter_by(user_id=user_id).all()
        return jsonify([transaction.to_dict() for transaction in transactions])
    except Exception as e:
        logger.error(f"Error fetching transactions: {e}")
        return jsonify({'error': 'Failed to fetch transactions'}), 500

@app.route('/api/transactions', methods=['POST'])
@login_required
def add_transaction():
    """Add a new transaction for the current user"""
    try:
        data = request.get_json()
        user_id = session['user_id']
        
        # Validate required fields
        required_fields = ['date', 'title', 'type', 'amount', 'category']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400
            
        transaction = Transaction(
            user_id=user_id,
            date=data['date'],
            title=data['title'],
            type=data['type'],
            amount=data['amount'],
            category=data['category'],
            notes=data.get('notes', '')
        )
        
        db.session.add(transaction)
        db.session.commit()
        
        return jsonify(transaction.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error adding transaction: {e}")
        return jsonify({'error': 'Failed to add transaction'}), 500

@app.route('/api/transactions/<int:transaction_id>', methods=['PUT'])
@login_required
def update_transaction(transaction_id):
    """Update a transaction for the current user"""
    try:
        user_id = session['user_id']
        transaction = Transaction.query.filter_by(id=transaction_id, user_id=user_id).first()
        
        if not transaction:
            return jsonify({'error': 'Transaction not found'}), 404
            
        data = request.get_json()
        
        # Update fields if provided
        if 'date' in data:
            transaction.date = data['date']
        if 'title' in data:
            transaction.title = data['title']
        if 'type' in data:
            transaction.type = data['type']
        if 'amount' in data:
            transaction.amount = data['amount']
        if 'category' in data:
            transaction.category = data['category']
        if 'notes' in data:
            transaction.notes = data['notes']
            
        db.session.commit()
        
        return jsonify(transaction.to_dict())
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating transaction: {e}")
        return jsonify({'error': 'Failed to update transaction'}), 500

@app.route('/api/transactions/<int:transaction_id>', methods=['DELETE'])
@login_required
def delete_transaction(transaction_id):
    """Delete a transaction for the current user"""
    try:
        user_id = session['user_id']
        transaction = Transaction.query.filter_by(id=transaction_id, user_id=user_id).first()
        
        if not transaction:
            return jsonify({'error': 'Transaction not found'}), 404
            
        db.session.delete(transaction)
        db.session.commit()
        
        return jsonify({'message': 'Transaction deleted successfully'})
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting transaction: {e}")
        return jsonify({'error': 'Failed to delete transaction'}), 500

# Budget endpoints
@app.route('/api/budgets', methods=['GET'])
@login_required
def get_budgets():
    """Get all budgets for the current user"""
    try:
        user_id = session['user_id']
        budgets = Budget.query.filter_by(user_id=user_id).all()
        return jsonify([budget.to_dict() for budget in budgets])
    except Exception as e:
        logger.error(f"Error fetching budgets: {e}")
        return jsonify({'error': 'Failed to fetch budgets'}), 500

@app.route('/api/categories', methods=['GET'])
@login_required
def get_categories():
    """Get all budget categories for the current user"""
    try:
        user_id = session['user_id']
        budgets = Budget.query.filter_by(user_id=user_id).all()
        categories = [{'name': budget.name, 'color': budget.color} for budget in budgets]
        return jsonify(categories)
    except Exception as e:
        logger.error(f"Error fetching categories: {e}")
        return jsonify({'error': 'Failed to fetch categories'}), 500

@app.route('/api/budgets', methods=['POST'])
@login_required
def add_budget():
    """Add a new budget for the current user"""
    try:
        data = request.get_json()
        user_id = session['user_id']
        
        # Validate required fields
        required_fields = ['name', 'budgetLimit', 'color']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Check if budget with same name already exists for this user
        existing_budget = Budget.query.filter_by(
            user_id=user_id, 
            name=data['name']
        ).first()
        if existing_budget:
            return jsonify({'error': 'Budget category already exists'}), 400
            
        budget = Budget(
            user_id=user_id,
            name=data['name'],
            budgetLimit=data['budgetLimit'],
            color=data['color'],
            period=data.get('period', 'Monthly')
        )
        
        db.session.add(budget)
        db.session.commit()
        
        return jsonify(budget.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error adding budget: {e}")
        return jsonify({'error': 'Failed to add budget'}), 500

@app.route('/api/budgets/<int:budget_id>', methods=['PUT'])
@login_required
def update_budget(budget_id):
    """Update a budget for the current user"""
    try:
        user_id = session['user_id']
        budget = Budget.query.filter_by(id=budget_id, user_id=user_id).first()
        
        if not budget:
            return jsonify({'error': 'Budget not found'}), 404
            
        data = request.get_json()
        
        # Update fields if provided
        if 'name' in data:
            # Check if another budget with this name exists for this user
            existing_budget = Budget.query.filter_by(
                user_id=user_id, 
                name=data['name']
            ).filter(Budget.id != budget_id).first()
            if existing_budget:
                return jsonify({'error': 'Budget category name already exists'}), 400
            budget.name = data['name']
        if 'budgetLimit' in data:
            budget.budgetLimit = data['budgetLimit']
        if 'color' in data:
            budget.color = data['color']
        if 'period' in data:
            budget.period = data['period']
            
        db.session.commit()
        
        return jsonify(budget.to_dict())
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating budget: {e}")
        return jsonify({'error': 'Failed to update budget'}), 500

@app.route('/api/budgets/<int:budget_id>', methods=['DELETE'])
@login_required
def delete_budget(budget_id):
    """Delete a budget for the current user"""
    try:
        user_id = session['user_id']
        budget = Budget.query.filter_by(id=budget_id, user_id=user_id).first()
        
        if not budget:
            return jsonify({'error': 'Budget not found'}), 404
            
        db.session.delete(budget)
        db.session.commit()
        
        return jsonify({'message': 'Budget deleted successfully'})
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting budget: {e}")
        return jsonify({'error': 'Failed to delete budget'}), 500

@app.route('/api/dashboard-stats', methods=['GET'])
@login_required
def get_dashboard_stats():
    """Get dashboard statistics for the current user"""
    try:
        user_id = session['user_id']
        
        # Calculate total income
        total_income = db.session.query(db.func.sum(Transaction.amount)).filter(
            Transaction.user_id == user_id,
            Transaction.type == 'income'
        ).scalar() or 0
        
        # Calculate total expenses
        total_expenses = db.session.query(db.func.sum(Transaction.amount)).filter(
            Transaction.user_id == user_id,
            Transaction.type == 'expense'
        ).scalar() or 0
        
        # Calculate total budget limits
        total_budget = db.session.query(db.func.sum(Budget.budgetLimit)).filter(
            Budget.user_id == user_id
        ).scalar() or 0
        
        # Calculate remaining budget (total budget + total income - total expenses)
        remaining_budget = total_budget + total_income - total_expenses
        
        # Count transactions
        transaction_count = Transaction.query.filter_by(user_id=user_id).count()
        
        # Count budgets
        budget_count = Budget.query.filter_by(user_id=user_id).count()
        
        # Get recent transactions (last 5)
        recent_transactions = Transaction.query.filter_by(user_id=user_id)\
            .order_by(Transaction.created_at.desc())\
            .limit(5)\
            .all()
        
        return jsonify({
            'total_income': float(total_income),
            'total_expenses': float(total_expenses),
            'total_budget': float(total_budget),
            'remaining_budget': float(remaining_budget),
            'net_income': float(total_income - total_expenses),
            'transaction_count': transaction_count,
            'budget_count': budget_count,
            'recent_transactions': [transaction.to_dict() for transaction in recent_transactions]
        })
        
    except Exception as e:
        logger.error(f"Error fetching dashboard stats: {e}")
        return jsonify({'error': 'Failed to fetch dashboard stats'}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    ollama_status = check_ollama_connection()
    return jsonify({
        'status': 'healthy' if ollama_status else 'degraded',
        'ollama_available': ollama_status,
        'model': MODEL_NAME
    })

@app.route('/api/chat', methods=['POST'])
def chat():
    """Chat endpoint for AI conversations"""
    try:
        data = request.get_json()
        
        if not data or 'message' not in data:
            return jsonify({'error': 'Message is required'}), 400
        
        user_message = data['message']
        context = data.get('context', '')
        
        # Check if Ollama is available
        if not check_ollama_connection():
            return jsonify({
                'response': "I'm sorry, but the AI service is currently unavailable. Please make sure Ollama is running with the gemma:2b model installed.",
                'error': 'Ollama service unavailable'
            }), 503
        
        # Generate response
        ai_response = generate_response(user_message, context)
        
        return jsonify({
            'response': ai_response,
            'model': MODEL_NAME,
            'timestamp': json.dumps({"$date": {"$numberLong": str(int(request.environ.get('time', 0) * 1000))}})
        })
        
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/financial-analysis', methods=['POST'])
def financial_analysis():
    """Endpoint for financial data analysis"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Financial data is required'}), 400
        
        # Extract financial data
        transactions = data.get('transactions', [])
        income = data.get('income', 0)
        expenses = data.get('expenses', 0)
        
        # Create context for financial analysis
        context = f"""
        Financial Summary:
        - Monthly Income: ${income}
        - Monthly Expenses: ${expenses}
        - Net Income: ${income - expenses}
        - Number of transactions: {len(transactions)}
        """
        
        user_question = data.get('question', 'Please analyze my financial data and provide insights.')
        
        # Generate financial analysis
        analysis = generate_response(user_question, context)
        
        return jsonify({
            'analysis': analysis,
            'summary': {
                'income': income,
                'expenses': expenses,
                'net': income - expenses,
                'transaction_count': len(transactions)
            }
        })
        
    except Exception as e:
        logger.error(f"Error in financial analysis endpoint: {e}")
        return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    logger.info("Starting Finance AI Chat Backend...")
    logger.info(f"Using Ollama at: {OLLAMA_BASE_URL}")
    logger.info(f"Model: {MODEL_NAME}")
    logger.info(f"Database: {app.config['SQLALCHEMY_DATABASE_URI']}")
    
    # Initialize database
    with app.app_context():
        try:
            # Test database connection
            db.engine.connect()
            logger.info("Database connection successful!")
            
            # Create tables
            db.create_all()
            logger.info("Database tables created successfully!")
            
            # Add some sample data if tables are empty
            if User.query.count() == 0:
                # Create a sample user
                sample_user = User(
                    full_name='Demo User',
                    email='demo@example.com'
                )
                sample_user.set_password('demo123')
                db.session.add(sample_user)
                db.session.commit()
                
                # Add sample transactions for the demo user
                sample_transactions = [
                    Transaction(user_id=sample_user.id, date='2024-01-15', title='Grocery Shopping', type='expense', amount=125.50, category='Groceries', notes='Weekly groceries'),
                    Transaction(user_id=sample_user.id, date='2024-01-14', title='Salary', type='income', amount=3500.00, category='Salary', notes='Monthly salary'),
                    Transaction(user_id=sample_user.id, date='2024-01-13', title='Coffee', type='expense', amount=4.50, category='Food', notes='Morning coffee'),
                ]
                for transaction in sample_transactions:
                    db.session.add(transaction)
                
                # Add sample budgets for the demo user
                sample_budgets = [
                    Budget(user_id=sample_user.id, name='Groceries', budgetLimit=500.0, color='#10b981'),
                    Budget(user_id=sample_user.id, name='Food', budgetLimit=200.0, color='#f59e0b'),
                    Budget(user_id=sample_user.id, name='Transport', budgetLimit=150.0, color='#3b82f6'),
                ]
                for budget in sample_budgets:
                    db.session.add(budget)
                
                db.session.commit()
                logger.info("Sample user and data added to database!")
                logger.info("Demo login: demo@example.com / demo123")
                
        except Exception as e:
            logger.error(f"Database initialization error: {e}")
            logger.info("Continuing without database - some features may not work")
    
    # Check initial connection
    if check_ollama_connection():
        logger.info("Successfully connected to Ollama!")
    else:
        logger.warning("Warning: Could not connect to Ollama. Make sure it's running and the gemma:2b model is installed.")
        logger.info("To install gemma:2b model, run: ollama pull gemma:2b")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
