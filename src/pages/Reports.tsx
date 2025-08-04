import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { Download, Calendar, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { transactionAPI, budgetAPI } from "@/lib/api";

interface Transaction {
  id: number;
  date: string;
  title: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  notes?: string;
}

interface Budget {
  id: number;
  name: string;
  budgetLimit: number;
  spent: number;
  remaining: number;
  color: string;
}

const Reports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("6months");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [transactionsData, budgetsData] = await Promise.all([
        transactionAPI.getAll(),
        budgetAPI.getAll()
      ]);
      setTransactions(transactionsData);
      setBudgets(budgetsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Process data for charts
  const processMonthlyTrends = () => {
    const monthlyData = new Map();
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, {
          month: monthName,
          income: 0,
          expenses: 0,
          savings: 0
        });
      }
      
      const data = monthlyData.get(monthKey);
      if (transaction.type === 'income') {
        data.income += transaction.amount;
      } else {
        data.expenses += transaction.amount;
      }
      data.savings = data.income - data.expenses;
    });
    
    return Array.from(monthlyData.values()).slice(-6); // Last 6 months
  };

  const processCategoryAnalysis = () => {
    const categoryTotals = new Map();
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    
    transactions.filter(t => t.type === 'expense').forEach(transaction => {
      if (!categoryTotals.has(transaction.category)) {
        const budget = budgets.find(b => b.name === transaction.category);
        categoryTotals.set(transaction.category, {
          category: transaction.category,
          amount: 0,
          color: budget?.color || '#6366F1'
        });
      }
      categoryTotals.get(transaction.category).amount += transaction.amount;
    });
    
    return Array.from(categoryTotals.values()).map(cat => ({
      ...cat,
      percentage: totalExpenses > 0 ? Math.round((cat.amount / totalExpenses) * 100) : 0
    }));
  };

  const monthlyTrends = processMonthlyTrends();
  const categoryAnalysis = processCategoryAnalysis();

  // Calculate key metrics
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const totalSavings = totalIncome - totalExpenses;
  const avgMonthlySavings = monthlyTrends.length > 0 ? totalSavings / monthlyTrends.length : 0;

  // Create savings goals from budgets
  const savingsGoals = budgets.map(budget => ({
    goal: budget.name,
    target: budget.budgetLimit,
    current: Math.max(0, budget.remaining),
    color: budget.color
  }));

  const exportToPDF = async () => {
    try {
      // Simple PDF export using window.print for now
      // We can implement a more sophisticated PDF solution later
      const printContent = `
        <html>
          <head><title>Financial Report</title></head>
          <body>
            <h1>Financial Report</h1>
            <h2>Summary</h2>
            <p>Total Income: $${totalIncome.toFixed(2)}</p>
            <p>Total Expenses: $${totalExpenses.toFixed(2)}</p>
            <p>Total Savings: $${totalSavings.toFixed(2)}</p>
            
            <h2>Category Breakdown</h2>
            ${categoryAnalysis.map(cat => 
              `<p>${cat.category}: $${cat.amount.toFixed(2)} (${cat.percentage}%)</p>`
            ).join('')}
            
            <h2>Budget Overview</h2>
            ${budgets.map(budget => 
              `<p>${budget.name}: $${budget.spent.toFixed(2)} of $${budget.budgetLimit.toFixed(2)} spent</p>`
            ).join('')}
          </body>
        </html>
      `;
      
      const printWindow = window.open('', '_blank');
      printWindow?.document.write(printContent);
      printWindow?.document.close();
      printWindow?.print();
    } catch (error) {
      console.error('Failed to export PDF:', error);
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-between items-center"
            >
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Detailed insights into your financial patterns
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="btn-secondary gap-2">
              <Calendar className="h-4 w-4" />
              Date Range
            </Button>
            <Button 
              onClick={exportToPDF}
              className="btn-primary gap-2"
            >
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">Last 3 months</SelectItem>
              <SelectItem value="6months">Last 6 months</SelectItem>
              <SelectItem value="1year">Last year</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              <SelectItem value="food">Food & Dining</SelectItem>
              <SelectItem value="transport">Transportation</SelectItem>
              <SelectItem value="entertainment">Entertainment</SelectItem>
              <SelectItem value="shopping">Shopping</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          <Card className="card-apple">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Income
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${totalIncome.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Last 6 months
              </p>
            </CardContent>
          </Card>

          <Card className="card-apple">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Expenses
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ${totalExpenses.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Last 6 months
              </p>
            </CardContent>
          </Card>

          <Card className="card-apple">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Savings
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                ${totalSavings.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Last 6 months
              </p>
            </CardContent>
          </Card>

          <Card className="card-apple">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg. Monthly Savings
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                ${avgMonthlySavings.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Per month
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Income vs Expenses Trend */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="card-apple">
              <CardHeader>
                <CardTitle>Income vs Expenses Trend</CardTitle>
                <CardDescription>
                  Monthly comparison over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value}`, ""]} />
                      <Line 
                        type="monotone" 
                        dataKey="income" 
                        stroke="#10B981" 
                        strokeWidth={3}
                        name="Income"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="expenses" 
                        stroke="#EF4444" 
                        strokeWidth={3}
                        name="Expenses"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="savings" 
                        stroke="#0EA5E9" 
                        strokeWidth={3}
                        name="Savings"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Category Breakdown */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="card-apple">
              <CardHeader>
                <CardTitle>Expense Categories</CardTitle>
                <CardDescription>
                  Breakdown by spending category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryAnalysis}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="amount"
                        label={({ category, percentage }) => 
                          `${category} ${percentage}%`
                        }
                      >
                        {categoryAnalysis.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`$${value}`, "Amount"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Savings Goals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="card-apple">
            <CardHeader>
              <CardTitle>Savings Goals Progress</CardTitle>
              <CardDescription>
                Track your progress towards financial goals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {savingsGoals.map((goal, index) => {
                  const percentage = (goal.current / goal.target) * 100;
                  return (
                    <motion.div
                      key={goal.goal}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className="space-y-3"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{goal.goal}</h4>
                          <p className="text-sm text-muted-foreground">
                            ${goal.current.toLocaleString()} of ${goal.target.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">{percentage.toFixed(1)}%</div>
                          <div className="text-sm text-muted-foreground">
                            ${(goal.target - goal.current).toLocaleString()} remaining
                          </div>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3">
                        <div
                          className="h-3 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(percentage, 100)}%`,
                            backgroundColor: goal.color,
                          }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default Reports;