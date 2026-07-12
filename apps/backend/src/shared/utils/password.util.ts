import bcrypt from "bcrypt";
import { env } from "@/config/env";

export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, env.BCRYPT_SALT_ROUNDS);
}

export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}
