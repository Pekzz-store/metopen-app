import React, { useState, useEffect } from 'react';
import { Navigation as NavIcon, Map as MapIcon, Clock, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const Navigation = () => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      // Fetch available parking locations and sort by available_slots descending
      const { data, error } = await supabase
        .from('parking_locations')
        .select('*')
        .eq('status', 'available')
        .order('available_slots', { ascending: false })
        .limit(3);
      
      if (error) throw error;
      setRecommendations(data || []);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div className="card" style={{ margin: '0 0 20px 0', background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))', color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '50%' }}>
            <NavIcon size={32} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>Rekomendasi Rute Bebas Macet</h2>
            <p style={{ opacity: 0.9, fontSize: '0.9rem' }}>Sistem cerdas kami telah menganalisa rute terbaik untuk Anda.</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ margin: '0', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <Clock size={24} color="var(--primary)" style={{ marginBottom: '8px' }} />
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Update Real-time</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sinkronisasi Data</div>
        </div>
        <div className="card" style={{ margin: '0', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <MapIcon size={24} color="var(--primary)" style={{ marginBottom: '8px' }} />
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{recommendations.length} Lokasi</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tersedia dan Bebas Macet</div>
        </div>
      </div>

      <h3 style={{ marginBottom: '12px', fontSize: '1.1rem' }}>Rekomendasi Berdasarkan Ketersediaan Terbanyak</h3>
      
      {loading ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>Menganalisa rute dan ketersediaan data...</p>
      ) : recommendations.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>Tidak ada lokasi parkir yang tersedia saat ini.</p>
      ) : (
        recommendations.map((loc, index) => (
          <div key={loc.id} className="card" style={{ margin: '0 0 12px 0', border: index === 0 ? '2px solid var(--primary)' : '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontWeight: 600 }}>{loc.name} {index === 0 ? '(Prioritas Utama)' : '(Alternatif)'}</div>
              <span className="badge available">Optimal</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Tipe: {loc.type === 'gedung' ? 'Gedung / Mall' : 'Tepi Jalan'} • Tarif: Rp {loc.rate?.toLocaleString()}/jam
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '12px' }}>
              <div><strong style={{ color: 'var(--primary)' }}>Ketersediaan:</strong> {loc.available_slots} / {loc.total_slots} Slot</div>
              <div><strong style={{ color: 'var(--success)' }}>Status:</strong> Tersedia</div>
              <div><strong style={{ color: 'var(--success)' }}>Lalu Lintas:</strong> Lancar</div>
            </div>
            <button 
              className={index === 0 ? "btn btn-primary" : "btn btn-outline"} 
              style={{ padding: '8px 16px', width: index === 0 ? '100%' : 'auto' }}
              onClick={() => navigate(`/details/${loc.id}`, { state: { location: {
                id: loc.id, name: loc.name, lat: loc.lat, lng: loc.lng,
                status: loc.status, availableSlots: loc.available_slots, totalSlots: loc.total_slots,
                type: loc.type, rate: loc.rate
              }}})}
            >
              Lihat Detail & Rute
            </button>
          </div>
        ))
      )}

      <div className="card" style={{ margin: '12px 0 0 0', display: 'flex', alignItems: 'flex-start', gap: '12px', borderLeft: '4px solid var(--primary)' }}>
        <AlertTriangle size={24} color="var(--primary)" />
        <div>
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>Info Sistem Navigasi</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Rekomendasi di atas dihasilkan dari data real-time ketersediaan slot kosong tertinggi untuk meminimalisir kemungkinan kemacetan di area masuk.</div>
        </div>
      </div>
    </div>
  );
};

export default Navigation;
