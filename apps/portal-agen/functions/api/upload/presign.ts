import { AwsClient } from "aws4fetch";

// Ekstensi yang sesuai dengan MIME type yang diperbolehkan
const EXTENSION_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "application/pdf": "pdf",
  "application/zip": "zip",
  "application/x-zip-compressed": "zip",
  "text/html": "html",
  "application/xhtml+xml": "html",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

// MIME type video yang TIDAK didukung browser — ditolak
const REJECTED_VIDEO_TYPES = new Set([
  "video/ogg",
  "video/quicktime",
  "video/x-matroska",
  "video/x-msvideo",
  "video/x-m4v",
]);

function safeFilename(mimeType: string): string {
  const ext = EXTENSION_MAP[mimeType] ?? "bin";
  const random = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${Date.now()}-${random}.${ext}`;
}

export const onRequestPost = async (context: any) => {
  const { R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ACCOUNT_ID } = context.env;

  // Karena ini direct upload, nama bucket harus sesuai dengan yang dibuat di Cloudflare
  const BUCKET_NAME = "kontenmu-media";

  if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ACCOUNT_ID) {
    return new Response(
      JSON.stringify({
        error:
          "R2 S3 credentials belum dikonfigurasi di environment variables.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const data = await context.request.json();
    const { contentType, fileName } = data;

    if (!contentType) {
      return new Response(
        JSON.stringify({ error: "contentType harus disertakan." }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Tolak format video yang tidak didukung browser
    if (REJECTED_VIDEO_TYPES.has(contentType)) {
      return new Response(
        JSON.stringify({
          error: `Format video "${contentType}" tidak didukung. Gunakan MP4 (video/mp4) atau WebM (video/webm) agar video dapat diputar di semua browser.`,
        }),
        { status: 415, headers: { "Content-Type": "application/json" } },
      );
    }

    const s3Url = new URL(
      `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${BUCKET_NAME}`,
    );

    const client = new AwsClient({
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
      service: "s3",
      region: "auto",
    });

    const generatedFilename = safeFilename(contentType);
    const objectUrl = new URL(`${s3Url.href}/${generatedFilename}`);

    // Presign a PUT request (must expire relatively quickly for security)
    const presignedRequest = await client.sign(objectUrl, {
      method: "PUT",
      aws: { signQuery: true },
      headers: {
        "Content-Type": contentType,
      },
    });

    return new Response(
      JSON.stringify({
        url: presignedRequest.url,
        filename: generatedFilename,
        mediaPath: `/api/media/${generatedFilename}`, // ini URL yang akan disimpan ke database
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        error: `Gagal generate presigned URL: ${error.message}`,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

export const onRequestOptions = () =>
  new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
