import { useState } from "react";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { Download, Calendar, TrendingUp, TrendingDown, DollarSign } from "lucide-react";

// Dummy data for reports
const monthlyTrends = [
  { month: "Jul", income: 8200, expenses: 3750, savings: 4450 },
  { month: "Aug", income: 8500, expenses: 4200, savings: 4300 },
  { month: "Sep", income: 8000, expenses: 3500, savings: 4500 },
  { month: "Oct", income: 8800, expenses: 4100, savings: 4700 },
  { month: "Nov", income: 8200, expenses: 3900, savings: 4300 },
  { month: "Dec", income: 9200, expenses: 4500, savings: 4700 },
];

const categoryAnalysis = [
  { category: "Food & Dining", amount: 1200, percentage: 32, color: "#0EA5E9" },
  { category: "Transportation", amount: 800, percentage: 21, color: "#8B5CF6" },
  { category: "Shopping", amount: 600, percentage: 16, color: "#F59E0B" },
  { category: "Entertainment", amount: 500, percentage: 13, color: "#EF4444" },
  { category: "Utilities", amount: 400, percentage: 11, color: "#10B981" },
  { category: "Others", amount: 250, percentage: 7, color: "#6366F1" },
];

const savingsGoals = [
  { goal: "Emergency Fund", target: 10000, current: 7500, color: "#0EA5E9" },
  { goal: "Vacation", target: 3000, current: 1800, color: "#F59E0B" },
  { goal: "New Car", target: 25000, current: 12000, color: "#10B981" },
];

const Reports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("6months");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Calculate key metrics
  const totalIncome = monthlyTrends.reduce((sum, month) => sum + month.income, 0);
  const totalExpenses = monthlyTrends.reduce((sum, month) => sum + month.expenses, 0);
  const totalSavings = monthlyTrends.reduce((sum, month) => sum + month.savings, 0);
  const avgMonthlySavings = totalSavings / monthlyTrends.length;

  return (
    <Layout>
      <div className="space-y-8">
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
            <Button className="btn-primary gap-2">
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
      </div>
    </Layout>
  );
};

export default Reports;