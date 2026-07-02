import { createHash } from "crypto"

const SALT = "insight_editor_salt_v1"

export function hashPassword(password: string): string {
  const hash = createHash("sha256").update(SALT + password).digest("hex")
  return `sha256$${SALT}$${hash}`
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const expected = hashPassword(password)
  return expected === storedHash
}
