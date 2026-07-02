"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [authorized, setAuthorized] = useState(false)
  const [checking, setChecking] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const access = localStorage.getItem("access-granted")
    if (access === "true") {
      setAuthorized(true)
    } else {
      router.replace("/")
    }
    setChecking(false)
  }, [router])

  if (checking) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#0c0f14" }}
      >
        <div className="text-gray-500 text-[13px]">Loading...</div>
      </div>
    )
  }

  if (!authorized) return null

  return <>{children}</>
}
