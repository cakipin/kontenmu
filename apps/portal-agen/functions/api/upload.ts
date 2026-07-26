const jsonHeaders = { 'Content-Type': 'application/json' };

// --- Whitelist MIME types yang diperbolehkan ---
const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
]);

const ALLOWED_CONTENT_TYPES = new Set([
  // Images
  ...ALLOWED_IMAGE_TYPES,
  // Video
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
  'video/x-matroska',
  'video/x-msvideo',
  'video/x-m4v',
  // Document
  'application/pdf',
  // HTML5 game archives
  'application/zip',
  'application/x-zip-compressed',
]);

// Ekstensi yang sesuai dengan MIME type yang diperbolehkan
const EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/ogg': 'ogv',
  'video/quicktime': 'mov',
  'video/x-matroska': 'mkv',
  'video/x-msvideo': 'avi',
  'video/x-m4v': 'm4v',
  'application/pdf': 'pdf',
  'application/zip': 'zip',
  'application/x-zip-compressed': 'zip',
};

/** Batas ukuran: gambar maks 5 MB, konten lain maks 200 MB */
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;   // 5 MB
const MAX_CONTENT_BYTES = 200 * 1024 * 1024; // 200 MB

/** Generate nama file aman menggunakan crypto random */
function safeFilename(mimeType: string): string {
  const ext = EXTENSION_MAP[mimeType] ?? 'bin';
  const random = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `${Date.now()}-${random}.${ext}`;
}

export const onRequestPost = async (context: any) => {
  const { MEDIA } = context.env;

  // Pastikan R2 bucket terkonfigurasi
  if (!MEDIA) {
    return new Response(
      JSON.stringify({ error: 'Penyimpanan media belum dikonfigurasi.' }),
      { status: 500, headers: jsonHeaders },
    );
  }

  try {
    const formData = await context.request.formData();
    const file = formData.get('file') as File | null;

    if (!file || typeof file === 'string') {
      return new Response(
        JSON.stringify({ error: 'Tidak ada file yang dikirim.' }),
        { status: 400, headers: jsonHeaders },
      );
    }

    // --- Validasi MIME type ---
    const mimeType = file.type || '';
    if (!ALLOWED_CONTENT_TYPES.has(mimeType)) {
      return new Response(
        JSON.stringify({
          error: `Tipe file tidak diperbolehkan: "${mimeType || '(tidak diketahui)'}". Gunakan: gambar (JPEG/PNG/WebP/GIF/SVG), video (MP4/WebM), PDF, atau ZIP.`,
        }),
        { status: 415, headers: jsonHeaders },
      );
    }

    // --- Validasi ukuran file ---
    const maxBytes = ALLOWED_IMAGE_TYPES.has(mimeType)
      ? MAX_IMAGE_BYTES
      : MAX_CONTENT_BYTES;

    if (file.size > maxBytes) {
      const limitMB = Math.round(maxBytes / 1024 / 1024);
      return new Response(
        JSON.stringify({
          error: `Ukuran file melebihi batas ${limitMB} MB. Ukuran file Anda: ${(file.size / 1024 / 1024).toFixed(1)} MB.`,
        }),
        { status: 413, headers: jsonHeaders },
      );
    }

    // --- Simpan ke R2 dengan nama aman ---
    const filename = safeFilename(mimeType);
    await MEDIA.put(filename, await file.arrayBuffer(), {
      httpMetadata: { contentType: mimeType },
      customMetadata: {
        originalName: file.name.slice(0, 200), // simpan nama asli di metadata
        uploadedAt: new Date().toISOString(),
      },
    });

    return new Response(
      JSON.stringify({ url: `/api/media/${filename}`, filename }),
      {
        headers: {
          ...jsonHeaders,
          'Access-Control-Allow-Origin': '*',
        },
      },
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: `Upload gagal: ${error.message}` }),
      {
        status: 500,
        headers: { ...jsonHeaders, 'Access-Control-Allow-Origin': '*' },
      },
    );
  }
};

export const onRequestOptions = () =>
  new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
