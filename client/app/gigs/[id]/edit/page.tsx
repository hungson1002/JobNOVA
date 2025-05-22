"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, ImageIcon, Plus, Trash2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"

export default function EditGigPage({ params }: { params: { id: string } }) {
  const [gig, setGig] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [files, setFiles] = useState<{ url: string; type: 'image' | 'video' }[]>([])

  useEffect(() => {
    // Fetch gig data
    fetch(`http://localhost:8800/api/gigs/${params.id}`)
      .then(res => res.json())
      .then(data => {
        setGig(data.gig)
        // Convert existing images to new format
        if (data.gig.images) {
          setFiles(data.gig.images.map((url: string) => ({
            url,
            type: url.match(/\.(mp4|mov|avi|wmv)$/i) ? 'video' : 'image'
          })))
        }
      })
      .finally(() => setLoading(false))
  }, [params.id])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    setUploading(true)

    try {
      const formData = new FormData()
      Array.from(e.target.files).forEach(file => {
        formData.append('files', file)
      })

      const res = await fetch('http://localhost:8800/api/cloudinary/upload-multiple', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()
      if (data.success) {
        const newFiles = data.files.map((file: any) => ({
          url: file.fileUrl,
          type: file.type
        }))
        setFiles(prev => [...prev, ...newFiles])
        toast({
          title: "Success",
          description: "Files uploaded successfully"
        })
      } else {
        throw new Error(data.message || 'Upload failed')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload files",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="flex items-center mb-8">
        <Link href={`/gigs/${params.id}`} className="mr-4">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold dark:text-white">Edit Gig</h1>
      </div>

      <Tabs defaultValue="overview" className="mb-10">
        <TabsList className="grid grid-cols-4 mb-8 w-full max-w-3xl mx-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="description">Description</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card className="border-gray-200 dark:border-gray-700 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl dark:text-white">Gig Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div>
                <label htmlFor="gig-title" className="block font-medium mb-2 dark:text-white">
                  Gig Title
                </label>
                <Input id="gig-title" placeholder="I will..." defaultValue={gig?.title} className="max-w-2xl h-12" />
                <p className="text-xs text-gray-500 mt-2 dark:text-gray-400">
                  Clearly describe what you are offering (max 80 characters)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label htmlFor="category" className="block font-medium mb-2 dark:text-white">
                    Category
                  </label>
                  <Select defaultValue={gig?.category}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Graphics & Design">Graphics & Design</SelectItem>
                      <SelectItem value="Digital Marketing">Digital Marketing</SelectItem>
                      <SelectItem value="Writing & Translation">Writing & Translation</SelectItem>
                      <SelectItem value="Video & Animation">Video & Animation</SelectItem>
                      <SelectItem value="Programming & Tech">Programming & Tech</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label htmlFor="subcategory" className="block font-medium mb-2 dark:text-white">
                    Subcategory
                  </label>
                  <Select defaultValue={gig?.subcategory}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Logo Design">Logo Design</SelectItem>
                      <SelectItem value="Brand Style Guides">Brand Style Guides</SelectItem>
                      <SelectItem value="Business Cards">Business Cards</SelectItem>
                      <SelectItem value="Social Media Design">Social Media Design</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label htmlFor="tags" className="block font-medium mb-2 dark:text-white">
                  Search Tags
                </label>
                <Input
                  id="tags"
                  placeholder="Add search terms that buyers would use to find your service"
                  defaultValue={gig?.tags.join(", ")}
                  className="max-w-2xl h-12"
                />
                <p className="text-xs text-gray-500 mt-2 dark:text-gray-400">Enter up to 5 tags separated by commas</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing">
          <Card className="border-gray-200 dark:border-gray-700 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl dark:text-white">Packages & Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {["basic", "standard", "premium"].map((tier) => (
                  <Card
                    key={tier}
                    className={`border-2 ${
                      tier === "basic"
                        ? "border-gray-200 dark:border-gray-700"
                        : tier === "standard"
                          ? "border-emerald-100 dark:border-emerald-900"
                          : "border-purple-100 dark:border-purple-900"
                    }`}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg capitalize dark:text-white">{tier}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div>
                        <label htmlFor={`price-${tier}`} className="block text-sm font-medium mb-2 dark:text-gray-200">
                          Price ($)
                        </label>
                        <Input
                          id={`price-${tier}`}
                          type="number"
                          defaultValue={gig?.price[tier as keyof typeof gig.price]}
                          className="h-12"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`delivery-${tier}`}
                          className="block text-sm font-medium mb-2 dark:text-gray-200"
                        >
                          Delivery Time (days)
                        </label>
                        <Select defaultValue={gig?.delivery[tier as keyof typeof gig.delivery].toString()}>
                          <SelectTrigger className="h-12">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 7, 10, 14, 21, 30].map((day) => (
                              <SelectItem key={day} value={day.toString()}>
                                {day} {day === 1 ? "day" : "days"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label
                          htmlFor={`revisions-${tier}`}
                          className="block text-sm font-medium mb-2 dark:text-gray-200"
                        >
                          Revisions
                        </label>
                        <Select defaultValue={gig?.revisions[tier as keyof typeof gig.revisions].toString()}>
                          <SelectTrigger className="h-12">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[0, 1, 2, 3, 4, 5, 10, "Unlimited"].map((rev) => (
                              <SelectItem key={rev.toString()} value={rev.toString()}>
                                {rev === 0
                                  ? "No revisions"
                                  : rev === 1
                                    ? "1 revision"
                                    : rev === "Unlimited"
                                      ? "Unlimited"
                                      : `${rev} revisions`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="description">
          <Card className="border-gray-200 dark:border-gray-700 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl dark:text-white">Description & Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div>
                <label htmlFor="description" className="block font-medium mb-2 dark:text-white">
                  Gig Description
                </label>
                <Textarea
                  id="description"
                  placeholder="Describe your service in detail..."
                  defaultValue={gig?.description}
                  className="min-h-[200px]"
                />
                <p className="text-xs text-gray-500 mt-2 dark:text-gray-400">
                  Min. 120 characters - Describe what you offer, your process, and why buyers should choose you
                </p>
              </div>

              <Separator className="my-8" />

              <div>
                <h3 className="font-medium mb-4 dark:text-white">Frequently Asked Questions</h3>
                <div className="space-y-5 mb-6">
                  <div className="p-5 border rounded-xl dark:border-gray-700">
                    <div className="flex justify-between items-start mb-3">
                      <Input
                        placeholder="Question"
                        defaultValue="How many logo concepts will I receive?"
                        className="mb-3 h-12"
                      />
                      <Button variant="ghost" size="icon" className="text-red-500 ml-2">
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                    <Textarea
                      placeholder="Answer"
                      defaultValue="With the standard package, you'll receive 3 initial concepts to choose from. The premium package includes 5 concepts."
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="p-5 border rounded-xl dark:border-gray-700">
                    <div className="flex justify-between items-start mb-3">
                      <Input placeholder="Question" defaultValue="Do you provide source files?" className="mb-3 h-12" />
                      <Button variant="ghost" size="icon" className="text-red-500 ml-2">
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                    <Textarea
                      placeholder="Answer"
                      defaultValue="Yes, all packages include the source files (AI, EPS, PDF) along with PNG and JPG formats."
                      className="min-h-[100px]"
                    />
                  </div>
                </div>

                <Button variant="outline" className="flex items-center">
                  <Plus className="h-4 w-4 mr-2" />
                  Add FAQ
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gallery">
          <Card className="border-gray-200 dark:border-gray-700 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl dark:text-white">Gallery</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {files.map((file, index) => (
                    <div key={index} className="relative group">
                      {file.type === 'image' ? (
                    <img
                          src={file.url}
                          alt={`Gallery item ${index + 1}`}
                          className="w-full aspect-video object-cover rounded-lg"
                    />
                      ) : (
                        <video
                          src={file.url}
                          className="w-full aspect-video object-cover rounded-lg"
                          controls
                        />
                      )}
                      <button
                        onClick={() => removeFile(index)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <label className="relative flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-emerald-500 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">Images or videos (max 500MB each)</p>
                  </div>
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      accept="image/*,video/*"
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                  </label>
                </div>
                {uploading && (
                  <div className="text-center text-sm text-gray-500">
                    Uploading files...
              </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between items-center max-w-6xl mx-auto">
        <Button variant="outline" className="px-6">
          Preview Gig
        </Button>
        <div className="space-x-4">
          <Button
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            Delete Gig
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 px-6">Save Changes</Button>
        </div>
      </div>
    </div>
  )
}
