import crypto from "crypto";

// AES-256-GCM encrypt/decrypt for OAuth tokens and credentials.
// Key from ENCRYPTION_KEY env (32 hex chars / 32 bytes), or a dev default.

const KEY_HEX = process.env.ENCRYPTION_KEY ?? "dev-32-byte-key-change-me-32b";

function getKey(): Buffer {
  let key = KEY_HEX;
  // If the env value is 64 hex chars, decode it. Otherwise pad/truncate a passphrase to 32 bytes.
  if (/^[0-9a-fA-F]{64}$/.test(key)) {
    return Buffer.from(key, "hex");
  }
  return crypto.createHash("sha256").update(key).digest(); // 32 bytes
}

const ALGO = "aes-256-gcm";
const IV_LEN = 12; // GCM standard IV length

export interface EncryptedBlob {
  iv: string; // base64
  ciphertext: string; // base64
  tag: string; // base64
}

export function encrypt(plaintext: string): EncryptedBlob {
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    iv: iv.toString("base64"),
    ciphertext: enc.toString("base64"),
    tag: tag.toString("base64"),
  };
}

export function decrypt(blob: EncryptedBlob): string {
  const decipher = crypto.createDecipheriv(ALGO, getKey(), Buffer.from(blob.iv, "base64"));
  decipher.setAuthTag(Buffer.from(blob.tag, "base64"));
  const dec = Buffer.concat([decipher.update(Buffer.from(blob.ciphertext, "base64")), decipher.final()]);
  return dec.toString("utf8");
}

// Convenience: store the whole blob as a JSON string (for DB columns that are String).
export function encryptToString(plaintext: string): string {
  return JSON.stringify(encrypt(plaintext));
}

export function decryptFromString(serialized: string): string {
  return decrypt(JSON.parse(serialized) as EncryptedBlob);
}
