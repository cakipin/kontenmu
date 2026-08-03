// Upload langsung via R2 binding - tidak perlu AWS/S3 credentials
// MEDIA binding sudah dikonfigurasi di wrangler.toml

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
  'text/html': 'html',
  'application/xhtml+xml': 'html',
};

function safeFilename(mimeType: string): string {
  const ext = EXTENSION_MAP[mimeType] ?? 'bin';
  const random = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `${Date.now()}-${random}.${ext}`;
}

export const onRequestPost = async (context: any) => {
  const { MEDIA } = context.env;

  if (!MEDIA) {
    return new Response(
      JSON.stringify({ error: 'R2 MEDIA binding tidak ditemukan. Periksa konfigurasi wrangler.toml.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const contentType = context.request.headers.get('Content-Type') || 'application/octet-stream';
    
    // Jika multipart/form-data, ambil file dari form
    let fileBody: ReadableStream | ArrayBuffer;
    let fileMimeType = contentType;
    
    if (contentType.startsWith('multipart/form-data')) {
      const formData = await context.request.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return new Response(
          JSON.stringify({ error: 'Field "file" tidak ditemukan dalam form data.' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      fileMimeType = file.type || 'application/octet-stream';
      fileBody = await file.arrayBuffer();
    } else {
      // Jika bukan multipart, cek apakah JSON (request presign lama)
      const body = await context.request.json().catch(() => null);
      if (body && body.contentType) {
        // Mode presign lama: kembalikan URL upload sementara
        // Gunakan workaround: generate nama file dan minta client upload lewat endpoint baru
        const filename = safeFilename(body.contentType);
        return new Response(
          JSON.stringify({
            // uploadUrl: endpoint upload baru yang menerima file langsung
            url: `/api/upload/file?key=${filename}&type=${encodeURIComponent(body.contentType)}`,
            filename,
            mediaPath: `/api/media/${filename}`,
            method: 'POST',
            useFormData: true,
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }
      return new Response(
        JSON.stringify({ error: 'Format request tidak didukung.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const filename = safeFilename(fileMimeType);
    await MEDIA.put(filename, fileBody, {
      httpMetadata: { contentType: fileMimeType },
    });

    return new Response(
      JSON.stringify({
        filename,
        mediaPath: `/api/media/${filename}`,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: `Gagal upload: ${error.message}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
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
