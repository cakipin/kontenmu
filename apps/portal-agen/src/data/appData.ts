import { useEffect, useState, useCallback, useMemo } from "react";
import type { UserRole } from "@repo/auth";

export type UserStatus = "Aktif" | "Nonaktif" | "Menunggu" | "Menunggu Approve";
export type PaymentStatus = "Lunas" | "Menunggu" | "Terlambat";
export type BookStatus = "Aktif" | "Draft";
export type ContentCategory = "Teks" | "Infografi" | "Video" | "Games HTML5";
export type SalesPackage =
  "Konten Digital" | "Konten Digital + Buku" | "Buku Cetak";
export type SubscriptionDuration =
  "Trial 1 Bulan" | "3 Bulan" | "6 Bulan" | "1 Tahun";
export type SubscriptionStatus =
  | "Menunggu Approve Agen"
  | "Disetujui Agen"
  | "Menunggu Super Admin"
  | "Disetujui Super Admin"
  | "Aktif"
  | "Kadaluarsa";
export type SchoolStaffRole = "admin" | "guru" | "siswa";

export interface SimUser {
  id: string;
  username: string;
  nama: string;
  role: UserRole;
  wilayah: string;
  status: UserStatus;
  initial: string;
  color: string;
  terakhirLogin: string;
  newUserSource?: "sso" | "manual";
  kelas?: string;
  nis?: string;
  nuptk?: string;
  nip?: string;
  ssoId?: string;
  email?: string;
  password?: string;
  sekolahId?: number;
  sekolah_id?: number;
  requestedRole?: "sekolah" | "agen";
  suratTugas?: string;
  masaAktif?: string;
}

export interface SimSchool {
  id: number;
  nama: string;
  kota: string;
  agen: string;
  npsn: string;
}

export interface SimBook {
  isbn: string;
  judul: string;
  mapel: string;
  jenjang: string;
  peruntukan?: string;
  penerbit: string;
  harga: number;
  status: BookStatus;
}

export interface SimSale {
  id: number;
  schoolId: number;
  isbn: string;
  jumlah: number;
  tanggal: string;
  agen: string;
  invoiceNo?: string;
  paket?: SalesPackage;
  durasiBulan?: number;
  hargaSatuan?: number;
  subtotal?: number;
  diskonPersen?: number;
  diskonNominal?: number;
  komisiPersen?: number;
  komisiNominal?: number;
  totalInvoice?: number;
}

export interface SimSubscription {
  id: string;
  invoiceNo: string;
  schoolId: number;
  paket: SalesPackage;
  durasi: SubscriptionDuration;
  mulai: string;
  selesai: string;
  nominal: number;
  diskonPersen: number;
  diskonNominal: number;
  komisiPersen: number;
  komisiNominal: number;
  status: SubscriptionStatus;
  requestAt: string;
  agentDeadline: string;
  approverRole?: "agen" | "superadmin";
  approverName?: string;
  agentApprovedAt?: string;
  superAdminApprovedAt?: string;
  note?: string;
}

export interface SimSchoolUser {
  id: string;
  schoolId: number;
  username: string;
  nama: string;
  role: SchoolStaffRole;
  mapel: string;
  status: "Aktif" | "Nonaktif";
  initial: string;
  color: string;
  terakhirLogin: string;
  password?: string;
  ssoEnabled?: boolean;
  ssoApproved?: boolean;
}

export interface SimSchoolAccess {
  id: string;
  schoolId: number;
  staffUsername: string;
  staffRole: SchoolStaffRole;
  accessType: "Mapel" | "Konten";
  mapel: string;
  contentId?: string;
  grantedBy: string;
  grantedAt: string;
}

export interface SimPayment {
  id: string;
  schoolId: number;
  nominal: number;
  jatuhTempo: string;
  status: PaymentStatus;
  invoiceNo?: string;
}

export interface SimAllocation {
  id: string;
  studentUsername: string;
  isbn: string;
  schoolId: number;
  tanggal: string;
}

export interface SimLearning {
  studentUsername: string;
  isbn: string;
  progress: number;
  durasiJam: number;
  terakhirDibaca: string;
}

// Helper to map DB row back to SimContent format if needed
export const mapContentRow = (row: any): SimContent => ({
  id: row.id,
  kategori: row.kategori,
  judul: row.judul,
  mapel: row.mapel,
  target: row.target,
  fileName: row.fileName,
  deskripsi: row.deskripsi,
  status: row.status,
  thumbnailUrl: row.thumbnailUrl,
  sourceUrl: row.sourceUrl,
  isbn: row.isbn,
  tanggal: row.tanggal,
  previewMode: row.previewMode,
  thumbnailKey: row.thumbnailKey,
  protectedPreview: row.protectedPreview,
});

export interface SimContent {
  id: string;
  judul: string;
  isbn?: string;
  kategori: ContentCategory;
  mapel: string;
  target: string;
  fileName: string;
  deskripsi?: string;
  thumbnailUrl?: string;
  status: "Draft" | "Siap Review" | "Terbit";
  tanggal: string;
  previewMode: "text" | "infografis" | "video" | "game";
  thumbnailKey: "text" | "infografis" | "video" | "game";
  protectedPreview?: boolean;
  sourceUrl?: string;
}

export interface DeployConfig {
  githubToken: string;
  repoOwner: string;
  repoName: string;
}

export interface AppData {
  users: SimUser[];
  schools: SimSchool[];
  schoolUsers: SimSchoolUser[];
  schoolAccess: SimSchoolAccess[];
  books: SimBook[];
  sales: SimSale[];
  payments: SimPayment[];
  allocations: SimAllocation[];
  learning: SimLearning[];
  contents: SimContent[];
  subscriptions: SimSubscription[];
  isChatWidgetEnabled: boolean;
  aiApiEndpoint: string;
  aiBotName: string;
  aiWelcomeMessage: string;
  aiProvider: "schmu" | "gemini" | "openai" | "custom";
  aiApiKey: string;
  aiSystemPrompt: string;
  lastSync?: string;
  aiAutoContext: string;
  aiIndexedChunks: number;
  roleAccessPermissions: Record<string, string[]>;
  deployConfig?: DeployConfig;
}

const colors = [
  "#6366f1",
  "#4f46e5",
  "#10b981",
  "#f59e0b",
  "#0ea5e9",
  "#ec4899",
  "#8b5cf6",
  "#14b8a6",
];

const subscriptionMonthMap: Record<SubscriptionDuration, number> = {
  "Trial 1 Bulan": 1,
  "3 Bulan": 3,
  "6 Bulan": 6,
  "1 Tahun": 12,
};

function addMonths(date: string, months: number) {
  const nextDate = new Date(date);
  nextDate.setMonth(nextDate.getMonth() + months);
  return nextDate.toISOString().slice(0, 10);
}

export function subscriptionDurationMonths(duration: SubscriptionDuration) {
  return subscriptionMonthMap[duration];
}

export function subscriptionEndDate(
  startDate: string,
  duration: SubscriptionDuration,
) {
  return addMonths(startDate, subscriptionDurationMonths(duration));
}

export function canSuperAdminApproveSubscription(
  subscription: SimSubscription,
  currentDate = new Date(),
) {
  const deadline = new Date(subscription.agentDeadline);
  return (
    subscription.status === "Menunggu Approve Agen" &&
    currentDate.getTime() >= deadline.getTime()
  );
}

export function getSchoolLevel(schoolName: string): string {
  const name = schoolName.toLowerCase();
  if (
    name.includes("sd") ||
    name.includes("mi") ||
    name.includes("sekolah dasar") ||
    name.includes("madrasah ibtidaiyah")
  ) {
    return "SD/MI";
  }
  if (
    name.includes("smp") ||
    name.includes("mts") ||
    name.includes("madrasah tsanawiyah")
  ) {
    return "SMP/MTs";
  }
  if (
    name.includes("sma") ||
    name.includes("smk") ||
    name.includes("ma ") ||
    name.includes("madrasah aliyah")
  ) {
    return "SMA/MA/SMK";
  }
  return "";
}

export const ROLE_LABELS: Record<UserRole, string> = {
  superadmin: "Super Admin",
  agen: "Agen",
  sekolah: "Sekolah",
  guru: "Guru",
  siswa: "Siswa",
  uploader: "Uploader",
  pending: "Menunggu Persetujuan",
};

export const NAVIGATION: Record<
  UserRole,
  {
    name: string;
    href: string;
    icon?: any;
    subItems?: { name: string; href: string }[];
  }[]
> = {
  superadmin: [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Data Sekolah", href: "/schools" },
    { name: "Data Guru", href: "/teachers" },
    { name: "Data Siswa", href: "/students" },
    { name: "Data Buku", href: "/books" },
    { name: "Data Penjualan", href: "/sales" },
    { name: "Data Konten", href: "/contents" },
    { name: "Pengaturan", href: "/settings" },
  ],
  agen: [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Data Sekolah", href: "/schools" },
    { name: "Penjualan", href: "/sales" },
  ],
  sekolah: [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Profil Sekolah", href: "/school-profile" },
    { name: "Data Guru", href: "/teachers" },
    { name: "Data Siswa", href: "/students" },
    { name: "Laporan", href: "/reports" },
  ],
  guru: [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Profil Sekolah", href: "/school-profile" },
  ],
  siswa: [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Profil Sekolah", href: "/school-profile" },
  ],
  uploader: [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Data Buku", href: "/books" },
    { name: "Data Konten", href: "/contents" },
  ],
  pending: [{ name: "Dashboard", href: "/dashboard" }],
};

export const MOBILE_NAVIGATION: Record<
  UserRole,
  { name: string; href: string; icon?: any }[]
> = {
  superadmin: [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Sekolah", href: "/schools" },
    { name: "Guru", href: "/teachers" },
    { name: "Siswa", href: "/students" },
    { name: "Buku", href: "/books" },
    { name: "Penjualan", href: "/sales" },
    { name: "Konten", href: "/contents" },
  ],
  agen: [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Sekolah", href: "/schools" },
    { name: "Penjualan", href: "/sales" },
  ],
  sekolah: [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Guru", href: "/teachers" },
    { name: "Siswa", href: "/students" },
    { name: "Laporan", href: "/reports" },
  ],
  guru: [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Profil Sekolah", href: "/school-profile" },
  ],
  siswa: [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Profil Sekolah", href: "/school-profile" },
  ],
  uploader: [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Buku", href: "/books" },
    { name: "Konten", href: "/contents" },
  ],
  pending: [{ name: "Dashboard", href: "/dashboard" }],
};

export const seedAppData: AppData = {
  users: [],
  schools: [],
  schoolUsers: [],
  schoolAccess: [],
  books: [],
  sales: [],
  payments: [],
  allocations: [],
  learning: [],
  contents: [],
  subscriptions: [],
  isChatWidgetEnabled: true,
  aiApiEndpoint: "https://schmu.id/api/chat/ask",
  aiBotName: "Asisten KontenMu",
  aiWelcomeMessage:
    "Halo! Ada yang bisa saya bantu? Saya Asisten KontenMu Platform Sekolah Masa Depan.",
  aiProvider: "schmu",
  aiApiKey: "",
  aiSystemPrompt: "",
  aiAutoContext: "",
  aiIndexedChunks: 108,
  roleAccessPermissions: {
    dashboard: ["superadmin", "agen", "sekolah", "siswa", "guru", "uploader"],
    catalog: ["superadmin", "uploader"],
    upload: ["superadmin", "uploader"],
    play: ["superadmin", "uploader"],
    sales: ["superadmin", "agen"],
    "sales-history": ["superadmin", "agen"],
    subscriptions: ["superadmin", "agen"],
    payments: ["superadmin", "agen"],
    "master-sekolah": ["superadmin"],
    "sim-sekolah": ["superadmin", "agen"],
    "ai-settings": ["superadmin"],
    inventory: ["sekolah"],
    allocation: ["sekolah"],
    "teacher-allocation": ["sekolah"],
    "school-users": ["sekolah"],
    profile: ["sekolah"],
    "school-profile": ["sekolah"],
    admin: ["siswa", "guru", "sekolah", "agen"],
    learning: ["siswa", "guru"],
    school: ["superadmin"],
  },
  deployConfig: {
    githubToken: "",
    repoOwner: "",
    repoName: "",
  },
};

function cloneData(data: AppData): AppData {
  return JSON.parse(JSON.stringify(data)) as AppData;
}

function normalizeAppData(data: AppData): AppData {
  const next = cloneData(data);
  next.users ??= [];
  next.schools ??= [];
  next.schoolUsers ??= [];
  next.schoolAccess ??= [];
  next.books ??= [];
  next.sales ??= [];
  next.payments ??= [];
  next.allocations ??= [];
  next.learning ??= [];
  next.contents ??= [];
  next.subscriptions ??= [];
  next.isChatWidgetEnabled ??= true;
  next.aiApiEndpoint ??= "https://schmu.id/api/chat/ask";
  next.aiBotName ??= "Asisten KontenMu";
  next.aiWelcomeMessage ??=
    "Halo! Ada yang bisa saya bantu? Saya Asisten KontenMu Platform Sekolah Masa Depan.";
  next.aiProvider ??= "schmu";
  next.aiApiKey ??= "";
  next.aiSystemPrompt ??= "";
  next.aiAutoContext ??= "";
  next.aiIndexedChunks ??= 108;
  const defaultPermissions = {
    dashboard: ["superadmin", "agen", "sekolah", "siswa", "guru", "uploader"],
    catalog: ["superadmin", "uploader"],
    upload: ["superadmin", "uploader"],
    play: ["superadmin", "uploader"],
    sales: ["superadmin", "agen"],
    "sales-history": ["superadmin", "agen"],
    subscriptions: ["superadmin", "agen"],
    payments: ["superadmin", "agen"],
    "master-sekolah": ["superadmin"],
    "sim-sekolah": ["superadmin", "agen"],
    "ai-settings": ["superadmin"],
    inventory: ["sekolah"],
    allocation: ["sekolah"],
    "teacher-allocation": ["sekolah"],
    "school-users": ["sekolah"],
    profile: ["sekolah"],
    "school-profile": ["sekolah"],
    library: ["siswa", "guru"],
    learning: ["siswa", "guru"],
    school: ["superadmin"],
  };
  next.roleAccessPermissions = {
    ...defaultPermissions,
    ...(next.roleAccessPermissions || {}),
  };
  if (next.roleAccessPermissions["sim-sekolah"]) {
    next.roleAccessPermissions["sim-sekolah"] = next.roleAccessPermissions[
      "sim-sekolah"
    ].filter((r) => r !== "sekolah" && r !== "guru" && r !== "siswa");
  }
  return next;
}

// Cache data terakhir yang berhasil di-fetch dari server
// Digunakan agar saat pindah halaman, data langsung muncul (bukan kosong)
let cachedRemoteData: AppData | null = null;

const LS_CONTENTS_KEY = "kontenmu_contents_cache";

function readContentsFromLocalStorage(): AppData["contents"] | null {
  try {
    const raw = localStorage.getItem(LS_CONTENTS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return null;
  } catch {
    return null;
  }
}

function writeContentsToLocalStorage(contents: AppData["contents"]) {
  try {
    if (contents && contents.length > 0) {
      localStorage.setItem(LS_CONTENTS_KEY, JSON.stringify(contents));
    }
  } catch {
    // ignore
  }
}

export function loadAppData(): AppData {
  if (cachedRemoteData) return cachedRemoteData;
  // Saat refresh: langsung isi contents dari localStorage (0 detik, tanpa network)
  const base = normalizeAppData(seedAppData);
  const lsContents = readContentsFromLocalStorage();
  if (lsContents) {
    base.contents = lsContents;
  }
  return base;
}

let remoteAppPromise: Promise<AppData | null> | null = null;

export function loadRemoteAppData(): Promise<AppData | null> {
  // Deduplikasi: jika sudah ada fetch berjalan, tunggu yang sama (tidak buat fetch baru)
  if (remoteAppPromise) return remoteAppPromise;

  remoteAppPromise = (async () => {
    try {
      // Tahap 1: Fetch data lite (tanpa schools) dari app-data (sekarang sangat cepat karena KV cache)
      const response = await fetch("/api/app-data?lite=true", {
        cache: "no-store",
      });
      if (!response.ok) return null;
      const payload = (await response.json()) as {
        found?: boolean;
        data?: AppData;
      };
      if (!payload.found || !payload.data) return null;
      
      const result = normalizeAppData(payload.data);
      
      // FIX: Jangan hapus contents dan users jika sudah ada di cache!
      if (cachedRemoteData) {
        if (cachedRemoteData.contents.length > 0) {
          result.contents = cachedRemoteData.contents;
        }
        if (cachedRemoteData.users.length > 0) {
          result.users = cachedRemoteData.users;
        }
      }
      
      cachedRemoteData = result;

      // Beritahu UI agar langsung render data lite tanpa menunggu full data
      window.dispatchEvent(
        new CustomEvent("kontenmu-appdata-updated", { detail: result }),
      );

      // Mulai background fetch baru, set state loading menjadi true
      isBackgroundLoading = true;
      window.dispatchEvent(
        new CustomEvent("kontenmu-appdata-bg-updated"),
      );

      // Tahap 2: Fetch full data di background secara mandiri
      Promise.all([
        fetch("/api/app-data", { cache: "no-store" }).then(res => res.json()).catch(() => null),
        fetch("/api/contents?page=1&limit=2000", { cache: "no-store" }).then(res => res.json()).catch(() => null),
        fetch("/api/users?page=1&limit=2000", { cache: "no-store" }).then(res => res.json()).catch(() => null)
      ]).then(([fullPayload, contentsPayload, usersPayload]) => {
        if (fullPayload?.found && fullPayload?.data) {
          const fullResult = normalizeAppData(fullPayload.data);
          
          // Sisipkan hasil dari endpoint mandiri ke dalam state (Decoupled API)
          if (contentsPayload?.success && Array.isArray(contentsPayload.contents)) {
            fullResult.contents = contentsPayload.contents;
            // Simpan ke localStorage agar refresh berikutnya 0 detik
            writeContentsToLocalStorage(fullResult.contents);
          } else if (cachedRemoteData && cachedRemoteData.contents.length > 0) {
            fullResult.contents = cachedRemoteData.contents;
          }

          if (usersPayload?.success && Array.isArray(usersPayload.users)) {
            fullResult.users = usersPayload.users;
          } else if (cachedRemoteData && cachedRemoteData.users.length > 0) {
            fullResult.users = cachedRemoteData.users;
          }
          
          cachedRemoteData = fullResult;
          isBackgroundLoading = false;
          window.dispatchEvent(
            new CustomEvent("kontenmu-appdata-bg-updated"),
          );
          window.dispatchEvent(
            new CustomEvent("kontenmu-appdata-updated", {
              detail: fullResult,
            }),
          );
        } else {
          isBackgroundLoading = false;
          window.dispatchEvent(
            new CustomEvent("kontenmu-appdata-bg-updated"),
          );
        }
      });

      return result;
    } catch {
      return null;
    } finally {
      remoteAppPromise = null;
    }
  })();

  return remoteAppPromise;
}

export async function saveAppData(data: AppData) {
  try {
    const res = await fetch("/api/app-data", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.warn(
        `Sistem gagal menyimpan perubahan data (Error ${res.status}): ${errText}`,
      );
    }
  } catch (err) {
    console.warn("Error saving app data:", err);
  }
}

let isInitialLoad = true;
export let isBackgroundLoading = true;

export function useAppData() {
  const initialData = useMemo(() => loadAppData(), []);
  const [data, setDataState] = useState<AppData>(initialData);
  const hasLocalCache = initialData.contents.length > 0 || initialData.schools.length > 0;
  
  const [isLoading, setIsLoading] = useState(
    isInitialLoad && cachedRemoteData === null && !hasLocalCache,
  );
  const [isBgLoading, setIsBgLoading] = useState(isBackgroundLoading);

  const setData = useCallback(
    (updater: AppData | ((current: AppData) => AppData)): Promise<void> => {
      return new Promise((resolve, reject) => {
        setDataState((current) => {
          const next =
            typeof updater === "function" ? updater(current) : updater;
          if (next === current) {
            resolve();
            return current;
          }

          void (async () => {
            try {
              await saveAppData(next);
              window.dispatchEvent(
                new CustomEvent("kontenmu-appdata-updated", { detail: next }),
              );
              resolve();
            } catch (err: any) {
              setDataState(current);
              reject(err);
            }
          })();

          return next;
        });
      });
    },
    [],
  );

  useEffect(() => {
    let active = true;
    const sync = async (event?: Event) => {
      // Jika event dipicu oleh setData lokal, langsung gunakan payloadnya
      if (event instanceof CustomEvent && event.detail) {
        if (active) {
          cachedRemoteData = event.detail;
          setDataState(event.detail);
        }
        return;
      }

      // Jika dipicu secara manual tanpa detail, fetch dari server
      // Hanya tampilkan loading spinner jika belum ada cache sama sekali
      if (cachedRemoteData === null && !hasLocalCache) setIsLoading(true);
      const remote = await loadRemoteAppData();
      isInitialLoad = false;
      if (active) {
        if (remote) setDataState(remote);
        setIsLoading(false);
      }
    };

    const bgSync = () => {
      if (active) setIsBgLoading(isBackgroundLoading);
    };

    void sync();
    window.addEventListener("kontenmu-appdata-updated", sync);
    window.addEventListener("kontenmu-appdata-bg-updated", bgSync);
    return () => {
      active = false;
      window.removeEventListener("kontenmu-appdata-updated", sync);
      window.removeEventListener("kontenmu-appdata-bg-updated", bgSync);
    };
  }, [hasLocalCache]);

  return { data, setData, isLoading, isBgLoading };
}

export function resetAppData() {
  void saveAppData(normalizeAppData(seedAppData));
  window.dispatchEvent(new Event("kontenmu-appdata-updated"));
}

export function formatCurrency(value: number) {
  if (value >= 1_000_000_000)
    return `Rp ${(value / 1_000_000_000).toFixed(1)} M`;
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)} jt`;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function saleSubtotal(sale: SimSale, book?: SimBook) {
  return sale.subtotal ?? sale.jumlah * (sale.hargaSatuan ?? book?.harga ?? 0);
}

export function saleDiscount(sale: SimSale, book?: SimBook) {
  const subtotal = saleSubtotal(sale, book);
  return sale.diskonNominal ?? subtotal * ((sale.diskonPersen ?? 0) / 100);
}

export function saleCommission(sale: SimSale, book?: SimBook) {
  const subtotalAfterDiscount =
    saleSubtotal(sale, book) - saleDiscount(sale, book);
  return (
    sale.komisiNominal ??
    subtotalAfterDiscount * ((sale.komisiPersen ?? 0) / 100)
  );
}

export function saleInvoiceTotal(sale: SimSale, book?: SimBook) {
  return (
    sale.totalInvoice ??
    Math.max(saleSubtotal(sale, book) - saleDiscount(sale, book), 0)
  );
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

export function makeInitial(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function nextId(prefix: string, count: number) {
  return `${prefix}-${String(count + 1).padStart(4, "0")}`;
}

export function colorForIndex(index: number) {
  return colors[index % colors.length];
}

export function getSchool(data: AppData, schoolId: number) {
  return data.schools.find((school) => school.id === schoolId);
}

export function getBook(data: AppData, isbn: string) {
  return data.books.find((book) => book.isbn === isbn);
}

export function soldLicenses(data: AppData, schoolId: number, isbn?: string) {
  return data.sales
    .filter(
      (sale) => sale.schoolId === schoolId && (!isbn || sale.isbn === isbn),
    )
    .reduce((total, sale) => total + sale.jumlah, 0);
}

export function allocatedLicenses(
  data: AppData,
  schoolId: number,
  isbn?: string,
) {
  return data.allocations.filter(
    (item) => item.schoolId === schoolId && (!isbn || item.isbn === isbn),
  ).length;
}

export function inventoryRows(data: AppData, schoolId = 1) {
  return data.books.map((book) => {
    const terjual = soldLicenses(data, schoolId, book.isbn);
    const teralokasi = allocatedLicenses(data, schoolId, book.isbn);
    return {
      book,
      terjual,
      teralokasi,
      tersedia: Math.max(terjual - teralokasi, 0),
    };
  });
}
