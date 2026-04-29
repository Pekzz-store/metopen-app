import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

const LocationModal = ({ isOpen, onClose, onSave, editingData }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'Umum',
    total_slots: 50,
    rate: 'Rp 3.000/jam',
    lat: -7.2655,
    lng: 112.743
  });

  useEffect(() => {
    if (editingData) {
      setFormData({
        name: editingData.name,
        type: editingData.type,
        total_slots: editingData.totalSlots,
        rate: editingData.rate,
        lat: editingData.lat,
        lng: editingData.lng
      });
    } else {
      // Reset form if adding new
      setFormData({
        name: '',
        type: 'Umum',
        total_slots: 50,
        rate: 'Rp 3.000/jam',
        lat: -7.2655,
        lng: 112.743
      });
    }
  }, [editingData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '500px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        animation: 'fadeIn 0.3s ease-out'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#F8FAFC'
        }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#1E293B' }}>
            {editingData ? 'Edit Lokasi Parkir' : 'Tambah Lokasi Baru'}
          </h2>
          <button 
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '8px', borderRadius: '50%', transition: '0.2s'
            }}
            className="hover:bg-gray-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>
                Nama Lokasi
              </label>
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Contoh: Mall Central Parkir"
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: '8px',
                  border: '1px solid #CBD5E1', fontSize: '0.95rem',
                  outline: 'none', transition: 'border-color 0.2s'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>
                  Tipe Lokasi
                </label>
                <select 
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: '8px',
                    border: '1px solid #CBD5E1', fontSize: '0.95rem',
                    outline: 'none', backgroundColor: 'white'
                  }}
                >
                  <option value="Umum">Umum</option>
                  <option value="Mall">Mall</option>
                  <option value="Gedung">Gedung</option>
                  <option value="Jalan">Jalan</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>
                  Kapasitas (Slot)
                </label>
                <input 
                  type="number" 
                  name="total_slots"
                  value={formData.total_slots}
                  onChange={handleChange}
                  required
                  min="1"
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: '8px',
                    border: '1px solid #CBD5E1', fontSize: '0.95rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>
                Tarif (Teks)
              </label>
              <input 
                type="text" 
                name="rate"
                value={formData.rate}
                onChange={handleChange}
                required
                placeholder="Contoh: Rp 5.000/jam"
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: '8px',
                  border: '1px solid #CBD5E1', fontSize: '0.95rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>
                  Latitude (Y)
                </label>
                <input 
                  type="number" 
                  step="any"
                  name="lat"
                  value={formData.lat}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: '8px',
                    border: '1px solid #CBD5E1', fontSize: '0.95rem',
                    outline: 'none'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>
                  Longitude (X)
                </label>
                <input 
                  type="number" 
                  step="any"
                  name="lng"
                  value={formData.lng}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: '8px',
                    border: '1px solid #CBD5E1', fontSize: '0.95rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
            <button 
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 24px', borderRadius: '8px', border: '1px solid #E2E8F0',
                backgroundColor: 'white', color: '#64748B', fontWeight: 600, cursor: 'pointer'
              }}
            >
              Batal
            </button>
            <button 
              type="submit"
              style={{
                padding: '12px 24px', borderRadius: '8px', border: 'none',
                backgroundColor: '#3B82F6', color: 'white', fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              <Save size={18} />
              Simpan Data
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default LocationModal;
