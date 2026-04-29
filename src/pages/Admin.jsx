import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  Car, 
  BarChart3, 
  Users, 
  FileText, 
  Settings, 
  LogOut, 
  Search, 
  Bell,
  MapPin,
  TrendingUp,
  Activity
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar
} from 'recharts';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import MapComponent from '../components/MapComponent';
import LocationModal from '../components/LocationModal';

// Mock data untuk grafik
const mockUsageData = [
  { time: '00:00', penggunaan: 120, kapasitas: 500 },
  { time: '03:00', penggunaan: 80, kapasitas: 500 },
  { time: '06:00', penggunaan: 200, kapasitas: 500 },
  { time: '09:00', penggunaan: 420, kapasitas: 500 },
  { time: '12:00', penggunaan: 480, kapasitas: 500 },
  { time: '15:00', penggunaan: 450, kapasitas: 500 },
  { time: '18:00', penggunaan: 490, kapasitas: 500 },
  { time: '21:00', penggunaan: 350, kapasitas: 500 },
];

const mockPeakHourData = [
  { time: '07:00', volume: 180 },
  { time: '08:00', volume: 320 },
  { time: '09:00', volume: 420 },
  { time: '12:00', volume: 480 },
  { time: '17:00', volume: 450 },
  { time: '18:00', volume: 490 },
  { time: '19:00', volume: 380 },
];

const Admin = () => {
  const { signOut, user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [locations, setLocations] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // CRUD State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState(null);
  
  const [stats, setStats] = useState({
    totalLocations: 0,
    totalCapacity: 0,
    availableSlots: 0,
    occupancyRate: 0,
  });

  useEffect(() => {
    fetchData();

    // Berlangganan perubahan real-time
    const subscription = supabase
      .channel('public_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parking_locations' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchData = async () => {
    try {
      // Ambil data lokasi
      const { data: locData, error: locError } = await supabase.from('parking_locations').select('*');
      if (locError) throw locError;
      
      // Ambil data reservasi
      const { data: resData, error: resError } = await supabase.from('reservations').select('*, parking_locations(name)').order('created_at', { ascending: false });
      if (resError) throw resError;

      // Ambil data profil (seluruh user terdaftar)
      const { data: profData, error: profError } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (profError) {
        console.error("Supabase Error fetching profiles:", profError);
        alert("Error Supabase (Profiles): " + profError.message);
      }

      setReservations(resData || []);
      setProfiles(profData || []);
      
      const formattedData = locData.map(item => {
        let computedStatus = 'available';
        if (item.available_slots <= 0) {
          computedStatus = 'full';
        } else if (item.available_slots <= (item.total_slots / 2)) {
          computedStatus = 'almost-full';
        }

        return {
          id: item.id,
          name: item.name,
          lat: item.lat,
          lng: item.lng,
          status: computedStatus,
          availableSlots: item.available_slots,
          totalSlots: item.total_slots,
          type: item.type,
          rate: item.rate
        };
      });
      
      setLocations(formattedData);

      // Hitung statistik dinamis
      const totalLocs = formattedData.length;
      let totalCap = 0;
      let totalAvail = 0;
      
      formattedData.forEach(loc => {
        totalCap += loc.totalSlots;
        totalAvail += loc.availableSlots;
      });

      const occupancy = totalCap > 0 ? (((totalCap - totalAvail) / totalCap) * 100).toFixed(1) : 0;

      setStats({
        totalLocations: totalLocs,
        totalCapacity: totalCap,
        availableSlots: totalAvail,
        occupancyRate: occupancy,
      });

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLocation = async (formData) => {
    try {
      if (editingData) {
        // Update existing
        const { error } = await supabase
          .from('parking_locations')
          .update({
            name: formData.name,
            type: formData.type,
            total_slots: parseInt(formData.total_slots),
            rate: formData.rate,
            lat: parseFloat(formData.lat),
            lng: parseFloat(formData.lng)
          })
          .eq('id', editingData.id);
          
        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('parking_locations')
          .insert([{
            name: formData.name,
            type: formData.type,
            total_slots: parseInt(formData.total_slots),
            available_slots: parseInt(formData.total_slots), // Default penuh (kosong) di awal
            rate: formData.rate,
            lat: parseFloat(formData.lat),
            lng: parseFloat(formData.lng),
            status: 'available'
          }]);
          
        if (error) throw error;
      }
      setIsModalOpen(false);
      fetchData(); // Refresh UI
    } catch (error) {
      console.error("Error saving location:", error);
      alert("Terjadi kesalahan saat menyimpan: " + error.message);
    }
  };

  const handleDeleteLocation = async (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus lokasi parkir ini? Data riwayat parkir yang terkait juga akan ikut terhapus.")) {
      try {
        const { error } = await supabase
          .from('parking_locations')
          .delete()
          .eq('id', id);
          
        if (error) throw error;
        fetchData();
      } catch (error) {
        console.error("Error deleting location:", error);
        alert("Terjadi kesalahan saat menghapus: " + error.message);
      }
    }
  };

  const renderContent = () => {
    if (loading) {
      return <div style={{ padding: '32px' }}>Memuat data sistem...</div>;
    }

    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'peta':
        return renderMap();
      case 'manajemen':
        return renderManagement();
      case 'pengguna':
        return renderUsers();
      case 'pengaturan':
        return renderSettings();
      default:
        return (
          <div style={{ padding: '32px', textAlign: 'center', color: '#64748B' }}>
            <h2>Fitur sedang dalam pengembangan</h2>
            <p>Menu ini akan tersedia pada versi berikutnya.</p>
          </div>
        );
    }
  };

  const renderDashboard = () => (
    <div style={{ padding: '32px', overflowY: 'auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1E293B', margin: '0 0 4px 0' }}>Dashboard Utama</h2>
        <p style={{ color: '#64748B', margin: 0 }}>Ringkasan data parkir Kota Surabaya secara real-time</p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '24px' }}>
        <KPICard 
          title="Total Lokasi Parkir" 
          value={stats.totalLocations} 
          badgeText="Aktif"
          icon={<MapPin size={24} color="white" />}
          iconBg="#3B82F6"
        />
        <KPICard 
          title="Slot Tersedia" 
          value={stats.availableSlots.toLocaleString('id-ID')} 
          subValue={`dari ${stats.totalCapacity.toLocaleString('id-ID')} total`}
          icon={<div style={{ fontWeight: 'bold', color: 'white', fontSize: '1.2rem' }}>P</div>}
          iconBg="#10B981"
        />
        <KPICard 
          title="Tingkat Okupansi" 
          value={`${stats.occupancyRate}%`} 
          badgeText="Real-time"
          icon={<TrendingUp size={24} color="white" />}
          iconBg="#8B5CF6"
        />
        <KPICard 
          title="Level Lalu Lintas" 
          value={stats.occupancyRate > 80 ? "Padat" : stats.occupancyRate > 50 ? "Sedang" : "Lancar"} 
          subValue="Berdasarkan algoritma"
          icon={<Activity size={24} color="white" />}
          iconBg="#F97316"
        />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        
        {/* Line Chart Card */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1E293B', margin: '0 0 4px 0' }}>Tren Penggunaan (24 Jam Terakhir)</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 24px 0' }}>Visualisasi histori kepadatan rata-rata (Data Simulasi)</p>
          
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockUsageData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Line type="monotone" dataKey="penggunaan" name="Penggunaan" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line type="step" dataKey="kapasitas" name="Kapasitas" stroke="#10B981" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart Card */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1E293B', margin: '0 0 4px 0' }}>Distribusi Jam Sibuk</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 24px 0' }}>Volume kendaraan per jam</p>
          
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockPeakHourData} margin={{ top: 5, right: 0, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                <Bar dataKey="volume" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );

  const renderMap = () => (
    <div style={{ height: 'calc(100vh - 72px)', position: 'relative' }}>
      <MapComponent locations={locations} />
      <div style={{ 
        position: 'absolute', top: '20px', right: '20px', zIndex: 1000, 
        backgroundColor: 'white', padding: '16px', borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        <h4 style={{ margin: '0 0 12px 0' }}>Legenda Peta</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10B981' }}></div>
          <span style={{ fontSize: '0.85rem' }}>Tersedia</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#F59E0B' }}></div>
          <span style={{ fontSize: '0.85rem' }}>Hampir Penuh</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#EF4444' }}></div>
          <span style={{ fontSize: '0.85rem' }}>Penuh</span>
        </div>
      </div>
    </div>
  );

  const renderManagement = () => (
    <div style={{ padding: '32px', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1E293B', margin: '0 0 4px 0' }}>Manajemen Data Parkir</h2>
          <p style={{ color: '#64748B', margin: 0 }}>Kelola lokasi parkir, tarif, dan kapasitas</p>
        </div>
        <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => { setEditingData(null); setIsModalOpen(true); }}>+ Tambah Lokasi</button>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
            <tr>
              <th style={{ padding: '16px 24px', color: '#64748B', fontWeight: 600, fontSize: '0.85rem' }}>NAMA LOKASI</th>
              <th style={{ padding: '16px 24px', color: '#64748B', fontWeight: 600, fontSize: '0.85rem' }}>TIPE</th>
              <th style={{ padding: '16px 24px', color: '#64748B', fontWeight: 600, fontSize: '0.85rem' }}>KAPASITAS (SLOT)</th>
              <th style={{ padding: '16px 24px', color: '#64748B', fontWeight: 600, fontSize: '0.85rem' }}>TARIF</th>
              <th style={{ padding: '16px 24px', color: '#64748B', fontWeight: 600, fontSize: '0.85rem' }}>STATUS</th>
              <th style={{ padding: '16px 24px', color: '#64748B', fontWeight: 600, fontSize: '0.85rem', textAlign: 'right' }}>AKSI</th>
            </tr>
          </thead>
          <tbody>
            {locations.map((loc) => (
              <tr key={loc.id} style={{ borderBottom: '1px solid #E2E8F0', transition: '0.2s' }} className="hover:bg-gray-50">
                <td style={{ padding: '16px 24px', fontWeight: 500, color: '#1E293B' }}>{loc.name}</td>
                <td style={{ padding: '16px 24px', color: '#64748B' }}>{loc.type}</td>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '100px', height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          width: `${((loc.totalSlots - loc.availableSlots) / loc.totalSlots) * 100}%`, 
                          height: '100%', 
                          backgroundColor: loc.status === 'full' ? '#EF4444' : loc.status === 'almost-full' ? '#F59E0B' : '#10B981' 
                        }}
                      ></div>
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{loc.availableSlots}/{loc.totalSlots}</span>
                  </div>
                </td>
                <td style={{ padding: '16px 24px', color: '#64748B' }}>{loc.rate}</td>
                <td style={{ padding: '16px 24px' }}>
                  <span className={`badge ${loc.status}`}>
                    {loc.status === 'available' ? 'Tersedia' : loc.status === 'full' ? 'Penuh' : 'Padat'}
                  </span>
                </td>
                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                  <button onClick={() => { setEditingData(loc); setIsModalOpen(true); }} style={{ backgroundColor: 'transparent', border: 'none', color: '#3B82F6', fontWeight: 600, cursor: 'pointer', marginRight: '16px' }}>Edit</button>
                  <button onClick={() => handleDeleteLocation(loc.id)} style={{ backgroundColor: 'transparent', border: 'none', color: '#EF4444', fontWeight: 600, cursor: 'pointer' }}>Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderUsers = () => {
    // Jika tabel profiles berhasil ditarik, gabungkan dengan riwayat reservasi
    const combinedUsers = profiles.map(profile => {
      // Cari transaksi terakhir dari user ini
      const userRes = reservations.find(r => r.user_name === profile.email);
      
      return {
        email: profile.email,
        created_at: new Date(profile.created_at).toLocaleDateString('id-ID'),
        license_plate: userRes ? userRes.license_plate : '-',
        last_booking: userRes ? new Date(userRes.created_at).toLocaleString('id-ID') : '-',
        location: userRes?.parking_locations?.name || '-'
      };
    });

    return (
      <div style={{ padding: '32px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1E293B', margin: '0 0 4px 0' }}>Data Pengguna</h2>
            <p style={{ color: '#64748B', margin: 0 }}>Daftar pengguna yang melakukan transaksi parkir</p>
          </div>
          <div style={{ padding: '8px 16px', backgroundColor: '#EFF6FF', color: '#3B82F6', borderRadius: '8px', fontWeight: 600 }}>
            Total: {combinedUsers.length} Pengguna Terdaftar
          </div>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <tr>
                <th style={{ padding: '16px 24px', color: '#64748B', fontWeight: 600, fontSize: '0.85rem' }}>PENGGUNA</th>
                <th style={{ padding: '16px 24px', color: '#64748B', fontWeight: 600, fontSize: '0.85rem' }}>TGL MENDAFTAR</th>
                <th style={{ padding: '16px 24px', color: '#64748B', fontWeight: 600, fontSize: '0.85rem' }}>LOKASI TERAKHIR</th>
                <th style={{ padding: '16px 24px', color: '#64748B', fontWeight: 600, fontSize: '0.85rem' }}>KENDARAAN</th>
                <th style={{ padding: '16px 24px', color: '#64748B', fontWeight: 600, fontSize: '0.85rem', textAlign: 'right' }}>TRANSAKSI TERAKHIR</th>
              </tr>
            </thead>
            <tbody>
              {combinedUsers.length > 0 ? combinedUsers.map((u, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #E2E8F0', transition: '0.2s' }} className="hover:bg-gray-50">
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#EFF6FF', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                        {u.email[0].toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 500, color: '#1E293B' }}>{u.email}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', color: '#64748B' }}>{u.created_at}</td>
                  <td style={{ padding: '16px 24px', color: '#64748B' }}>{u.location}</td>
                  <td style={{ padding: '16px 24px', color: '#64748B' }}>
                    <div style={{ display: 'inline-block', padding: '4px 8px', border: '1px solid #E2E8F0', borderRadius: '4px', fontWeight: 500, opacity: u.license_plate === '-' ? 0.5 : 1 }}>
                      {u.license_plate}
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right', color: '#64748B' }}>
                    {u.last_booking}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: '#64748B' }}>
                    Data pengguna belum tersedia. Pastikan skrip SQL telah dijalankan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderSettings = () => (
    <div style={{ padding: '32px', overflowY: 'auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1E293B', margin: '0 0 4px 0' }}>Pengaturan Akun</h2>
        <p style={{ color: '#64748B', margin: 0 }}>Kelola profil administrator dan preferensi sistem</p>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '32px', maxWidth: '600px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px', paddingBottom: '32px', borderBottom: '1px solid #E2E8F0' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#3B82F6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold' }}>
            {user?.email?.[0]?.toUpperCase() || 'A'}
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1E293B', margin: '0 0 4px 0' }}>{user?.email || 'Administrator'}</h3>
            <p style={{ color: '#64748B', margin: 0 }}>Super Admin Dishub Surabaya</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Settings size={20} color="#64748B" />
              <span style={{ fontWeight: 500, color: '#1E293B' }}>Preferensi Notifikasi</span>
            </div>
            <button style={{ border: 'none', backgroundColor: 'transparent', color: '#3B82F6', fontWeight: 600, cursor: 'pointer' }}>Ubah</button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Users size={20} color="#64748B" />
              <span style={{ fontWeight: 500, color: '#1E293B' }}>Manajemen Akses Staff</span>
            </div>
            <button style={{ border: 'none', backgroundColor: 'transparent', color: '#3B82F6', fontWeight: 600, cursor: 'pointer' }}>Kelola</button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F8FAFC', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Sidebar */}
      <aside style={{ width: '260px', backgroundColor: '#FFFFFF', borderRight: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: '#3B82F6', color: 'white', padding: '8px', borderRadius: '8px', display: 'flex' }}>
            <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>P</span>
          </div>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1E293B', margin: 0 }}>Smart Parking</h1>
        </div>

        <nav style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <AdminNavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <AdminNavItem icon={<MapIcon size={20} />} label="Peta Parkir" active={activeTab === 'peta'} onClick={() => setActiveTab('peta')} />
          <AdminNavItem icon={<Car size={20} />} label="Manajemen Parkir" active={activeTab === 'manajemen'} onClick={() => setActiveTab('manajemen')} />
          <AdminNavItem icon={<BarChart3 size={20} />} label="Analitik" active={activeTab === 'analitik'} onClick={() => setActiveTab('analitik')} />
          <AdminNavItem icon={<Users size={20} />} label="Pengguna" active={activeTab === 'pengguna'} onClick={() => setActiveTab('pengguna')} />
          <AdminNavItem icon={<FileText size={20} />} label="Laporan" active={activeTab === 'laporan'} onClick={() => setActiveTab('laporan')} />
          <AdminNavItem icon={<Settings size={20} />} label="Pengaturan" active={activeTab === 'pengaturan'} onClick={() => setActiveTab('pengaturan')} />
        </nav>

        <div style={{ padding: '24px', borderTop: '1px solid #E2E8F0' }}>
          <button 
            onClick={signOut} 
            style={{ 
              display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px',
              backgroundColor: 'transparent', border: 'none', color: '#64748B', fontWeight: 600,
              cursor: 'pointer', borderRadius: '8px', transition: '0.2s'
            }}
          >
            <LogOut size={20} /> Keluar
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Topbar */}
        <header style={{ 
          height: '72px', backgroundColor: '#FFFFFF', borderBottom: '1px solid #E2E8F0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px',
          flexShrink: 0
        }}>
          <div style={{ 
            display: 'flex', alignItems: 'center', backgroundColor: '#F1F5F9', 
            padding: '10px 16px', borderRadius: '8px', width: '300px'
          }}>
            <Search size={18} color="#94A3B8" />
            <input 
              type="text" 
              placeholder="Cari data..." 
              style={{ border: 'none', backgroundColor: 'transparent', outline: 'none', marginLeft: '12px', width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', 
              padding: '6px 12px', backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', 
              borderRadius: '20px', color: '#059669', fontSize: '0.85rem', fontWeight: 600
            }}>
              <div style={{ width: '8px', height: '8px', backgroundColor: '#10B981', borderRadius: '50%' }}></div>
              Data Real-time
            </div>
            
            <div style={{ position: 'relative', cursor: 'pointer' }}>
              <Bell size={24} color="#64748B" />
              <div style={{ position: 'absolute', top: 0, right: 0, width: '10px', height: '10px', backgroundColor: '#EF4444', borderRadius: '50%', border: '2px solid white' }}></div>
            </div>
            
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#3B82F6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              {user?.email?.[0]?.toUpperCase() || 'A'}
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {renderContent()}
        </div>
      </main>
      
      {/* Modal CRUD */}
      <LocationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveLocation}
        editingData={editingData}
      />
    </div>
  );
};

// Reusable Components
const AdminNavItem = ({ icon, label, active, onClick }) => {
  return (
    <div 
      onClick={onClick}
      style={{ 
        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', 
        backgroundColor: active ? '#EFF6FF' : 'transparent',
        color: active ? '#3B82F6' : '#64748B',
        borderRadius: '8px', cursor: 'pointer', fontWeight: 500,
        transition: '0.2s'
      }}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
};

const KPICard = ({ title, value, subValue, badgeText, icon, iconBg }) => {
  return (
    <div style={{ 
      backgroundColor: 'white', borderRadius: '16px', padding: '24px', 
      border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      display: 'flex', flexDirection: 'column', position: 'relative'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '0.95rem', color: '#64748B', fontWeight: 500, margin: 0 }}>{title}</h3>
        <div style={{ 
          width: '48px', height: '48px', borderRadius: '12px', backgroundColor: iconBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {icon}
        </div>
      </div>
      
      <div style={{ fontSize: '2rem', fontWeight: 700, color: '#1E293B', marginBottom: '8px' }}>
        {value}
      </div>
      
      {subValue && (
        <div style={{ fontSize: '0.85rem', color: '#64748B' }}>
          {subValue}
        </div>
      )}
      
      {badgeText && (
        <div style={{ 
          display: 'inline-flex', padding: '4px 8px', backgroundColor: '#ECFDF5', 
          color: '#059669', fontSize: '0.75rem', fontWeight: 600, borderRadius: '4px',
          alignSelf: 'flex-start'
        }}>
          {badgeText}
        </div>
      )}
    </div>
  );
};

export default Admin;
