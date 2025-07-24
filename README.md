# Neo Finance Bloom - Personal Finance Management with AI

## Project Overview

Neo Finance Bloom is a modern personal finance management application built with React, TypeScript, and Tailwind CSS, featuring AI-powered financial assistance and persistent data storage with SQLite.

### 🚀 Key Features:
- 💰 **Transaction Management**: Add, edit, delete, and search transactions
- 📊 **Budget Tracking**: Create and monitor budget categories with visual progress
- 🤖 **AI Financial Assistant**: Chat with an AI powered by Ollama/gemma:2b for financial advice
- 📈 **Financial Analysis**: AI-powered insights into your spending patterns
- 🗄️ **Persistent Storage**: SQLite database for secure data persistence
- 📱 **Responsive Design**: Beautiful, modern UI that works on all devices

## 🤖 AI Chat Feature

This project includes an AI-powered financial assistant using **Ollama** with the **gemma:2b** model and a **Python Flask backend**!

### AI Features:
- 💬 Real-time AI chat for financial advice
- 📊 AI-powered financial analysis and insights
- 🧠 Powered by gemma:2b model via Ollama
- � Context-aware responses based on your financial data

## 🗄️ Database Integration

The application uses **SQLite** for persistent data storage, ensuring your financial data is securely saved and accessible across sessions. SQLite is a lightweight, file-based database that requires no server setup.

### Database Features:
- 📝 Persistent transaction storage
- 💾 Budget category management
- 🔄 Real-time data synchronization
- 🛡️ Secure data handling

## 🚀 Quick Start

1. **Run the setup script** (first time only):
   ```bash
   ./setup.sh
   ```
   This will:
   - Set up SQLite database (automatic, no server needed)
   - Install Python dependencies
   - Download the gemma:2b AI model

2. **Start all services**:
   ```bash
   ./start-dev.sh
   ```

3. **Open your browser** and go to `http://localhost:5173`

4. **Start managing your finances** with AI assistance!

## 📋 Prerequisites

Before running the setup script, make sure you have:

- **SQLite**: Built into Python (no separate installation needed)
- **Ollama**: AI model runner ([https://ollama.ai](https://ollama.ai))
- **Python 3.8+**: For the backend
- **Node.js**: For the frontend

2. **Setup Python backend**:
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   python app.py
   ```

3. **Setup React frontend** (in another terminal):
   ```bash
   npm install
   npm run dev
   ```

### API Endpoints

The Python backend provides these endpoints:
- `GET /api/health` - Check backend and Ollama status
- `POST /api/chat` - Send messages to AI assistant
- `POST /api/financial-analysis` - Get AI analysis of financial data

## How can I edit this code?

There are several ways of editing your application.

**Local Development**

You can work locally using your preferred IDE:

1. Clone this repository
2. Install dependencies: `npm install`
3. Setup backend: `cd backend && pip install -r requirements.txt`
4. Start development servers:
   - Backend: `cd backend && python app.py`
   - Frontend: `npm run dev`

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

### Frontend Deployment
You can deploy the frontend to any static hosting service:

1. **Build for production**: `npm run build`
2. **Deploy the `dist/` folder** to:
   - Vercel
   - Netlify
   - GitHub Pages
   - Firebase Hosting
   - Any static hosting service

### Backend Deployment
Deploy the Python Flask backend to:
- Heroku
- Railway
- Render
- DigitalOcean App Platform
- AWS/GCP/Azure

## Custom Domain

You can connect your own custom domain to your deployed application by configuring DNS settings with your hosting provider.
