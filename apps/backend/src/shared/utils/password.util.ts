import bcrypt from "bcrypt";
import { randomInt } from "node:crypto";
import { env } from "@/config/env";

export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, env.BCRYPT_SALT_ROUNDS);
}

export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

// Ambiguous-looking characters (I, O, l, 0, 1) are excluded so a manager can
// read a temporary password aloud or retype it without confusion.
const TEMP_PASSWORD_UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const TEMP_PASSWORD_LOWER = "abcdefghijkmnopqrstuvwxyz";
const TEMP_PASSWORD_DIGITS = "23456789";
const TEMP_PASSWORD_ALL = TEMP_PASSWORD_UPPER + TEMP_PASSWORD_LOWER + TEMP_PASSWORD_DIGITS;

function randomChar(charset: string): string {
  return charset.charAt(randomInt(charset.length));
}

/** Cryptographically secure temporary password: 11 chars, guaranteed upper/lower/digit. */
export function generateTemporaryPassword(length = 11): string {
  const required = [randomChar(TEMP_PASSWORD_UPPER), randomChar(TEMP_PASSWORD_LOWER), randomChar(TEMP_PASSWORD_DIGITS)];
  const rest = Array.from({ length: length - required.length }, () => randomChar(TEMP_PASSWORD_ALL));
  const chars = [...required, ...rest];

  // Fisher-Yates shuffle so the guaranteed chars aren't always in the same
  // positions, using the same CSPRNG as the rest of the password.
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    const temp = chars[i]!;
    chars[i] = chars[j]!;
    chars[j] = temp;
  }

  return chars.join("");
}
