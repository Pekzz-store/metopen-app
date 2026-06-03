import { Info, CheckCircle, AlertCircle } from 'lucide-react';

const Notifications = () => {
  const notifs = [
    {
      id: 1,
      title: "Parkir Hampir Penuh",
      desc: "Mall Central Parkir sisa 5 slot. Segera booking tempat Anda.",
      time: "10 menit yang lalu",
      type: "warning",
      icon: <AlertCircle size={20} color="var(--warning)" />
    },
    {
      id: 2,
      title: "Booking Berhasil",
      desc: "Reservasi parkir di Gedung A berhasil. Tunjukkan QR code di gerbang.",
      time: "2 jam yang lalu",
      type: "success",
      icon: <CheckCircle size={20} color="var(--secondary)" />
    },
    {
      id: 3,
      title: "Rekomendasi Alternatif",
      desc: "Kepadatan tinggi di rute Anda. Kami merekomendasikan Parkir B.",
      time: "Kemarin",
      type: "info",
      icon: <Info size={20} color="var(--primary)" />
    }
  ];

  return (
    <div style={{ padding: '20px' }}>
      {notifs.map(n => (
        <div key={n.id} className="card" style={{ margin: '0 0 12px 0', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div style={{ marginTop: '4px' }}>{n.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <h4 style={{ margin: 0, fontSize: '1rem' }}>{n.title}</h4>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{n.time}</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{n.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Notifications;
