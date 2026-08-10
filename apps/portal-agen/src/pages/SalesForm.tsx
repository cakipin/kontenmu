import { useMemo, useState, useEffect, type FormEvent } from "react";
import { GlassCard } from "../../../../packages/ui/src/GlassCard";
import { ButtonPromax } from "../../../../packages/ui/src/ButtonPromax";
import {
  formatCurrency,
  getBook,
  getSchool,
  nextId,
  subscriptionDurationMonths,
  subscriptionEndDate,
  useAppData,
  type SalesPackage,
  type SubscriptionDuration,
} from "../data/appData";
import { useAuth } from "@repo/auth";
import Select from "react-select";

const packageMultipliers: Record<SalesPackage, number> = {
  "Konten Digital": 1,
  "Konten Digital + Buku": 1.65,
  "Buku Cetak": 1.25,
};

const packageOptions = Object.keys(packageMultipliers) as SalesPackage[];
const durationMultipliers: Record<SubscriptionDuration, number> = {
  "Trial 1 Bulan": 0.33,
  "3 Bulan": 1,
  "6 Bulan": 1.8,
  "1 Tahun": 3.2,
};

export default function SalesForm() {
  const { session } = useAuth();
  const isSuperAdmin = session?.role === "superadmin";
  const { data, setData } = useAppData();
  const [schoolId, setSchoolId] = useState(String(data.schools[0]?.id ?? ""));
  const [isbn, setIsbn] = useState(data.books[0]?.isbn ?? "");
  const [paket, setPaket] = useState<SalesPackage>("Konten Digital + Buku");
  const [durasi, setDurasi] = useState<SubscriptionDuration>("6 Bulan");
  const [jumlah, setJumlah] = useState("");
  const [diskonPersen, setDiskonPersen] = useState("10");
  const [komisiPersen, setKomisiPersen] = useState("8");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    const fetchRequiredData = async () => {
      try {
        const p1 =
          data.schools.length === 0
            ? fetch(
                `${""}/api/sekolah?limit=1000`,
              ).then((r) => r.json())
            : Promise.resolve(null);
        const p2 =
          data.books.length === 0
            ? fetch(
                `${import.meta.env.VITE_API_URL || "https://sales-api.1912.workers.dev"}/api/books`,
              ).then((r) => r.json())
            : Promise.resolve(null);

        const [schoolsRes, booksRes] = await Promise.all([p1, p2]);

        if (mounted && (schoolsRes?.success || booksRes?.success)) {
          setData((prev) => {
            const next = { ...prev };
            if (schoolsRes?.success && schoolsRes.data) {
              next.schools = schoolsRes.data;
            }
            if (booksRes?.success && booksRes.data) {
              next.books = booksRes.data;
            }
            return next;
          });
        }
      } catch (err) {
        console.error("Failed to fetch initial data for SalesForm:", err);
      }
    };

    fetchRequiredData();
    return () => {
      mounted = false;
    };
  }, [data.schools.length, data.books.length, setData]);

  const schoolOptions = data.schools.map((school) => ({
    value: String(school.id),
    label: `${school.nama} - ${school.kota}`,
  }));
  const bookOptions = data.books.map((book) => ({
    value: book.isbn,
    label: book.judul,
  }));

  const selectedBook = getBook(data, isbn);
  const quantity = Number(jumlah || 0);
  const basePrice = selectedBook?.harga ?? 0;
  const unitPrice = Math.round(
    basePrice * packageMultipliers[paket] * durationMultipliers[durasi],
  );
  const subtotal = quantity * unitPrice;
  const discount = Math.round(subtotal * (Number(diskonPersen || 0) / 100));
  const afterDiscount = Math.max(subtotal - discount, 0);
  const commission = Math.round(
    afterDiscount * (Number(komisiPersen || 0) / 100),
  );
  const invoiceTotal = afterDiscount;
  const startedAt = new Date().toISOString().slice(0, 10);
  const finishedAt = subscriptionEndDate(startedAt, durasi);

  const invoiceNo = useMemo(() => {
    const next = data.sales.length + 1;
    return `INV-${new Date().getFullYear()}-${String(next).padStart(4, "0")}`;
  }, [data.sales.length]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!quantity || quantity < 1) return;

    setData((current) => {
      const school = getSchool(current, Number(schoolId));
      const nextSale = {
        id: Math.max(0, ...current.sales.map((sale) => sale.id)) + 1,
        schoolId: Number(schoolId),
        isbn,
        jumlah: quantity,
        tanggal: new Date().toISOString().slice(0, 10),
        agen: school?.agen ?? "PWM Jawa Tengah",
        invoiceNo,
        paket,
        durasiBulan: subscriptionDurationMonths(durasi),
        hargaSatuan: unitPrice,
        subtotal,
        diskonPersen: Number(diskonPersen || 0),
        diskonNominal: discount,
        komisiPersen: Number(komisiPersen || 0),
        komisiNominal: commission,
        totalInvoice: invoiceTotal,
      };
      const nextSubscription = {
        id: nextId("SUB", current.subscriptions.length),
        invoiceNo,
        schoolId: Number(schoolId),
        paket,
        durasi,
        mulai: startedAt,
        selesai: finishedAt,
        nominal: invoiceTotal,
        diskonPersen: Number(diskonPersen || 0),
        diskonNominal: discount,
        komisiPersen: Number(komisiPersen || 0),
        komisiNominal: commission,
        status: "Menunggu Approve Agen" as const,
        requestAt: startedAt,
        agentDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10),
        note: `${school?.nama ?? "Sekolah"} menunggu approval agen.`,
      };
      const nextPayment = {
        id: `PAY-${String(current.payments.length + 1).padStart(4, "0")}`,
        schoolId: Number(schoolId),
        nominal: invoiceTotal,
        jatuhTempo: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10),
        status: "Menunggu" as const,
        invoiceNo,
      };
      return {
        ...current,
        sales: [nextSale, ...current.sales],
        subscriptions: [nextSubscription, ...current.subscriptions],
        payments: [nextPayment, ...current.payments],
      };
    });

    setMessage(
      `Invoice ${invoiceNo} berhasil dibuat. Komisi agen: ${formatCurrency(commission)}. Langganan ${durasi} tersimpan menunggu approval.`,
    );
    setJumlah("");
  };

  return (
    <div className="page-shell">
      <GlassCard style={{ width: "100%", maxWidth: "980px" }}>
        <div className="panel-heading">
          <div>
            <h2>Input Penjualan Gelondongan</h2>
            <p>
              Hitung harga paket, diskon, komisi agen, periode subscribe 3/6/12
              bulan, dan invoice untuk kebutuhan penjualan.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="form-stack">
          <div className="form-grid">
            <label style={{ zIndex: 50 }}>
              Sekolah
              <Select
                options={schoolOptions}
                value={schoolOptions.find((opt) => opt.value === schoolId)}
                onChange={(option) => setSchoolId(option?.value ?? "")}
                placeholder="Pencarian nama atau kota sekolah..."
                className="react-select-container"
                classNamePrefix="react-select"
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: "44px",
                    borderRadius: "10px",
                    borderColor: "var(--border-subtle)",
                    background: "var(--bg-secondary)",
                    color: "var(--text-primary)",
                  }),
                  menu: (base) => ({ ...base, zIndex: 9999 }),
                  singleValue: (base) => ({
                    ...base,
                    color: "var(--text-primary)",
                  }),
                  input: (base) => ({ ...base, color: "var(--text-primary)" }),
                }}
              />
            </label>

            <label style={{ zIndex: 40 }}>
              Buku / Konten
              <Select
                options={bookOptions}
                value={bookOptions.find((opt) => opt.value === isbn)}
                onChange={(option) => setIsbn(option?.value ?? "")}
                placeholder="Pencarian judul konten..."
                className="react-select-container"
                classNamePrefix="react-select"
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: "44px",
                    borderRadius: "10px",
                    borderColor: "var(--border-subtle)",
                    background: "var(--bg-secondary)",
                    color: "var(--text-primary)",
                  }),
                  menu: (base) => ({ ...base, zIndex: 9999 }),
                  singleValue: (base) => ({
                    ...base,
                    color: "var(--text-primary)",
                  }),
                  input: (base) => ({ ...base, color: "var(--text-primary)" }),
                }}
              />
            </label>

            <label>
              Paket Penjualan
              <select
                className="input-control"
                value={paket}
                onChange={(e) => setPaket(e.target.value as SalesPackage)}
              >
                {packageOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Durasi Subscribe
              <select
                className="input-control"
                value={durasi}
                onChange={(e) =>
                  setDurasi(e.target.value as SubscriptionDuration)
                }
              >
                {(
                  ["3 Bulan", "6 Bulan", "1 Tahun"] as SubscriptionDuration[]
                ).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Jumlah Lisensi / Eksemplar
              <input
                className="input-control"
                type="number"
                min={1}
                value={jumlah}
                onChange={(e) => setJumlah(e.target.value)}
                placeholder="Contoh: 150"
                required
              />
            </label>

            <label>
              Diskon (%)
              <input
                className="input-control"
                type="number"
                min={0}
                max={100}
                value={diskonPersen}
                onChange={(e) => setDiskonPersen(e.target.value)}
              />
            </label>

            {isSuperAdmin && (
              <label>
                Komisi Agen (%)
                <input
                  className="input-control"
                  type="number"
                  min={0}
                  max={100}
                  value={komisiPersen}
                  onChange={(e) => setKomisiPersen(e.target.value)}
                />
              </label>
            )}
          </div>

          <div className="invoice-summary-grid">
            <SummaryItem label="Nomor Invoice" value={invoiceNo} />
            <SummaryItem label="Durasi Subscribe" value={durasi} />
            <SummaryItem label="Selesai Periode" value={finishedAt} />
            <SummaryItem
              label="Harga Satuan Paket"
              value={formatCurrency(unitPrice)}
            />
            <SummaryItem label="Subtotal" value={formatCurrency(subtotal)} />
            <SummaryItem
              label={`Diskon ${Number(diskonPersen || 0)}%`}
              value={`-${formatCurrency(discount)}`}
            />
            <SummaryItem
              label="Total Invoice"
              value={formatCurrency(invoiceTotal)}
              highlight
            />
            {isSuperAdmin && (
              <SummaryItem
                label={`Komisi Agen ${Number(komisiPersen || 0)}%`}
                value={formatCurrency(commission)}
              />
            )}
          </div>

          {message && <p className="status-message success">{message}</p>}

          <div className="button-row">
            <ButtonPromax type="submit">Buat Invoice Penjualan</ButtonPromax>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}

function SummaryItem({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={`invoice-summary-item ${highlight ? "highlight" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
