
import { useState } from "react";
import { motion } from "framer-motion";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCategory: (category: { name: string; budgetLimit: number; color: string }) => void;
}

const colors = [
  "#0EA5E9", "#8B5CF6", "#F59E0B", "#EF4444", "#10B981", 
  "#6366F1", "#F97316", "#EC4899", "#14B8A6", "#84CC16"
];

const AddCategoryModal = ({ isOpen, onClose, onAddCategory }: AddCategoryModalProps) => {
  const [name, setName] = useState("");
  const [budgetLimit, setBudgetLimit] = useState("");
  const [selectedColor, setSelectedColor] = useState(colors[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && budgetLimit) {
      onAddCategory({
        name,
        budgetLimit: parseFloat(budgetLimit),
        color: selectedColor,
      });
      setName("");
      setBudgetLimit("");
      setSelectedColor(colors[0]);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md"
      >
        <Card className="card-apple">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Add New Category</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="categoryName">Category Name</Label>
                <Input
                  id="categoryName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Food & Dining"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="budgetLimit">Budget Limit ($)</Label>
                <Input
                  id="budgetLimit"
                  type="number"
                  value={budgetLimit}
                  onChange={(e) => setBudgetLimit(e.target.value)}
                  placeholder="500"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <Label>Color</Label>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        selectedColor === color 
                          ? "border-foreground scale-110" 
                          : "border-border hover:scale-105"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setSelectedColor(color)}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 gap-2">
                  <Plus className="h-4 w-4" />
                  Add Category
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default AddCategoryModal;
