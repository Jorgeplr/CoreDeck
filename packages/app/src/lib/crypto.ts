/**
 * E2EE Vault Crypto — Web Crypto API
 * Master password never leaves the client.
 * Keys are derived via PBKDF2 and used for AES-256-GCM encryption.
 */

const PBKDF2_ITERATIONS = 310_000;

export async function deriveMasterKey(
  masterPassword: string,
  userId: string
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(masterPassword),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode(userId),
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false, // non-extractable
    ["encrypt", "decrypt"]
  );
}

function toBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function fromBase64(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

export async function encryptField(
  plaintext: string,
  masterKey: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
  const encoded = new TextEncoder().encode(plaintext);

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    masterKey,
    encoded
  );

  return {
    ciphertext: toBase64(encryptedBuffer),
    iv: toBase64(iv.buffer),
  };
}

export async function decryptField(
  ciphertext: string,
  iv: string,
  masterKey: CryptoKey
): Promise<string> {
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(iv) },
    masterKey,
    fromBase64(ciphertext)
  );

  return new TextDecoder().decode(decryptedBuffer);
}

export function generatePassword(length = 20): string {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{}|;:,.<>?";
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (x) => chars[x % chars.length]).join("");
}
