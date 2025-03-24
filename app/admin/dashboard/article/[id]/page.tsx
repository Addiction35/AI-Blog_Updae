"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAdminStore } from "@/lib/store"
import { ArrowLeft, ImageIcon, Save, Upload } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"

export default function ArticleEditor({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { currentUser, getArticle, addArticle, updateArticle, uploadedImages, addImage } = useAdminStore()
  const { toast } = useToast()
  const isNew = params.id === "new"
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    category: "",
    author: "",
    authorId: "",
    readTime: "",
    image: "",
    slug: "",
    published: false,
  })

  const [isLoading, setIsLoading] = useState(false)
  const [showMediaLibrary, setShowMediaLibrary] = useState(false)
  const [selectedField, setSelectedField] = useState<"content" | "image">("image")
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  useEffect(() => {
    if (!currentUser) {
      router.push("/admin")
      return
    }

    if (!isNew) {
      const article = getArticle(params.id)
      if (article) {
        setFormData(article)
        setPreviewImage(article.image)
      } else {
        toast({
          title: "Article not found",
          description: "The article you're trying to edit doesn't exist.",
          variant: "destructive",
        })
        router.push("/admin/dashboard")
      }
    } else {
      // Set default values for new article
      setFormData((prev) => ({
        ...prev,
        author: currentUser.name,
        authorId: currentUser.id,
      }))
    }
  }, [isNew, params.id, getArticle, router, toast, currentUser])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleTogglePublish = () => {
    setFormData((prev) => ({ ...prev, published: !prev.published }))
  }

  const generateSlug = () => {
    const slug = formData.title
      .toLowerCase()
      .replace(/[^\w\s]/gi, "")
      .replace(/\s+/g, "-")

    setFormData((prev) => ({ ...prev, slug }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Generate slug if empty
    if (!formData.slug) {
      generateSlug()
    }

    // Set current date if new article
    const articleData = {
      ...formData,
      date: formData.date || format(new Date(), "MMMM d, yyyy"),
    }

    setTimeout(() => {
      try {
        if (isNew) {
          addArticle(articleData)
          toast({
            title: "Article created",
            description: "Your article has been successfully created.",
          })
        } else {
          updateArticle(params.id, articleData)
          toast({
            title: "Article updated",
            description: "Your article has been successfully updated.",
          })
        }
        router.push("/admin/dashboard")
      } catch (error) {
        toast({
          title: "Error",
          description: "There was an error saving your article.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }, 1000)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    const reader = new FileReader()

    reader.onload = (event) => {
      if (event.target && typeof event.target.result === "string") {
        const imageUrl = event.target.result

        // Add image to store
        const imageId = addImage({
          url: imageUrl,
          name: file.name,
          uploadedBy: currentUser?.id || "unknown",
          uploadedAt: new Date().toISOString(),
        })

        // Update form data with image URL
        if (selectedField === "image") {
          setFormData((prev) => ({ ...prev, image: imageUrl }))
          setPreviewImage(imageUrl)
        } else {
          // Insert image URL at cursor position in content
          const textarea = document.getElementById("content") as HTMLTextAreaElement
          if (textarea) {
            const startPos = textarea.selectionStart
            const endPos = textarea.selectionEnd
            const textBefore = formData.content.substring(0, startPos)
            const textAfter = formData.content.substring(endPos)

            const imageHtml = `<img src="${imageUrl}" alt="${file.name}" />`
            const newContent = textBefore + imageHtml + textAfter

            setFormData((prev) => ({ ...prev, content: newContent }))
          }
        }

        toast({
          title: "Image uploaded",
          description: "Image has been uploaded and added to your article.",
        })
      }
    }

    reader.readAsDataURL(file)

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSelectImage = (imageUrl: string) => {
    if (selectedField === "image") {
      setFormData((prev) => ({ ...prev, image: imageUrl }))
      setPreviewImage(imageUrl)
    } else {
      // Insert image URL at cursor position in content
      const textarea = document.getElementById("content") as HTMLTextAreaElement
      if (textarea) {
        const startPos = textarea.selectionStart
        const endPos = textarea.selectionEnd
        const textBefore = formData.content.substring(0, startPos)
        const textAfter = formData.content.substring(endPos)

        const imageHtml = `<img src="${imageUrl}" alt="Article image" />`
        const newContent = textBefore + imageHtml + textAfter

        setFormData((prev) => ({ ...prev, content: newContent }))
      }
    }

    setShowMediaLibrary(false)
  }

  const openMediaLibrary = (field: "content" | "image") => {
    setSelectedField(field)
    setShowMediaLibrary(true)
  }

  if (!currentUser) {
    return null
  }

  // Filter images based on user role
  const userImages =
    currentUser.role === "admin" ? uploadedImages : uploadedImages.filter((img) => img.uploadedBy === currentUser.id)

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-gray-800 py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-xl font-bold tracking-tighter">
              Neural<span className="text-purple-500">Pulse</span>
            </Link>
            <span className="text-sm text-gray-400">Article Editor</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button variant="outline" size="sm" className="border-gray-800 hover:bg-gray-900" asChild>
            <Link href="/admin/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle>{isNew ? "Create New Article" : "Edit Article"}</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="bg-black border-gray-800"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <div className="flex space-x-2">
                  <Input
                    id="slug"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    className="bg-black border-gray-800 flex-1"
                    placeholder="article-slug"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="border-gray-800 hover:bg-gray-900"
                    onClick={generateSlug}
                  >
                    Generate
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => handleSelectChange("category", value)}>
                    <SelectTrigger className="bg-black border-gray-800">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GenAI">GenAI</SelectItem>
                      <SelectItem value="AI Research">AI Research</SelectItem>
                      <SelectItem value="Future Tech">Future Tech</SelectItem>
                      <SelectItem value="Computer Vision">Computer Vision</SelectItem>
                      <SelectItem value="NLP">NLP</SelectItem>
                      <SelectItem value="AI Ethics">AI Ethics</SelectItem>
                      <SelectItem value="Future of AI">Future of AI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="readTime">Read Time</Label>
                  <Input
                    id="readTime"
                    name="readTime"
                    value={formData.readTime}
                    onChange={handleChange}
                    className="bg-black border-gray-800"
                    placeholder="5 min read"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="featured-image">Featured Image</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <Input
                      id="image"
                      name="image"
                      value={formData.image}
                      onChange={handleChange}
                      className="bg-black border-gray-800"
                      placeholder="Image URL"
                      required
                    />
                    <div className="flex space-x-2">
                      <Input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="border-gray-800 hover:bg-gray-900"
                        onClick={() => {
                          setSelectedField("image")
                          fileInputRef.current?.click()
                        }}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-gray-800 hover:bg-gray-900"
                        onClick={() => openMediaLibrary("image")}
                      >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Media Library
                      </Button>
                    </div>
                  </div>
                  <div className="relative aspect-video rounded-md overflow-hidden border border-gray-800">
                    {previewImage ? (
                      <Image
                        src={previewImage || "/placeholder.svg"}
                        alt="Featured image preview"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-gray-400">
                        <span>No image</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="bg-black border-gray-800"
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="content">Content (HTML)</Label>
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-gray-800 hover:bg-gray-900"
                      onClick={() => {
                        setSelectedField("content")
                        fileInputRef.current?.click()
                      }}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Add Image
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-gray-800 hover:bg-gray-900"
                      onClick={() => openMediaLibrary("content")}
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Media Library
                    </Button>
                  </div>
                </div>
                <Textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  className="bg-black border-gray-800 font-mono text-xs"
                  rows={15}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant={formData.published ? "default" : "outline"}
                className={formData.published ? "bg-green-600 hover:bg-green-700" : "border-gray-800 hover:bg-gray-900"}
                onClick={handleTogglePublish}
              >
                {formData.published ? "Published" : "Draft"}
              </Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? "Saving..." : "Save Article"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>

      <Dialog open={showMediaLibrary} onOpenChange={setShowMediaLibrary}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-4xl">
          <DialogHeader>
            <DialogTitle>Media Library</DialogTitle>
            <DialogDescription>
              Select an image to add to your {selectedField === "image" ? "featured image" : "content"}
            </DialogDescription>
          </DialogHeader>

          {userImages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">No images found in your media library.</p>
              <Button
                onClick={() => {
                  setShowMediaLibrary(false)
                  setTimeout(() => {
                    fileInputRef.current?.click()
                  }, 300)
                }}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload an Image
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto p-2">
              {userImages.map((image) => (
                <div
                  key={image.id}
                  className="relative group cursor-pointer border-2 border-gray-800 hover:border-purple-500 rounded-md overflow-hidden"
                  onClick={() => handleSelectImage(image.url)}
                >
                  <div className="aspect-square relative">
                    <Image src={image.url || "/placeholder.svg"} alt={image.name} fill className="object-cover" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

