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
  requestedRole?: "sekolah" | "agen" | "guru" | "siswa";
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
  kelas?: string;
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
  bab: row.bab ?? undefined,
  target: row.target,
  kelas: row.kelas ?? undefined,
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
  bab?: number;
  target: string;
  kelas?: string;
  fileName: string;
  deskripsi?: string;
  thumbnailUrl?: string;
  status: "Draft" | "Siap Review" | "Terbit";
  tanggal: string;
  previewMode: "text" | "infografis" | "video" | "game";
  thumbnailKey: "text" | "infografis" | "video" | "game";
  protectedPreview?: boolean;
  sourceUrl?: string;
  dilihat?: number;
  totalWatchTime?: number;
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

const ROMAN_CLASS_NUMBERS: Record<string, number> = {
  I: 1,
  II: 2,
  III: 3,
  IV: 4,
  V: 5,
  VI: 6,
  VII: 7,
  VIII: 8,
  IX: 9,
  X: 10,
  XI: 11,
  XII: 12,
};

/** Menyamakan format kelas lama ("7") dan format label ("SMP Kelas VII"). */
export function getClassNumber(value: unknown): number | null {
  const label = String(value ?? "").trim().toUpperCase();
  if (!label) return null;

  const numeric = label.match(/(?:^|\D)(1[0-2]|[1-9])(?:\D|$)/);
  if (numeric) return Number(numeric[1]);

  const roman = label.match(/\b(XII|XI|IX|VIII|VII|VI|IV|III|II|I|X|V)\b/);
  return roman ? ROMAN_CLASS_NUMBERS[roman[1]] ?? null : null;
}

/** Data tanpa kelas tetap diterima agar katalog lama yang stabil tidak terputus. */
export function matchesClass(userClass: unknown, bookClass: unknown): boolean {
  const normalizedUserClass = getClassNumber(userClass);
  const normalizedBookClass = getClassNumber(bookClass);
  return (
    normalizedUserClass === null ||
    normalizedBookClass === null ||
    normalizedUserClass === normalizedBookClass
  );
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
    { name: "Dashboard", href: "/dashboard", icon: "dashboard" },
    { name: "Analitik", href: "/analytics", icon: "analytics" },
    { name: "Data Sekolah", href: "/schools", icon: "school" },
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
    { name: "Dashboard", href: "/dashboard", icon: "dashboard" },
    { name: "Profil Sekolah", href: "/school-profile", icon: "school" },
    { name: "Analitik", href: "/analytics", icon: "analytics" },
    { name: "Data Guru", href: "/teachers", icon: "users" },
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
    { name: "Analitik", href: "/analytics" },
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
    { name: "Analitik", href: "/analytics" },
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
    analytics: ["superadmin", "sekolah"],
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
    "school-profile": ["sekolah", "guru", "siswa"],
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
  // Guard: jika learning berisi string (misalnya terisi roleAccessPermissions yang corrupt), reset ke []
  if (Array.isArray(next.learning) && next.learning.length > 0 && typeof next.learning[0] !== "object") {
    next.learning = [];
  }
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
    analytics: ["superadmin", "sekolah"],
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
    "school-profile": ["sekolah", "guru", "siswa"],
    library: ["siswa", "guru"],   // BUG #9: now a dedicated key, separate from "learning"
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
  // Force patch for school-profile
  if (next.roleAccessPermissions["school-profile"]) {
    if (!next.roleAccessPermissions["school-profile"].includes("guru")) {
      next.roleAccessPermissions["school-profile"].push("guru");
    }
    if (!next.roleAccessPermissions["school-profile"].includes("siswa")) {
      next.roleAccessPermissions["school-profile"].push("siswa");
    }
  }
  return next;
}

// Cache data terakhir yang berhasil di-fetch dari server
// Digunakan agar saat pindah halaman, data langsung muncul (bukan kosong)
let cachedRemoteData: AppData | null = null;

export function loadAppData(): AppData {
  // Selalu mulai dari seed netral. Data tenant/distribusi hanya berasal dari API.
  return normalizeAppData(seedAppData);
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
        fetch("/api/users?page=1&limit=2000", { cache: "no-store" }).then(res => res.json()).catch(() => null),
        fetch("/api/allocations", { cache: "no-store" }).then(res => res.json()).catch(() => null)
      ]).then(([fullPayload, contentsPayload, usersPayload, allocationsPayload]) => {
        const baseData = (fullPayload?.found && fullPayload?.data) ? fullPayload.data : initialData;
        if (baseData) {
          const fullResult = normalizeAppData(baseData);
          const fullResult = normalizeAppData(fullPayload.data);
          
          if (allocationsPayload?.success && Array.isArray(allocationsPayload.data)) {
             fullResult.allocations = allocationsPayload.data;
          }
          
          // Sisipkan hasil dari endpoint mandiri ke dalam state (Decoupled API)
          if (contentsPayload?.success && Array.isArray(contentsPayload.contents)) {
            fullResult.contents = contentsPayload.contents;
          }

          const apiUsers = Array.isArray(usersPayload?.data)
            ? usersPayload.data
            : Array.isArray(usersPayload?.users)
              ? usersPayload.users
              : null;
          if (usersPayload?.success && apiUsers) {
            fullResult.users = apiUsers;
          }
          console.log("Full data fetched successfully", {
            contentsLength: fullResult.contents.length,
            usersLength: fullResult.users.length
          });
          
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
          console.error("Full payload missing found or data property!", fullPayload);
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
  const res = await fetch("/api/app-data", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(
      `Sistem gagal menyimpan perubahan data (Error ${res.status}): ${errText}`,
    );
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
        console.log("kontenmu-appdata-updated received", {
          contentsLength: event.detail.contents?.length,
          active
        });
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
