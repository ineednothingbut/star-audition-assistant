import bcrypt from 'bcrypt'

// Number of salt rounds for bcrypt (10 is a good balance between security and performance)
const SALT_ROUNDS = 10

/**
 * Hashes a plaintext password using bcrypt
 * @param password - The plaintext password to hash
 * @returns Promise that resolves to the hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS)
    return hash
  } catch (error) {
    console.error('Error hashing password:', error)
    throw new Error('Failed to hash password')
  }
}

/**
 * Verifies a plaintext password against a hashed password
 * @param password - The plaintext password to verify
 * @param hash - The hashed password to compare against
 * @returns Promise that resolves to true if passwords match, false otherwise
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    const match = await bcrypt.compare(password, hash)
    return match
  } catch (error) {
    console.error('Error verifying password:', error)
    return false
  }
}
