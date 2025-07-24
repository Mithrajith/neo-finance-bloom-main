from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
import logging
import os
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

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

# Database Models
class Transaction(db.Model):
    __tablename__ = 'transactions'
    
    id = db.Column(db.Integer, primary_key=True)
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
    name = db.Column(db.String(100), unique=True, nullable=False)
    budgetLimit = db.Column(db.Float, nullable=False)
    color = db.Column(db.String(7), nullable=False)
    period = db.Column(db.String(20), default='Monthly')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        # Calculate spent amount from expenses
        expenses = db.session.query(db.func.sum(Transaction.amount)).filter(
            Transaction.category == self.name,
            Transaction.type == 'expense'
        ).scalar() or 0
        
        # Calculate income for this category
        income = db.session.query(db.func.sum(Transaction.amount)).filter(
            Transaction.category == self.name,
            Transaction.type == 'income'
        ).scalar() or 0
        
        # Calculate remaining: budget + income - expenses
        remaining = self.budgetLimit + income - expenses
        
        return {
            'id': self.id,
            'name': self.name,
            'budgetLimit': self.budgetLimit,
            'spent': float(expenses),
            'income': float(income),
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

# Transaction endpoints
@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    """Get all transactions"""
    try:
        transactions = Transaction.query.order_by(Transaction.date.desc()).all()
        return jsonify([t.to_dict() for t in transactions])
    except Exception as e:
        logger.error(f"Error fetching transactions: {e}")
        return jsonify({'error': 'Failed to fetch transactions'}), 500

@app.route('/api/transactions', methods=['POST'])
def add_transaction():
    """Add a new transaction"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Transaction data is required'}), 400
        
        new_transaction = Transaction(
            date=data.get('date'),
            title=data.get('title'),
            type=data.get('type'),
            amount=data.get('amount'),
            category=data.get('category'),
            notes=data.get('notes', '')
        )
        
        db.session.add(new_transaction)
        db.session.commit()
        
        return jsonify(new_transaction.to_dict()), 201
    except Exception as e:
        logger.error(f"Error adding transaction: {e}")
        db.session.rollback()
        return jsonify({'error': 'Failed to add transaction'}), 500

@app.route('/api/transactions/<int:transaction_id>', methods=['PUT'])
def update_transaction(transaction_id):
    """Update an existing transaction"""
    try:
        transaction = Transaction.query.get_or_404(transaction_id)
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Transaction data is required'}), 400
        
        transaction.date = data.get('date', transaction.date)
        transaction.title = data.get('title', transaction.title)
        transaction.type = data.get('type', transaction.type)
        transaction.amount = data.get('amount', transaction.amount)
        transaction.category = data.get('category', transaction.category)
        transaction.notes = data.get('notes', transaction.notes)
        
        db.session.commit()
        
        return jsonify(transaction.to_dict())
    except Exception as e:
        logger.error(f"Error updating transaction: {e}")
        db.session.rollback()
        return jsonify({'error': 'Failed to update transaction'}), 500

@app.route('/api/transactions/<int:transaction_id>', methods=['DELETE'])
def delete_transaction(transaction_id):
    """Delete a transaction"""
    try:
        transaction = Transaction.query.get_or_404(transaction_id)
        db.session.delete(transaction)
        db.session.commit()
        
        return jsonify({'message': 'Transaction deleted successfully'})
    except Exception as e:
        logger.error(f"Error deleting transaction: {e}")
        db.session.rollback()
        return jsonify({'error': 'Failed to delete transaction'}), 500

# Budget endpoints
@app.route('/api/budgets', methods=['GET'])
def get_budgets():
    """Get all budgets"""
    try:
        budgets = Budget.query.all()
        return jsonify([b.to_dict() for b in budgets])
    except Exception as e:
        logger.error(f"Error fetching budgets: {e}")
        return jsonify({'error': 'Failed to fetch budgets'}), 500

@app.route('/api/budgets', methods=['POST'])
def add_budget():
    """Add a new budget"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Budget data is required'}), 400
        
        new_budget = Budget(
            name=data.get('name'),
            budgetLimit=data.get('budgetLimit'),
            color=data.get('color'),
            period=data.get('period', 'Monthly')
        )
        
        db.session.add(new_budget)
        db.session.commit()
        
        return jsonify(new_budget.to_dict()), 201
    except Exception as e:
        logger.error(f"Error adding budget: {e}")
        db.session.rollback()
        return jsonify({'error': 'Failed to add budget'}), 500

@app.route('/api/budgets/<int:budget_id>', methods=['PUT'])
def update_budget(budget_id):
    """Update an existing budget"""
    try:
        budget = Budget.query.get_or_404(budget_id)
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Budget data is required'}), 400
        
        budget.name = data.get('name', budget.name)
        budget.budgetLimit = data.get('budgetLimit', budget.budgetLimit)
        budget.color = data.get('color', budget.color)
        budget.period = data.get('period', budget.period)
        
        db.session.commit()
        
        return jsonify(budget.to_dict())
    except Exception as e:
        logger.error(f"Error updating budget: {e}")
        db.session.rollback()
        return jsonify({'error': 'Failed to update budget'}), 500

@app.route('/api/budgets/<int:budget_id>', methods=['DELETE'])
def delete_budget(budget_id):
    """Delete a budget"""
    try:
        budget = Budget.query.get_or_404(budget_id)
        db.session.delete(budget)
        db.session.commit()
        
        return jsonify({'message': 'Budget deleted successfully'})
    except Exception as e:
        logger.error(f"Error deleting budget: {e}")
        db.session.rollback()
        return jsonify({'error': 'Failed to delete budget'}), 500

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
            if Transaction.query.count() == 0:
                sample_transactions = [
                    Transaction(date='2024-01-15', title='Grocery Shopping', type='expense', amount=125.50, category='Groceries', notes='Weekly groceries'),
                    Transaction(date='2024-01-14', title='Salary', type='income', amount=3500.00, category='Salary', notes='Monthly salary'),
                    Transaction(date='2024-01-13', title='Coffee', type='expense', amount=4.50, category='Food', notes='Morning coffee'),
                ]
                for transaction in sample_transactions:
                    db.session.add(transaction)
                
                sample_budgets = [
                    Budget(name='Groceries', budgetLimit=500.0, color='#10b981'),
                    Budget(name='Food', budgetLimit=200.0, color='#f59e0b'),
                    Budget(name='Transport', budgetLimit=150.0, color='#3b82f6'),
                ]
                for budget in sample_budgets:
                    db.session.add(budget)
                
                db.session.commit()
                logger.info("Sample data added to database!")
                
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
