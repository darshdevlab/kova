import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { ProviderError } from "./errors";

function masterKey() {
  const value = process.env.KOVA_PROVIDER_MASTER_KEY;
  if (!value || !/^[a-fA-F0-9]{64}$/.test(value))
    throw new ProviderError("encryption_unavailable", "AI Providers unavailable: KOVA_PROVIDER_MASTER_KEY must be a 32-byte hex key.", 503);
  return Buffer.from(value, "hex");
}
export function assertEncryptionAvailable() { masterKey(); }
export function encryptCredential(secret: string, context: string) {
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", masterKey(), nonce);
  cipher.setAAD(Buffer.from(context));
  const ciphertext = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return ["v1", nonce.toString("base64"), cipher.getAuthTag().toString("base64"), ciphertext.toString("base64")].join(".");
}
export function decryptCredential(envelope: string, context: string) {
  const key = masterKey();
  try {
    const [version, nonce, tag, ciphertext, extra] = envelope.split(".");
    if (version !== "v1" || extra !== undefined || !nonce || !tag || ciphertext === undefined) throw Error();
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(nonce, "base64"));
    decipher.setAAD(Buffer.from(context));
    decipher.setAuthTag(Buffer.from(tag, "base64"));
    return Buffer.concat([decipher.update(Buffer.from(ciphertext, "base64")), decipher.final()]).toString("utf8");
  } catch { throw new ProviderError("credential_unreadable", "Saved credential cannot be decrypted. Ask an administrator to replace it.", 503); }
}
