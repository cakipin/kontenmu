import { useState, useEffect } from 'react';
import { useAppData } from '../data/appData';

export function SchoolSearchInput({ value, onChange, className, subscribedOnly = false, agentFilter }: { value: string, onChange: (val: string, id?: number, school?: any) => void, className?: string, subscribedOnly?: boolean, agentFilter?: string }) {
  const [searchQuery, setSearchQuery] = useState(value || '');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const { data } = useAppData();

  useEffect(() => {
    setSearchQuery(value || '');
  }, [value]);

  useEffect(() => {
    if (searchQuery.length >= 3 && isOpen) {
      setIsSearching(true);
      
      if (agentFilter && data && data.schools) {
        const timer = setTimeout(() => {
          const lowerQuery = searchQuery.toLowerCase();
          const agentSchools = data.schools.filter(school => school.agen === agentFilter);
          const results = agentSchools.filter(s => s.nama.toLowerCase().includes(lowerQuery) || (s.npsn && s.npsn.includes(lowerQuery)));
          setSearchResults(results.slice(0, 20));
          setIsSearching(false);
        }, 300);
        return () => clearTimeout(timer);
      } else if (subscribedOnly && data && data.schools && data.sales) {
        const timer = setTimeout(() => {
          const lowerQuery = searchQuery.toLowerCase();
          const subscribedSchools = data.schools.filter(school => 
            data.sales.some(s => s.schoolId === school.id || data.schools.find(ds => ds.id === s.schoolId)?.npsn === school.npsn)
          );
          
          const results = subscribedSchools.filter(s => s.nama.toLowerCase().includes(lowerQuery) || (s.npsn && s.npsn.includes(lowerQuery)));
          setSearchResults(results.slice(0, 20));
          setIsSearching(false);
        }, 300);
        return () => clearTimeout(timer);
      } else {
        const timer = setTimeout(() => {
          const baseUrl = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || 'https://sales-api.1912.workers.dev');
          fetch(`${baseUrl}/api/sekolah?search=` + encodeURIComponent(searchQuery))
            .then(res => res.json())
            .then(resData => {
              if (resData.success) setSearchResults(resData.data || []);
            })
            .catch(err => console.error(err))
            .finally(() => setIsSearching(false));
        }, 500);
        return () => clearTimeout(timer);
      }
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, isOpen]);

  return (
    <div style={{ position: 'relative' }}>
      <input 
        className={className || "input-control"}
        type="text" 
        value={searchQuery}
        onFocus={() => setIsOpen(true)}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          onChange(e.target.value, undefined);
          setIsOpen(true);
        }}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        placeholder="Ketik untuk mencari sekolah..."
        required
      />
      {isSearching && isOpen && (
        <div style={{ position: 'absolute', right: '16px', top: '12px', color: 'var(--text-secondary)' }}>Mencari...</div>
      )}
      {isOpen && searchQuery.length > 0 && searchQuery.length < 3 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'var(--bg-primary, #ffffff)', border: '1px solid var(--border-subtle, #e2e8f0)', borderRadius: '8px', marginTop: '4px', zIndex: 99999, padding: '12px', fontSize: '0.85rem', color: 'var(--text-secondary, #64748b)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}>
          Ketik minimal 3 huruf untuk memunculkan pilihan sekolah...
        </div>
      )}
      {isOpen && searchQuery.length >= 3 && !isSearching && searchResults.length === 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'var(--bg-primary, #ffffff)', border: '1px solid var(--border-subtle, #e2e8f0)', borderRadius: '8px', marginTop: '4px', zIndex: 99999, padding: '12px', fontSize: '0.85rem', color: 'var(--text-secondary, #64748b)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}>
          Tidak menemukan sekolah dengan nama "{searchQuery}".
        </div>
      )}
      {isOpen && searchResults.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'var(--bg-primary, #ffffff)', border: '1px solid var(--border-subtle, #e2e8f0)', borderRadius: '8px', marginTop: '4px', zIndex: 99999, maxHeight: '200px', overflowY: 'auto', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}>
          {searchResults.map((res: any) => (
            <div 
              key={res.id} 
              style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-subtle, #e2e8f0)', cursor: 'pointer', fontSize: '0.85rem' }}
              onClick={() => {
                setSearchQuery(res.nama);
                onChange(res.nama, res.id, res);
                setIsOpen(false);
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--text-primary, #1e293b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{res.nama}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary, #64748b)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>NPSN: {res.npsn || '-'} | {res.kota || res.kabupaten}, {res.provinsi}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
