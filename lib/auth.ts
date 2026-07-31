"use client";

/**
 * Device-local family authentication for the static deployment.
 * Credentials are salted SHA-256 hashes stored inside the family ledger
 * state (localStorage), synced across tabs like every other mutation.
 * Nothing ever leaves the device.
 */

export interface Credential {
  salt: string;
  hash: string;
}

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function generateSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return bufToHex(bytes.buffer);
}

export async function hashSecret(secret: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${secret}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return bufToHex(digest);
}

export async function makeCredential(secret: string): Promise<Credential> {
  const salt = generateSalt();
  return { salt, hash: await hashSecret(secret, salt) };
}

export async function verifySecret(
  secret: string,
  cred: Credential
): Promise<boolean> {
  return (await hashSecret(secret, cred.salt)) === cred.hash;
}

export function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
}
