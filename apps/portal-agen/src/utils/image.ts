export async function compressImageToWebp(file: File, quality = 0.8): Promise<File> {
  // Pastikan file adalah gambar
  if (!file.type.startsWith("image/")) {
    return file;
  }
  
  // Jika SVG, tidak usah diconvert
  if (file.type === "image/svg+xml") {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return resolve(file);
      }
      
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            return resolve(file);
          }
          const newName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
          const webpFile = new File([blob], newName, {
            type: "image/webp",
            lastModified: Date.now(),
          });
          resolve(webpFile);
        },
        "image/webp",
        quality
      );
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file); // fallback ke file asli jika gagal
    };
    
    img.src = url;
  });
}
