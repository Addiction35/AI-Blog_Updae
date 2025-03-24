"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAdminStore, type UploadedImage } from "@/lib/store"
import { ArrowLeft, Copy, Trash, Upload } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"

export default function MediaLibrary() {
  const { currentUser, uploadedImages, addImage, deleteImage } = useAdminStore()
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<UploadedImage | null>(null)

  useEffect(() => {
    if (!currentUser) {
      router.push("/admin")
    }
  }, [currentUser, router])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const reader = new FileReader()

        reader.onload = (event) => {
          if (event.target && typeof event.target.result === "string") {
            const imageUrl = event.target.result

            // Add image to store
            addImage({
              url: imageUrl,
              name: file.name,
              uploadedBy: currentUser?.id || "unknown",
              uploadedAt: new Date().toISOString(),
            })
          }
        }

        reader.readAsDataURL(file)
      }

      toast({
        title: "Upload successful",
        description: `${files.length} image(s) uploaded successfully.`,
      })
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was an error uploading your image(s).",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleDeleteImage = (id: string) => {
    if (confirm("Are you sure you want to delete this image?")) {
      deleteImage(id)
      if (selectedImage?.id === id) {
        setSelectedImage(null)
      }
      toast({
        title: "Image deleted",
        description: "The image has been successfully deleted.",
      })
    }
  }

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    toast({
      title: "URL copied",
      description: "Image URL copied to clipboard.",
    })
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
            <span className="text-sm text-gray-400">Media Library</span>
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

        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-2/3">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Media Library</h1>
              <div>
                <Input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-purple-600 hover:bg-purple-700"
                  disabled={isUploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? "Uploading..." : "Upload Images"}
                </Button>
              </div>
            </div>

            {userImages.length === 0 ? (
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-6 text-center">
                  <p className="text-gray-400 mb-4">No images found in your media library.</p>
                  <Button onClick={() => fileInputRef.current?.click()} className="bg-purple-600 hover:bg-purple-700">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Your First Image
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {userImages.map((image) => (
                  <div
                    key={image.id}
                    className={`relative group cursor-pointer border-2 rounded-md overflow-hidden ${
                      selectedImage?.id === image.id ? "border-purple-500" : "border-gray-800"
                    }`}
                    onClick={() => setSelectedImage(image)}
                  >
                    <div className="aspect-square relative">
                      <Image src={image.url || "/placeholder.svg"} alt={image.name} fill className="object-cover" />
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-800 bg-black bg-opacity-70 hover:bg-gray-900 text-red-500 hover:text-red-400"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteImage(image.id)
                        }}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="w-full md:w-1/3">
            {selectedImage ? (
              <Card className="bg-gray-900 border-gray-800 sticky top-4">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4">Image Details</h2>

                  <div className="aspect-video relative mb-4 rounded-md overflow-hidden">
                    <Image
                      src={selectedImage.url || "/placeholder.svg"}
                      alt={selectedImage.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-400">File name</Label>
                      <p className="text-sm truncate">{selectedImage.name}</p>
                    </div>

                    <div>
                      <Label className="text-gray-400">Uploaded on</Label>
                      <p className="text-sm">{format(new Date(selectedImage.uploadedAt), "PPP")}</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-400">Image URL</Label>
                      <div className="flex">
                        <Input value={selectedImage.url} readOnly className="bg-black border-gray-800 text-xs" />
                        <Button
                          variant="outline"
                          className="ml-2 border-gray-800 hover:bg-gray-900"
                          onClick={() => handleCopyUrl(selectedImage.url)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full border-gray-800 hover:bg-gray-900 text-red-500 hover:text-red-400"
                      onClick={() => handleDeleteImage(selectedImage.id)}
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Delete Image
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-gray-900 border-gray-800 sticky top-4">
                <CardContent className="p-6 text-center">
                  <p className="text-gray-400 mb-4">Select an image to view details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

