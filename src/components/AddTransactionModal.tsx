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

export interface Transaction {
  id?: number;
  date: string;
  title: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  notes?: string;
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

  useEffect(() => {
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
  }, [transactionToEdit, isOpen]);

  const handleSave = () => {
    onSave(transaction);
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
            <Input
              id="category"
              value={transaction.category}
              onChange={(e) =>
                setTransaction({ ...transaction, category: e.target.value })
              }
              className="col-span-3"
            />
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
