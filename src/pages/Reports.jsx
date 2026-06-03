import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

const Reports = () => {
  const [rangeType, setRangeType] = useState('day');
  const [startDate, setStartDate] = useState(() => startOfDay(new Date()));
  const [endDate, setEndDate] = useState(() => endOfDay(new Date()));
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    // set start/end based on rangeType
    const now = new Date();
    if (rangeType === 'day') {
      Promise.resolve().then(() => { setStartDate(startOfDay(now)); setEndDate(endOfDay(now)); });
    } else if (rangeType === 'week') {
      const s = startOfWeek(now);
      Promise.resolve().then(() => { setStartDate(s); setEndDate(endOfDay(addDays(s, 6))); });
    } else if (rangeType === 'month') {
      const s = startOfMonth(now);
      Promise.resolve().then(() => { setStartDate(s); setEndDate(endOfDay(endOfMonth(now))); });
    }
  }, [rangeType]);
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const from = startDate.toISOString();
        const to = endDate.toISOString();
        const { data, error } = await supabase
          .from('reservations')
          .select('*, parking_locations(name)')
          .gte('created_at', from)
          .lte('created_at', to)
          .order('created_at', { ascending: false });
        if (error) throw error;
        if (!mounted) return;
        setRows(data || []);
      } catch (err) {
        console.error('Error fetching reports:', err);
        if (!mounted) return;
        setRows([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [startDate, endDate]);

  // Expose manual refresh (used by "Terapkan" button)
  async function refreshData() {
    setLoading(true);
    try {
      const from = startDate.toISOString();
      const to = endDate.toISOString();
      const { data, error } = await supabase
        .from('reservations')
        .select('*, parking_locations(name)')
        .gte('created_at', from)
        .lte('created_at', to)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRows(data || []);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Laporan Transaksi Parkir</h2>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 12, marginBottom: 12 }}>
        <button className={rangeType === 'day' ? 'btn btn-primary' : 'btn btn-outline'} onClick={() => setRangeType('day')}>Harian</button>
        <button className={rangeType === 'week' ? 'btn btn-primary' : 'btn btn-outline'} onClick={() => setRangeType('week')}>Mingguan</button>
        <button className={rangeType === 'month' ? 'btn btn-primary' : 'btn btn-outline'} onClick={() => setRangeType('month')}>Bulanan</button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ fontSize: 12 }}>Dari</label>
          <input type="date" value={formatInput(startDate)} onChange={e => setStartDate(startOfDay(new Date(e.target.value)))} />
          <label style={{ fontSize: 12 }}>Sampai</label>
          <input type="date" value={formatInput(endDate)} onChange={e => setEndDate(endOfDay(new Date(e.target.value)))} />
          <button className="btn btn-primary" onClick={refreshData}>Terapkan</button>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ marginBottom: 8 }}><strong>Total transaksi:</strong> {rows.length}</div>
        {loading ? <div>Mengambil data...</div> : (
          <div style={{ background: 'white', borderRadius: 8, border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#F8FAFC' }}>
                <tr>
                  <th style={{ padding: 12, textAlign: 'left' }}>Waktu</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Pengguna</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>No. Polisi</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Lokasi</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: 12 }}>{format(new Date(r.created_at), 'yyyy-MM-dd HH:mm:ss')}</td>
                    <td style={{ padding: 12 }}>{r.user_name}</td>
                    <td style={{ padding: 12 }}>{r.license_plate}</td>
                    <td style={{ padding: 12 }}>{r.parking_locations?.name || '-'}</td>
                    <td style={{ padding: 12 }}>{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// helper date utils (avoid external deps besides date-fns for formatting)
function startOfDay(d) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function endOfDay(d) { const x = new Date(d); x.setHours(23,59,59,999); return x; }
function startOfWeek(d) { const x = startOfDay(d); const day = x.getDay(); const diff = (day + 6) % 7; x.setDate(x.getDate() - diff); return startOfDay(x); }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function startOfMonth(d) { const x = new Date(d.getFullYear(), d.getMonth(), 1); return startOfDay(x); }
function endOfMonth(d) { const x = new Date(d.getFullYear(), d.getMonth() + 1, 0); return endOfDay(x); }
function formatInput(d) { return format(new Date(d), 'yyyy-MM-dd'); }

export default Reports;
