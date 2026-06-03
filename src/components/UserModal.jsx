import { useState, useEffect } from 'react';

const UserModal = ({ isOpen, onClose, onSave, editingData }) => {
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (editingData) {
      Promise.resolve().then(() => {
        setEmail(editingData.email || '');
      });
    } else {
      Promise.resolve().then(() => {
        setEmail('');
      });
    }
  }, [editingData]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ id: editingData?.id, email: email.trim() });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <form onSubmit={handleSubmit} style={{ width: 520, background: 'white', borderRadius: 8, padding: 20 }}>
        <h3 style={{ marginTop: 0 }}>{editingData ? 'Edit Pengguna' : 'Tambah Pengguna'}</h3>

        <label style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>Email</label>
        <input type="email" required value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: 8, marginBottom: 12 }} />

        {/* Vehicle fields removed; vehicles are stored in `vehicles` table now */}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} className="btn btn-outline">Batal</button>
          <button type="submit" className="btn btn-primary">Simpan</button>
        </div>
      </form>
    </div>
  );
};

export default UserModal;
