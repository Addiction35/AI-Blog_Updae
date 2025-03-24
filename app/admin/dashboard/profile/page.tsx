"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAdminStore } from "@/lib/store"
import { ArrowLeft, Save, Upload } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function UserProfile() {
  const { currentUser, updateUser, addImage } = useAdminStore()
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    bio: "",
    avatar: "",
  })

  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!currentUser) {
      router.push("/admin")
      return
    }

    setFormData({
      name: currentUser.name,
      email: currentUser.email,
      bio: currentUser.bio || "",
      avatar: currentUser.avatar || "",
    })
  }, [currentUser, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    setTimeout(() => {
      try {
        updateUser(currentUser!.id, formData)
        toast({
          title: "Profile updated",
          description: "Your profile has been successfully updated.",
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "There was an error updating your profile.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }, 1000)
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
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

        // Update form data with image URL
        setFormData((prev) => ({ ...prev, avatar: imageUrl }))

        toast({
          title: "Avatar uploaded",
          description: "Your avatar has been successfully uploaded.",
        })
      }
    }

    reader.readAsDataURL(file)

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  if (!currentUser) {
    return null
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-gray-800 py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-xl font-bold tracking-tighter">
              Neural<span className="text-purple-500">Pulse</span>
            </Link>
            <span className="text-sm text-gray-400">User Profile</span>
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

        <Card className="bg-gray-900 border-gray-800 max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative h-32 w-32 rounded-full overflow-hidden border-2 border-gray-800">
                  {formData.avatar ? (
                    <Image
                      src={formData.avatar || "/placeholder.svg"}
                      alt={formData.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-gray-400">
                      <span className="text-2xl">{formData.name.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <div>
                  <Input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="border-gray-800 hover:bg-gray-900"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Change Avatar
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="bg-black border-gray-800"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-black border-gray-800"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  className="bg-black border-gray-800"
                  rows={4}
                  placeholder="Tell us about yourself"
                />
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Input value={currentUser.role} className="bg-black border-gray-800" disabled />
                <p className="text-xs text-gray-400">
                  Your role cannot be changed. Contact an administrator if you need a role change.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? "Saving..." : "Save Profile"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  )
}

