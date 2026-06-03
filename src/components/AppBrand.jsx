const AppBrand = ({ compact = false }) => {
  const size = compact ? 32 : 40;
  const titleStyle = { fontSize: compact ? '1rem' : '1.2rem', fontWeight: 700, color: '#1E293B', margin: 0 };
  const subtitleStyle = { fontSize: compact ? '0.7rem' : '0.8rem', color: 'var(--text-muted)', marginTop: 4 };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: size, height: size, borderRadius: 8, background: '#3B82F6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: size * 0.5 }}>
        P
      </div>
      <div style={{ lineHeight: 1 }}>
        <h1 style={titleStyle}>Smart Parking</h1>
        {!compact && <div style={subtitleStyle}>Kota Surabaya</div>}
      </div>
    </div>
  );
};

export default AppBrand;
