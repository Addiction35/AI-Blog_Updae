"use client"

import { useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAdminStore, type Article } from "@/lib/store"
import { Edit, Eye, LogOut, Plus, Trash, User, Users, ImageIcon } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function AdminDashboard() {
  const { currentUser, articles, logout, deleteArticle } = useAdminStore()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (!currentUser) {
      router.push("/admin")
    }
  }, [currentUser, router])

  const handleLogout = () => {
    logout()
    router.push("/admin")
  }

  const handleDeleteArticle = (id: string) => {
    if (confirm("Are you sure you want to delete this article?")) {
      deleteArticle(id)
      toast({
        title: "Article deleted",
        description: "The article has been successfully deleted.",
      })
    }
  }

  // Filter articles based on user role
  const userArticles =
    currentUser?.role === "admin" ? articles : articles.filter((article) => article.authorId === currentUser?.id)

  const publishedArticles = userArticles.filter((article) => article.published)
  const draftArticles = userArticles.filter((article) => !article.published)

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
            <span className="text-sm text-gray-400">Dashboard</span>
          </div>
          <div className="flex items-center space-x-4">
            {currentUser.avatar && (
              <div className="relative w-8 h-8 rounded-full overflow-hidden">
                <Image
                  src={currentUser.avatar || "/placeholder.svg"}
                  alt={currentUser.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <span className="text-sm hidden md:inline-block">
              {currentUser.name} <span className="text-purple-500">({currentUser.role})</span>
            </span>
            <Button variant="outline" size="sm" className="border-gray-800 hover:bg-gray-900" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h1 className="text-3xl font-bold">Content Management</h1>
          <div className="flex flex-wrap gap-2">
            <Button asChild className="bg-purple-600 hover:bg-purple-700">
              <Link href="/admin/dashboard/article/new">
                <Plus className="h-4 w-4 mr-2" />
                New Article
              </Link>
            </Button>
            <Button asChild className="bg-gray-800 hover:bg-gray-700">
              <Link href="/admin/dashboard/media">
                <ImageIcon className="h-4 w-4 mr-2" />
                Media Library
              </Link>
            </Button>
            {currentUser.role === "admin" && (
              <Button asChild className="bg-gray-800 hover:bg-gray-700">
                <Link href="/admin/dashboard/users">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </Link>
              </Button>
            )}
            <Button asChild className="bg-gray-800 hover:bg-gray-700">
              <Link href="/admin/dashboard/profile">
                <User className="h-4 w-4 mr-2" />
                My Profile
              </Link>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="published" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="published">Published ({publishedArticles.length})</TabsTrigger>
            <TabsTrigger value="drafts">Drafts ({draftArticles.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="published">
            {publishedArticles.length === 0 ? (
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle>No Published Articles</CardTitle>
                  <CardDescription>
                    You haven't published any articles yet. Create a new article to get started.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <div className="grid gap-4">
                {publishedArticles.map((article) => (
                  <ArticleRow
                    key={article.id}
                    article={article}
                    onDelete={() => handleDeleteArticle(article.id)}
                    isAdmin={currentUser.role === "admin"}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="drafts">
            {draftArticles.length === 0 ? (
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle>No Draft Articles</CardTitle>
                  <CardDescription>
                    You don't have any draft articles. Create a new article to get started.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <div className="grid gap-4">
                {draftArticles.map((article) => (
                  <ArticleRow
                    key={article.id}
                    article={article}
                    onDelete={() => handleDeleteArticle(article.id)}
                    isAdmin={currentUser.role === "admin"}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

function ArticleRow({ article, onDelete, isAdmin }: { article: Article; onDelete: () => void; isAdmin: boolean }) {
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h3 className="font-medium text-lg">{article.title}</h3>
            <div className="flex items-center space-x-3 text-sm text-gray-400">
              <span>{article.category}</span>
              <span>•</span>
              <span>{article.date}</span>
              <span>•</span>
              <span>{article.published ? "Published" : "Draft"}</span>
              <span>•</span>
              <span>By {article.author}</span>
            </div>
            <p className="text-gray-400 text-sm line-clamp-2 mt-2">{article.description}</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" className="border-gray-800 hover:bg-gray-800" asChild>
              <Link href={`/blog/${article.slug}`}>
                <Eye className="h-4 w-4" />
                <span className="sr-only">View</span>
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="border-gray-800 hover:bg-gray-800" asChild>
              <Link href={`/admin/dashboard/article/${article.id}`}>
                <Edit className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Link>
            </Button>
            {(isAdmin || article.authorId === article.id) && (
              <Button
                variant="outline"
                size="sm"
                className="border-gray-800 hover:bg-gray-800 text-red-500 hover:text-red-400"
                onClick={onDelete}
              >
                <Trash className="h-4 w-4" />
                <span className="sr-only">Delete</span>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

