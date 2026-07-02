"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function LoginPage() {
  const [key, setKey] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Auto-redirect if already unlocked on this device
  useEffect(() => {
    const savedKey = localStorage.getItem("device-access-key")
    const accessGranted = localStorage.getItem("access-granted")
    if (savedKey && accessGranted === "true") {
      router.replace("/editor")
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const trimmedKey = key.trim().toUpperCase()

      // Check if THIS device already activated this key before
      const savedKey = localStorage.getItem("device-access-key")
      if (savedKey === trimmedKey) {
        localStorage.setItem("access-granted", "true")
        router.push("/editor")
        return
      }

      // Call Supabase function (atomic + safe)
      const { data, error: rpcError } = await supabase.rpc("use_key", {
        input_key: trimmedKey,
      })

      if (rpcError) {
        setError("Something went wrong. Try again.")
        setLoading(false)
        return
      }

      if (data === "invalid") {
        setError("Invalid key. Please try again.")
        setLoading(false)
        return
      }

      if (data === "already_used") {
        setError("This key has already been used.")
        setLoading(false)
        return
      }

      if (data === "success") {
        localStorage.setItem("access-granted", "true")
        localStorage.setItem("device-access-key", trimmedKey)
        router.push("/editor")
        return
      }

      setError("Unexpected response. Try again.")
      setLoading(false)
    } catch (err) {
      setError("Something went wrong. Try again.")
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ backgroundColor: "#0c0f14" }}
    >
      <div className="w-full max-w-[340px]">
        <div className="text-center mb-8">
          <h1 className="text-[24px] font-bold text-white mb-2">Insight Editor</h1>
          <p className="text-[13px] text-gray-400">Enter your access key to continue</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="text"
              value={key}
              onChange={(e) => { setKey(e.target.value); setError("") }}
              placeholder="Enter access key"
              className="w-full px-4 py-3 rounded-xl text-[14px] text-white outline-none border transition-colors"
              style={{
                backgroundColor: "#1a1d23",
                borderColor: error ? "#ef4444" : "#2a2d33",
                caretColor: "#d939cf",
              }}
              onFocus={(e) => { if (!error) e.target.style.borderColor = "#d939cf" }}
              onBlur={(e) => { if (!error) e.target.style.borderColor = "#2a2d33" }}
              autoFocus
            />
            {error && (
              <p className="text-[12px] text-red-400 mt-2 ml-1">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={!key.trim() || loading}
            className="w-full py-3 rounded-xl text-[14px] font-semibold transition-all duration-200 active:scale-[0.98]"
            style={{
              backgroundColor: key.trim() ? "#d939cf" : "#2a2d33",
              color: key.trim() ? "white" : "#666",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Verifying..." : "Access Editor"}
          </button>
        </form>

        <p className="text-[11px] text-gray-600 text-center mt-6">
          Contact admin for access key
        </p>
      </div>
    </div>
  )
}
