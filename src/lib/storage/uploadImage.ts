import { createClient } from "../supabase/client";

const ALLOWED_BUCKETS = new Set(["team-logos", "player-photos"]);

/**
 * Uploads a file to a specific Supabase storage bucket
 * @param file The File object from an HTML input
 * @param bucket "team-logos" or "player-photos"
 * @returns The public URL of the uploaded image
 */
export async function uploadImage(file: File, bucket: "team-logos" | "player-photos") {
  if (!ALLOWED_BUCKETS.has(bucket)) {
    throw new Error("Invalid upload bucket.");
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }

  const supabase = createClient();
  const fileExt = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = fileName;
  const fileBody = new Blob([await file.arrayBuffer()], { type: file.type });

  // 1. Upload file to Supabase Storage bucket
  const { data, error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, fileBody, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  // 2. Get the public URL for the uploaded asset
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return publicUrl;
}
