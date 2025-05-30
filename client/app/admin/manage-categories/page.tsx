"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { ChevronUp, ChevronDown, ListOrdered, ArrowUpAZ } from "lucide-react";

interface Category {
  id: number;
  name: string;
}

export default function ManageCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: "" });
  const { getToken, userId } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sortOption, setSortOption] = useState("id-asc"); // id-asc, id-desc, name-asc, name-desc

  const fetchCategories = async () => {
    try {
      const token = await getToken();
      const response = await fetch("http://localhost:8800/api/categories", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      toast.error("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchCategories();
    }
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await getToken();
      const url = editingCategory
        ? `http://localhost:8800/api/categories/${editingCategory.id}`
        : "http://localhost:8800/api/categories";
      
      const response = await fetch(url, {
        method: editingCategory ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(editingCategory ? "Category updated successfully" : "Category created successfully");
        setIsDialogOpen(false);
        setFormData({ name: "" });
        setEditingCategory(null);
        fetchCategories();
      } else {
        if (response.status === 409) {
          throw new Error("Cannot update category because it is currently being used by one or more services.");
        }
        throw new Error(data.message || "Something went wrong");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save category");
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;

    try {
      const token = await getToken();
      const response = await fetch(`http://localhost:8800/api/categories/${deletingCategory.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success("Category deleted successfully");
        setIsDeleteDialogOpen(false);
        setDeletingCategory(null);
        fetchCategories();
      } else {
        const data = await response.json();
        if (response.status === 409) {
          toast.error("Cannot delete category because it is currently being used by one or more services.");
        } else {
          toast.error(data.message || "Failed to delete category");
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete category");
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({ name: category.name });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (category: Category) => {
    setDeletingCategory(category);
    setIsDeleteDialogOpen(true);
  };

  // Filter and sort categories
  const filteredCategories = categories
    .filter((cat) => cat.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      let cmp = 0;
      if (sortOption === "id-asc") cmp = a.id - b.id;
      else if (sortOption === "id-desc") cmp = b.id - a.id;
      else if (sortOption === "name-asc") cmp = a.name.localeCompare(b.name);
      else if (sortOption === "name-desc") cmp = b.name.localeCompare(a.name);
      return cmp;
    });

  if (!userId) {
    return null;
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-10">
      <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-emerald-700 tracking-tight mb-2">Manage Categories</h1>
          <p className="text-lg text-gray-500">Create, edit, and organize your service categories</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="flex items-center gap-2 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 py-2">
              <Plus className="h-5 w-5" /> Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-2xl border-2 border-emerald-100">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-emerald-700">
                {editingCategory ? "Edit Category" : "Add New Category"}
              </DialogTitle>
              <DialogDescription>
                {editingCategory ? "Update the category name." : "Create a new category for your services."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="name">Category Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ name: e.target.value })}
                  placeholder="Enter category name"
                  required
                  className="rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-lg">
                  Cancel
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg">
                  {editingCategory ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Input
          placeholder="Search category by name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-64 rounded-lg"
        />
        <div className="flex gap-2 items-center">
          <label className="text-sm font-medium">Sort by:</label>
          <Select value={sortOption} onValueChange={setSortOption}>
            <SelectTrigger className="w-40 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="id-asc">
                <span className="inline-flex items-center gap-1">
                  <ListOrdered className="w-4 h-4" /> ID <ChevronUp className="w-4 h-4" />
                </span>
              </SelectItem>
              <SelectItem value="id-desc">
                <span className="inline-flex items-center gap-1">
                  <ListOrdered className="w-4 h-4" /> ID <ChevronDown className="w-4 h-4" />
                </span>
              </SelectItem>
              <SelectItem value="name-asc">
                <span className="inline-flex items-center gap-1">
                  <ArrowUpAZ className="w-4 h-4" /> Name <ChevronUp className="w-4 h-4" />
                </span>
              </SelectItem>
              <SelectItem value="name-desc">
                <span className="inline-flex items-center gap-1">
                  <ArrowUpAZ className="w-4 h-4 rotate-180" /> Name <ChevronDown className="w-4 h-4" />
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl border-2 border-red-100">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-red-600">Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the category "{deletingCategory?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="rounded-lg">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} className="rounded-lg">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Card className="rounded-2xl border-2 border-gray-100">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="animate-spin h-8 w-8 text-emerald-500 mr-2" />
              <span className="text-lg text-gray-500">Loading categories...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-900">
                    <TableHead className="py-4 px-6 text-lg font-bold text-gray-700">ID</TableHead>
                    <TableHead className="py-4 px-6 text-lg font-bold text-gray-700">Name</TableHead>
                    <TableHead className="py-4 px-6 text-lg font-bold text-gray-700 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map((category) => (
                      <TableRow key={category.id} className="hover:bg-emerald-50 transition-all">
                        <TableCell className="py-3 px-6 text-base">{category.id}</TableCell>
                        <TableCell className="py-3 px-6 text-base font-semibold">{category.name}</TableCell>
                        <TableCell className="py-3 px-6 text-right">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleEdit(category)}
                            className="rounded-full border-emerald-200 hover:bg-emerald-100 mr-2"
                            aria-label="Edit"
                          >
                            <Edit className="h-5 w-5 text-emerald-600" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleDeleteClick(category)}
                            className="rounded-full border-red-200 hover:bg-red-100"
                            aria-label="Delete"
                          >
                            <Trash2 className="h-5 w-5 text-red-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-gray-400 text-lg">
                        No categories found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 