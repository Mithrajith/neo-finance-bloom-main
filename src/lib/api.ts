// API service for communicating with the backend
const API_BASE_URL = 'http://localhost:5000/api';

// Helper function for making API requests
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      credentials: 'include', // Include cookies for session management
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
}

// Authentication API functions
export const authAPI = {
  // Register a new user
  register: (userData: {
    full_name: string;
    email: string;
    password: string;
  }) => apiRequest('/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),

  // Login user
  login: (credentials: {
    email: string;
    password: string;
  }) => apiRequest('/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),

  // Logout user
  logout: () => apiRequest('/logout', {
    method: 'POST',
  }),

  // Get current user
  getCurrentUser: () => apiRequest('/me'),

  // Update user settings
  updateSettings: (settings: {
    full_name?: string;
    email?: string;
    current_password?: string;
    new_password?: string;
    currency?: string;
    language?: string;
    notifications?: {
      budget_alerts?: boolean;
      monthly_reports?: boolean;
      transaction_updates?: boolean;
      security_alerts?: boolean;
    };
  }) => apiRequest('/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  }),

  updatePassword: (currentPassword: string, newPassword: string) => apiRequest('/settings', {
    method: 'PUT',
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  }),
};

// Transaction API functions
export const transactionAPI = {
  // Get all transactions
  getAll: () => apiRequest('/transactions'),

  // Add a new transaction
  create: (transaction: {
    date: string;
    title: string;
    type: 'income' | 'expense';
    amount: number;
    category: string;
    notes?: string;
  }) => apiRequest('/transactions', {
    method: 'POST',
    body: JSON.stringify(transaction),
  }),

  // Update a transaction
  update: (id: number, transaction: {
    date?: string;
    title?: string;
    type?: 'income' | 'expense';
    amount?: number;
    category?: string;
    notes?: string;
  }) => apiRequest(`/transactions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(transaction),
  }),

  // Delete a transaction
  delete: (id: number) => apiRequest(`/transactions/${id}`, {
    method: 'DELETE',
  }),
};

// Budget API functions
export const budgetAPI = {
  // Get all budgets
  getAll: () => apiRequest('/budgets'),

  // Get categories for dropdowns
  getCategories: () => apiRequest('/categories'),

  // Add a new budget
  create: (budget: {
    name: string;
    budgetLimit: number;
    color: string;
    period?: string;
  }) => apiRequest('/budgets', {
    method: 'POST',
    body: JSON.stringify(budget),
  }),

  // Update a budget
  update: (id: number, budget: {
    name?: string;
    budgetLimit?: number;
    color?: string;
    period?: string;
  }) => apiRequest(`/budgets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(budget),
  }),

  // Delete a budget
  delete: (id: number) => apiRequest(`/budgets/${id}`, {
    method: 'DELETE',
  }),
};

// Dashboard API functions
export const dashboardAPI = {
  // Get dashboard statistics
  getStats: () => apiRequest('/dashboard-stats'),
};

// Chat API function (existing)
export const chatAPI = {
  sendMessage: (message: string, context?: string) => 
    apiRequest('/chat', {
      method: 'POST',
      body: JSON.stringify({ message, context }),
    }),
};

// Financial Analysis API function (existing)
export const analysisAPI = {
  analyze: (data: {
    transactions: any[];
    income: number;
    expenses: number;
    question?: string;
  }) => apiRequest('/financial-analysis', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// Health check API function
export const healthAPI = {
  check: () => apiRequest('/health'),
};
