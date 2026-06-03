import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Ticket as TicketIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

const MyTickets = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMyTickets() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('reservations')
          .select(`
            id,
            created_at,
            license_plate,
            parking_locations (
              name,
              type
            )
          `)
          .eq('user_name', user.email)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTickets(data || []);
      } catch (err) {
        console.error('Error fetching tickets:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchMyTickets();
  }, [user]);

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
  };

  return (
    <div style={{ padding: '20px', paddingBottom: '100px', maxWidth: '600px', margin: '0 auto' }}>
      <button 
        onClick={() => navigate('/profile')} 
        style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '24px', color: 'var(--text-main)' }}
      >
        <ArrowLeft size={20} />
        <span style={{ fontWeight: 500 }}>Kembali ke Profil</span>
      </button>

      <h2 style={{ marginBottom: '20px', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <TicketIcon size={24} color="var(--primary)" />
        Tiket Saya
      </h2>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Memuat tiket...</div>
      ) : tickets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px', border: '1px dashed #E5E7EB' }}>
          <TicketIcon size={48} color="#D1D5DB" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-main)' }}>Belum Ada Tiket</h3>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Kamu belum pernah melakukan booking parkir.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {tickets.map((ticket) => (
            <div 
              key={ticket.id} 
              onClick={() => navigate(`/ticket/${ticket.id}`)}
              style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #E5E7EB', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '4px' }}>{ticket.parking_locations?.name}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {ticket.license_plate} • {formatTime(ticket.created_at)}
                </div>
              </div>
              <div style={{ background: '#ECFDF5', color: '#065F46', padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                LUNAS
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTickets;
