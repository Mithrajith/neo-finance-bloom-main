import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { budgetAPI } from "@/lib/api";

export interface Transaction {
  id?: number;
  date: string;
  title: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  notes?: string;
}

interface Category {
  name: string;
  color: string;
}

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Transaction) => void;
  transactionToEdit?: Transaction | null;
}

export const AddTransactionModal = ({
  isOpen,
  onClose,
  onSave,
  transactionToEdit,
}: AddTransactionModalProps) => {
  const [transaction, setTransaction] = useState<Transaction>({
    date: new Date().toISOString().split("T")[0],
    title: "",
    type: "expense",
    amount: 0,
    category: "",
    notes: "",
  });
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch categories when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await budgetAPI.getCategories();
      setCategories(response);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    try {
      if (transactionToEdit) {
        setTransaction({
          ...transactionToEdit,
          date: new Date(transactionToEdit.date).toISOString().split("T")[0],
        });
      } else {
        // Reset to default when adding a new transaction
        setTransaction({
          date: new Date().toISOString().split("T")[0],
          title: "",
          type: "expense",
          amount: 0,
          category: "",
          notes: "",
        });
      }
    } catch (error) {
      console.error('Error setting transaction data:', error);
      // Set safe defaults
      setTransaction({
        date: new Date().toISOString().split("T")[0],
        title: "",
        type: "expense",
        amount: 0,
        category: "",
        notes: "",
      });
    }
  }, [transactionToEdit, isOpen]);

  const handleSave = () => {
    try {
      // Basic validation
      if (!transaction.title.trim()) {
        alert('Please enter a title for the transaction');
        return;
      }
      if (!transaction.category.trim()) {
        alert('Please select a category');
        return;
      }
      if (transaction.amount <= 0) {
        alert('Please enter a valid amount');
        return;
      }
      
      console.log('Saving transaction from modal:', transaction);
      onSave(transaction);
    } catch (error) {
      console.error('Error in handleSave:', error);
      alert('An error occurred while saving the transaction');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {transactionToEdit ? "Edit Transaction" : "Add Transaction"}
          </DialogTitle>
          <DialogDescription>
            {transactionToEdit
              ? "Update the details of your transaction."
              : "Add a new transaction to your records."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Title
            </Label>
            <Input
              id="title"
              value={transaction.title}
              onChange={(e) =>
                setTransaction({ ...transaction, title: e.target.value })
              }
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount
            </Label>
            <Input
              id="amount"
              type="number"
              value={transaction.amount}
              onChange={(e) =>
                setTransaction({
                  ...transaction,
                  amount: parseFloat(e.target.value) || 0,
                })
              }
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">
              Date
            </Label>
            <Input
              id="date"
              type="date"
              value={transaction.date}
              onChange={(e) =>
                setTransaction({ ...transaction, date: e.target.value })
              }
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">
              Type
            </Label>
            <Select
              value={transaction.type}
              onValueChange={(value: "income" | "expense") =>
                setTransaction({ ...transaction, type: value })
              }
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Category
            </Label>
            <Select
              value={transaction.category}
              onValueChange={(value: string) =>
                setTransaction({ ...transaction, category: value })
              }
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.name} value={category.name}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
                {categories.length === 0 && (
                  <SelectItem value="" disabled>
                    {isLoading ? "Loading categories..." : "No categories found"}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="notes" className="text-right">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={transaction.notes || ""}
              onChange={(e) =>
                setTransaction({ ...transaction, notes: e.target.value })
              }
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
