import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { PlusSquare, Edit2, Trash2 } from 'lucide-react';

const emptyVehicle = () => ({ id: null, license_plate: '', vehicle_type: 'Mobil' });

const MyVehicles = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState(emptyVehicle());
  const [editingId, setEditingId] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [tableMissing, setTableMissing] = useState(false);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('vehicles').select('id, license_plate, vehicle_type, created_at').eq('user_id', user.id).order('created_at', { ascending: false });
        if (error) {
          // detect missing table (REST 404) and set flag to show helpful message
          if (error.status === 404 || /not found/i.test(error.message || '')) {
            setTableMissing(true);
            return;
          }
          if (error.code !== 'PGRST116') throw error;
        }
        if (!mounted) return;
        setVehicles(data || []);
      } catch (err) {
        console.error('Error loading vehicles:', err);
        if (err && (err.status === 404 || /not found/i.test(err.message || ''))) {
          setTableMissing(true);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [user]);

  const startAdd = () => {
    setForm(emptyVehicle());
    setEditingId(null);
    setIsAdding(true);
  };

  const startEdit = (v) => {
    setForm({ id: v.id, license_plate: v.license_plate, vehicle_type: v.vehicle_type });
    setEditingId(v.id);
    setIsAdding(true);
  };

  const save = async () => {
    if (!user) return alert('Not authenticated');
    if (!form.license_plate) return alert('Isi nomor polisi');
    setLoading(true);
    try {
      if (editingId) {
        const { error } = await supabase.from('vehicles').update({ license_plate: form.license_plate, vehicle_type: form.vehicle_type }).eq('id', editingId).eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('vehicles').insert([{ user_id: user.id, license_plate: form.license_plate, vehicle_type: form.vehicle_type }]);
        if (error) throw error;
      }
      // reload
      const { data } = await supabase.from('vehicles').select('id, license_plate, vehicle_type, created_at').eq('user_id', user.id).order('created_at', { ascending: false });
      setVehicles(data || []);
      setForm(emptyVehicle());
      setEditingId(null);
      setIsAdding(false);
    } catch (err) {
      console.error('Error saving vehicle:', err);
      if (err && (err.status === 404 || /not found/i.test(err.message || ''))) setTableMissing(true);
      alert('Gagal menyimpan kendaraan. Cek console.');
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Hapus kendaraan ini?')) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('vehicles').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      setVehicles(prev => prev.filter(v => v.id !== id));
    } catch (err) {
      console.error('Error deleting vehicle:', err);
      if (err && (err.status === 404 || /not found/i.test(err.message || ''))) setTableMissing(true);
      alert('Gagal menghapus kendaraan. Cek console.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Kendaraan Saya</h2>
        <div>
          <button
            onClick={startAdd}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#6d28d9', color: 'white', border: 'none', padding: '10px 16px', borderRadius: 8, cursor: 'pointer' }}
          >
            <PlusSquare size={18} /> Tambah Kendaraan
          </button>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        {loading ? <div>Memuat...</div> : (
          <div>
            {tableMissing && (
              <div style={{ marginBottom: 12 }}>
                <div className="card" style={{ padding: 16, background: '#fff7ed', border: '1px solid #fcd34d' }}>
                  <div style={{ fontWeight: 700, color: '#92400e' }}>Tabel "vehicles" tidak ditemukan di Supabase</div>
                  <div style={{ marginTop: 8, color: '#92400e' }}>Jalankan file <strong>sql/supabase_vehicles.sql</strong> di Supabase SQL Editor untuk membuat tabel dan policy RLS.</div>
                </div>
              </div>
            )}

            <div className="table-responsive" style={{ background: 'white', borderRadius: 8, padding: 16, boxShadow: '0 0 0 1px rgba(0,0,0,0.02)' }}>
              <div style={{ marginBottom: 12, fontWeight: 600 }}>Daftar Kendaraan</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    <th style={{ padding: '12px 8px', whiteSpace: 'nowrap' }}>Plat Nomor</th>
                    <th style={{ padding: '12px 8px', whiteSpace: 'nowrap' }}>Jenis</th>
                    <th style={{ padding: '12px 8px', whiteSpace: 'nowrap' }}>Status</th>
                    <th style={{ padding: '12px 8px', whiteSpace: 'nowrap' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ padding: 16 }}>Belum ada kendaraan terdaftar.</td>
                    </tr>
                  )}
                  {vehicles.map((v, idx) => (
                    <tr key={v.id} style={{ borderTop: '1px solid rgba(0,0,0,0.04)', background: idx % 2 === 0 ? 'transparent' : '#fbfbfb' }}>
                      <td style={{ padding: '12px 8px', whiteSpace: 'nowrap' }}>{v.license_plate}</td>
                      <td style={{ padding: '12px 8px', whiteSpace: 'nowrap' }}>{v.vehicle_type}</td>
                      <td style={{ padding: '12px 8px', whiteSpace: 'nowrap' }}>
                        <span style={{ background: '#ecfdf5', color: '#065f46', padding: '6px 8px', borderRadius: 999, fontSize: '0.85rem', fontWeight: 600 }}>Aktif</span>
                      </td>
                      <td style={{ padding: '12px 8px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => startEdit(v)} title="Ubah" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', padding: 8, borderRadius: 8, cursor: 'pointer' }}><Edit2 size={16} /></button>
                          <button onClick={() => remove(v.id)} title="Hapus" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', padding: 8, borderRadius: 8, cursor: 'pointer', color: '#ef4444' }}><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {isAdding && (
              <div style={{ marginTop: 20 }}>
                <div className="card" style={{ padding: 16 }}>
                  <h4 style={{ marginTop: 0 }}>{editingId ? 'Ubah Kendaraan' : 'Tambah Kendaraan'}</h4>
                  <div className="vehicle-form-row" style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
                    <input value={form.license_plate} onChange={e => setForm(prev => ({ ...prev, license_plate: e.target.value }))} placeholder="No. Polisi" style={{ padding: 8, minWidth: 200 }} />
                    <select value={form.vehicle_type} onChange={e => setForm(prev => ({ ...prev, vehicle_type: e.target.value }))} style={{ padding: 8 }}>
                      <option>Mobil</option>
                      <option>Motor</option>
                    </select>
                    <button onClick={save} disabled={loading} style={{ background: '#6d28d9', color: 'white', border: 'none', padding: '10px 16px', borderRadius: 8, cursor: 'pointer' }}>{editingId ? 'Simpan Perubahan' : 'Simpan'}</button>
                    <button onClick={() => { setForm(emptyVehicle()); setEditingId(null); setIsAdding(false); }} style={{ border: '1px solid #6d28d9', color: '#6d28d9', background: 'transparent', padding: '10px 16px', borderRadius: 8 }}>Batal</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyVehicles;
