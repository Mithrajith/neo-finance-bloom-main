# Finance AI Chat Backend

This is the Python backend for the AI chat functionality using Ollama with the Mistral model.

## Prerequisites

1. **Install Ollama**: Download and install Ollama from [https://ollama.ai](https://ollama.ai)

2. **Install Mistral model**:
   ```bash
   ollama pull mistral
   ```

3. **Python 3.8+**: Make sure you have Python installed

## Setup

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Start Ollama** (if not already running):
   ```bash
   ollama serve
   ```

3. **Run the backend**:
   ```bash
   python app.py
   ```

The backend will start on `http://localhost:5000`

## API Endpoints

### Health Check
- **GET** `/api/health`
- Returns the status of the backend and Ollama connection

### Chat
- **POST** `/api/chat`
- Body: `{"message": "your question", "context": "optional context"}`
- Returns AI response from Mistral model

### Financial Analysis
- **POST** `/api/financial-analysis`
- Body: `{"transactions": [], "income": 5000, "expenses": 3000, "question": "analyze my finances"}`
- Returns financial insights and analysis

## Example Usage

```bash
# Health check
curl http://localhost:5000/api/health

# Chat
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "How can I save more money?"}'

# Financial analysis
curl -X POST http://localhost:5000/api/financial-analysis \
  -H "Content-Type: application/json" \
  -d '{"income": 5000, "expenses": 3000, "question": "Should I be concerned about my spending?"}'
```

## Configuration

- **Ollama URL**: Default is `http://localhost:11434`
- **Model**: Uses `mistral` model by default
- **Port**: Backend runs on port 5000

## Troubleshooting

1. **Ollama not found**: Make sure Ollama is installed and running
2. **Mistral model not found**: Run `ollama pull mistral` to download the model
3. **Connection issues**: Check if Ollama is running on the correct port (11434)
