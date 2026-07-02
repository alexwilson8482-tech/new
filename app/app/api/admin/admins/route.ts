import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"
import { verifyPassword, hashPassword } from "@/lib/password"

// Verify admin session and check if super_admin
async function verifySuperAdmin(request: NextRequest) {
  const authHeader = request.headers.get("x-admin-session")
  if (!authHeader) return { authorized: false, error: "Not logged in" }

  try {
    const session = JSON.parse(authHeader)
    if (session.role !== "super_admin") {
      return { authorized: false, error: "Super admin access required" }
    }

    // Verify admin still exists
    const supabase = getSupabaseAdmin()
    const { data: admin, error } = await supabase
      .from("admins")
      .select("id, role")
      .eq("id", session.id)
      .single()

    if (error || !admin) {
      return { authorized: false, error: "Admin not found" }
    }

    return { authorized: true, adminId: admin.id }
  } catch {
    return { authorized: false, error: "Invalid session" }
  }
}

// GET — List all admins
export async function GET(request: NextRequest) {
  const auth = await verifySuperAdmin(request)
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  try {
    const supabase = getSupabaseAdmin()
    const { data: admins, error } = await supabase
      .from("admins")
      .select("id, username, role, created_at")
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Count keys created by each admin
    const { data: keys } = await supabase
      .from("access_keys")
      .select("created_by")

    const adminsWithStats = (admins || []).map((admin) => ({
      ...admin,
      keys_created: keys?.filter((k) => k.created_by === admin.username).length || 0,
    }))

    return NextResponse.json({ admins: adminsWithStats })
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

// POST — Create a new admin
export async function POST(request: NextRequest) {
  const auth = await verifySuperAdmin(request)
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { username, password, role } = body

    if (!username || !password || !role) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    if (!["super_admin", "admin"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const passwordHash = hashPassword(password)

    const { data, error } = await supabase
      .from("admins")
      .insert({ username, password_hash: passwordHash, role })
      .select("id, username, role, created_at")
      .single()

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Username already exists" }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ admin: data })
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

// DELETE — Delete an admin
export async function DELETE(request: NextRequest) {
  const auth = await verifySuperAdmin(request)
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const adminId = searchParams.get("id")

    if (!adminId) {
      return NextResponse.json({ error: "Admin ID required" }, { status: 400 })
    }

    // Can't delete yourself
    if (adminId === auth.adminId) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { error } = await supabase
      .from("admins")
      .delete()
      .eq("id", adminId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
