import { create } from "zustand"
import { persist } from "zustand/middleware"

export type User = {
  id: string
  username: string
  password: string
  role: "admin" | "author"
  name: string
  email: string
  bio?: string
  avatar?: string
}

export type Article = {
  id: string
  title: string
  description: string
  content: string
  category: string
  date: string
  author: string
  authorId: string
  readTime: string
  image: string
  slug: string
  published: boolean
}

export type UploadedImage = {
  id: string
  url: string
  name: string
  uploadedBy: string
  uploadedAt: string
}

type AdminState = {
  currentUser: User | null
  users: User[]
  articles: Article[]
  uploadedImages: UploadedImage[]

  // Auth actions
  login: (username: string, password: string) => boolean
  logout: () => void
  register: (user: Omit<User, "id">) => boolean
  updateUser: (id: string, userData: Partial<User>) => void

  // Article actions
  addArticle: (article: Omit<Article, "id">) => void
  updateArticle: (id: string, article: Partial<Article>) => void
  deleteArticle: (id: string) => void
  getArticle: (id: string) => Article | undefined

  // Image actions
  addImage: (image: Omit<UploadedImage, "id">) => string
  deleteImage: (id: string) => void
  getImage: (id: string) => UploadedImage | undefined
}

// Demo users
const DEMO_USERS: User[] = [
  {
    id: "1",
    username: "admin",
    password: "admin123",
    role: "admin",
    name: "Admin User",
    email: "admin@neuralpulse.com",
    bio: "Site administrator",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&h=200&auto=format&fit=crop",
  },
  {
    id: "2",
    username: "author",
    password: "author123",
    role: "author",
    name: "Demo Author",
    email: "author@neuralpulse.com",
    bio: "Content creator",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&h=200&auto=format&fit=crop",
  },
]

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: DEMO_USERS,
      articles: [],
      uploadedImages: [],

      login: (username: string, password: string) => {
        const user = get().users.find((u) => u.username === username && u.password === password)

        if (user) {
          set({ currentUser: user })
          return true
        }
        return false
      },

      logout: () => set({ currentUser: null }),

      register: (userData) => {
        // Check if username already exists
        if (get().users.some((u) => u.username === userData.username)) {
          return false
        }

        const newUser: User = {
          ...userData,
          id: Date.now().toString(),
        }

        set((state) => ({
          users: [...state.users, newUser],
        }))

        return true
      },

      updateUser: (id, userData) => {
        set((state) => ({
          users: state.users.map((user) => (user.id === id ? { ...user, ...userData } : user)),
          currentUser: state.currentUser?.id === id ? { ...state.currentUser, ...userData } : state.currentUser,
        }))
      },

      addArticle: (article) => {
        const id = Date.now().toString()
        set((state) => ({
          articles: [...state.articles, { ...article, id }],
        }))
      },

      updateArticle: (id, article) => {
        set((state) => ({
          articles: state.articles.map((a) => (a.id === id ? { ...a, ...article } : a)),
        }))
      },

      deleteArticle: (id) => {
        set((state) => ({
          articles: state.articles.filter((a) => a.id !== id),
        }))
      },

      getArticle: (id) => {
        return get().articles.find((a) => a.id === id)
      },

      addImage: (image) => {
        const id = Date.now().toString()
        const newImage = { ...image, id }

        set((state) => ({
          uploadedImages: [...state.uploadedImages, newImage],
        }))

        return id
      },

      deleteImage: (id) => {
        set((state) => ({
          uploadedImages: state.uploadedImages.filter((img) => img.id !== id),
        }))
      },

      getImage: (id) => {
        return get().uploadedImages.find((img) => img.id === id)
      },
    }),
    {
      name: "neural-pulse-storage",
    },
  ),
)

