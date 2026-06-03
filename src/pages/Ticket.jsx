import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, CheckCircle2, MapPin, Car, User, Clock, QrCode } from 'lucide-react';

const Ticket = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTicket() {
      try {
        const { data, error } = await supabase
          .from('reservations')
          .select(`
            *,
            parking_locations (
              name,
              type
            )
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        setTicket(data);
      } catch (err) {
        console.error('Error fetching ticket:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchTicket();
  }, [id]);

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Memuat tiket...</div>;
  }

  if (!ticket) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h2>Tiket tidak ditemukan</h2>
        <button className="btn btn-primary" onClick={() => navigate('/')}>Kembali ke Beranda</button>
      </div>
    );
  }

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' });
  };

  return (
    <div style={{ padding: '20px', paddingBottom: '100px', maxWidth: '600px', margin: '0 auto' }}>
      <button 
        onClick={() => navigate('/')} 
        style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '24px', color: 'var(--text-main)' }}
      >
        <ArrowLeft size={20} />
        <span style={{ fontWeight: 500 }}>Ke Beranda</span>
      </button>

      <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
        {/* Header Ticket */}
        <div style={{ background: 'var(--primary)', color: 'white', padding: '24px', textAlign: 'center' }}>
          <CheckCircle2 size={48} color="#D1FAE5" style={{ marginBottom: '12px' }} />
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>E-Ticket Parkir</h2>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '20px', display: 'inline-block', marginTop: '12px', fontSize: '0.85rem', fontWeight: 600 }}>
            LUNAS
          </div>
        </div>

        {/* Content Ticket */}
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <MapPin size={24} color="var(--primary)" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Lokasi Parkir</div>
                <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{ticket.parking_locations?.name || 'Lokasi Parkir'}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{ticket.parking_locations?.type === 'gedung' ? 'Gedung / Mall' : 'Tepi Jalan'}</div>
              </div>
            </div>

            <div style={{ height: '1px', background: '#E5E7EB', margin: '8px 0' }}></div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <User size={24} color="var(--primary)" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Nama Pengguna</div>
                <div style={{ fontWeight: 600, fontSize: '1rem' }}>{ticket.user_name}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <Car size={24} color="var(--primary)" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Kendaraan</div>
                <div style={{ fontWeight: 600, fontSize: '1rem' }}>{ticket.license_plate}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <Clock size={24} color="var(--primary)" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Waktu Booking</div>
                <div style={{ fontWeight: 600, fontSize: '1rem' }}>{formatTime(ticket.created_at)}</div>
              </div>
            </div>

          </div>

          <div style={{ height: '1px', borderTop: '2px dashed #E5E7EB', margin: '24px 0', position: 'relative' }}>
             <div style={{ position: 'absolute', width: '20px', height: '20px', borderRadius: '50%', background: 'var(--bg-color)', left: '-34px', top: '-11px' }}></div>
             <div style={{ position: 'absolute', width: '20px', height: '20px', borderRadius: '50%', background: 'var(--bg-color)', right: '-34px', top: '-11px' }}></div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>Tunjukkan QR Code ini pada petugas parkir</div>
            <div style={{ display: 'inline-block', padding: '16px', background: 'white', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
              <QrCode size={120} color="var(--text-main)" />
            </div>
            <div style={{ marginTop: '12px', fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
              ID: {ticket.id}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Ticket;
