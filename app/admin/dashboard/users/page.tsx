"use client"

import { useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAdminStore, type User } from "@/lib/store"
import { ArrowLeft, Edit, Trash, UserPlus } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function UserManagement() {
  const { currentUser, users } = useAdminStore()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Check if user is logged in and is admin
    if (!currentUser) {
      router.push("/admin")
      return
    }

    if (currentUser.role !== "admin") {
      toast({
        title: "Access denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      })
      router.push("/admin/dashboard")
    }
  }, [currentUser, router, toast])

  if (!currentUser || currentUser.role !== "admin") {
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
            <span className="text-sm text-gray-400">User Management</span>
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

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">User Management</h1>
          <Button asChild className="bg-purple-600 hover:bg-purple-700">
            <Link href="/admin">
              <UserPlus className="h-4 w-4 mr-2" />
              Add New User
            </Link>
          </Button>
        </div>

        <div className="grid gap-4">
          {users.map((user) => (
            <UserRow key={user.id} user={user} currentUserId={currentUser.id} />
          ))}
        </div>
      </main>
    </div>
  )
}

function UserRow({ user, currentUserId }: { user: User; currentUserId: string }) {
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="relative h-12 w-12 rounded-full overflow-hidden border border-gray-800">
              {user.avatar ? (
                <Image src={user.avatar || "/placeholder.svg"} alt={user.name} fill className="object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-gray-400">
                  <span className="text-lg">{user.name.charAt(0)}</span>
                </div>
              )}
            </div>
            <div>
              <h3 className="font-medium">{user.name}</h3>
              <div className="flex items-center space-x-3 text-sm text-gray-400">
                <span>@{user.username}</span>
                <span>•</span>
                <span className="text-purple-500">{user.role}</span>
              </div>
              <p className="text-gray-400 text-sm mt-1">{user.email}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            {user.id !== currentUserId && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-800 hover:bg-gray-800 text-red-500 hover:text-red-400"
                  disabled
                >
                  <Trash className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
                <Button variant="outline" size="sm" className="border-gray-800 hover:bg-gray-800" disabled>
                  <Edit className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Button>
              </>
            )}
            {user.id === currentUserId && <span className="text-xs text-gray-500 italic">Current User</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

