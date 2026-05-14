/**
 * Hybrid (X25519 + AES-GCM) "sealed box" style encryption for vault sharing.
 *
 * - Each user has an X25519 keypair. The private key is stored on the server
 *   encrypted with the user's vault masterKey (AES-GCM). The public key is
 *   stored in plaintext.
 * - To share a secret with userB, userA:
 *     1. Generates an ephemeral X25519 keypair (eph)
 *     2. Computes shared = X25519(eph.priv, userB.pub)
 *     3. Derives AES-256 key with HKDF-SHA256(shared, "coredesk-vault-share")
 *     4. AES-GCM encrypts the secret with that key
 *     5. Sends { passwordEncrypted = b64(eph.pub || ciphertext), iv = b64(iv) }
 * - userB does the inverse with their own privateKey + the embedded eph.pub.
 *
 * The recipient's long-term private key never leaves their device in plaintext
 * — only re-encrypted with their own masterKey.
 */
import { x25519 } from "@noble/curves/ed25519.js";
import { hkdf } from "@noble/hashes/hkdf.js";
import { sha256 } from "@noble/hashes/sha2.js";

const HKDF_INFO = new TextEncoder().encode("coredesk-vault-share/v1");

function b64Encode(buf: Uint8Array): string {
  let s = "";
  for (let i = 0; i < buf.length; i++) s += String.fromCharCode(buf[i]);
  return btoa(s);
}

function b64Decode(s: string): Uint8Array<ArrayBuffer> {
  const bin = atob(s);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function generateKeypair(): { privateKey: Uint8Array; publicKey: Uint8Array } {
  const privateKey = x25519.utils.randomSecretKey();
  const publicKey = x25519.getPublicKey(privateKey);
  return { privateKey, publicKey };
}

export async function encryptPrivateKey(
  privateKey: Uint8Array,
  masterKey: CryptoKey
): Promise<{ encryptedPrivateKey: string; privateKeyIv: string; publicKeyB64: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    masterKey,
    toArrayBuffer(privateKey)
  );
  return {
    encryptedPrivateKey: b64Encode(new Uint8Array(ct)),
    privateKeyIv: b64Encode(iv),
    publicKeyB64: b64Encode(x25519.getPublicKey(privateKey)),
  };
}

export async function decryptPrivateKey(
  encryptedPrivateKey: string,
  privateKeyIv: string,
  masterKey: CryptoKey
): Promise<Uint8Array> {
  const ct = b64Decode(encryptedPrivateKey);
  const iv = b64Decode(privateKeyIv);
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    masterKey,
    toArrayBuffer(ct)
  );
  return new Uint8Array(pt);
}

function toArrayBuffer(u: Uint8Array): ArrayBuffer {
  // Force a fresh ArrayBuffer-backed Uint8Array (not SharedArrayBuffer) for Web Crypto.
  const copy = new Uint8Array(u.byteLength);
  copy.set(u);
  return copy.buffer;
}

async function deriveAesKey(sharedSecret: Uint8Array, usage: KeyUsage[]): Promise<CryptoKey> {
  const raw = hkdf(sha256, sharedSecret, undefined, HKDF_INFO, 32);
  return crypto.subtle.importKey("raw", toArrayBuffer(raw), "AES-GCM", false, usage);
}

export async function sealedBoxEncrypt(
  plaintext: string,
  recipientPublicKeyB64: string
): Promise<{ passwordEncrypted: string; iv: string }> {
  const recipientPub = b64Decode(recipientPublicKeyB64);
  const ephPriv = x25519.utils.randomSecretKey();
  const ephPub = x25519.getPublicKey(ephPriv);
  const shared = x25519.getSharedSecret(ephPriv, recipientPub);

  const aesKey = await deriveAesKey(shared, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, encoded)
  );

  // Pack: ephPub (32) || ciphertext+tag
  const packed = new Uint8Array(ephPub.length + ct.length);
  packed.set(ephPub, 0);
  packed.set(ct, ephPub.length);

  return {
    passwordEncrypted: b64Encode(packed),
    iv: b64Encode(iv),
  };
}

export async function sealedBoxDecrypt(
  passwordEncrypted: string,
  iv: string,
  recipientPrivateKey: Uint8Array
): Promise<string> {
  const packed = b64Decode(passwordEncrypted);
  if (packed.length < 33) throw new Error("Payload demasiado corto");
  const ephPub = packed.slice(0, 32);
  const ct = packed.slice(32);
  const shared = x25519.getSharedSecret(recipientPrivateKey, ephPub);
  const aesKey = await deriveAesKey(shared, ["decrypt"]);
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: b64Decode(iv) },
    aesKey,
    toArrayBuffer(ct)
  );
  return new TextDecoder().decode(pt);
}
