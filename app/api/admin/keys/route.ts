import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

// Verify admin session (admin or super_admin)
async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get("x-admin-session")
  if (!authHeader) return { authorized: false, error: "Not logged in" }

  try {
    const session = JSON.parse(authHeader)
    if (!["super_admin", "admin"].includes(session.role)) {
      return { authorized: false, error: "Admin access required" }
    }

    // Verify admin still exists
    const supabase = getSupabaseAdmin()
    const { data: admin } = await supabase
      .from("admins")
      .select("id, username, role")
      .eq("id", session.id)
      .single()

    if (!admin) {
      return { authorized: false, error: "Admin not found" }
    }

    return { authorized: true, username: admin.username, role: admin.role }
  } catch {
    return { authorized: false, error: "Invalid session" }
  }
}

// Generate a random key (format: PREFIX-XXXX-XXXX-XXXX)
function generateKey(prefix: string = "IE"): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let key = ""
  for (let i = 0; i < 3; i++) {
    if (i > 0) key += "-"
    for (let j = 0; j < 4; j++) {
      key += chars[Math.floor(Math.random() * chars.length)]
    }
  }
  return `${prefix}-${key}`
}

// GET — List all keys + stats
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request)
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from("access_keys")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const totalKeys = data?.length || 0
    const usedKeys = data?.filter((k: any) => k.used).length || 0
    const availableKeys = totalKeys - usedKeys

    return NextResponse.json({
      keys: data || [],
      stats: {
        total: totalKeys,
        used: usedKeys,
        available: availableKeys,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

// POST — Generate new keys
export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request)
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  try {
    const body = await request.json()
    const count = Math.min(Math.max(1, body.count || 1), 50)
    const note = body.note || ""
    const prefix = process.env.ADMIN_KEY_PREFIX || "IE"

    // Generate unique keys
    const keys: string[] = []
    const maxAttempts = count * 5
    let attempts = 0

    while (keys.length < count && attempts < maxAttempts) {
      const newKey = generateKey(prefix)
      if (!keys.includes(newKey)) {
        keys.push(newKey)
      }
      attempts++
    }

    // Insert keys
    const rows = keys.map((key) => ({
      key_value: key,
      used: false,
      note,
      created_by: auth.username,
    }))

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from("access_keys")
      .insert(rows)
      .select()

    if (error) {
      if (error.code === "23505") {
        // Handle duplicate keys by inserting individually
        const inserted = []
        for (const row of rows) {
          const { data: d, error: e } = await supabase
            .from("access_keys")
            .insert(row)
            .select()
          if (!e && d) inserted.push(...d)
        }
        return NextResponse.json({
          keys: inserted,
          count: inserted.length,
        })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      keys: data,
      count: data?.length || 0,
    })
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

// DELETE — Delete or reset a key
export async function DELETE(request: NextRequest) {
  const auth = await verifyAdmin(request)
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const action = searchParams.get("action")

    if (!id) {
      return NextResponse.json({ error: "Key ID required" }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    if (action === "reset") {
      const { error } = await supabase
        .from("access_keys")
        .update({ used: false, used_at: null })
        .eq("id", id)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ success: true, message: "Key reset to available" })
    } else {
      const { error } = await supabase
        .from("access_keys")
        .delete()
        .eq("id", id)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ success: true, message: "Key deleted" })
    }
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
