import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import type { ChangeEvent } from "react";

interface TableSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function TableSearch({
  value,
  onChange,
  placeholder = "Cari...",
}: TableSearchProps) {
  return (
    <div style={{ position: "relative", width: "300px", marginBottom: 0 }}>
      <Search
        size={18}
        style={{
          position: "absolute",
          left: "12px",
          top: "50%",
          transform: "translateY(-50%)",
          color: "var(--text-secondary)",
        }}
      />
      <input
        type="text"
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "10px 12px 10px 38px",
          borderRadius: "8px",
          border: "1px solid var(--border-subtle)",
          background: "var(--bg-secondary)",
          color: "var(--text-primary)",
          fontSize: "0.9rem",
          outline: "none",
        }}
      />
    </div>
  );
}

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function TablePagination({
  currentPage,
  totalPages,
  onPageChange,
}: TablePaginationProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        marginTop: "16px",
        padding: "16px 0",
        borderTop: "1px solid var(--border-subtle)",
      }}
    >
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "8px",
          borderRadius: "6px",
          border: "1px solid var(--border-subtle)",
          background: currentPage === 1 ? "var(--bg-subtle)" : "var(--bg-card)",
          color:
            currentPage === 1 ? "var(--text-tertiary)" : "var(--text-primary)",
          cursor: currentPage === 1 ? "not-allowed" : "pointer",
        }}
        title="Halaman Sebelumnya"
      >
        <ChevronLeft size={18} />
      </button>

      <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
        Halaman{" "}
        <strong style={{ color: "var(--text-primary)" }}>{currentPage}</strong>{" "}
        dari {totalPages}
      </span>

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "8px",
          borderRadius: "6px",
          border: "1px solid var(--border-subtle)",
          background:
            currentPage >= totalPages ? "var(--bg-subtle)" : "var(--bg-card)",
          color:
            currentPage >= totalPages
              ? "var(--text-tertiary)"
              : "var(--text-primary)",
          cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
        }}
        title="Halaman Selanjutnya"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
