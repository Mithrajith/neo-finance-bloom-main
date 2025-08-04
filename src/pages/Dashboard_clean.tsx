import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import ChatArea from "@/components/ChatArea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Plus, Bot, BarChart3 } from "lucide-react";
import { categoryStore } from "@/store/categoryStore";
import { useFinancialAnalysis } from "@/hooks/useFinancialAnalysis";
import { dashboardAPI, transactionAPI } from "@/lib/api";
import { AddTransactionModal, Transaction } from "@/components/AddTransactionModal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DashboardStats {
  total_income: number;
  total_expenses: number;
  total_budget: number;
  remaining_budget: number;
  net_income: number;
  transaction_count: number;
  budget_count: number;
  recent_transactions: any[];
}

const Dashboard = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [categoryData, setCategoryData] = useState(categoryStore.getCategoryData() || []);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string>("");
  const { analyzeFinancialData, isAnalyzing, error } = useFinancialAnalysis();

  useEffect(() => {
    try {
      fetchDashboardStats();
      setCategoryData(categoryStore.getCategoryData() || []);
      
      const unsubscribe = categoryStore.subscribe(() => {
        setCategoryData(categoryStore.getCategoryData() || []);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error in Dashboard useEffect:', error);
    }
  }, []);

  const fetchDashboardStats = async () => {
    try {
      console.log('Fetching dashboard stats...');
      setIsStatsLoading(true);
      const stats = await dashboardAPI.getStats();
      console.log('Dashboard stats received:', stats);
      setDashboardStats(stats);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      // Set some default stats to prevent white screen
      setDashboardStats({
        total_income: 0,
        total_expenses: 0,
        total_budget: 0,
        remaining_budget: 0,
        net_income: 0,
        transaction_count: 0,
        budget_count: 0,
        recent_transactions: []
      });
    } finally {
      setIsStatsLoading(false);
    }
  };

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const handleOpenTransactionModal = () => {
    try {
      console.log('Opening transaction modal...');
      setIsTransactionModalOpen(true);
    } catch (error) {
      console.error('Error opening transaction modal:', error);
    }
  };

  const handleSaveTransaction = async (transaction: Transaction) => {
    try {
      console.log('Saving transaction:', transaction);
      await transactionAPI.create(transaction);
      setIsTransactionModalOpen(false);
      // Refresh dashboard stats after adding transaction
      await fetchDashboardStats();
      console.log('Transaction saved successfully');
    } catch (error) {
      console.error('Failed to save transaction:', error);
      // Don't close the modal if there's an error
      alert('Failed to save transaction. Please try again.');
    }
  };

  const handleFinancialAnalysis = async () => {
    if (!dashboardStats) return;
    
    const financialData = {
      transactions: dashboardStats.recent_transactions,
      income: dashboardStats.total_income,
      expenses: dashboardStats.total_expenses,
      question: "Please analyze my financial situation and provide insights on my spending patterns and savings potential."
    };

    const result = await analyzeFinancialData(financialData);
    if (result) {
      setAnalysisResult(result.analysis);
      setAnalysisOpen(true);
    }
  };

  // Create dynamic summary data from dashboard stats with safe defaults
  const summaryData = dashboardStats ? [
    {
      title: "Total Balance",
      value: `$${(dashboardStats.net_income || 0).toLocaleString()}`,
      change: (dashboardStats.net_income || 0) >= 0 ? "+100%" : "-100%",
      trend: (dashboardStats.net_income || 0) >= 0 ? "up" : "down",
      icon: DollarSign,
    },
    {
      title: "Total Income",
      value: `$${(dashboardStats.total_income || 0).toLocaleString()}`,
      change: "+100%",
      trend: "up",
      icon: TrendingUp,
    },
    {
      title: "Total Expenses",
      value: `$${(dashboardStats.total_expenses || 0).toLocaleString()}`,
      change: "-100%",
      trend: "down",
      icon: TrendingDown,
    },
  ] : [
    {
      title: "Total Balance",
      value: "$0",
      change: "+0%",
      trend: "up",
      icon: DollarSign,
    },
    {
      title: "Total Income",
      value: "$0",
      change: "+0%",
      trend: "up",
      icon: TrendingUp,
    },
    {
      title: "Total Expenses",
      value: "$0",
      change: "-0%",
      trend: "down",
      icon: TrendingDown,
    },
  ];

  // Create monthly data (simplified for now - using current totals) with safe defaults
  const monthlyData = dashboardStats ? [
    { 
      month: "Current", 
      income: dashboardStats.total_income || 0, 
      expenses: dashboardStats.total_expenses || 0 
    },
  ] : [
    { 
      month: "Current", 
      income: 0, 
      expenses: 0 
    },
  ];

  // Chart configurations
  const pieChartConfig = {
    spending: {
      label: "Spending",
    },
    ...categoryData.reduce((acc, category) => {
      acc[category.name.toLowerCase().replace(/\s+/g, '')] = {
        label: category.name,
        color: category.color,
      };
      return acc;
    }, {} as any)
  };

  const barChartConfig = {
    income: {
      label: "Income",
      color: "hsl(var(--chart-1))",
    },
    expenses: {
      label: "Expenses", 
      color: "hsl(var(--chart-2))",
    },
  };

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
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Here's your financial overview.
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleFinancialAnalysis} variant="outline" className="gap-2" disabled={isAnalyzing}>
              <BarChart3 className="h-4 w-4" />
              {isAnalyzing ? "Analyzing..." : "AI Analysis"}
            </Button>
            <Button onClick={toggleChat} variant="outline" className="gap-2">
              <Bot className="h-4 w-4" />
              AI Chat
            </Button>
            <Button 
              onClick={handleOpenTransactionModal}
              className="btn-primary gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Transaction
            </Button>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {isStatsLoading ? (
            <div className="col-span-3 flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            summaryData.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <Card className="card-apple hover:shadow-apple-xl transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {item.title}
                    </CardTitle>
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                      {item.value}
                    </div>
                    <p className={`text-xs flex items-center gap-1 mt-1 ${
                      item.trend === "up" ? "text-green-600" : "text-red-600"
                    }`}>
                      {item.trend === "up" ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {item.change} from last month
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </motion.div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Enhanced Category Spending Pie Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="card-apple">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                  Spending by Category
                </CardTitle>
                <CardDescription>
                  Your expenses breakdown for this month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={pieChartConfig}
                  className="mx-auto aspect-square max-h-[350px]"
                >
                  <PieChart>
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      innerRadius={60}
                      strokeWidth={2}
                      stroke="hsl(var(--background))"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color}
                          className="hover:opacity-80 transition-opacity duration-200"
                        />
                      ))}
                    </Pie>
                    <ChartLegend
                      content={<ChartLegendContent nameKey="name" />}
                      className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
                    />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Enhanced Monthly Trends Bar Chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="card-apple">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-500 to-blue-500"></div>
                  Monthly Trends
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  Income vs Expenses over the last 6 months
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={barChartConfig} className="min-h-[350px]">
                  <BarChart
                    data={monthlyData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      className="stroke-muted/30"
                      vertical={false}
                    />
                    <XAxis 
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      className="text-xs fill-muted-foreground"
                    />
                    <YAxis 
                      tickLine={false}
                      axisLine={false}
                      className="text-xs fill-muted-foreground"
                      tickFormatter={(value) => `$${value}`}
                    />
                    <ChartTooltip
                      cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
                      content={<ChartTooltipContent indicator="dot" />}
                    />
                    <Bar 
                      dataKey="income" 
                      fill="var(--color-income)"
                      radius={[4, 4, 0, 0]}
                      className="hover:opacity-80 transition-opacity duration-200"
                    />
                    <Bar 
                      dataKey="expenses" 
                      fill="var(--color-expenses)"
                      radius={[4, 4, 0, 0]}
                      className="hover:opacity-80 transition-opacity duration-200"
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Chat Area */}
      <ChatArea isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

      {/* Financial Analysis Dialog */}
      <Dialog open={analysisOpen} onOpenChange={setAnalysisOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              AI Financial Analysis
            </DialogTitle>
            <DialogDescription>
              AI-powered insights about your financial data using gemma:2b model
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4">
              {error ? (
                <div className="text-red-600 bg-red-50 p-4 rounded-lg">
                  Error: {error}
                </div>
              ) : (
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {analysisResult}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        onSave={handleSaveTransaction}
      />
    </Layout>
  );
};

export default Dashboard;
