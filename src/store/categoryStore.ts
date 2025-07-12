
interface Category {
  id: number;
  name: string;
  budgetLimit: number;
  spent: number;
  color: string;
  period: string;
}

// Global category store
class CategoryStore {
  private categories: Category[] = [
    {
      id: 1,
      name: "Food & Dining",
      budgetLimit: 800,
      spent: 650,
      color: "#0EA5E9",
      period: "Monthly",
    },
    {
      id: 2,
      name: "Transportation",
      budgetLimit: 400,
      spent: 320,
      color: "#8B5CF6",
      period: "Monthly",
    },
    {
      id: 3,
      name: "Entertainment",
      budgetLimit: 300,
      spent: 280,
      color: "#F59E0B",
      period: "Monthly",
    },
    {
      id: 4,
      name: "Shopping",
      budgetLimit: 500,
      spent: 480,
      color: "#EF4444",
      period: "Monthly",
    },
    {
      id: 5,
      name: "Health & Fitness",
      budgetLimit: 200,
      spent: 150,
      color: "#10B981",
      period: "Monthly",
    },
    {
      id: 6,
      name: "Utilities",
      budgetLimit: 350,
      spent: 290,
      color: "#6366F1",
      period: "Monthly",
    },
  ];

  private listeners: (() => void)[] = [];

  getCategories(): Category[] {
    return this.categories;
  }

  addCategory(categoryData: { name: string; budgetLimit: number; color: string }) {
    const newCategory: Category = {
      id: Math.max(...this.categories.map(c => c.id), 0) + 1,
      name: categoryData.name,
      budgetLimit: categoryData.budgetLimit,
      spent: 0,
      color: categoryData.color,
      period: "Monthly",
    };
    
    this.categories.push(newCategory);
    this.notifyListeners();
  }

  deleteCategory(id: number) {
    this.categories = this.categories.filter(cat => cat.id !== id);
    this.notifyListeners();
  }

  updateCategory(id: number, updates: Partial<Omit<Category, 'id'>>) {
    const index = this.categories.findIndex(cat => cat.id === id);
    if (index !== -1) {
      this.categories[index] = { ...this.categories[index], ...updates };
      this.notifyListeners();
    }
  }

  getCategoryData() {
    return this.categories.map(cat => ({
      name: cat.name,
      value: cat.spent,
      color: cat.color,
    }));
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }
}

export const categoryStore = new CategoryStore();
export type { Category };
