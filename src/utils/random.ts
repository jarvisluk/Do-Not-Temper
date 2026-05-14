/** Produces an upper-case hex string of the requested length. */
export function randomHex(len: number): string {
  const chars = "0123456789ABCDEF";
  let out = "";
  for (let i = 0; i < len; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}
