import { compress } from "image-conversion"

export async function compressImage(file: File, maxSizeMB = 0.5): Promise<File> {
  // Check if compression is needed
  const fileSizeMB = file.size / (1024 * 1024)

  if (fileSizeMB <= maxSizeMB) {
    return file
  }

  try {
    // Compress the image
    const compressedBlob = await compress(file, {
      maxWidth: 1920,
      maxHeight: 1440,
      quality: 0.7, // 70% quality to balance size and appearance
      type: "image/jpeg",
    })

    return new File([compressedBlob], file.name, { type: "image/jpeg" })
  } catch (error) {
    console.error("[v0] Image compression error:", error)
    // Return original file if compression fails
    return file
  }
}
