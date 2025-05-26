"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";

interface Category {
  id: number;
  name: string;
  description: string;
}

export default function ManageCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  useEffect(() => {
    // Fetch categories from API
    fetch("http://localhost:8800/api/categories")
      .then(res => res.json())
      .then(data => setCategories(Array.isArray(data.categories) ? data.categories : []));
  }, []);

  return (
    <div className="container px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Category Management</h1>
          <p className="text-muted-foreground">View and manage all service categories</p>
        </div>
        <Button size="sm" className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Category
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>List of all service categories</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length > 0 ? categories.map(category => (
                <TableRow key={category.id}>
                  <TableCell>{category.id}</TableCell>
                  <TableCell>{category.name}</TableCell>
                  <TableCell>{category.description}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost"><Edit className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost"><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">No categories found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 