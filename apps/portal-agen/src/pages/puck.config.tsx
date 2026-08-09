import type { Config } from "@puckeditor/core";
import { Link } from "react-router-dom";
import dashboardPreview from "../assets/landing/student-content.webp";
import { useRef, useEffect, useState } from "react";

type HeroProps = {
  badgeText: string;
  title1: string;
  titleGradient: string;
  description: string;
  btnText: string;
  btnLink: string;
  heroImage?: string;
  paddingTop?: string;
  paddingBottom?: string;
};

// Komponen kustom untuk field upload gambar (diunggah ke R2 melalui API)
const ImageUploadField = ({
  value,
  onChange,
}: {
  value: any;
  onChange: (val: any) => void;
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {value && (
        <img
          src={value}
          alt="Preview"
          style={{
            width: "100%",
            maxHeight: "150px",
            objectFit: "contain",
            borderRadius: "4px",
            border: "1px solid #e5e7eb",
          }}
        />
      )}
      {isUploading && (
        <div style={{ fontSize: "12px", color: "#6b7280" }}>Mengunggah...</div>
      )}
      {errorMsg && (
        <div style={{ fontSize: "12px", color: "#ef4444" }}>{errorMsg}</div>
      )}
      <input
        type="file"
        accept="image/*"
        style={{ fontSize: "12px", display: isUploading ? "none" : "block" }}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) {
            setIsUploading(true);
            setErrorMsg(null);
            try {
              const formData = new FormData();
              formData.append("file", file);
              const res = await fetch(`/api/upload`, {
                method: "POST",
                body: formData,
              });
              const data = await res.json();
              if (data.url) {
                onChange(data.url);
              } else {
                setErrorMsg("Gagal mengunggah gambar");
              }
            } catch (err) {
              console.error(err);
              setErrorMsg("Terjadi kesalahan saat mengunggah");
            } finally {
              setIsUploading(false);
            }
          }
        }}
      />
      <button
        type="button"
        onClick={() => onChange(undefined)}
        disabled={isUploading}
        style={{
          padding: "6px",
          background: "#fee2e2",
          color: "#ef4444",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "12px",
          fontWeight: 600,
          opacity: isUploading ? 0.5 : 1,
        }}
      >
        Hapus / Pakai Default
      </button>
    </div>
  );
};

// Helper untuk padding (otomatis tambah px jika hanya angka)
const getPadding = (val?: string) => {
  if (!val) return undefined;
  if (!isNaN(Number(val))) return `${val}px`;
  return val;
};

// Komponen kustom untuk field color picker
const ColorPickerField = ({
  value,
  onChange,
}: {
  value: any;
  onChange: (val: any) => void;
}) => (
  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
    <input
      type="color"
      value={value || "#ffffff"}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "32px",
        height: "32px",
        padding: 0,
        border: "1px solid #e5e7eb",
        borderRadius: "4px",
        cursor: "pointer",
      }}
    />
    <input
      type="text"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Kosongkan untuk transparan"
      style={{
        flex: 1,
        padding: "6px 8px",
        fontSize: "12px",
        border: "1px solid #e5e7eb",
        borderRadius: "4px",
      }}
    />
  </div>
);

type SocialProofProps = {
  title: string;
  clients: { name: string; logo?: string; logoUrl?: string }[];
  paddingTop?: string;
  paddingBottom?: string;
};

type FeatureProps = {
  kicker: string;
  title: string;
  features: {
    subtitle: string;
    description: string;
    iconText: string;
    isReverse: boolean;
    image?: string;
  }[];
  paddingTop?: string;
  paddingBottom?: string;
};

type TestimonialsProps = {
  kicker: string;
  title: string;
  items: {
    quote: string;
    name: string;
    role: string;
    avatar?: string;
  }[];
  paddingTop?: string;
  paddingBottom?: string;
};

type CTAProps = {
  title: string;
  description: string;
  btnText: string;
  btnLink: string;
  footerText: string;
  paddingTop?: string;
  paddingBottom?: string;
};

type CustomHTMLProps = {
  html: string;
  paddingTop?: string;
  paddingBottom?: string;
};

type Props = {
  Hero: HeroProps;
  SocialProof: SocialProofProps;
  Feature: FeatureProps;
  Testimonials: TestimonialsProps;
  CTA: CTAProps;
  CustomHTML: CustomHTMLProps;
};

type RootProps = {
  children?: React.ReactNode;
  paddingTop?: string;
  paddingBottom?: string;
  headerTitle?: string;
  showFooter?: boolean;
  footerText?: string;
  navItems?: { label: string; href: string }[];
  headerLogo?: string;
  headerColor?: string;
  customCSS?: string;
  headerBtnText?: string;
  headerBtnLink?: string;
  favicon?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoImage?: string;
};
const TestimonialsComponent = ({
  kicker,
  title,
  items,
  paddingTop,
  paddingBottom,
}: any) => {
  const safeItems = items || [
    {
      quote:
        "Distribusi konten pendidikan jadi jauh lebih rapi. Tim sekolah tidak lagi berpindah-pindah sistem. Stabilitas sistem saat menangani aktivasi siswa sangat lancar berkat arsitektur headless ini.",
      name: "Ratna Sari",
      role: "Admin Sekolah",
    },
    {
      quote:
        "Sinkronisasi materi ajar berjalan tanpa cela. Guru tetap nyaman menyusun presentasi, sementara siswa menikmati pengalaman belajar yang super cepat dan interaktif di kelas.",
      name: "Bima Prakoso",
      role: "Guru Penggerak",
    },
    {
      quote:
        "Akses aset video pembelajaran dan game edukasi kini sangat efisien. Masalah buffering yang sering terjadi saat jam belajar sibuk sudah teratasi sepenuhnya.",
      name: "Ahmad Fauzi",
      role: "Kepala Kurikulum",
    },
  ];

  const sliderRef = useRef<HTMLDivElement>(null);

  const slideLeft = () => {
    if (sliderRef.current) {
      const cardWidth =
        (sliderRef.current.querySelector(".antigravity-card") as HTMLElement)
          ?.offsetWidth || 400;
      sliderRef.current.scrollBy({
        left: -(cardWidth + 24),
        behavior: "smooth",
      });
    }
  };

  const slideRight = () => {
    if (sliderRef.current) {
      const cardWidth =
        (sliderRef.current.querySelector(".antigravity-card") as HTMLElement)
          ?.offsetWidth || 400;
      sliderRef.current.scrollBy({ left: cardWidth + 24, behavior: "smooth" });
    }
  };

  return (
    <section
      id="testimoni"
      className="md-testimonials"
      style={{
        paddingTop: getPadding(paddingTop),
        paddingBottom: getPadding(paddingBottom),
      }}
    >
      <div className="md-container">
        <div className="md-testimonial-header">
          <div>
            <span className="md-kicker">{kicker}</span>
            <h2 className="md-section-title">{title}</h2>
          </div>
          <div className="md-slider-nav">
            <button
              onClick={slideLeft}
              className="md-nav-btn antigravity-btn group"
              aria-label="Previous"
            >
              <svg
                className="w-6 h-6 md-icon-left"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                ></path>
              </svg>
            </button>
            <button
              onClick={slideRight}
              className="md-nav-btn antigravity-btn group"
              aria-label="Next"
            >
              <svg
                className="w-6 h-6 md-icon-right"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5l7 7-7 7"
                ></path>
              </svg>
            </button>
          </div>
        </div>

        <div
          id="testimonial-slider"
          className="md-slider-track no-scrollbar"
          ref={sliderRef}
        >
          {safeItems.map((item: any, idx: number) => (
            <div
              key={idx}
              className={`md-testimonial-card antigravity-card ${idx === 1 ? "md-card-dark" : "md-card-light"}`}
            >
              <div className="md-quote-icon">
                <svg fill="currentColor" viewBox="0 0 32 32">
                  <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
                </svg>
              </div>
              <p className="md-quote-text">"{item.quote}"</p>
              <div className="md-author">
                <div
                  className="md-author-avatar"
                  style={
                    item.avatar
                      ? {
                          backgroundImage: `url(${item.avatar})`,
                          backgroundSize: "cover",
                        }
                      : {}
                  }
                ></div>
                <div>
                  <h4 className="md-author-name">{item.name}</h4>
                  <p className="md-author-role">{item.role}</p>
                </div>
              </div>
            </div>
          ))}
          <div className="md-slider-spacer"></div>
        </div>
      </div>
    </section>
  );
};

const RootComponent = ({
  children,
  paddingTop,
  paddingBottom,
  headerTitle,
  showFooter,
  footerText,
  navItems,
  headerLogo,
  headerColor,
  customCSS,
  headerBtnText,
  headerBtnLink,
  favicon,
  seoTitle,
  seoDescription,
  seoImage,
}: any) => {
  const safeNavItems = navItems || [
    { label: "Fitur", href: "#fitur" },
    { label: "Klien", href: "#klien" },
    { label: "Testimoni", href: "#testimoni" },
  ];

  useEffect(() => {
    if (favicon) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = favicon;
    }

    if (seoTitle) {
      document.title = seoTitle;
      let ogTitle = document.querySelector("meta[property='og:title']");
      if (!ogTitle) {
        ogTitle = document.createElement("meta");
        ogTitle.setAttribute("property", "og:title");
        document.head.appendChild(ogTitle);
      }
      ogTitle.setAttribute("content", seoTitle);
    }

    if (seoDescription) {
      let metaDesc = document.querySelector("meta[name='description']");
      if (!metaDesc) {
        metaDesc = document.createElement("meta");
        metaDesc.setAttribute("name", "description");
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute("content", seoDescription);

      let ogDesc = document.querySelector("meta[property='og:description']");
      if (!ogDesc) {
        ogDesc = document.createElement("meta");
        ogDesc.setAttribute("property", "og:description");
        document.head.appendChild(ogDesc);
      }
      ogDesc.setAttribute("content", seoDescription);
    }

    if (seoImage) {
      let ogImage = document.querySelector("meta[property='og:image']");
      if (!ogImage) {
        ogImage = document.createElement("meta");
        ogImage.setAttribute("property", "og:image");
        document.head.appendChild(ogImage);
      }
      ogImage.setAttribute("content", seoImage);

      let twImage = document.querySelector("meta[name='twitter:image']");
      if (!twImage) {
        twImage = document.createElement("meta");
        twImage.setAttribute("name", "twitter:image");
        document.head.appendChild(twImage);
      }
      twImage.setAttribute("content", seoImage);
    }
  }, [favicon, seoTitle, seoDescription, seoImage]);

  return (
    <div
      className="md-landing-wrapper"
      style={{
        paddingTop: getPadding(paddingTop),
        paddingBottom: getPadding(paddingBottom),
      }}
    >
      {customCSS && <style>{customCSS}</style>}
      {/* HEADER */}
      <header
        className={`md-header ${!headerColor ? "glass-nav" : ""}`}
        style={headerColor ? { backgroundColor: headerColor } : {}}
      >
        <div className="md-container md-header-inner">
          <Link to="/" className="md-brand" style={{ textDecoration: "none" }}>
            {headerLogo ? (
              <img
                src={headerLogo}
                alt="Logo"
                style={{ height: "32px", objectFit: "contain" }}
              />
            ) : (
              <div className="md-logo-icon">K</div>
            )}
            <span className="md-brand-name">{headerTitle || "KontenMu"}</span>
          </Link>
          <nav className="md-nav">
            {safeNavItems.map((item: any, i: number) => (
              <a key={i} href={item.href} className="md-nav-link">
                {item.label}
              </a>
            ))}
          </nav>
          <Link
            to={headerBtnLink || "/login"}
            className="md-btn-primary antigravity-btn"
          >
            {headerBtnText || "Mulai Demo"}
          </Link>
        </div>
      </header>

      <main>{children}</main>

      {/* FOOTER */}
      {showFooter !== false && (
        <footer className="md-footer">
          <div className="md-container md-footer-inner">
            <div className="md-brand-footer">
              {headerLogo ? (
                <img
                  src={headerLogo}
                  alt="Logo"
                  style={{ height: "24px", objectFit: "contain" }}
                />
              ) : (
                <div className="md-logo-icon-small">K</div>
              )}
              <span className="md-brand-name">{headerTitle || "KontenMu"}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <p className="md-footer-copy">
                {footerText || "© 2026 KontenMu. All rights reserved."}
              </p>
              <Link
                to="/editor"
                style={{
                  color: "var(--text-tertiary)",
                  textDecoration: "none",
                  fontSize: "12px",
                  opacity: 0.5,
                }}
              >
                Editor
              </Link>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export const puckConfig: Config<Props, RootProps> = {
  components: {
    Hero: {
      fields: {
        badgeText: { type: "text" },
        title1: { type: "text" },
        titleGradient: { type: "text" },
        description: { type: "textarea" },
        btnText: { type: "text" },
        btnLink: { type: "text" },
        heroImage: {
          type: "custom",
          render: ImageUploadField,
        },
        paddingTop: { type: "text" },
        paddingBottom: { type: "text" },
      },
      defaultProps: {
        badgeText: "🚀 Generasi Baru Portal Pendidikan",
        title1: "Tinggalkan Distribusi Manual. Beralih ke",
        titleGradient: "Ekosistem Konten Cerdas.",
        description:
          "Kombinasi fleksibilitas pengelolaan perpustakaan sekolah dan kecepatan absolut bagi siswa. Dirancang khusus untuk mendigitalkan materi ajar secara interaktif dan terpusat.",
        btnText: "Mulai Demo Gratis",
        btnLink: "/login",
      },
      render: ({
        badgeText,
        title1,
        titleGradient,
        description,
        btnText,
        btnLink,
        heroImage,
        paddingTop,
        paddingBottom,
      }) => (
        <section
          className="md-hero"
          style={{
            paddingTop: getPadding(paddingTop),
            paddingBottom: getPadding(paddingBottom),
          }}
        >
          <div className="md-orb orb-1"></div>
          <div className="md-orb orb-2"></div>

          <div className="md-container md-hero-content">
            <div className="md-badge antigravity-btn">{badgeText}</div>
            <h1 className="md-hero-title">
              {title1} <span className="md-gradient-text">{titleGradient}</span>
            </h1>
            <p className="md-hero-desc">{description}</p>
            <div className="md-hero-actions">
              <Link to={btnLink} className="md-btn-large antigravity-btn">
                {btnText}
              </Link>
            </div>

            <div className="md-hero-visual-wrapper">
              <div className="md-hero-visual antigravity-card">
                <img
                  src={heroImage || dashboardPreview}
                  alt="Dashboard Preview"
                  className="md-hero-img"
                />
              </div>
            </div>
          </div>
        </section>
      ),
    },
    SocialProof: {
      fields: {
        title: { type: "text" },
        clients: {
          type: "array",
          getItemSummary: (item) => item.name || "New Client",
          arrayFields: {
            name: { type: "text" },
            logoUrl: { type: "text" },
            logo: {
              type: "custom",
              render: ImageUploadField,
            },
          },
        },
        paddingTop: { type: "text" },
        paddingBottom: { type: "text" },
      },
      defaultProps: {
        title: "Dipercaya oleh Jaringan Ekosistem Sekolah Terkemuka",
        clients: [
          { name: "Dikdasmen" },
          { name: "PWM Jateng" },
          { name: "LabMu" },
          { name: "KontenMu Press" },
        ],
      },
      render: ({ title, clients, paddingTop, paddingBottom }) => {
        const safeClients = clients || [
          { name: "Dikdasmen" },
          { name: "PWM Jateng" },
          { name: "LabMu" },
          { name: "KontenMu Press" },
        ];
        return (
          <section
            id="klien"
            className="md-social-proof"
            style={{
              paddingTop: getPadding(paddingTop),
              paddingBottom: getPadding(paddingBottom),
            }}
          >
            <div className="md-container">
              <h2 className="md-kicker-center">{title}</h2>
              <div className="md-client-row">
                {safeClients.map((client, i) => {
                  const finalLogo = client.logo || client.logoUrl;
                  return (
                    <span
                      key={i}
                      className="md-client-logo"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                      }}
                    >
                      {finalLogo && (
                        <img
                          src={finalLogo}
                          alt={client.name}
                          style={{ maxHeight: "40px", objectFit: "contain" }}
                        />
                      )}
                      <span style={{ fontSize: "14px", fontWeight: 600 }}>
                        {client.name}
                      </span>
                    </span>
                  );
                })}
              </div>
            </div>
          </section>
        );
      },
    },
    Feature: {
      fields: {
        kicker: { type: "text" },
        title: { type: "text" },
        features: {
          type: "array",
          getItemSummary: (item) => item.subtitle || "Feature",
          arrayFields: {
            subtitle: { type: "text" },
            description: { type: "textarea" },
            iconText: { type: "text" },
            isReverse: {
              type: "radio",
              options: [
                { label: "Normal", value: false },
                { label: "Reversed", value: true },
              ],
            },
            image: {
              type: "custom",
              render: ImageUploadField,
            },
          },
        },
        paddingTop: { type: "text" },
        paddingBottom: { type: "text" },
      },
      defaultProps: {
        kicker: "Keunggulan Sistem",
        title: "Didesain Untuk Pembelajaran Modern",
        features: [
          {
            subtitle: "Distribusi Media Tanpa Batas",
            description:
              "Kami mengintegrasikan sistem dengan infrastruktur visual interaktif. Pengelolaan aset Game HTML5 dan video resolusi tinggi kini tidak lagi membebani jaringan sekolah Anda.",
            iconText: "Materi Interaktif & Multimedia",
            isReverse: false,
          },
          {
            subtitle: "Manajemen Terpusat & Lisensi",
            description:
              "Memanfaatkan dashboard mutakhir untuk memantau alur distribusi agen. Mengatur aktivasi langganan sekolah dan siswa kini menjadi transparan secara *real-time*.",
            iconText: "",
            isReverse: true,
          },
        ],
      },
      render: ({ kicker, title, features, paddingTop, paddingBottom }) => {
        const safeFeatures = features || [
          {
            subtitle: "Distribusi Media Tanpa Batas",
            description:
              "Kami mengintegrasikan sistem dengan infrastruktur visual interaktif. Pengelolaan aset Game HTML5 dan video resolusi tinggi kini tidak lagi membebani jaringan sekolah Anda.",
            iconText: "Materi Interaktif & Multimedia",
            isReverse: false,
          },
          {
            subtitle: "Manajemen Terpusat & Lisensi",
            description:
              "Memanfaatkan dashboard mutakhir untuk memantau alur distribusi agen. Mengatur aktivasi langganan sekolah dan siswa kini menjadi transparan secara *real-time*.",
            iconText: "",
            isReverse: true,
          },
        ];
        return (
          <section
            id="fitur"
            className="md-features"
            style={{
              paddingTop: getPadding(paddingTop),
              paddingBottom: getPadding(paddingBottom),
            }}
          >
            <div className="md-container">
              <div className="md-section-header">
                <span className="md-kicker">{kicker}</span>
                <h2 className="md-section-title">{title}</h2>
              </div>
              {safeFeatures.map((feat, i) => (
                <div
                  key={i}
                  className={`md-feature-row ${feat.isReverse ? "md-feature-reverse" : ""}`}
                >
                  {!feat.isReverse ? (
                    <>
                      <div className="md-feature-text">
                        <h3 className="md-feature-subtitle">{feat.subtitle}</h3>
                        <p className="md-feature-desc">{feat.description}</p>
                      </div>
                      <div className="md-feature-box antigravity-card">
                        {feat.image ? (
                          <img
                            src={feat.image}
                            alt={feat.subtitle}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              borderRadius: "inherit",
                            }}
                          />
                        ) : (
                          <div className="md-feature-box-inner">
                            <svg
                              className="md-feature-icon"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.5"
                                d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                              ></path>
                            </svg>
                            <span>{feat.iconText}</span>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="md-feature-box antigravity-card md-feature-box-brand">
                        {feat.image ? (
                          <img
                            src={feat.image}
                            alt={feat.subtitle}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              borderRadius: "inherit",
                            }}
                          />
                        ) : (
                          <div className="md-feature-mock-ui">
                            <div className="md-mock-bar w-75"></div>
                            <div className="md-mock-bar w-50"></div>
                          </div>
                        )}
                      </div>
                      <div className="md-feature-text">
                        <h3 className="md-feature-subtitle">{feat.subtitle}</h3>
                        <p className="md-feature-desc">{feat.description}</p>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      },
    },
    Testimonials: {
      fields: {
        kicker: { type: "text" },
        title: { type: "text" },
        items: {
          type: "array",
          getItemSummary: (item) => item.name || "Testimonial",
          arrayFields: {
            quote: { type: "textarea" },
            name: { type: "text" },
            role: { type: "text" },
            avatar: {
              type: "custom",
              render: ImageUploadField,
            },
          },
        },
        paddingTop: { type: "text" },
        paddingBottom: { type: "text" },
      },
      defaultProps: {
        kicker: "Bukti Nyata",
        title: "Dampak Terukur pada Sistem Sekolah",
        items: [
          {
            quote:
              "Distribusi konten pendidikan jadi jauh lebih rapi. Tim sekolah tidak lagi berpindah-pindah sistem. Stabilitas sistem saat menangani aktivasi siswa sangat lancar berkat arsitektur headless ini.",
            name: "Ratna Sari",
            role: "Admin Sekolah",
          },
          {
            quote:
              "Sinkronisasi materi ajar berjalan tanpa cela. Guru tetap nyaman menyusun presentasi, sementara siswa menikmati pengalaman belajar yang super cepat dan interaktif di kelas.",
            name: "Bima Prakoso",
            role: "Guru Penggerak",
          },
          {
            quote:
              "Akses aset video pembelajaran dan game edukasi kini sangat efisien. Masalah buffering yang sering terjadi saat jam belajar sibuk sudah teratasi sepenuhnya.",
            name: "Ahmad Fauzi",
            role: "Kepala Kurikulum",
          },
        ],
      },
      render: TestimonialsComponent,
    },
    CTA: {
      fields: {
        title: { type: "text" },
        description: { type: "textarea" },
        btnText: { type: "text" },
        btnLink: { type: "text" },
        footerText: { type: "text" },
        paddingTop: { type: "text" },
        paddingBottom: { type: "text" },
      },
      defaultProps: {
        title: "Tingkatkan Antusiasme Belajar Siswa.",
        description:
          "Jangan biarkan keterbatasan distribusi menghambat potensi sekolah Anda. Bangun ekosistem belajar performa tinggi dan kelola dengan transparan hari ini.",
        btnText: "Mulai Transformasi Sekarang",
        btnLink: "/login",
        footerText: "Memberdayakan Sekolah di Seluruh Nusantara.",
      },
      render: ({
        title,
        description,
        btnText,
        btnLink,
        footerText,
        paddingTop,
        paddingBottom,
      }) => (
        <section
          id="cta"
          className="md-cta"
          style={{
            paddingTop: getPadding(paddingTop),
            paddingBottom: getPadding(paddingBottom),
          }}
        >
          <div className="md-cta-bg"></div>
          <div className="md-container md-cta-content">
            <h2 className="md-cta-title">{title}</h2>
            <p className="md-cta-desc">{description}</p>
            <div className="md-cta-actions">
              <Link to={btnLink} className="md-btn-large antigravity-btn">
                {btnText}
              </Link>
            </div>
            <p className="md-cta-footer-text">{footerText}</p>
          </div>
        </section>
      ),
    },
    CustomHTML: {
      fields: {
        html: { type: "textarea" },
        paddingTop: { type: "text" },
        paddingBottom: { type: "text" },
      },
      defaultProps: {
        html: '<div style="text-align: center; padding: 20px;">\n  <h2>Custom HTML Block</h2>\n  <p>Anda bisa menaruh tag script, iframe, atau elemen HTML bebas di sini.</p>\n</div>',
      },
      render: ({ html, paddingTop, paddingBottom }) => (
        <section
          style={{
            paddingTop: getPadding(paddingTop),
            paddingBottom: getPadding(paddingBottom),
          }}
          dangerouslySetInnerHTML={{ __html: html || "" }}
        />
      ),
    },
  },
  root: {
    fields: {
      paddingTop: { type: "text" },
      paddingBottom: { type: "text" },
      headerTitle: { type: "text" },
      showFooter: {
        type: "radio",
        options: [
          { label: "Tampil", value: true },
          { label: "Sembunyi", value: false },
        ],
      },
      footerText: { type: "text" },
      headerLogo: {
        type: "custom",
        render: ImageUploadField,
      },
      headerColor: {
        type: "custom",
        render: ColorPickerField,
      },
      headerBtnText: { type: "text" },
      headerBtnLink: { type: "text" },
      favicon: {
        type: "custom",
        render: ImageUploadField,
      },
      seoTitle: { type: "text" },
      seoDescription: { type: "textarea" },
      seoImage: {
        type: "custom",
        render: ImageUploadField,
      },
      customCSS: { type: "textarea" },
      navItems: {
        type: "array",
        getItemSummary: (item) => item.label || "Link",
        arrayFields: {
          label: { type: "text" },
          href: { type: "text" },
        },
      },
    },
    defaultProps: {
      paddingTop: "0px",
      paddingBottom: "0px",
      headerTitle: "KontenMu",
      showFooter: true,
      footerText: "© 2026 KontenMu. All rights reserved.",
      navItems: [
        { label: "Fitur", href: "#fitur" },
        { label: "Klien", href: "#klien" },
        { label: "Testimoni", href: "#testimoni" },
      ],
      headerColor: "",
      customCSS: "",
      headerBtnText: "Mulai Demo",
      headerBtnLink: "/login",
      seoTitle: "KontenMu - Portal Pendidikan",
      seoDescription: "Generasi Baru Portal Pendidikan",
    },
    render: RootComponent,
  },
};

export const initialData = {
  content: [
    { type: "Hero", props: { id: "hero-1" } },
    { type: "SocialProof", props: { id: "proof-1" } },
    { type: "Feature", props: { id: "feat-1" } },
    { type: "Testimonials", props: { id: "test-1" } },
    { type: "CTA", props: { id: "cta-1" } },
  ],
  root: {},
  zones: {},
};
