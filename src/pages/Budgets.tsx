
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import AddCategoryModal from "@/components/AddCategoryModal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Plus, AlertTriangle, TrendingUp, Trash2, Edit } from "lucide-react";
import { budgetAPI } from "@/lib/api";

interface Budget {
  id: number;
  name: string;
  budgetLimit: number;
  spent: number;
  color: string;
  period: string;
  created_at?: string;
}

const Budgets = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await budgetAPI.getAll();
      setBudgets(data);
    } catch (error) {
      console.error("Failed to fetch budgets:", error);
      setError("Failed to load budgets. Please make sure the backend server is running.");
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePercentage = (spent: number, limit: number) => {
    return limit > 0 ? (spent / limit) * 100 : 0;
  };

  const getBudgetStatus = (spent: number, limit: number) => {
    const percentage = calculatePercentage(spent, limit);
    if (percentage >= 90) return "critical";
    if (percentage >= 75) return "warning";
    return "good";
  };

  const handleAddCategory = async (categoryData: { name: string; budgetLimit: number; color: string }) => {
    try {
      await budgetAPI.create(categoryData);
      await fetchBudgets(); // Refresh the list
      setIsAddModalOpen(false);
    } catch (error) {
      console.error("Failed to add budget:", error);
      alert("Failed to add budget. Please try again.");
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm("Are you sure you want to delete this budget category?")) {
      return;
    }

    try {
      await budgetAPI.delete(id);
      await fetchBudgets(); // Refresh the list
    } catch (error) {
      console.error("Failed to delete budget:", error);
      alert("Failed to delete budget. Please try again.");
    }
  };

  const totalBudget = budgets.reduce((sum, budget) => sum + budget.budgetLimit, 0);
  const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
  const totalRemaining = totalBudget - totalSpent;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading budgets...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={fetchBudgets} className="mt-4">
              Try Again
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

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
            <h1 className="text-3xl font-bold text-foreground">Budgets</h1>
            <p className="text-muted-foreground mt-1">
              Track your spending against your budget goals
            </p>
          </div>
          <Button 
            className="btn-primary gap-2"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Category
          </Button>
        </motion.div>

        {/* Budget Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <Card className="card-apple">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Budget
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ${totalBudget.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                For this month
              </p>
            </CardContent>
          </Card>

          <Card className="card-apple">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Spent
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ${totalSpent.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {((totalSpent / totalBudget) * 100).toFixed(1)}% of budget
              </p>
            </CardContent>
          </Card>

          <Card className="card-apple">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Remaining
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${totalRemaining.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Available to spend
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Budget Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          {budgets.map((budget, index) => {
            const percentage = calculatePercentage(budget.spent, budget.budgetLimit);
            const status = getBudgetStatus(budget.spent, budget.budgetLimit);
            const remaining = budget.budgetLimit - budget.spent;

            return (
              <motion.div
                key={budget.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <Card className="card-apple hover:shadow-apple-xl transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold">
                        {budget.name}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {status === "critical" && (
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                        )}
                        {status === "warning" && (
                          <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteCategory(budget.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <CardDescription>
                      {budget.period} Budget
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{percentage.toFixed(1)}%</span>
                      </div>
                      <Progress
                        value={percentage}
                        className="h-2"
                        style={{
                          backgroundColor: `${budget.color}20`,
                        }}
                      />
                    </div>

                    {/* Amount Details */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Spent</span>
                        <span className="font-medium text-red-600">
                          ${budget.spent.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Budget</span>
                        <span className="font-medium">
                          ${budget.budgetLimit.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-t pt-2">
                        <span className="text-sm font-medium">Remaining</span>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={status === "good" ? "default" : "destructive"}
                            className={
                              status === "good"
                                ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400"
                                : status === "warning"
                                ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400"
                                : "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400"
                            }
                          >
                            ${remaining.toLocaleString()}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      <AddCategoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddCategory={handleAddCategory}
      />
    </Layout>
  );
};

export default Budgets;
