import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, DollarSign, Star, Car, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

const Details = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(state?.location || null);
  const [userVehicles, setUserVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');

  // Fetch real vehicle data for the user
  useEffect(() => {
    async function fetchUserVehicles() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('vehicles')
          .select('license_plate, vehicle_type')
          .eq('user_id', user.id);
        
        if (data && data.length > 0) {
          setUserVehicles(data);
          setSelectedVehicle(data[0].license_plate);
        }
      } catch (err) {
        console.error("Error fetching vehicles:", err);
      }
    }
    fetchUserVehicles();
  }, [user]);

  // Fallback if data is missing
  const location = currentLocation || {
    id: id,
    name: "Memuat Data...",
    type: "Umum",
    status: 'full',
    availableSlots: 0,
    totalSlots: 0,
    rate: "-",
  };

  const handleBookingClick = () => {
    if (location.availableSlots <= 0) return;
    setShowPayment(true);
  };

  const processPayment = async () => {
    setPaymentProcessing(true);
    try {
      // Simulate payment delay
      await new Promise(r => setTimeout(r, 2000));

      // 1. Tambahkan data ke tabel reservations
      const { data: resData, error: insertError } = await supabase
        .from('reservations')
        .insert([
          { 
            parking_id: location.id, 
            user_name: user?.email || 'User Anonim',
            license_plate: selectedVehicle 
          }
        ])
        .select();

      if (insertError) throw insertError;

      // 2. Kurangi available_slots di tabel parking_locations
      const newAvailableSlots = location.availableSlots - 1;
      let newStatus = location.status;
      
      if (newAvailableSlots === 0) newStatus = 'full';
      else if (newAvailableSlots <= 5) newStatus = 'almost-full';

      const { error: updateError } = await supabase
        .from('parking_locations')
        .update({ 
          available_slots: newAvailableSlots,
          status: newStatus
        })
        .eq('id', location.id);

      if (updateError) throw updateError;

      // Navigate to ticket
      const ticketId = resData[0].id;
      setShowPayment(false);
      navigate(`/ticket/${ticketId}`);

    } catch (error) {
      console.error('Error processing payment/booking:', error);
      alert('Gagal melakukan pembayaran. Silakan coba lagi.');
    } finally {
      setPaymentProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'available': return <span className="badge available">Tersedia</span>;
      case 'full': return <span className="badge full">Penuh</span>;
      case 'almost-full': return <span className="badge almost-full">Hampir Penuh</span>;
      default: return null;
    }
  };

  return (
    <div style={{ padding: '20px', paddingBottom: '100px' }}>
      <button 
        onClick={() => navigate(-1)} 
        style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '20px', color: 'var(--text-main)' }}
      >
        <ArrowLeft size={20} />
        <span style={{ fontWeight: 500 }}>Kembali</span>
      </button>

      {success && (
        <div style={{ background: '#D1FAE5', color: '#065F46', padding: '12px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Check size={20} />
          <strong>Booking Berhasil!</strong> Tempat Anda telah diamankan.
        </div>
      )}

      <div className="card" style={{ margin: '0 0 20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{location.name}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Parkir {location.type}</p>
          </div>
          {getStatusBadge(location.status)}
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <div style={{ flex: 1, background: 'var(--bg-color)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
              {location.availableSlots}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sisa Slot</div>
          </div>
          <div style={{ flex: 1, background: 'var(--bg-color)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
              {location.totalSlots}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Kapasitas Total</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <MapPin size={20} color="var(--text-muted)" />
            <span>Surabaya, Jawa Timur</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <DollarSign size={20} color="var(--text-muted)" />
            <span>{location.rate}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Clock size={20} color="var(--text-muted)" />
            <span>08:00 - 22:00 WIB</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Star size={20} color="#F59E0B" />
            <span>4.8 / 5.0 (120 Ulasan)</span>
          </div>
        </div>

        {/* Predictive AI Section (Simulated) */}
        <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div style={{ background: 'var(--primary)', color: 'white', padding: '4px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>AI PREDIKSI</div>
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Estimasi Ketersediaan</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
            {location.availableSlots > 20 
              ? 'Berdasarkan data historis spatio-temporal, lokasi ini diprediksi tetap tersedia hingga 2 jam ke depan.' 
              : 'Tren menunjukkan lokasi ini akan penuh dalam waktu kurang dari 30 menit. Segera lakukan reservasi.'}
          </p>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>Pilih Kendaraan Anda</label>
        {userVehicles.length > 0 ? (
          <select 
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none', background: 'white' }}
          >
            {userVehicles.map(v => (
              <option key={v.license_plate} value={v.license_plate}>{v.license_plate} ({v.vehicle_type})</option>
            ))}
          </select>
        ) : (
          <div style={{ padding: '12px', background: '#FEE2E2', color: '#991B1B', borderRadius: '8px', fontSize: '0.85rem' }}>
            Anda belum mendaftarkan kendaraan. Silakan tambahkan di halaman Profil.
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button className="btn btn-outline" style={{ flex: 1 }} 
        onClick={() => navigate(`/?routeLat=${location.lat}&routeLng=${location.lng}`)}>
          <MapPin size={18} /> Rute
        </button>
        <button 
          className="btn btn-primary" 
          style={{ flex: 2, opacity: location.availableSlots === 0 || userVehicles.length === 0 ? 0.7 : 1 }}
          disabled={location.availableSlots === 0 || userVehicles.length === 0}
          onClick={handleBookingClick}
        >
          <Car size={18} /> Booking Sekarang
        </button>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '400px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Ringkasan Pembayaran</h3>
              <button onClick={() => !paymentProcessing && setShowPayment(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
            </div>
            
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Lokasi</span>
                <span style={{ fontWeight: 500 }}>{location.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Kendaraan</span>
                <span style={{ fontWeight: 500 }}>{selectedVehicle}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Durasi Booking</span>
                <span style={{ fontWeight: 500 }}>1 Jam (Awal)</span>
              </div>
              
              <div style={{ height: '1px', background: '#E5E7EB', margin: '16px 0' }}></div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600 }}>Total Tagihan</span>
                <span style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--primary)' }}>Rp {location.rate ? location.rate.toLocaleString() : '3.000'}</span>
              </div>
            </div>

            <div style={{ padding: '20px', background: '#F9FAFB', borderTop: '1px solid #E5E7EB' }}>
              <button 
                onClick={processPayment} 
                disabled={paymentProcessing}
                style={{ width: '100%', padding: '14px', borderRadius: '8px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 600, fontSize: '1rem', cursor: paymentProcessing ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
              >
                {paymentProcessing ? 'Memproses...' : 'Bayar Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Details;
