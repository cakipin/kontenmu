export interface Sekolah {
  id: number;
  nama_sekolah: string;
  alamat: string | null;
}

export interface Buku {
  isbn: string;
  judul: string;
  penulis: string | null;
  penerbit: string | null;
}

export interface Penjualan {
  id: number;
  sekolah_id: number;
  nama_sekolah: string;
  isbn: string;
  judul: string;
  jumlah_lisensi: number;
  tanggal_transaksi: string;
}

export interface InventoryItem {
  isbn: string;
  judul: string;
  total_lisensi: number;
  teralokasi: number;
}

export interface Alokasi {
  id: number;
  siswa_id: string;
  isbn: string;
  judul: string;
  tanggal_alokasi: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  remaining?: number;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const body = (await res.json()) as ApiResponse<T>;

  if (!res.ok || !body.success) {
    throw new Error(body.error || `Request gagal (${res.status})`);
  }

  return body.data as T;
}

export const api = {
  getSekolah: () => request<Sekolah[]>("/api/sekolah"),
  getBuku: () => request<Buku[]>("/api/buku"),
  getSales: () => request<Penjualan[]>("/api/sales"),
  createBulkSales: async (
    rows: { sekolahId: number; isbn: string; jumlah: number }[],
  ) => {
    const res = await fetch("/api/sales/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rows),
    });
    const body = (await res.json()) as ApiResponse<unknown>;
    if (!res.ok || !body.success) {
      throw new Error(body.error || `Request gagal (${res.status})`);
    }
  },
  getInventory: (sekolahId: number) =>
    request<InventoryItem[]>(`/api/inventory?sekolahId=${sekolahId}`),
  getAllocations: (sekolahId: number) =>
    request<Alokasi[]>(`/api/allocations?sekolahId=${sekolahId}`),
  allocate: (payload: { sekolahId: number; isbn: string; siswaId: string }) =>
    fetch("/api/allocate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(async (res) => {
      const body = (await res.json()) as ApiResponse<unknown>;
      if (!res.ok || !body.success) {
        throw new Error(body.error || `Alokasi gagal (${res.status})`);
      }
      return body;
    }),
};
