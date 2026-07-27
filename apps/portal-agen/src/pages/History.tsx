import { useState, useMemo } from 'react';
import { GlassCard } from '../../../../packages/ui/src/GlassCard';
import { Chip } from '../../../../packages/ui/src/Chip';
import { TableSearch, TablePagination } from '../../../../packages/ui/src/TableControls';
import { formatCurrency, formatNumber, getBook, getSchool, saleCommission, saleDiscount, saleInvoiceTotal, saleSubtotal, useAppData } from '../data/appData';
import { Eye, Edit2, Trash2, Printer, X, AlertTriangle } from 'lucide-react';

export default function History() {
  const { data, setData } = useAppData();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 25;
  const [previewRow, setPreviewRow] = useState<any>(null);
  const [editRow, setEditRow] = useState<any>(null);
  const [deleteRow, setDeleteRow] = useState<any>(null);

  const filteredSales = useMemo(() => {
    return data.sales.filter(row => {
      const school = getSchool(data, row.schoolId);
      const book = getBook(data, row.isbn);
      const schoolName = school?.nama?.toLowerCase() || '';
      const invoiceNo = row.invoiceNo?.toLowerCase() || '';
      const packageName = row.paket?.toLowerCase() || '';
      const bookTitle = book?.judul?.toLowerCase() || '';
      const s = search.toLowerCase();
      
      return schoolName.includes(s) || invoiceNo.includes(s) || packageName.includes(s) || bookTitle.includes(s);
    });
  }, [data, search]);

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage) || 1;
  const paginatedSales = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredSales.slice(start, start + itemsPerPage);
  }, [filteredSales, page]);

  return (
    <div className="page-shell">
      <GlassCard style={{ width: '100%' }}>
        <div className="panel-heading">
          <div>
            <h2>Riwayat Penjualan</h2>
            <p>Transaksi gelondongan yang tersimpan di sistem.</p>
          </div>
          <div>
            <TableSearch value={search} onChange={(val) => { setSearch(val); setPage(1); }} placeholder="Cari invoice atau sekolah..." />
          </div>
        </div>

        <div className="table-scroll">
          <table className="table-promax">
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Invoice</th>
                <th style={{ textAlign: 'left' }}>Sekolah</th>
                <th style={{ textAlign: 'left' }}>Paket / Periode</th>
                <th style={{ textAlign: 'center' }}>Jumlah</th>
                <th style={{ textAlign: 'right' }}>Subtotal</th>
                <th style={{ textAlign: 'right' }}>Diskon</th>
                <th style={{ textAlign: 'right' }}>Komisi Agen</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th style={{ textAlign: 'center' }}>Tanggal</th>
                <th style={{ textAlign: 'center', width: '120px' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSales.map((row) => {
                const school = getSchool(data, row.schoolId);
                const book = getBook(data, row.isbn);
                return (
                  <tr key={row.id}>
                    <td>{row.invoiceNo ?? `#${row.id.toString().padStart(4, '0')}`}</td>
                    <td>{school?.nama ?? '-'}</td>
                    <td>{row.paket ? `${row.paket}${row.durasiBulan ? ` · ${row.durasiBulan} bln` : ''}` : book?.judul ?? row.isbn}</td>
                    <td style={{ textAlign: 'center' }}>{formatNumber(row.jumlah)} Lisensi</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(saleSubtotal(row, book))}</td>
                    <td style={{ color: 'var(--warning)', textAlign: 'right' }}>{formatCurrency(saleDiscount(row, book))}</td>
                    <td style={{ color: 'var(--accent-primary)', textAlign: 'right' }}>{formatCurrency(saleCommission(row, book))}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(saleInvoiceTotal(row, book))}</td>
                    <td style={{ textAlign: 'center' }}><Chip type="success" label={new Date(row.tanggal).toLocaleDateString('id-ID')} /></td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button className="icon-button" style={{ color: 'var(--primary)', padding: '6px' }} onClick={() => setPreviewRow(row)} title="Preview & Cetak"><Eye size={18} /></button>
                        <button className="icon-button" style={{ color: 'var(--warning)', padding: '6px' }} onClick={() => setEditRow(row)} title="Edit"><Edit2 size={18} /></button>
                        <button className="icon-button" style={{ color: 'var(--danger)', padding: '6px' }} onClick={() => setDeleteRow(row)} title="Hapus"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <TablePagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </GlassCard>

      {/* MODAL PREVIEW & CETAK */}
      {previewRow && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'var(--bg-primary)', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>Detail Invoice</h3>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => {
                  const printContent = document.getElementById('print-area');
                  if (printContent) {
                    const originalContents = document.body.innerHTML;
                    document.body.innerHTML = printContent.innerHTML;
                    window.print();
                    document.body.innerHTML = originalContents;
                    window.location.reload();
                  }
                }} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--primary)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                  <Printer size={16} /> Cetak
                </button>
                <button onClick={() => setPreviewRow(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-secondary)' }}><X size={24} /></button>
              </div>
            </div>
            
            <div id="print-area" style={{ color: 'var(--text-primary)' }}>
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <h2 style={{ margin: '0 0 8px 0', fontSize: '1.5rem' }}>INVOICE PENJUALAN</h2>
                <p style={{ margin: 0, color: '#64748b' }}>Nomor: {previewRow.invoiceNo ?? `#${previewRow.id.toString().padStart(4, '0')}`}</p>
                <p style={{ margin: 0, color: '#64748b' }}>Tanggal: {new Date(previewRow.tanggal).toLocaleDateString('id-ID')}</p>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#64748b', fontSize: '0.875rem', textTransform: 'uppercase' }}>Informasi Pelanggan</h4>
                <p style={{ margin: '0 0 4px 0', fontWeight: 600, fontSize: '1.125rem' }}>{getSchool(data, previewRow.schoolId)?.nama ?? '-'}</p>
                <p style={{ margin: 0, color: '#64748b' }}>{getSchool(data, previewRow.schoolId)?.alamat ?? '-'}</p>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '32px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ textAlign: 'left', padding: '12px 0', color: '#64748b' }}>Deskripsi</th>
                    <th style={{ textAlign: 'center', padding: '12px 0', color: '#64748b' }}>Jumlah</th>
                    <th style={{ textAlign: 'right', padding: '12px 0', color: '#64748b' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '16px 0' }}>{previewRow.paket ? `${previewRow.paket} (${previewRow.durasiBulan} bulan)` : getBook(data, previewRow.isbn)?.judul ?? previewRow.isbn}</td>
                    <td style={{ textAlign: 'center', padding: '16px 0' }}>{formatNumber(previewRow.jumlah)} Lisensi</td>
                    <td style={{ textAlign: 'right', padding: '16px 0' }}>{formatCurrency(saleSubtotal(previewRow, getBook(data, previewRow.isbn)))}</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: '300px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#64748b' }}>
                    <span>Subtotal:</span>
                    <span>{formatCurrency(saleSubtotal(previewRow, getBook(data, previewRow.isbn)))}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#ef4444' }}>
                    <span>Diskon:</span>
                    <span>-{formatCurrency(saleDiscount(previewRow, getBook(data, previewRow.isbn)))}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '16px', borderTop: '2px solid #e2e8f0', fontWeight: 700, fontSize: '1.25rem' }}>
                    <span>Total Tagihan:</span>
                    <span>{formatCurrency(saleInvoiceTotal(previewRow, getBook(data, previewRow.isbn)))}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT */}
      {editRow && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'var(--bg-primary)', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '500px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Edit Transaksi</h3>
              <button onClick={() => setEditRow(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={24} /></button>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.5 }}>
              Fitur Edit transaksi penjualan akan terintegrasi langsung dengan formulir <strong>Input Penjualan</strong> pada pembaruan sistem berikutnya. 
              Saat ini data bersifat <em>read-only</em> untuk menjaga konsistensi laporan keuangan.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setEditRow(null)} style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DELETE */}
      {deleteRow && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'var(--bg-primary)', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'inline-flex', padding: '16px', background: '#fee2e2', color: '#ef4444', borderRadius: '50%', marginBottom: '24px' }}>
              <AlertTriangle size={32} />
            </div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.25rem' }}>Hapus Transaksi?</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: 1.5 }}>
              Apakah Anda yakin ingin menghapus invoice <strong>{deleteRow.invoiceNo ?? `#${deleteRow.id}`}</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button onClick={() => setDeleteRow(null)} style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, flex: 1 }}>Batal</button>
              <button onClick={() => {
                setData(prev => ({ ...prev, sales: prev.sales.filter(s => s.id !== deleteRow.id) }));
                setDeleteRow(null);
              }} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, flex: 1 }}>Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
