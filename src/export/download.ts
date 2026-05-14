/**
 * Shared download primitives used by all export targets (SVG / PNG / PDF).
 */

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Release the object URL after a short delay so the browser finishes the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load SVG into <img> for rasterization"));
    img.src = src;
  });
}
