"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import dynamic from "next/dynamic"

const FydelysV4 = dynamic(() => import("@/components/FydelysV4"), { ssr: false })

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push("/")
    })
  }, [])

  return <FydelysV4 />
}
