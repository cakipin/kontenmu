import { Link } from "react-router-dom";
import { useMemo, useState, useEffect, useRef } from "react";
import { useAuth } from "@repo/auth";
import { GlassCard } from "../../../../packages/ui/src/GlassCard";
import { Chip } from "../../../../packages/ui/src/Chip";
import {
  Package,
  Banknote,
  Building2,
  ShoppingCart,
  CreditCard,
  Users,
  BookOpen,
  TrendingUp,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Settings,
  Maximize,
  Minimize,
  PlayCircle,
} from "lucide-react";
import { SchoolSearchInput } from "../components/SchoolSearchInput";
import {
  allocatedLicenses,
  formatCurrency,
  formatNumber,
  getBook,
  getSchool,
  inventoryRows,
  saleInvoiceTotal,
  useAppData,
  type SalesPackage,
  type SubscriptionDuration,
  type SimSubscription,
  type SimSale,
  subscriptionEndDate,
  subscriptionDurationMonths,
  matchesClass,
} from "../data/appData";

export default function Dashboard({ currentRole }: { currentRole: string }) {
  const { session, setCustomSession } = useAuth();
  const { data, setData, isLoading } = useAppData();

  const [users, setUsers] = useState<any[]>([]);
  const currentUser = users.find((u) => u.username === session?.username);
  const sessionRefreshStarted = useRef(false);
  const currentStudentClass =
    currentUser?.kelas ||
    (data.users || []).find((u: any) => u.username === session?.username)
      ?.kelas ||
    (session as any)?.kelas ||
    "";
  const [suratTugas, setSuratTugas] = useState("");

  // Add Subscription State
  const [isAddSubscriptionModalOpen, setIsAddSubscriptionModalOpen] =
    useState(false);
  const [newSubSchoolId, setNewSubSchoolId] = useState<number | "">("");
  const [newSubSchoolName, setNewSubSchoolName] = useState("");
  const [newSubPaket, setNewSubPaket] = useState<SalesPackage>(
    "Konten Digital + Buku",
  );
  const [newSubDurasi, setNewSubDurasi] =
    useState<SubscriptionDuration>("3 Bulan");
  const [newSubNominal, setNewSubNominal] = useState<number>(1500000);
  const [newSubLisensi, setNewSubLisensi] = useState<number>(0);

  const handleAddSubscriptionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubSchoolId) return alert("Pilih sekolah rekanan Anda");

    const school = data.schools.find((s: any) => s.id === newSubSchoolId);
    if (!school) return alert("Sekolah tidak valid");

    const startDate = new Date().toISOString().slice(0, 10);
    const endDate = subscriptionEndDate(startDate, newSubDurasi);

    const newSub: SimSubscription = {
      id: `SUB-${Math.floor(Math.random() * 100000)}`,
      invoiceNo: `INV-SUB-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${Math.floor(Math.random() * 1000)}`,
      schoolId: newSubSchoolId,
      paket: newSubPaket,
      durasi: newSubDurasi,
      mulai: startDate,
      selesai: endDate,
      nominal: newSubNominal,
      diskonPersen: 0,
      diskonNominal: 0,
      komisiPersen: 10,
      komisiNominal: newSubNominal * 0.1,
      status: "Menunggu Approve Agen",
      requestAt: startDate,
      agentDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10), // 3 days deadline
    };

    const studentsCount =
      users.filter((u) => u.role === "siswa" && u.sekolahId === newSubSchoolId)
        .length || 1;

    const newSale: SimSale = {
      id: Date.now(),
      schoolId: newSubSchoolId,
      isbn: "ALL",
      jumlah: newSubLisensi || studentsCount,
      tanggal: startDate,
      agen: session?.displayName || "Agen",
      paket: newSubPaket,
      durasiBulan: subscriptionDurationMonths(newSubDurasi),
      hargaSatuan: Math.floor(
        newSubNominal / (newSubLisensi || studentsCount || 1),
      ),
    };

    setData((current: any) => ({
      ...current,
      subscriptions: [...(current.subscriptions || []), newSub],
      sales: [...(current.sales || []), newSale],
    }));

    setIsAddSubscriptionModalOpen(false);
    setNewSubSchoolId("");
    setNewSubPaket("Konten Digital + Buku");
    setNewSubDurasi("3 Bulan");
    setNewSubNominal(1500000);

    // Switch to payments tab if we want to show it, or just let them see it in Dashboard or /payments.
    // We stay on dashboard so they can see the school is added to their list.
  };
  const [masaAktif, setMasaAktif] = useState("");
  const [dbStats, setDbStats] = useState<any>(null);

  useEffect(() => {
    if (currentRole === "superadmin") {
      const baseUrl = import.meta.env.DEV
        ? ""
        : import.meta.env.VITE_API_URL || "https://sales-api.1912.workers.dev";
      fetch(`${baseUrl}/api/stats`)
        .then((res) => res.json())
        .then((res) => {
          if (res.success) setDbStats(res.data);
        })
        .catch(console.error);
    }
  }, [currentRole]);

  const masterStats = dbStats || {
    totalSekolah: 1500,
    sekolahAktif: 850,
    sekolahMuhammadiyah: 420,
    totalGuru: 12500,
    guruAktif: 8200,
    totalSiswa: 350000,
    siswaAktif: 210000,
  };

  const [selectedRole, setSelectedRole] = useState("sekolah");
  const [sekolahNama, setSekolahNama] = useState("");
  const [sekolahId, setSekolahId] = useState<number | undefined>(undefined);
  const [namaLengkap, setNamaLengkap] = useState(session?.displayName || "");
  const [kelas, setKelas] = useState("");
  const [nisn, setNisn] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWarning, setShowWarning] = useState(true);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      if (dashboardRef.current) {
        await dashboardRef.current.requestFullscreen().catch(console.error);
      }
    } else {
      await document.exitFullscreen().catch(console.error);
    }
  };

  useEffect(() => {
    fetch("/api/users?limit=2000")
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data) setUsers(res.data);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (
      currentRole !== "pending" ||
      !session?.token ||
      !currentUser ||
      currentUser.status !== "Aktif" ||
      !currentUser.role ||
      currentUser.role === "pending" ||
      sessionRefreshStarted.current
    ) {
      return;
    }

    sessionRefreshStarted.current = true;
    const refreshApprovedSession = async () => {
      try {
        const refreshResponse = await fetch("/api/auth/refresh", {
          method: "POST",
          headers: { Authorization: `Bearer ${session.token}` },
          cache: "no-store",
        });
        const result = await refreshResponse.json().catch(() => ({}));
        if (!refreshResponse.ok || !result.success || !result.token || !result.user) {
          throw new Error(result.error || "Gagal memperbarui sesi");
        }

        const sessionResponse = await fetch("/api/auth/session", {
          method: "POST",
          headers: { Authorization: `Bearer ${result.token}` },
        });
        if (!sessionResponse.ok) throw new Error("Gagal menyimpan sesi baru");

        const approvedUser = result.user;
        setCustomSession({
          ...session,
          id: approvedUser.id,
          username: approvedUser.username,
          role: approvedUser.role,
          displayName: approvedUser.nama || approvedUser.username,
          initial:
            approvedUser.initial ||
            (approvedUser.nama || approvedUser.username)
              .substring(0, 2)
              .toUpperCase(),
          sekolahId: approvedUser.sekolah_id
            ? Number(approvedUser.sekolah_id)
            : undefined,
          wilayah: approvedUser.wilayah || undefined,
          picture: approvedUser.picture || undefined,
          kelas: approvedUser.kelas || undefined,
          token: result.token,
        } as any);
      } catch (error) {
        console.error("Failed to refresh approved user session", error);
        sessionRefreshStarted.current = false;
      }
    };

    void refreshApprovedSession();
  }, [currentRole, currentUser, session, setCustomSession]);

  useEffect(() => {
    if (currentRole === "pending") {
      const isPending =
        users.find((u) => u.username === session?.username)?.status !==
        "Menunggu Approve";
      if (isPending) {
        document.body.style.overflow = "hidden";
        return () => {
          document.body.style.overflow = "auto";
        };
      }
    }
    document.body.style.overflow = "auto";
  }, [currentRole, users, session?.username]);

  const getKelasOptions = (schoolName: string) => {
    const name = (schoolName || "").toUpperCase();
    if (
      /\b(SMA|SMK|SLTA|MA|MAK|SMAN|SMKN|MAN|MAS)\b/.test(name) ||
      name.startsWith("SMA") ||
      name.startsWith("SMK")
    ) {
      return ["10", "11", "12"];
    }
    if (
      /\b(SMP|SLTP|MTS|SMPN|MTSN)\b/.test(name) ||
      name.startsWith("SMP") ||
      name.startsWith("MTS")
    ) {
      return ["7", "8", "9"];
    }
    if (
      /\b(SD|MI|SDN|MIN|MIS)\b/.test(name) ||
      name.startsWith("SD") ||
      name.startsWith("MI")
    ) {
      return ["1", "2", "3", "4", "5", "6"];
    }
    return ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
  };

  const handleSubmitRegistration = async (e: any) => {
    e.preventDefault();
    if (!session) return;

    setIsSubmitting(true);
    let userToUpdate = currentUser;

    if (!userToUpdate) {
      userToUpdate = {
        id: `USR-${Date.now().toString().slice(-4)}`,
        username: session.username,
        nama: session.displayName || session.username,
        initial: session.initial || "U",
        role: "pending",
        status: "Aktif",
      } as any;
    }

    if (selectedRole === "sekolah" && !sekolahId) {
      alert("Silakan pilih sekolah dari senarai pencarian.");
      setIsSubmitting(false);
      return;
    }

    if ((selectedRole === "siswa" || selectedRole === "guru") && !sekolahId) {
      alert("Silakan pilih sekolah berlangganan dari daftar.");
      setIsSubmitting(false);
      return;
    }

    const updatedUser = {
      ...userToUpdate,
      role: "pending",
      requestedRole: selectedRole,
      status: "Menunggu Approve",
      nama: namaLengkap || userToUpdate.nama,
      sekolah_id: sekolahId || null,
      wilayah: sekolahNama || "",
      kelas: selectedRole === "siswa" ? kelas : null,
      nis: selectedRole === "siswa" || selectedRole === "guru" ? nisn : null,
      suratTugas: selectedRole === "sekolah" ? suratTugas : null,
      masaAktif: selectedRole === "sekolah" ? masaAktif : null,
    } as any;

    setData((prev) => {
      const exists = prev.users.some((u) => u.username === session.username);
      return {
        ...prev,
        users: exists
          ? prev.users.map((u) =>
              u.username === session.username ? updatedUser : u,
            )
          : [updatedUser, ...prev.users],
      };
    });

    try {
      const response = await fetch(
        `${""}/api/users/${userToUpdate.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedUser),
        },
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Gagal mengirim pendaftaran");
      }

      if (session) {
        setCustomSession({
          ...session,
          role: "pending",
          displayName: namaLengkap || session.displayName,
          sekolahId: sekolahId,
          wilayah: sekolahNama,
        });
      }

      window.location.reload();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Gagal mengirim pendaftaran");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalLicenses = (data.sales || []).reduce(
    (sum, sale) => sum + sale.jumlah,
    0,
  );
  const grossRevenue = (data.sales || []).reduce(
    (sum, sale) => sum + saleInvoiceTotal(sale, getBook(data, sale.isbn)),
    0,
  );
  const activeSchools = (data.schools || []).length;
  const pendingPayments = (data.payments || []).filter(
    (payment) => payment.status !== "Lunas",
  ).length;
  const learningAverage = Math.round(
    (data.learning || []).reduce((sum, row) => sum + row.progress, 0) /
      Math.max((data.learning || []).length, 1),
  );
  const contentStats = {
    total: (data.contents || []).length,
    video: (data.contents || []).filter(
      (content) => content.kategori === "Video",
    ).length,
    infografi: (data.contents || []).filter(
      (content) => content.kategori === "Infografi",
    ).length,
    games: (data.contents || []).filter(
      (content) => content.kategori === "Games HTML5",
    ).length,
  };
  const jenjangStats = {
    sd: (data.contents || []).filter((c) => /SD|MI/i.test(c.target)).length,
    smp: (data.contents || []).filter((c) => /SMP|MTS/i.test(c.target)).length,
    sma: (data.contents || []).filter((c) => /SMA|SMK|MA/i.test(c.target))
      .length,
  };

  const agentRows = (users || [])
    .filter((user) => user.role === "agen")
    .map((agent) => {
      const schoolIds = (data.schools || [])
        .filter((school) => school.agen === agent.nama)
        .map((school) => school.id);
      const revenue = (data.sales || [])
        .filter((sale) => schoolIds.includes(sale.schoolId))
        .reduce(
          (sum, sale) => sum + saleInvoiceTotal(sale, getBook(data, sale.isbn)),
          0,
        );
      return { ...agent, revenue };
    });

  const schoolRows = (data.schools || [])
    .filter((school) => {
      if (currentRole !== "agen") return true;
      const isAgentSchool = school.agen === session?.displayName;
      const hasSubscription = (data.subscriptions || []).some(
        (sub) => sub.schoolId === school.id,
      );
      return isAgentSchool && hasSubscription;
    })
    .map((school) => ({
      ...school,
      lisensi: (data.sales || [])
        .filter((sale) => sale.schoolId === school.id)
        .reduce((sum, sale) => sum + sale.jumlah, 0),
      payment:
        (data.payments || []).find((payment) => payment.schoolId === school.id)
          ?.status ?? "Menunggu",
    }));

  const [agentSchoolSearch, setAgentSchoolSearch] = useState("");
  const [agentSchoolPage, setAgentSchoolPage] = useState(1);
  const agentSchoolPageSize = 10;

  const filteredAgentSchoolRows = useMemo(() => {
    const query = agentSchoolSearch.trim().toLowerCase();
    if (!query) return schoolRows;
    return schoolRows.filter((school) =>
      [
        school.nama,
        school.kota,
        school.npsn?.toString() ?? "",
        school.payment,
      ].some((value) => value.toLowerCase().includes(query)),
    );
  }, [schoolRows, agentSchoolSearch]);

  const agentSchoolTotalPages = Math.max(
    1,
    Math.ceil(filteredAgentSchoolRows.length / agentSchoolPageSize),
  );
  const agentSchoolCurrentPage = Math.min(
    agentSchoolPage,
    agentSchoolTotalPages,
  );
  const visibleAgentSchoolRows = filteredAgentSchoolRows.slice(
    (agentSchoolCurrentPage - 1) * agentSchoolPageSize,
    agentSchoolCurrentPage * agentSchoolPageSize,
  );
  const agentSchoolFirstRow =
    filteredAgentSchoolRows.length === 0
      ? 0
      : (agentSchoolCurrentPage - 1) * agentSchoolPageSize + 1;
  const agentSchoolLastRow = Math.min(
    agentSchoolCurrentPage * agentSchoolPageSize,
    filteredAgentSchoolRows.length,
  );

  const schoolId = session?.sekolahId;
  const currentSchool = schoolId
    ? getSchool(data, schoolId)
    : data.schools?.find(
        (s: any) =>
          s.nama?.toLowerCase() === (session as any)?.wilayah?.toLowerCase(),
      );
  const resolvedSchoolId = schoolId || currentSchool?.id || 1;
  const studentRows = users.filter(
    (user) =>
      user.role === "siswa" &&
      (user.sekolahId === resolvedSchoolId ||
        (currentSchool &&
          user.wilayah?.toLowerCase() === currentSchool.nama?.toLowerCase()) ||
        ((session as any)?.wilayah &&
          user.wilayah?.toLowerCase() ===
            (session as any).wilayah.toLowerCase())),
  );
  const [studentSearch, setStudentSearch] = useState("");
  const [studentPage, setStudentPage] = useState(1);
  const studentPageSize = 50;
  const filteredStudentRows = useMemo(() => {
    const query = studentSearch.trim().toLowerCase();
    if (!query) return studentRows;
    return studentRows.filter((student) =>
      [
        student.nama,
        student.username,
        student.id,
        student.wilayah,
        student.kelas ?? "",
        student.nis ?? "",
        student.status,
      ].some((value) => value.toLowerCase().includes(query)),
    );
  }, [studentRows, studentSearch]);
  const studentTotalPages = Math.max(
    1,
    Math.ceil(filteredStudentRows.length / studentPageSize),
  );
  const studentCurrentPage = Math.min(studentPage, studentTotalPages);
  const visibleStudentRows = filteredStudentRows.slice(
    (studentCurrentPage - 1) * studentPageSize,
    studentCurrentPage * studentPageSize,
  );
  const studentFirstRow =
    filteredStudentRows.length === 0
      ? 0
      : (studentCurrentPage - 1) * studentPageSize + 1;
  const studentLastRow = Math.min(
    studentCurrentPage * studentPageSize,
    filteredStudentRows.length,
  );
  const [distributionBooks, setDistributionBooks] = useState<any[]>([]);

  useEffect(() => {
    if (currentRole !== "guru" && currentRole !== "siswa") return;
    let active = true;

    // --- Logika Caching: Cek apakah ada di cache lokal sebelum fetch ---
    const cacheKey = "kontenmu_books_cache";
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        if (Array.isArray(parsed)) {
          setDistributionBooks(parsed);
          // Kita tetap bisa return lebih awal jika tidak ingin revalidate background (cache-first sederhana)
          return;
        }
      } catch (e) {
        // Abaikan error parse dan lanjut fetch
      }
    }

    fetch(
      `${import.meta.env.VITE_API_URL || "https://sales-api.1912.workers.dev"}/api/books`,
      { cache: "no-store" },
    )
      .then((response) => response.json())
      .then((payload) => {
        if (active && payload?.success && Array.isArray(payload.data)) {
          setDistributionBooks(payload.data);
          // --- Logika Caching: Simpan hasil fetch baru ke cache ---
          localStorage.setItem(cacheKey, JSON.stringify(payload.data));
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [currentRole]);

  const libraryRows =
    currentRole === "guru" || currentRole === "siswa"
      ? (data.allocations || [])
          .filter((a) => a.studentUsername === session?.username)
          .map((a) => {
            const learning = (data.learning || []).find(
              (l) => l.studentUsername === session?.username && l.isbn === a.isbn
            ) || {
              studentUsername: a.studentUsername,
              isbn: a.isbn,
              progress: 0,
            };
            const book =
              distributionBooks.find(
                (b: any) => String(b.isbn) === String(a.isbn),
              ) ||
              (data.books || []).find(
                (b: any) => String(b.isbn) === String(a.isbn),
              ) ||
              getBook(data, a.isbn);
            return {
              learning,
              book,
            };
          })
          .filter(
            (row) =>
              row.book &&
              (currentRole !== "siswa" ||
                (Boolean(currentStudentClass) &&
                  Boolean(row.book.kelas) &&
                  matchesClass(currentStudentClass, row.book.kelas))),
          )
      : (data.learning || [])
          .map((learning) => ({
            learning,
            book: (data.books || []).find((b: any) => b.isbn === learning.isbn) || getBook(data, learning.isbn),
          }))
          .filter((row) => row.book);

  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryPage, setLibraryPage] = useState(1);
  const [libraryMapel, setLibraryMapel] = useState("");
  const libraryPageSize = 10;

  const normalizeLibraryMapel = (value: unknown) =>
    String(value || "")
      .trim()
      .toLocaleLowerCase("id-ID")
      .replace(/[\s._-]+/g, "");

  const libraryAvailableMapels = useMemo(() => {
    const mapels = new Map<string, string>();
    libraryRows.forEach((row) => {
      const label = String(row.book?.mapel || "").trim();
      const key = normalizeLibraryMapel(label);
      if (key && !mapels.has(key)) mapels.set(key, label);
    });
    return Array.from(mapels.values()).sort((a, b) =>
      a.localeCompare(b, "id-ID"),
    );
  }, [libraryRows]);

  const filteredLibraryRows = useMemo(() => {
    let result = libraryRows;
    if (librarySearch) {
      const q = librarySearch.toLowerCase();
      result = result.filter(row => row.book?.judul.toLowerCase().includes(q));
    }
    if (libraryMapel) {
      const selectedMapel = normalizeLibraryMapel(libraryMapel);
      result = result.filter(
        (row) => normalizeLibraryMapel(row.book?.mapel) === selectedMapel,
      );
    }
    return result;
  }, [libraryRows, librarySearch, libraryMapel]);

  const libraryTotalPages = Math.max(1, Math.ceil(filteredLibraryRows.length / libraryPageSize));
  const libraryCurrentPage = Math.min(libraryPage, libraryTotalPages);
  const libraryFirstRow = filteredLibraryRows.length === 0 ? 0 : (libraryCurrentPage - 1) * libraryPageSize + 1;
  const libraryLastRow = Math.min(libraryCurrentPage * libraryPageSize, filteredLibraryRows.length);
  const paginatedLibraryRows = filteredLibraryRows.slice((libraryCurrentPage - 1) * libraryPageSize, libraryCurrentPage * libraryPageSize);

  const getGuruMapel = (mapel: string) => {
    if (!mapel) return "-";
    const currentUser = data.users?.find((u: any) => u.username === session?.username);
    const wilayah = currentUser?.wilayah;
    const guru = data.schoolUsers?.find((u: any) => u.role === 'guru' && u.mapel === mapel && (wilayah ? u.schoolId === currentUser?.sekolahId : true)) 
              || data.users?.find((u: any) => u.role === 'guru' && u.wilayah === wilayah && u.mapel === mapel);
    return guru?.nama || "-";
  };

  if (currentRole === "pending") {
    const isWaitingApproval = currentUser?.status === "Menunggu Approve";
    const waitingForSchoolAdmin =
      currentUser?.requestedRole === "guru" ||
      currentUser?.requestedRole === "siswa";

    if (isWaitingApproval) {
      return (
        <div
          className="page-shell"
          style={{ textAlign: "left", minHeight: "100vh" }}
        >
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              maxWidth: "600px",
              margin: "0 auto",
            }}
          >
            <GlassCard style={{ padding: "40px" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: "var(--bg-secondary)",
                  marginBottom: "24px",
                }}
              >
                <Clock size={40} color="var(--primary)" />
              </div>
              <h2 style={{ fontSize: "1.5rem", marginBottom: "16px" }}>
                Menunggu Persetujuan {waitingForSchoolAdmin ? "Admin Sekolah" : "Admin Dikdasmen"}
              </h2>
              <div
                style={{
                  padding: "16px",
                  background: "rgba(16, 185, 129, 0.1)",
                  color: "var(--success)",
                  borderRadius: "8px",
                  marginBottom: "24px",
                  fontWeight: 500,
                }}
              >
                Data berhasil dikirim. Menunggu persetujuan dari {waitingForSchoolAdmin ? "Admin Sekolah" : "Admin Dikdasmen"}.
              </div>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Pendaftaran Anda sedang diverifikasi. Kami akan memberitahu Anda
                setelah disetujui.
              </p>
            </GlassCard>
          </div>
        </div>
      );
    }
  }

  if (isLoading) {
    return (
      <div
        className="page-shell"
        style={{
          textAlign: "center",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 20px",
        }}
      >
        <div
          style={{
            display: "inline-block",
            width: "32px",
            height: "32px",
            border: "3px solid var(--border-subtle)",
            borderTopColor: "var(--brand-primary)",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            marginBottom: "16px",
          }}
        />
        <div style={{ color: "var(--text-secondary)" }}>
          Memuat data dasbor...
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div
      ref={dashboardRef}
      className="page-shell"
      style={{
        background: isFullscreen ? "#f8fafc" : "transparent",
        padding: isFullscreen ? "32px" : "0",
        overflowY: "auto",
        textAlign: "left",
        minHeight: isFullscreen ? "100vh" : "auto",
      }}
    >
      {currentRole === "superadmin" && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: "16px",
          }}
        >
          <button
            onClick={toggleFullscreen}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "#fff",
              border: "1px solid var(--border-subtle)",
              borderRadius: "8px",
              padding: "8px 16px",
              cursor: "pointer",
              color: "var(--text-primary)",
              fontWeight: 600,
              fontSize: "0.875rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            {isFullscreen ? "Perkecil" : "Layar Penuh"}
          </button>
        </div>
      )}

      {currentRole === "superadmin" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: "16px",
            paddingBottom: "12px",
          }}
        >
          <StatCard
            icon={<Package size={20} />}
            colorStart="#5A95FF"
            colorEnd="#3B66FF"
            shadowColor="rgba(59, 102, 255, 0.2)"
            title="Total Distribusi"
            value={formatNumber(totalLicenses)}
            subtitle="data dari transaksi"
          />
          <StatCard
            icon={<Banknote size={20} />}
            colorStart="#85C87C"
            colorEnd="#5CA058"
            shadowColor="rgba(92, 160, 88, 0.2)"
            title="Pendapatan (Gross)"
            value={formatCurrency(grossRevenue)}
            subtitle="Berdasarkan katalog"
          />
          <StatCard
            icon={<Building2 size={20} />}
            colorStart="#4ADE80"
            colorEnd="#16A34A"
            shadowColor="rgba(22, 163, 74, 0.2)"
            title="Sekolah Aktif"
            value={formatNumber(activeSchools)}
            subtitle="Unit terdaftar"
          />
        </div>
      )}

      {currentRole === "superadmin" && masterStats && (
        <div
          style={{
            background: "#fff",
            margin: "8px 0 24px",
            borderRadius: "24px",
            padding: "24px",
            border: "1px solid var(--border-subtle)",
            boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
          }}
        >
          <h2
            style={{
              fontSize: "1.125rem",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: "4px",
            }}
          >
            Statistik Master Data Sekolah
          </h2>
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--text-secondary)",
              marginBottom: "24px",
            }}
          >
            Data agregasi sekolah dan status aktivasi KontenMu.
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "32px",
              alignItems: "center",
              justifyContent: "space-around",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <SimpleDonut
                total={masterStats.totalSekolah}
                data={[
                  {
                    label: "Sudah Aktif",
                    value: masterStats.sekolahAktif,
                    color: "#10B981",
                  },
                  {
                    label: "Belum Aktif",
                    value: Math.max(
                      0,
                      masterStats.totalSekolah - masterStats.sekolahAktif,
                    ),
                    color: "#EF4444",
                  },
                ]}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                  marginTop: "16px",
                  fontSize: "10px",
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <span
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "2px",
                      background: "#10B981",
                    }}
                  ></span>{" "}
                  Sudah Aktif
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <span
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "2px",
                      background: "#EF4444",
                    }}
                  ></span>{" "}
                  Belum Aktif
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                flex: "1",
                minWidth: "250px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  padding: "16px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "16px",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: "rgba(245, 158, 11, 0.1)",
                    color: "#F59E0B",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Building2 size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                    }}
                  >
                    {formatNumber(masterStats.sekolahMuhammadiyah || 0)}
                  </div>
                  <div
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Sekolah Muhammadiyah
                  </div>
                  <div
                    style={{
                      marginTop: "8px",
                      width: "100%",
                      height: "4px",
                      background: "#EF4444",
                      borderRadius: "2px",
                      overflow: "hidden",
                      display: "flex",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        background: "#10B981",
                        width: `${masterStats.totalSekolah ? ((masterStats.sekolahAktif || 0) / masterStats.totalSekolah) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: "0.65rem",
                      color: "var(--text-secondary)",
                      marginTop: "4px",
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>
                      {formatNumber(masterStats.totalSekolah || 0)} Total
                    </span>
                    <span>
                      {formatNumber(masterStats.sekolahAktif || 0)} Aktif
                    </span>
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  padding: "16px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "16px",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: "rgba(139, 92, 246, 0.1)",
                    color: "#8B5CF6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Users size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                    }}
                  >
                    {formatNumber(masterStats.totalGuru || 0)}
                  </div>
                  <div
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Total Guru (PTK)
                  </div>
                  <div
                    style={{
                      marginTop: "8px",
                      width: "100%",
                      height: "4px",
                      background: "#EF4444",
                      borderRadius: "2px",
                      overflow: "hidden",
                      display: "flex",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        background: "#10B981",
                        width: `${masterStats.totalGuru ? ((masterStats.guruAktif || 0) / masterStats.totalGuru) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: "0.65rem",
                      color: "var(--text-secondary)",
                      marginTop: "4px",
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>
                      {formatNumber(masterStats.totalGuru || 0)} Total
                    </span>
                    <span>
                      {formatNumber(masterStats.guruAktif || 0)} Aktif
                    </span>
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  padding: "16px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "16px",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: "rgba(236, 72, 153, 0.1)",
                    color: "#EC4899",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Users size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                    }}
                  >
                    {formatNumber(masterStats.totalSiswa || 0)}
                  </div>
                  <div
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Total Siswa (PD)
                  </div>
                  <div
                    style={{
                      marginTop: "8px",
                      width: "100%",
                      height: "4px",
                      background: "#EF4444",
                      borderRadius: "2px",
                      overflow: "hidden",
                      display: "flex",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        background: "#10B981",
                        width: `${masterStats.totalSiswa ? ((masterStats.siswaAktif || 0) / masterStats.totalSiswa) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: "0.65rem",
                      color: "var(--text-secondary)",
                      marginTop: "4px",
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>
                      {formatNumber(masterStats.totalSiswa || 0)} Total
                    </span>
                    <span>
                      {formatNumber(masterStats.siswaAktif || 0)} Aktif
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentRole === "superadmin" && (
        <div
          style={{
            background: "#fff",
            margin: "8px 0 24px",
            borderRadius: "24px",
            padding: "24px",
            border: "1px solid var(--border-subtle)",
            boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
          }}
        >
          <h2
            style={{
              fontSize: "1.125rem",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: "4px",
            }}
          >
            Statistik Konten Digital
          </h2>
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--text-secondary)",
              marginBottom: "24px",
            }}
          >
            Pantau jumlah konten digital berdasarkan kategorinya.
          </p>

          <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
            <div
              style={{
                flex: "1",
                minWidth: "250px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <SimpleDonut
                total={contentStats.total}
                data={[
                  {
                    label: "Video",
                    value: contentStats.video,
                    color: "#3B82F6",
                  },
                  {
                    label: "Infografis",
                    value: contentStats.infografi,
                    color: "#10B981",
                  },
                  {
                    label: "Games",
                    value: contentStats.games,
                    color: "#F59E0B",
                  },
                  {
                    label: "Lainnya",
                    value:
                      contentStats.total -
                      contentStats.video -
                      contentStats.infografi -
                      contentStats.games,
                    color: "#8B5CF6",
                  },
                ]}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                  marginTop: "24px",
                  fontSize: "10px",
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <span
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "2px",
                      background: "#3B82F6",
                    }}
                  ></span>{" "}
                  Video
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <span
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "2px",
                      background: "#10B981",
                    }}
                  ></span>{" "}
                  Infografis
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <span
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "2px",
                      background: "#F59E0B",
                    }}
                  ></span>{" "}
                  Games
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <span
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "2px",
                      background: "#8B5CF6",
                    }}
                  ></span>{" "}
                  Lainnya
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                flex: "1",
                minWidth: "250px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  padding: "16px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "16px",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: "rgba(59, 130, 246, 0.1)",
                    color: "#3B82F6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <BookOpen size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                    }}
                  >
                    {formatNumber(jenjangStats.sd)}
                  </div>
                  <div
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Konten SD/MI
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  padding: "16px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "16px",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: "rgba(16, 185, 129, 0.1)",
                    color: "#10B981",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <BookOpen size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                    }}
                  >
                    {formatNumber(jenjangStats.smp)}
                  </div>
                  <div
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Konten SMP/MTS
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  padding: "16px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "16px",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: "rgba(245, 158, 11, 0.1)",
                    color: "#F59E0B",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <BookOpen size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                    }}
                  >
                    {formatNumber(jenjangStats.sma)}
                  </div>
                  <div
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Konten SMA/MA/SMK
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Link
            to="/library"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              background: "#40AEF0",
              color: "white",
              padding: "14px",
              borderRadius: "16px",
              fontWeight: 600,
              textDecoration: "none",
              fontSize: "14px",
              boxShadow: "0 4px 14px rgba(64, 174, 240, 0.4)",
              marginTop: "24px",
            }}
          >
            <Settings size={18} /> Kelola Konten
          </Link>
        </div>
      )}

      {currentRole === "agen" && (
        <div className="dashboard-grid">
          <MetricCard
            icon={<ShoppingCart size={24} />}
            color="#4f46e5"
            title="Lisensi Terjual"
            value={formatNumber(totalLicenses)}
            subtitle="Dari semua transaksi"
          />
          <MetricCard
            icon={<Building2 size={24} />}
            color="#10b981"
            title="Sekolah Tercover"
            value={formatNumber(activeSchools)}
            subtitle="Area aktif"
          />
          <MetricCard
            icon={<CreditCard size={24} />}
            color="#f59e0b"
            title="Tagihan Tertunda"
            value={`${pendingPayments} Sekolah`}
            subtitle="Perlu follow up"
          />
        </div>
      )}

      {currentRole === "sekolah" && (
        <div className="dashboard-grid">
          <MetricCard
            icon={<Users size={24} />}
            color="#4f46e5"
            title="Total Siswa"
            value={formatNumber(studentRows.length)}
            subtitle="Akun siswa terdaftar"
          />
          <MetricCard
            icon={<BookOpen size={24} />}
            color="#10b981"
            title="Lisensi Aktif"
            value={formatNumber(
              inventoryRows(data, 1).reduce((sum, row) => sum + row.terjual, 0),
            )}
            subtitle={`${allocatedLicenses(data, 1)} sudah dialokasi`}
          />
          <MetricCard
            icon={<TrendingUp size={24} />}
            color="#0ea5e9"
            title="Aktivitas Belajar"
            value={`${learningAverage}%`}
            subtitle="Rata-rata progress"
          />
        </div>
      )}

      {currentRole === "siswa" && (
        <div className="player-mobile-stats" style={{ marginBottom: 24 }}>
          <div className="player-stats-total">
            <div>
              <div className="label">Buku Saya</div>
              <div className="value">{libraryRows.length} Buku</div>
              <div className="sub">Akses aktif saat ini</div>
            </div>
            <div className="icon-box">📚</div>
          </div>
          <div className="player-stats-grid">
            <div className="player-stat-item">
              <div className="icon-wrapper video">⏱️</div>
              <h3>
                {formatNumber(
                  (data.learning || []).reduce(
                    (sum, row) => sum + row.durasiJam,
                    0,
                  ),
                )}
              </h3>
              <p>Jam Belajar</p>
            </div>
            <div className="player-stat-item">
              <div className="icon-wrapper games">🏆</div>
              <h3>{learningAverage}%</h3>
              <p>Progress</p>
            </div>
            <div className="player-stat-item">
              <div className="icon-wrapper docs">🎯</div>
              <h3>Aktif</h3>
              <p>Status Akun</p>
            </div>
          </div>
        </div>
      )}

      {currentRole === "guru" && (
        <div className="dashboard-grid">
          <MetricCard
            icon={<BookOpen size={24} />}
            color="#4f46e5"
            title="Buku Saya"
            value={formatNumber(libraryRows.length)}
            subtitle="Buku untuk mengajar"
          />
          <MetricCard
            icon={<Clock size={24} />}
            color="#10b981"
            title="Jam Mengajar"
            value={formatNumber(
              (data.learning || []).reduce(
                (sum, row) => sum + row.durasiJam,
                0,
              ),
            )}
            subtitle="Total jam pakai konten"
          />
          <MetricCard
            icon={<TrendingUp size={24} />}
            color="#f59e0b"
            title="Status"
            value="Aktif"
            subtitle="Guru terdaftar"
          />
        </div>
      )}

      {currentRole === "uploader" && (
        <div className="dashboard-grid">
          <MetricCard
            icon={<BookOpen size={24} />}
            color="#4f46e5"
            title="Katalog Buku"
            value={formatNumber(data.books?.length || 0)}
            subtitle="Koleksi"
          />
          <MetricCard
            icon={<Package size={24} />}
            color="#10b981"
            title="Materi Digital"
            value={formatNumber(data.contents?.length || 0)}
            subtitle="Total konten interaktif"
          />
          <MetricCard
            icon={<Building2 size={24} />}
            color="#0ea5e9"
            title="Sekolah"
            value={formatNumber(data.schools?.length || 0)}
            subtitle="Data sekolah"
          />
        </div>
      )}

      {currentRole !== "superadmin" && (
        <GlassCard
          style={{
            width: "100%",
            padding: currentRole === "sekolah" ? "30px" : "24px",
          }}
        >
          <div
            className={`panel-heading ${currentRole === "sekolah" ? "panel-heading-school" : ""}`}
          >
            <div>
              <h3>
                {currentRole === "superadmin" && "Daftar Agen"}
                {currentRole === "agen" && "Daftar Sekolah Rekanan"}
                {currentRole === "sekolah" && "Daftar Siswa Aktif"}
                {currentRole === "siswa" && "Koleksi Buku Terakhir Dibaca"}
                {currentRole === "guru" && "Buku yang Dialokasikan"}
                {currentRole === "uploader" && "Konten yang Sudah Terupload"}
              </h3>
              <p>
                {currentRole === "superadmin" &&
                  "Daftar agen yang terdaftar di sistem."}
                {currentRole === "agen" &&
                  "Kelola integrasi dan tagihan sekolah dari data demo."}
                {currentRole === "sekolah" &&
                  "Alokasikan lisensi dan pantau progress belajar siswa."}
                {currentRole === "siswa" &&
                  "Lanjutkan membaca buku terakhir Anda."}
                {currentRole === "guru" &&
                  "Buku yang sudah dialokasikan ke akun Anda untuk mengajar."}
                {currentRole === "uploader" &&
                  "Daftar materi digital yang telah Anda unggah."}
              </p>
            </div>
            {currentRole !== "superadmin" && (
              <div style={{ display: "flex", gap: "8px" }}>
                {currentRole === "uploader" && (
                  <Link
                    to="/upload-content"
                    className="btn-promax"
                    style={{
                      textDecoration: "none",
                      background: "var(--success)",
                      color: "white",
                      border: "none",
                    }}
                  >
                    Upload Konten
                  </Link>
                )}
                {currentRole === "agen" && (
                  <button
                    type="button"
                    className="btn-promax"
                    style={{
                      background: "#3b82f6",
                      color: "white",
                      border: "none",
                    }}
                    onClick={() => setIsAddSubscriptionModalOpen(true)}
                  >
                    Add Berlangganan
                  </button>
                )}
                <Link
                  to={
                    currentRole === "agen"
                      ? "/payments"
                      : currentRole === "sekolah"
                        ? "/allocation"
                        : currentRole === "uploader"
                          ? "/catalog"
                          : currentRole === "guru"
                            ? "/library"
                            : "/library"
                  }
                  className="btn-promax"
                  style={{ textDecoration: "none" }}
                >
                  Lihat Semua
                </Link>
              </div>
            )}
          </div>

          {currentRole === "agen" && (
            <div className="table-toolbar">
              <label className="search-field">
                <span>Cari sekolah</span>
                <input
                  className="input-control"
                  value={agentSchoolSearch}
                  onChange={(event) => {
                    setAgentSchoolSearch(event.target.value);
                    setAgentSchoolPage(1);
                  }}
                  placeholder="Cari nama sekolah, kota, atau NPSN..."
                />
              </label>
              <div className="table-summary">
                Menampilkan {agentSchoolFirstRow}-{agentSchoolLastRow} dari{" "}
                {filteredAgentSchoolRows.length} sekolah
              </div>
            </div>
          )}

          {currentRole === "sekolah" && (
            <div className="table-toolbar">
              <label className="search-field">
                <span>Cari siswa</span>
                <input
                  className="input-control"
                  value={studentSearch}
                  onChange={(event) => {
                    setStudentSearch(event.target.value);
                    setStudentPage(1);
                  }}
                  placeholder="Cari nama, username, kelas, NIS, atau unit..."
                />
              </label>
              <div className="table-summary">
                Menampilkan {studentFirstRow}-{studentLastRow} dari{" "}
                {filteredStudentRows.length} siswa
              </div>
            </div>
          )}

          {currentRole === "siswa" && (
            <div className="table-toolbar" style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <label className="search-field" style={{ flex: 1, minWidth: "250px" }}>
                <span>Cari buku</span>
                <input
                  className="input-control"
                  value={librarySearch}
                  onChange={(event) => {
                    setLibrarySearch(event.target.value);
                    setLibraryPage(1);
                  }}
                  placeholder="Cari judul buku..."
                />
              </label>
              <label className="search-field" style={{ minWidth: "200px" }}>
                <span>Mata Pelajaran</span>
                <select 
                  className="input-control"
                  value={libraryMapel}
                  onChange={(event) => {
                    setLibraryMapel(event.target.value);
                    setLibraryPage(1);
                  }}
                >
                  <option value="">Semua Mata Pelajaran</option>
                  {libraryAvailableMapels.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </label>
              <div className="table-summary" style={{ width: "100%" }}>
                Menampilkan {libraryFirstRow}-{libraryLastRow} dari{" "}
                {filteredLibraryRows.length} buku
              </div>
            </div>
          )}

          <div className="table-scroll">
            <table className="table-promax">
              <thead>
                {currentRole === "superadmin" && (
                  <tr>
                    <th style={{ textAlign: "left" }}>Nama Agen</th>
                    <th style={{ textAlign: "left" }}>Area</th>
                    <th style={{ textAlign: "center" }}>Total Penjualan</th>
                    <th style={{ textAlign: "center" }}>Status</th>
                  </tr>
                )}
                {currentRole === "agen" && (
                  <tr>
                    <th style={{ textAlign: "left" }}>Nama Sekolah</th>
                    <th style={{ textAlign: "left" }}>Kota/Kab</th>
                    <th style={{ textAlign: "center" }}>Total Lisensi</th>
                    <th style={{ textAlign: "center" }}>Pembayaran</th>
                  </tr>
                )}
                {currentRole === "sekolah" && (
                  <tr>
                    <th style={{ textAlign: "left" }}>Siswa</th>
                    <th style={{ textAlign: "left" }}>Username</th>
                    <th style={{ textAlign: "center" }}>Unit</th>
                    <th style={{ textAlign: "center" }}>Akses Aplikasi</th>
                  </tr>
                )}
                {currentRole === "siswa" && (
                  <tr>
                    <th style={{ textAlign: "left" }}>Judul Buku</th>
                    <th style={{ textAlign: "left" }}>Mata Pelajaran</th>
                    <th style={{ textAlign: "center" }}>Kelas</th>
                    <th style={{ textAlign: "left" }}>Guru Mapel</th>
                    <th style={{ textAlign: "center" }}>Progress</th>
                    <th style={{ textAlign: "center" }}>Status</th>
                  </tr>
                )}
                {currentRole === "uploader" && (
                  <tr>
                    <th style={{ textAlign: "left" }}>Judul Konten</th>
                    <th style={{ textAlign: "left" }}>Kategori & Mapel</th>
                    <th style={{ textAlign: "center" }}>Status</th>
                    <th style={{ textAlign: "center" }}>Tanggal</th>
                  </tr>
                )}
                {currentRole === "guru" && (
                  <tr>
                    <th style={{ textAlign: "left" }}>Judul Buku</th>
                    <th style={{ textAlign: "left" }}>Mata Pelajaran</th>
                    <th style={{ textAlign: "center" }}>Kelas</th>
                    <th style={{ textAlign: "center" }}>Status</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {currentRole === "superadmin" &&
                  agentRows.map((agent) => (
                    <tr key={agent.id}>
                      <td>
                        <Identity
                          initial={agent.initial}
                          color={agent.color}
                          title={agent.nama}
                          subtitle={agent.id}
                        />
                      </td>
                      <td style={{ color: "var(--text-secondary)" }}>
                        {agent.wilayah}
                      </td>
                      <td
                        style={{ color: "var(--success)", textAlign: "center" }}
                      >
                        {formatCurrency(agent.revenue)}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <Chip
                          type={
                            agent.status === "Aktif" ? "success" : "warning"
                          }
                          label={agent.status}
                        />
                      </td>
                    </tr>
                  ))}

                {currentRole === "agen" &&
                  visibleAgentSchoolRows.map((school) => (
                    <tr key={school.id}>
                      <td>
                        <Identity
                          initial={`S${school.id}`}
                          color="#0ea5e9"
                          title={school.nama}
                          subtitle={`NPSN: ${school.npsn}`}
                        />
                      </td>
                      <td style={{ color: "var(--text-secondary)" }}>
                        {school.kota}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {formatNumber(school.lisensi)}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <Chip
                          type={
                            school.payment === "Lunas" ? "success" : "warning"
                          }
                          label={school.payment}
                        />
                      </td>
                    </tr>
                  ))}

                {currentRole === "sekolah" &&
                  visibleStudentRows.map((student) => (
                    <tr key={student.id}>
                      <td>
                        <Identity
                          initial={student.initial}
                          color={student.color}
                          title={student.nama}
                          subtitle={student.id}
                        />
                      </td>
                      <td style={{ color: "var(--text-secondary)" }}>
                        {student.username}
                      </td>
                      <td
                        style={{
                          textAlign: "center",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {student.wilayah}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <Chip
                          type={
                            student.status === "Aktif" ? "success" : "warning"
                          }
                          label={
                            student.status === "Aktif"
                              ? "Terhubung"
                              : "Belum Aktivasi"
                          }
                        />
                      </td>
                    </tr>
                  ))}

                {currentRole === "siswa" &&
                  (paginatedLibraryRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "32px 16px", color: "var(--text-secondary)" }}>
                        Tidak ada buku yang ditemukan.
                      </td>
                    </tr>
                  ) : (
                    paginatedLibraryRows.map(({ learning, book }) => (
                      <tr key={`${learning.studentUsername}-${learning.isbn}`}>
                        <td>
                          <Identity
                            initial="BK"
                            color="#3b82f6"
                            title={book!.judul}
                            subtitle={book!.penerbit}
                          />
                        </td>
                        <td style={{ color: "var(--text-secondary)" }}>
                          {book!.mapel}
                        </td>
                        <td
                          style={{
                            textAlign: "center",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {book!.kelas || "—"}
                        </td>
                        <td style={{ color: "var(--text-secondary)" }}>
                          {getGuruMapel(book!.mapel)}
                        </td>
                        <td style={{ minWidth: 180 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                            }}
                          >
                            <div className="progress-track">
                              <div
                                className="progress-fill"
                                style={{ width: `${learning.progress}%` }}
                              />
                            </div>
                            <span
                              style={{
                                color: "var(--text-secondary)",
                                fontSize: "0.875rem",
                              }}
                            >
                              {learning.progress}%
                            </span>
                          </div>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <Link to="/library" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--success)" }}>
                            <PlayCircle size={28} />
                          </Link>
                        </td>
                      </tr>
                    ))
                  ))}

                {currentRole === "guru" &&
                  (libraryRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        style={{
                          textAlign: "center",
                          color: "var(--text-secondary)",
                          padding: "32px 16px",
                        }}
                      >
                        Belum ada buku yang dialokasikan ke akun Anda.
                        <br />
                        <small>Minta Admin Sekolah untuk mengalokasikan buku mengajar Anda.</small>
                      </td>
                    </tr>
                  ) : (
                    libraryRows.map(({ learning, book }) => (
                      <tr key={`${learning.studentUsername}-${learning.isbn}`}>
                        <td>
                          <Identity
                            initial="BK"
                            color="#4f46e5"
                            title={book!.judul}
                            subtitle={book!.penerbit}
                          />
                        </td>
                        <td style={{ color: "var(--text-secondary)" }}>
                          {book!.mapel || "—"}
                        </td>
                        <td
                          style={{
                            textAlign: "center",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {book!.kelas || book!.jenjang || "—"}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <Chip type="success" label="Tersedia" />
                        </td>
                      </tr>
                    ))
                  ))}

                {currentRole === "uploader" &&
                  (data.contents || []).slice(0, 15).map((content) => (
                    <tr key={content.id}>
                      <td>
                        <Identity
                          initial="KT"
                          color="#0ea5e9"
                          title={content.judul}
                          subtitle={`File: ${content.fileName}`}
                        />
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                          }}
                        >
                          <span style={{ fontWeight: 500 }}>
                            {content.kategori}
                          </span>
                          <span
                            style={{
                              color: "var(--text-secondary)",
                              fontSize: "0.85rem",
                            }}
                          >
                            {content.mapel} - {content.target}
                          </span>
                        </div>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <Chip
                          type={
                            content.status === "Terbit" ? "success" : "warning"
                          }
                          label={content.status}
                        />
                      </td>
                      <td
                        style={{
                          textAlign: "center",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {new Date(content.tanggal).toLocaleDateString("id-ID")}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {currentRole === "siswa" && (
            <div className="pagination-bar">
              <div className="table-summary">
                Halaman {libraryCurrentPage} dari {libraryTotalPages}
              </div>
              <div className="pagination-actions">
                <button
                  type="button"
                  className="icon-action-button"
                  onClick={() => setLibraryPage(1)}
                  disabled={libraryCurrentPage <= 1}
                  aria-label="Ke halaman awal"
                  title="Awal"
                >
                  <ChevronsLeft size={18} />
                </button>
                <button
                  type="button"
                  className="icon-action-button"
                  onClick={() => setLibraryPage((p) => Math.max(1, p - 1))}
                  disabled={libraryCurrentPage <= 1}
                  aria-label="Halaman sebelumnya"
                  title="Sebelumnya"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  className="icon-action-button"
                  onClick={() => setLibraryPage((p) => Math.min(libraryTotalPages, p + 1))}
                  disabled={libraryCurrentPage >= libraryTotalPages}
                  aria-label="Halaman selanjutnya"
                  title="Selanjutnya"
                >
                  <ChevronRight size={18} />
                </button>
                <button
                  type="button"
                  className="icon-action-button"
                  onClick={() => setLibraryPage(libraryTotalPages)}
                  disabled={libraryCurrentPage >= libraryTotalPages}
                  aria-label="Ke halaman akhir"
                  title="Akhir"
                >
                  <ChevronsRight size={18} />
                </button>
              </div>
            </div>
          )}

          {currentRole === "agen" && (
            <div className="pagination-bar">
              <div className="table-summary">
                Halaman {agentSchoolCurrentPage} dari {agentSchoolTotalPages}
              </div>
              <div className="pagination-actions">
                <button
                  type="button"
                  className="icon-action-button"
                  disabled={agentSchoolCurrentPage <= 1}
                  onClick={() => setAgentSchoolPage((p) => Math.max(1, p - 1))}
                  aria-label="Halaman sebelumnya"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  className="icon-action-button"
                  disabled={agentSchoolCurrentPage >= agentSchoolTotalPages}
                  onClick={() =>
                    setAgentSchoolPage((p) =>
                      Math.min(agentSchoolTotalPages, p + 1),
                    )
                  }
                  aria-label="Halaman selanjutnya"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {currentRole === "sekolah" && (
            <div className="pagination-bar">
              <div className="table-summary">
                Halaman {studentCurrentPage} dari {studentTotalPages}
              </div>
              <div className="pagination-actions">
                <button
                  type="button"
                  className="icon-action-button"
                  onClick={() => setStudentPage(1)}
                  disabled={studentCurrentPage === 1}
                  aria-label="Ke halaman awal"
                  title="Awal"
                >
                  <ChevronsLeft size={18} />
                </button>
                <button
                  type="button"
                  className="icon-action-button"
                  onClick={() =>
                    setStudentPage((value) => Math.max(1, value - 1))
                  }
                  disabled={studentCurrentPage === 1}
                  aria-label="Ke halaman sebelumnya"
                  title="Sebelumnya"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  className="icon-action-button"
                  onClick={() =>
                    setStudentPage((value) =>
                      Math.min(studentTotalPages, value + 1),
                    )
                  }
                  disabled={studentCurrentPage === studentTotalPages}
                  aria-label="Ke halaman berikutnya"
                  title="Berikutnya"
                >
                  <ChevronRight size={18} />
                </button>
                <button
                  type="button"
                  className="icon-action-button"
                  onClick={() => setStudentPage(studentTotalPages)}
                  disabled={studentCurrentPage === studentTotalPages}
                  aria-label="Ke halaman akhir"
                  title="Akhir"
                >
                  <ChevronsRight size={18} />
                </button>
              </div>
            </div>
          )}
        </GlassCard>
      )}

      {currentRole === "pending" &&
        currentUser?.status !== "Menunggu Approve" && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
            }}
          >
            {showWarning ? (
              <GlassCard
                style={{
                  padding: "40px",
                  textAlign: "center",
                  maxWidth: "600px",
                  width: "100%",
                }}
              >
                <div style={{ fontSize: "3rem", marginBottom: "16px" }}>⚠️</div>
                <h2
                  style={{
                    fontSize: "1.5rem",
                    marginBottom: "16px",
                    color: "var(--text-primary)",
                  }}
                >
                  Peringatan Akses
                </h2>
                <p
                  style={{
                    color: "var(--text-secondary)",
                    lineHeight: 1.6,
                    marginBottom: "24px",
                    fontSize: "1rem",
                  }}
                >
                  Akun Anda berstatus baru dan belum melengkapi data institusi.
                  Anda tidak dapat mengakses fitur utama sebelum melengkapi
                  profil.
                </p>
                <div
                  style={{
                    padding: "16px",
                    background: "rgba(59, 130, 246, 0.1)",
                    color: "#3b82f6",
                    borderRadius: "8px",
                    marginBottom: "32px",
                    textAlign: "left",
                    fontSize: "0.9rem",
                  }}
                >
                  <strong>Catatan:</strong> Silakan klik lanjutkan untuk
                  melengkapi data Anda agar dapat diverifikasi oleh sistem.
                </div>
                <button
                  onClick={() => setShowWarning(false)}
                  className="btn-primary"
                  style={{ width: "100%", padding: "12px" }}
                >
                  Lanjutkan Lengkapi Data
                </button>
              </GlassCard>
            ) : (
              <GlassCard
                style={{
                  padding: "40px",
                  maxWidth: "600px",
                  width: "100%",
                  maxHeight: "90vh",
                  overflowY: "auto",
                }}
              >
                <h2
                  style={{
                    fontSize: "1.5rem",
                    marginBottom: "8px",
                    textAlign: "center",
                  }}
                >
                  Lengkapi Data Profil
                </h2>
                <p
                  style={{
                    color: "var(--text-secondary)",
                    textAlign: "center",
                    marginBottom: "32px",
                  }}
                >
                  Silakan lengkapi formulir di bawah ini untuk mengakses
                  aplikasi.
                </p>

                <form
                  onSubmit={handleSubmitRegistration}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>Peran (Role)</span>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="input-control"
                    >
                      <option value="sekolah">Admin Sekolah</option>
                      <option value="guru">Guru</option>
                      <option value="siswa">Siswa</option>
                      <option value="agen">Agen</option>
                    </select>
                  </label>

                  <label
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>Nama Lengkap</span>
                    <input
                      type="text"
                      className="input-control"
                      value={namaLengkap}
                      onChange={(e) => setNamaLengkap(e.target.value)}
                      required
                    />
                  </label>

                  {(selectedRole === "sekolah" ||
                    selectedRole === "guru" ||
                    selectedRole === "siswa") && (
                    <label
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      <span style={{ fontWeight: 500 }}>Asal Sekolah</span>
                      <SchoolSearchInput
                        value={sekolahNama}
                        onChange={(val, id) => {
                          setSekolahNama(val);
                          setSekolahId(id);
                        }}
                        className="input-control"
                        subscribedOnly={false}
                      />
                    </label>
                  )}

                  {selectedRole === "sekolah" && (
                    <>
                      <label
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                        }}
                      >
                        <span style={{ fontWeight: 500 }}>
                          Upload Surat Tugas
                        </span>
                        <input
                          type="file"
                          className="input-control"
                          onChange={(e) => {
                            if (e.target.files?.length)
                              setSuratTugas(e.target.files[0].name);
                          }}
                          required
                        />
                        {suratTugas && (
                          <span
                            style={{
                              fontSize: "0.8rem",
                              color: "var(--brand-primary)",
                            }}
                          >
                            File: {suratTugas}
                          </span>
                        )}
                      </label>
                      <label
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                        }}
                      >
                        <span style={{ fontWeight: 500 }}>Masa Aktif</span>
                        <input
                          type="text"
                          className="input-control"
                          placeholder="Contoh: Tahun Ajaran 2024/2025"
                          value={masaAktif}
                          onChange={(e) => setMasaAktif(e.target.value)}
                          required
                        />
                      </label>
                    </>
                  )}

                  {selectedRole === "siswa" && (
                    <label
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      <span style={{ fontWeight: 500 }}>Kelas</span>
                      <select
                        value={kelas}
                        onChange={(e) => setKelas(e.target.value)}
                        className="input-control"
                        required
                      >
                        <option value="">Pilih Kelas</option>
                        {getKelasOptions(sekolahNama).map((k) => (
                          <option key={k} value={k}>
                            Kelas {k}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}

                  {(selectedRole === "siswa" || selectedRole === "guru") && (
                    <label
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      <span style={{ fontWeight: 500 }}>
                        {selectedRole === "guru" ? "NUPTK / NIP" : "NISN"}
                      </span>
                      <input
                        type="text"
                        className="input-control"
                        value={nisn}
                        onChange={(e) => setNisn(e.target.value)}
                        placeholder={
                          selectedRole === "guru"
                            ? "Masukkan NUPTK / NIP"
                            : "Masukkan NISN"
                        }
                        required
                      />
                    </label>
                  )}

                  <button
                    type="submit"
                    className="action-button"
                    disabled={
                      isSubmitting ||
                      ((selectedRole === "sekolah" ||
                        selectedRole === "guru" ||
                        selectedRole === "siswa") &&
                        !sekolahId)
                    }
                    style={{ marginTop: "16px" }}
                  >
                    {isSubmitting ? "Menyimpan..." : "Simpan Profil"}
                  </button>
                </form>
              </GlassCard>
            )}
          </div>
        )}

      {isAddSubscriptionModalOpen && (
        <div
          className="modal-backdrop"
          style={{
            zIndex: 99999,
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setIsAddSubscriptionModalOpen(false)}
        >
          <div
            className="modal-content"
            style={{
              background: "white",
              padding: "24px",
              borderRadius: "8px",
              width: "400px",
              maxWidth: "90%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0, marginBottom: "16px" }}>
              Tambah Berlangganan
            </h3>
            <form onSubmit={handleAddSubscriptionSubmit}>
              <div style={{ marginBottom: "12px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  Sekolah Rekanan
                </label>
                <SchoolSearchInput
                  value={newSubSchoolName}
                  onChange={(val, id, schoolObj) => {
                    setNewSubSchoolName(val);
                    const schoolId = id || "";
                    setNewSubSchoolId(schoolId);

                    if (schoolId) {
                      if (
                        schoolObj &&
                        !data.schools.find((s: any) => s.id === schoolId)
                      ) {
                        setData((current: any) => ({
                          ...current,
                          schools: [
                            ...(current.schools || []),
                            { ...schoolObj, agen: session?.displayName },
                          ],
                        }));
                      }
                      const defaultLisensi = users.filter(
                        (u) => u.role === "siswa" && u.sekolahId === schoolId,
                      ).length;
                      setNewSubLisensi(defaultLisensi);
                    } else {
                      setNewSubLisensi(0);
                    }
                  }}
                  className="input-control"
                />
              </div>
              <div style={{ marginBottom: "12px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  Paket Penjualan
                </label>
                <select
                  className="input-control"
                  style={{ width: "100%", padding: "8px" }}
                  value={newSubPaket}
                  onChange={(e) =>
                    setNewSubPaket(e.target.value as SalesPackage)
                  }
                >
                  <option value="Konten Digital">Konten Digital</option>
                  <option value="Konten Digital + Buku">
                    Konten Digital + Buku
                  </option>
                  <option value="Buku Cetak">Buku Cetak</option>
                </select>
              </div>
              <div style={{ marginBottom: "12px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  Durasi
                </label>
                <select
                  className="input-control"
                  style={{ width: "100%", padding: "8px" }}
                  value={newSubDurasi}
                  onChange={(e) =>
                    setNewSubDurasi(e.target.value as SubscriptionDuration)
                  }
                >
                  <option value="Trial 1 Bulan">Trial 1 Bulan</option>
                  <option value="3 Bulan">3 Bulan</option>
                  <option value="6 Bulan">6 Bulan</option>
                  <option value="1 Tahun">1 Tahun</option>
                </select>
              </div>
              <div style={{ marginBottom: "12px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  Jumlah Lisensi
                </label>
                <input
                  type="number"
                  className="input-control"
                  style={{ width: "100%", padding: "8px" }}
                  value={newSubLisensi}
                  onChange={(e) => setNewSubLisensi(Number(e.target.value))}
                  required
                />
              </div>
              <div style={{ marginBottom: "24px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  Total Tagihan/Nominal (Rp)
                </label>
                <input
                  type="number"
                  className="input-control"
                  style={{ width: "100%", padding: "8px" }}
                  value={newSubNominal}
                  onChange={(e) => setNewSubNominal(Number(e.target.value))}
                  required
                />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "8px",
                }}
              >
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsAddSubscriptionModalOpen(false)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                    background: "transparent",
                    cursor: "pointer",
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    border: "none",
                    background: "var(--primary)",
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Identity({
  initial,
  color,
  title,
  subtitle,
}: {
  initial: string;
  color: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
      <div
        style={{
          width: "42px",
          height: "42px",
          borderRadius: "50%",
          background: `${color}25`,
          color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 800,
        }}
      >
        {initial}
      </div>
      <div>
        <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>
          {title}
        </div>
        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
          {subtitle}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  color,
  title,
  value,
  subtitle,
}: {
  icon: React.ReactNode;
  color: string;
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="metric-card">
      <div
        className="metric-icon-wrapper"
        style={{ color, backgroundColor: `${color}15` }}
      >
        {icon}
      </div>
      <div>
        <div className="metric-title">{title}</div>
        <div className="metric-value">{value}</div>
        <div
          className="metric-subtitle"
          style={{
            color:
              title.includes("Pendapatan") || title.includes("Total")
                ? "var(--success)"
                : "",
          }}
        >
          {subtitle}
        </div>
      </div>
    </div>
  );
}

export function StatCard({
  icon,
  colorStart,
  colorEnd,
  title,
  value,
  subtitle,
  shadowColor,
}: any) {
  return (
    <div
      style={{
        background: `linear-gradient(to bottom right, ${colorStart}, ${colorEnd})`,
        borderRadius: "16px",
        padding: "16px",
        color: "white",
        minWidth: "130px",
        boxShadow: `0 10px 15px -3px ${shadowColor}, 0 4px 6px -4px ${shadowColor}`,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: "16px",
      }}
    >
      <div style={{ color: "rgba(255,255,255,0.9)" }}>{icon}</div>
      <div>
        <div
          style={{
            fontSize: "10px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: "4px",
            opacity: 0.9,
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: "24px", fontWeight: 700 }}>{value}</div>
        <div style={{ fontSize: "10px", opacity: 0.8, marginTop: "4px" }}>
          {subtitle}
        </div>
      </div>
    </div>
  );
}

export function SimpleDonut({
  data,
  total,
}: {
  data: { color: string; value: number; label: string }[];
  total: number;
}) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const displayTotal = total > 0 ? total : 1;
  const [hovered, setHovered] = useState<{
    label: string;
    value: number;
  } | null>(null);

  return (
    <div
      style={{
        position: "relative",
        width: "200px",
        height: "200px",
        margin: "0 auto",
        marginBottom: "24px",
      }}
    >
      <svg
        width="200"
        height="200"
        viewBox="0 0 200 200"
        style={{ transform: "rotate(-90deg)" }}
      >
        {data.map((item, i) => {
          if (item.value === 0) return null;
          const strokeDasharray = `${(item.value / displayTotal) * circumference} ${circumference}`;
          const strokeDashoffset = -offset;
          offset += (item.value / displayTotal) * circumference;
          return (
            <circle
              key={i}
              cx="100"
              cy="100"
              r={radius}
              fill="transparent"
              stroke={item.color}
              strokeWidth="25"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              style={{
                transition: "stroke-dasharray 1s ease-out",
                cursor: "pointer",
              }}
              onMouseEnter={() => setHovered(item)}
              onMouseLeave={() => setHovered(null)}
            >
              <title>
                {item.label}: {item.value}
              </title>
            </circle>
          );
        })}
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            fontSize: "1.875rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            transition: "all 0.2s",
          }}
        >
          {hovered ? hovered.value : total}
        </span>
        <span
          style={{
            fontSize: "0.625rem",
            color: "var(--text-secondary)",
            transition: "all 0.2s",
          }}
        >
          {hovered ? hovered.label : "Semua kategori"}
        </span>
      </div>
    </div>
  );
}
