"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
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
          throw new Error("Cannot update category because it is currently being used by one or more gigs.");
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
          toast.error("Cannot delete category because it is currently being used by one or more gigs.");
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
    <div className="container px-4 py-8">
      <div className="mb-4">
        <h1 className="text-3xl font-bold">Categories</h1>
        <p className="text-muted-foreground">List of all service categories</p>
      </div>
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          <Input
            placeholder="Search category by name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-64"
          />
          <div className="flex gap-2 items-center">
            <label className="text-sm font-medium">Sort by:</label>
            <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger className="w-40">
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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCategory ? "Edit Category" : "Add New Category"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Category Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ name: e.target.value })}
                  placeholder="Enter category name"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingCategory ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the category "{deletingCategory?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Card>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>{category.id}</TableCell>
                      <TableCell>{category.name}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteClick(category)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">
                      No categories found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 