"use client"

import { useState, useEffect, useCallback } from "react"

// ==================== TYPES ====================
interface AdminSession {
  id: string
  username: string
  role: "super_admin" | "admin"
}

interface KeyData {
  id: string
  key_value: string
  used: boolean
  used_at: string | null
  note: string
  created_by: string
  created_at: string
}

interface AdminData {
  id: string
  username: string
  role: string
  created_at: string
  keys_created: number
}

interface Stats {
  total: number
  used: number
  available: number
}

// ==================== MAIN COMPONENT ====================
export default function AdminPage() {
  const [session, setSession] = useState<AdminSession | null>(null)
  const [checking, setChecking] = useState(true)
  const [activeTab, setActiveTab] = useState<"keys" | "admins">("keys")

  // Check for existing session
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("admin-session")
      if (saved) {
        setSession(JSON.parse(saved))
      }
    } catch {}
    setChecking(false)
  }, [])

  // Handle successful login
  const handleLogin = (admin: AdminSession) => {
    setSession(admin)
    sessionStorage.setItem("admin-session", JSON.stringify(admin))
  }

  // Logout
  const handleLogout = () => {
    setSession(null)
    sessionStorage.removeItem("admin-session")
  }

  // Helper to get session header for API calls
  const getSessionHeader = () => {
    if (!session) return ""
    return JSON.stringify({ id: session.id, role: session.role })
  }

  // ==================== LOADING ====================
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0c0f14" }}>
        <div className="text-gray-500 text-sm">Loading...</div>
      </div>
    )
  }

  // ==================== NOT LOGGED IN ====================
  if (!session) {
    return <LoginForm onLogin={handleLogin} />
  }

  // ==================== DASHBOARD ====================
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0c0f14" }}>
      {/* Header */}
      <div className="sticky top-0 z-50 border-b" style={{ backgroundColor: "#0c0f14ee", borderColor: "#1a1d23", backdropFilter: "blur(12px)" }}>
        <div className="max-w-[800px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: session.role === "super_admin" ? "#d939cf22" : "#7738fb22" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={session.role === "super_admin" ? "#d939cf" : "#7738fb"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                {session.role === "super_admin" ? (
                  <><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></>
                ) : (
                  <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>
                )}
              </svg>
            </div>
            <div>
              <h1 className="text-[15px] font-bold text-white">Admin Panel</h1>
              <p className="text-[11px] text-gray-400">
                {session.username} · {session.role === "super_admin" ? "Super Admin" : "Admin"}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-[12px] text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: "#1a1d23" }}
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-[800px] mx-auto px-4 pt-5 pb-8">
        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl mb-5" style={{ backgroundColor: "#1a1d23" }}>
          <button
            onClick={() => setActiveTab("keys")}
            className="flex-1 py-2.5 rounded-lg text-[13px] font-medium transition-all"
            style={activeTab === "keys" ? { backgroundColor: "#25282d", color: "white" } : { color: "#888" }}
          >
            🔑 Manage Keys
          </button>
          {session.role === "super_admin" && (
            <button
              onClick={() => setActiveTab("admins")}
              className="flex-1 py-2.5 rounded-lg text-[13px] font-medium transition-all"
              style={activeTab === "admins" ? { backgroundColor: "#25282d", color: "white" } : { color: "#888" }}
            >
              👥 Manage Admins
            </button>
          )}
        </div>

        {activeTab === "keys" ? (
          <KeysManager sessionHeader={getSessionHeader()} />
        ) : (
          <AdminsManager sessionHeader={getSessionHeader()} />
        )}
      </div>
    </div>
  )
}

// ==================== LOGIN FORM ====================
function LoginForm({ onLogin }: { onLogin: (admin: AdminSession) => void }) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!username.trim() || !password) {
      setError("Enter username and password")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Login failed")
        setLoading(false)
        return
      }

      onLogin(data.admin)
    } catch {
      setError("Connection error")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: "#0c0f14" }}>
      <div className="w-full max-w-[340px]">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4" style={{ backgroundColor: "#d939cf22" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d939cf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h1 className="text-[22px] font-bold text-white mb-2">Admin Login</h1>
          <p className="text-[13px] text-gray-400">Enter your admin credentials</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError("") }}
              placeholder="Username"
              className="w-full px-4 py-3 rounded-xl text-[14px] text-white outline-none border transition-colors"
              style={{ backgroundColor: "#1a1d23", borderColor: error ? "#ef4444" : "#2a2d33", caretColor: "#d939cf" }}
              onFocus={(e) => { if (!error) e.target.style.borderColor = "#d939cf" }}
              onBlur={(e) => { if (!error) e.target.style.borderColor = "#2a2d33" }}
              autoFocus
            />
          </div>
          <div className="mb-4">
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError("") }}
              placeholder="Password"
              className="w-full px-4 py-3 rounded-xl text-[14px] text-white outline-none border transition-colors"
              style={{ backgroundColor: "#1a1d23", borderColor: error ? "#ef4444" : "#2a2d33", caretColor: "#d939cf" }}
              onFocus={(e) => { if (!error) e.target.style.borderColor = "#d939cf" }}
              onBlur={(e) => { if (!error) e.target.style.borderColor = "#2a2d33" }}
            />
            {error && <p className="text-[12px] text-red-400 mt-2 ml-1">{error}</p>}
          </div>
          <button
            type="submit"
            disabled={!username.trim() || !password || loading}
            className="w-full py-3 rounded-xl text-[14px] font-semibold transition-all"
            style={{
              backgroundColor: username.trim() && password ? "#d939cf" : "#2a2d33",
              color: username.trim() && password ? "white" : "#666",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Verifying..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  )
}

// ==================== KEYS MANAGER ====================
function KeysManager({ sessionHeader }: { sessionHeader: string }) {
  const [keys, setKeys] = useState<KeyData[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, used: 0, available: 0 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "available" | "used">("all")
  const [keyCount, setKeyCount] = useState(5)
  const [note, setNote] = useState("")
  const [generatedKeys, setGeneratedKeys] = useState<string[]>([])
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [subTab, setSubTab] = useState<"generate" | "list">("generate")

  const fetchKeys = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/keys", {
        headers: { "x-admin-session": sessionHeader },
      })
      if (!res.ok) return
      const data = await res.json()
      setKeys(data.keys || [])
      setStats(data.stats || { total: 0, used: 0, available: 0 })
    } catch {}
    setLoading(false)
  }, [sessionHeader])

  useEffect(() => { fetchKeys() }, [fetchKeys])

  const handleGenerate = async () => {
    setGenerating(true)
    setGeneratedKeys([])
    try {
      const res = await fetch("/api/admin/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-session": sessionHeader },
        body: JSON.stringify({ count: keyCount, note }),
      })
      const data = await res.json()
      if (data.keys) {
        setGeneratedKeys(data.keys.map((k: KeyData) => k.key_value))
        setNote("")
        fetchKeys()
      }
    } catch {}
    setGenerating(false)
  }

  const copyKeys = () => {
    navigator.clipboard.writeText(generatedKeys.join("\n"))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const deleteKey = async (id: string) => {
    if (!confirm("Delete this key?")) return
    await fetch(`/api/admin/keys?id=${id}&action=delete`, {
      method: "DELETE",
      headers: { "x-admin-session": sessionHeader },
    })
    fetchKeys()
  }

  const resetKey = async (id: string) => {
    await fetch(`/api/admin/keys?id=${id}&action=reset`, {
      method: "DELETE",
      headers: { "x-admin-session": sessionHeader },
    })
    fetchKeys()
  }

  const filteredKeys = keys.filter((k) => {
    if (filter === "available") return !k.used
    if (filter === "used") return k.used
    return true
  })

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <StatCard label="Total" value={stats.total} color="#d939cf" />
        <StatCard label="Available" value={stats.available} color="#22c55e" />
        <StatCard label="Used" value={stats.used} color="#666" />
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-5" style={{ backgroundColor: "#151820" }}>
        <button
          onClick={() => setSubTab("generate")}
          className="flex-1 py-2 rounded-lg text-[12px] font-medium transition-all"
          style={subTab === "generate" ? { backgroundColor: "#25282d", color: "white" } : { color: "#666" }}
        >
          ✨ Generate
        </button>
        <button
          onClick={() => setSubTab("list")}
          className="flex-1 py-2 rounded-lg text-[12px] font-medium transition-all"
          style={subTab === "list" ? { backgroundColor: "#25282d", color: "white" } : { color: "#666" }}
        >
          📋 All Keys
        </button>
      </div>

      {/* Generate Section */}
      {subTab === "generate" && (
        <div>
          <div className="rounded-xl p-5 mb-4" style={{ backgroundColor: "#1a1d23", border: "1px solid #2a2d33" }}>
            <div className="mb-4">
              <label className="text-[12px] text-gray-400 mb-1.5 block">Number of Keys (1-50)</label>
              <input
                type="number"
                min={1} max={50}
                value={keyCount}
                onChange={(e) => setKeyCount(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-full px-4 py-2.5 rounded-lg text-[14px] text-white outline-none border"
                style={{ backgroundColor: "#0c0f14", borderColor: "#2a2d33" }}
              />
            </div>
            <div className="mb-5">
              <label className="text-[12px] text-gray-400 mb-1.5 block">Note (optional)</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g., March 2025 batch"
                className="w-full px-4 py-2.5 rounded-lg text-[14px] text-white outline-none border"
                style={{ backgroundColor: "#0c0f14", borderColor: "#2a2d33" }}
              />
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full py-3 rounded-xl text-[14px] font-semibold"
              style={{ backgroundColor: "#d939cf", color: "white", opacity: generating ? 0.7 : 1 }}
            >
              {generating ? "Generating..." : `Generate ${keyCount} Key${keyCount > 1 ? "s" : ""}`}
            </button>
          </div>

          {generatedKeys.length > 0 && (
            <div className="rounded-xl p-5" style={{ backgroundColor: "#1a1d23", border: "1px solid #22c55e44" }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[14px] font-semibold text-green-400">✓ {generatedKeys.length} Keys Generated</h3>
                <button
                  onClick={copyKeys}
                  className="text-[12px] px-3 py-1.5 rounded-lg font-medium"
                  style={{ backgroundColor: copied ? "#22c55e" : "#25282d", color: copied ? "white" : "#aaa" }}
                >
                  {copied ? "✓ Copied!" : "Copy All"}
                </button>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {generatedKeys.map((key, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg font-mono text-[13px]" style={{ backgroundColor: "#0c0f14" }}>
                    <span className="text-white">{key}</span>
                    <button onClick={() => navigator.clipboard.writeText(key)} className="text-gray-500 hover:text-white">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Keys List */}
      {subTab === "list" && (
        <div>
          <div className="flex gap-2 mb-4">
            {(["all", "available", "used"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all"
                style={filter === f
                  ? { backgroundColor: "#25282d", color: "white", borderColor: "#d939cf" }
                  : { backgroundColor: "transparent", color: "#888", borderColor: "#2a2d33" }
                }
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f === "all" && ` (${stats.total})`}
                {f === "available" && ` (${stats.available})`}
                {f === "used" && ` (${stats.used})`}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-10 text-gray-500 text-sm">Loading...</div>
          ) : filteredKeys.length === 0 ? (
            <div className="text-center py-10 text-gray-500 text-sm">No keys found</div>
          ) : (
            <div className="space-y-2">
              {filteredKeys.map((k) => (
                <div key={k.id} className="rounded-xl p-4 flex items-center justify-between" style={{ backgroundColor: "#1a1d23", border: "1px solid #2a2d33" }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[13px] text-white truncate">{k.key_value}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={k.used ? { backgroundColor: "#ef444422", color: "#ef4444" } : { backgroundColor: "#22c55e22", color: "#22c55e" }}>
                        {k.used ? "USED" : "AVAILABLE"}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500">
                      Created: {new Date(k.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      {k.created_by && <> · By: <span className="text-gray-400">{k.created_by}</span></>}
                      {k.used_at && <> · Used: {new Date(k.used_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</>}
                      {k.note && <> · <span className="text-gray-400">{k.note}</span></>}
                    </div>
                  </div>
                  <div className="flex gap-1.5 ml-3">
                    {k.used && (
                      <button onClick={() => resetKey(k.id)} className="text-[11px] px-2.5 py-1.5 rounded-lg" style={{ backgroundColor: "#22c55e22", color: "#22c55e" }}>
                        Reset
                      </button>
                    )}
                    <button onClick={() => deleteKey(k.id)} className="text-[11px] px-2.5 py-1.5 rounded-lg" style={{ backgroundColor: "#ef444422", color: "#ef4444" }}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ==================== ADMINS MANAGER (Super Admin Only) ====================
function AdminsManager({ sessionHeader }: { sessionHeader: string }) {
  const [admins, setAdmins] = useState<AdminData[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newUsername, setNewUsername] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newRole, setNewRole] = useState<"admin" | "super_admin">("admin")
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const fetchAdmins = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/admins", {
        headers: { "x-admin-session": sessionHeader },
      })
      if (!res.ok) return
      const data = await res.json()
      setAdmins(data.admins || [])
    } catch {}
    setLoading(false)
  }, [sessionHeader])

  useEffect(() => { fetchAdmins() }, [fetchAdmins])

  const handleCreate = async () => {
    setError("")
    setSuccess("")

    if (!newUsername.trim() || !newPassword) {
      setError("Fill in all fields")
      return
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setCreating(true)
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-session": sessionHeader },
        body: JSON.stringify({ username: newUsername.trim(), password: newPassword, role: newRole }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to create admin")
        setCreating(false)
        return
      }

      setSuccess(`Admin "${newUsername.trim()}" created!`)
      setNewUsername("")
      setNewPassword("")
      setShowCreate(false)
      fetchAdmins()
    } catch {
      setError("Connection error")
    }
    setCreating(false)
  }

  const deleteAdmin = async (id: string, username: string) => {
    if (!confirm(`Delete admin "${username}"? They will lose access immediately.`)) return
    try {
      await fetch(`/api/admin/admins?id=${id}`, {
        method: "DELETE",
        headers: { "x-admin-session": sessionHeader },
      })
      fetchAdmins()
    } catch {}
  }

  return (
    <div>
      {/* Create Admin Button */}
      <button
        onClick={() => { setShowCreate(!showCreate); setError(""); setSuccess("") }}
        className="w-full py-3 rounded-xl text-[14px] font-semibold mb-5 transition-all"
        style={{ backgroundColor: showCreate ? "#1a1d23" : "#d939cf", color: "white", border: showCreate ? "1px solid #2a2d33" : "none" }}
      >
        {showCreate ? "✕ Cancel" : "+ Create New Admin"}
      </button>

      {/* Create Form */}
      {showCreate && (
        <div className="rounded-xl p-5 mb-5" style={{ backgroundColor: "#1a1d23", border: "1px solid #d939cf33" }}>
          <h3 className="text-[14px] font-semibold text-white mb-4">New Admin Account</h3>
          <div className="mb-3">
            <label className="text-[12px] text-gray-400 mb-1.5 block">Username</label>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Enter username"
              className="w-full px-4 py-2.5 rounded-lg text-[14px] text-white outline-none border"
              style={{ backgroundColor: "#0c0f14", borderColor: "#2a2d33" }}
            />
          </div>
          <div className="mb-3">
            <label className="text-[12px] text-gray-400 mb-1.5 block">Password (min 6 chars)</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-2.5 rounded-lg text-[14px] text-white outline-none border"
              style={{ backgroundColor: "#0c0f14", borderColor: "#2a2d33" }}
            />
          </div>
          <div className="mb-4">
            <label className="text-[12px] text-gray-400 mb-1.5 block">Role</label>
            <div className="flex gap-2">
              <button
                onClick={() => setNewRole("admin")}
                className="flex-1 py-2.5 rounded-lg text-[13px] font-medium border transition-all"
                style={newRole === "admin"
                  ? { backgroundColor: "#7738fb22", borderColor: "#7738fb", color: "#7738fb" }
                  : { backgroundColor: "transparent", borderColor: "#2a2d33", color: "#888" }
                }
              >
                Admin
                <span className="block text-[10px] opacity-60 mt-0.5">Manages keys only</span>
              </button>
              <button
                onClick={() => setNewRole("super_admin")}
                className="flex-1 py-2.5 rounded-lg text-[13px] font-medium border transition-all"
                style={newRole === "super_admin"
                  ? { backgroundColor: "#d939cf22", borderColor: "#d939cf", color: "#d939cf" }
                  : { backgroundColor: "transparent", borderColor: "#2a2d33", color: "#888" }
                }
              >
                Super Admin
                <span className="block text-[10px] opacity-60 mt-0.5">Manages admins + keys</span>
              </button>
            </div>
          </div>
          {error && <p className="text-[12px] text-red-400 mb-3">{error}</p>}
          {success && <p className="text-[12px] text-green-400 mb-3">{success}</p>}
          <button
            onClick={handleCreate}
            disabled={creating}
            className="w-full py-3 rounded-xl text-[14px] font-semibold"
            style={{ backgroundColor: "#d939cf", color: "white", opacity: creating ? 0.7 : 1 }}
          >
            {creating ? "Creating..." : "Create Admin"}
          </button>
        </div>
      )}

      {/* Admins List */}
      {loading ? (
        <div className="text-center py-10 text-gray-500 text-sm">Loading admins...</div>
      ) : (
        <div className="space-y-2">
          {admins.map((admin) => (
            <div key={admin.id} className="rounded-xl p-4 flex items-center justify-between" style={{ backgroundColor: "#1a1d23", border: "1px solid #2a2d33" }}>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[14px] font-semibold text-white">{admin.username}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                    style={admin.role === "super_admin"
                      ? { backgroundColor: "#d939cf22", color: "#d939cf" }
                      : { backgroundColor: "#7738fb22", color: "#7738fb" }
                    }>
                    {admin.role === "super_admin" ? "SUPER ADMIN" : "ADMIN"}
                  </span>
                </div>
                <div className="text-[11px] text-gray-500">
                  Created: {new Date(admin.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  {" · "}Keys created: {admin.keys_created}
                </div>
              </div>
              <button
                onClick={() => deleteAdmin(admin.id, admin.username)}
                className="text-[11px] px-2.5 py-1.5 rounded-lg ml-3"
                style={{ backgroundColor: "#ef444422", color: "#ef4444" }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ==================== STAT CARD ====================
function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl p-3.5 text-center" style={{ backgroundColor: "#1a1d23", border: "1px solid #2a2d33" }}>
      <div className="text-[22px] font-bold" style={{ color }}>{value}</div>
      <div className="text-[11px] text-gray-400 mt-0.5">{label}</div>
    </div>
  )
}
