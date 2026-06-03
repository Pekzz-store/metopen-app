import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Info, Target, Layers } from 'lucide-react';

const AboutUs = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '20px', paddingBottom: '80px', display: 'flex', flexDirection: 'column', height: '100%', minHeight: '100vh', background: 'var(--bg-color, #f8f9fa)' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
        <button 
          onClick={() => navigate('/profile')}
          style={{ background: 'none', border: 'none', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-color)' }}
        >
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 600, marginLeft: '8px' }}>Tentang Aplikasi</h1>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '16px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 4px 12px rgba(109, 40, 217, 0.2)' }}>
            <Info size={40} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>Smart Parking</h2>
          <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '4px 12px', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 600 }}>Versi 1.0.0</span>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--primary)', fontWeight: 600 }}>
            <Layers size={20} />
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Tentang Aplikasi</h3>
          </div>
          <p style={{ lineHeight: '1.6', color: 'var(--text-muted)' }}>
            Aplikasi Smart Parking adalah solusi inovatif yang dirancang untuk mempermudah pengendara dalam mencari, memilih, dan menuju ke lokasi parkir yang tersedia secara real-time, khususnya di area Surabaya.
          </p>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--primary)', fontWeight: 600 }}>
            <Target size={20} />
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Tujuan Pembuatan</h3>
          </div>
          <ul style={{ lineHeight: '1.6', color: 'var(--text-muted)', paddingLeft: '20px', margin: 0 }}>
            <li style={{ marginBottom: '8px' }}>Menghemat waktu pengguna dalam mencari tempat parkir kosong.</li>
            <li style={{ marginBottom: '8px' }}>Mengurangi kemacetan yang sering terjadi akibat antrean atau pencarian tempat parkir.</li>
            <li>Memberikan rekomendasi parkir terbaik berdasarkan jarak dan kebutuhan pengguna.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
