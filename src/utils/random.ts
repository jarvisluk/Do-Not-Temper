/** Produces an upper-case hex string of the requested length. */
export function randomHex(len: number): string {
  const bytes = getRandomBytes(len);
  const chars = "0123456789ABCDEF";
  let out = "";
  for (let i = 0; i < len; i++) {
    const index = bytes ? bytes[i] & 0xf : Math.floor(Math.random() * chars.length);
    out += chars[index];
  }
  return out;
}

function getRandomBytes(len: number): Uint8Array | null {
  if (typeof crypto === "undefined" || typeof crypto.getRandomValues !== "function") {
    return null;
  }

  try {
    const bytes = new Uint8Array(len);
    crypto.getRandomValues(bytes);
    return bytes;
  } catch {
    return null;
  }
}
