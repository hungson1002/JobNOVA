"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Trash2, MoveUp, MoveDown, Upload, X } from "lucide-react"
import Image from "next/image"
import { toast } from "@/components/ui/use-toast"

interface BannerSlide {
  id: number
  image_url: string
  title: string
  subtitle: string
  created_at: string
}

export default function ManageSlidesPage() {
  const [slides, setSlides] = useState<BannerSlide[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedSlide, setSelectedSlide] = useState<BannerSlide | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    image: null as File | null,
    imagePreview: ""
  })

  // Fetch slides
  useEffect(() => {
    fetchSlides()
  }, [])

  const fetchSlides = async () => {
    try {
      const response = await fetch("/api/bannerSlides")
      const data = await response.json()
      if (data.success) {
        setSlides(data.banners)
      }
    } catch (error) {
      console.error("Error fetching slides:", error)
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách slides",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Kiểm tra kích thước file (giới hạn 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Lỗi",
          description: "Kích thước ảnh không được vượt quá 5MB",
          variant: "destructive"
        })
        return
      }

      // Kiểm tra loại file
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Lỗi",
          description: "Vui lòng chọn file ảnh",
          variant: "destructive"
        })
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          image: file,
          imagePreview: reader.result as string
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.image) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn ảnh",
        variant: "destructive"
      })
      return
    }

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('title', formData.title)
      formDataToSend.append('subtitle', formData.subtitle)
      formDataToSend.append('image', formData.image)

      const response = await fetch("/api/bannerSlides", {
        method: "POST",
        body: formDataToSend
      })
      const data = await response.json()
      if (data.success) {
        toast({
          title: "Thành công",
          description: "Đã thêm slide mới"
        })
        fetchSlides()
        setIsAddDialogOpen(false)
        setFormData({ title: "", subtitle: "", image: null, imagePreview: "" })
      }
    } catch (error) {
      console.error("Error adding slide:", error)
      toast({
        title: "Lỗi",
        description: "Không thể thêm slide",
        variant: "destructive"
      })
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSlide) return

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('title', formData.title)
      formDataToSend.append('subtitle', formData.subtitle)
      if (formData.image) {
        formDataToSend.append('image', formData.image)
      }

      const response = await fetch(`/api/bannerSlides/${selectedSlide.id}`, {
        method: "PUT",
        body: formDataToSend
      })
      const data = await response.json()
      if (data.success) {
        toast({
          title: "Thành công",
          description: "Đã cập nhật slide"
        })
        fetchSlides()
        setIsEditDialogOpen(false)
        setSelectedSlide(null)
        setFormData({ title: "", subtitle: "", image: null, imagePreview: "" })
      }
    } catch (error) {
      console.error("Error updating slide:", error)
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật slide",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa slide này?")) return

    try {
      const response = await fetch(`/api/bannerSlides/${id}`, {
        method: "DELETE"
      })
      const data = await response.json()
      if (data.success) {
        toast({
          title: "Thành công",
          description: "Đã xóa slide"
        })
        fetchSlides()
      }
    } catch (error) {
      console.error("Error deleting slide:", error)
      toast({
        title: "Lỗi",
        description: "Không thể xóa slide",
        variant: "destructive"
      })
    }
  }

  const openEditDialog = (slide: BannerSlide) => {
    setSelectedSlide(slide)
    setFormData({
      title: slide.title,
      subtitle: slide.subtitle,
      image: null,
      imagePreview: slide.image_url
    })
    setIsEditDialogOpen(true)
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Quản lý Banner Slides</CardTitle>
              <CardDescription>
                Thêm, sửa, xóa và sắp xếp các banner slides trên trang chủ
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm Slide Mới
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Thêm Banner Slide Mới</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Tiêu đề</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="subtitle">Mô tả</Label>
                    <Input
                      id="subtitle"
                      value={formData.subtitle}
                      onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="image">Hình ảnh</Label>
                    <div className="mt-2 flex items-center gap-4">
                      <div className="relative flex-1">
                        <Input
                          id="image"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => document.getElementById('image')?.click()}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Chọn ảnh
                        </Button>
                      </div>
                      {formData.imagePreview && (
                        <div className="relative h-20 w-32">
                          <Image
                            src={formData.imagePreview}
                            alt="Preview"
                            fill
                            className="rounded object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -right-2 -top-2 h-6 w-6"
                            onClick={() => setFormData({ ...formData, image: null, imagePreview: "" })}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Hủy
                    </Button>
                    <Button type="submit">Thêm</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hình ảnh</TableHead>
                <TableHead>Tiêu đề</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : slides.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Chưa có banner slides nào
                  </TableCell>
                </TableRow>
              ) : (
                slides.map((slide) => (
                  <TableRow key={slide.id}>
                    <TableCell>
                      <div className="relative h-16 w-24 overflow-hidden rounded">
                        <Image
                          src={slide.image_url}
                          alt={slide.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </TableCell>
                    <TableCell>{slide.title}</TableCell>
                    <TableCell>{slide.subtitle}</TableCell>
                    <TableCell>{new Date(slide.created_at).toLocaleDateString("vi-VN")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" onClick={() => openEditDialog(slide)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleDelete(slide.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon">
                          <MoveUp className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon">
                          <MoveDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa Banner Slide</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Tiêu đề</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-subtitle">Mô tả</Label>
              <Input
                id="edit-subtitle"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-image">Hình ảnh</Label>
              <div className="mt-2 flex items-center gap-4">
                <div className="relative flex-1">
                  <Input
                    id="edit-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => document.getElementById('edit-image')?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Chọn ảnh mới
                  </Button>
                </div>
                {formData.imagePreview && (
                  <div className="relative h-20 w-32">
                    <Image
                      src={formData.imagePreview}
                      alt="Preview"
                      fill
                      className="rounded object-cover"
                    />
                    {formData.image && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -right-2 -top-2 h-6 w-6"
                        onClick={() => setFormData({ ...formData, image: null, imagePreview: selectedSlide?.image_url || "" })}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Hủy
              </Button>
              <Button type="submit">Lưu thay đổi</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
} 