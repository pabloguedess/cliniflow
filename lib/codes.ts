import bcrypt from 'bcryptjs'

export function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000)) // 6 dígitos
}

export async function hashCode(code: string) {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(code, salt)
}

export async function verifyCode(code: string, hash: string) {
  return bcrypt.compare(code, hash)
}
