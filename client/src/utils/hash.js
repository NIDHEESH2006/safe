/**
 * Client-side SHA-256 hashing for the Evidence Locker. Real cryptographic
 * hashing via the browser's native Web Crypto API — every uploaded file is
 * fingerprinted before it ever leaves the device, giving the survivor a
 * tamper-evident receipt (the hash can be independently recomputed later to
 * prove the evidence wasn't altered).
 */
export async function sha256OfFile(file) {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
