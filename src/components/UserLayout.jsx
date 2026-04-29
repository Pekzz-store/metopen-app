import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

const UserLayout = () => {
  const location = useLocation();

  const getHeaderTitle = () => {
    if (location.pathname === '/') return 'Peta Sebaran Parkir Kota Surabaya';
    if (location.pathname.includes('/navigation')) return 'Rekomendasi Parkir Tempat Surabaya';
    if (location.pathname.includes('/details')) return 'Detail Lokasi Parkir'
    if (location.pathname === '/profile') return 'Profil Saya';
    return 'Smart Parking';
  };

  // Khusus untuk halaman peta, kita gunakan layout tanpa padding besar agar peta maksimal
  const isMapPage = location.pathname === '/';

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <header className="topbar">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{getHeaderTitle()}</h2>
        </header>

        {isMapPage ? (
          <Outlet />
        ) : (
          <div className="page-container">
            <Outlet />
          </div>
        )}
      </main>
    </div>
  );
};

export default UserLayout;
