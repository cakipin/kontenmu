import { useState, useMemo } from 'react';
import { GlassCard } from '../../../../packages/ui/src/GlassCard';
import { Chip } from '../../../../packages/ui/src/Chip';
import { TableSearch, TablePagination } from '../../../../packages/ui/src/TableControls';
import { formatCurrency, formatNumber, getBook, getSchool, saleCommission, saleDiscount, saleInvoiceTotal, saleSubtotal, useAppData } from '../data/appData';

export default function History() {
  const { data } = useAppData();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 25;

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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <TablePagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </GlassCard>
    </div>
  );
}
