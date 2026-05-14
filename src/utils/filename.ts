/**
 * Builds a download filename like `do-not-tamper-<slug>.<ext>`.
 *
 * The slug is derived from the sticker title: lowercased, non-alphanumerics
 * collapsed to single dashes, leading/trailing dashes stripped. Falls back to
 * `"sticker"` when the title yields an empty slug (e.g. all Chinese / emoji).
 */
export function buildFilename(title: string, ext: string): string {
  const slug =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "sticker";
  return `do-not-tamper-${slug}.${ext}`;
}
