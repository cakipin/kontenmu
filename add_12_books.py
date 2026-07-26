import urllib.request
import json
import ssl

ssl._create_default_https_context = ssl._create_unverified_context

base64_image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="

for kelas in range(1, 13):
    if kelas <= 6:
        peruntukan = "SD/MI"
    elif kelas <= 9:
        peruntukan = "SMP/MTS"
    else:
        peruntukan = "SMA/MA"

    payload = {
        "isbn": f"978-623-200{kelas}",
        "judul": f"Buku Pelajaran Kelas {kelas}",
        "peruntukan": peruntukan,
        "kelas": str(kelas),
        "terbit": "2024",
        "cover_url": base64_image
    }
    
    req = urllib.request.Request(
        "https://sales-api.1912.workers.dev/api/books",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            print(f"Added Kelas {kelas}: {res_body}")
    except Exception as e:
        print(f"Failed to add Kelas {kelas}: {e}")
