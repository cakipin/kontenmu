const payload = {
  users: [],
  contents: [
    {
      id: "CNT_TEST1",
      judul: "Test",
      kategori: "Video",
      mapel: "Umum",
      target: "Semua jenjang",
      fileName: "video-belajar-matematika",
      status: "Siap Review",
      tanggal: "2026-07-20",
      previewMode: "video",
      protectedPreview: true,
      sourceUrl: "/api/media/123456-abcdef.mp4"
    }
  ]
};

fetch("https://kontenmu.labmu.dev/api/app-data", {
  method: "PUT",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify(payload)
}).then(async r => {
  console.log("Status:", r.status);
  console.log("Body:", await r.text());
});
