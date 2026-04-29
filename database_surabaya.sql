-- Menghapus data Jakarta yang lama
DELETE FROM public.reservations;
DELETE FROM public.parking_locations;

-- Memasukkan data lokasi nyata di Surabaya
INSERT INTO public.parking_locations (name, lat, lng, status, available_slots, total_slots, type, rate)
VALUES
  ('Tunjungan Plaza Parking', -7.262500, 112.739700, 'almost-full', 12, 500, 'Mall', 'Rp 6.000/jam'),
  ('Pakuwon Mall', -7.288900, 112.675000, 'available', 150, 1000, 'Mall', 'Rp 5.000/jam'),
  ('Stasiun Gubeng', -7.265500, 112.751900, 'full', 0, 250, 'Fasilitas Umum', 'Rp 4.000/jam'),
  ('Taman Bungkul On-Street', -7.291300, 112.739400, 'almost-full', 3, 50, 'On-Street', 'Rp 2.000/jam'),
  ('Gedung Balai Kota', -7.261800, 112.748300, 'available', 40, 150, 'Perkantoran', 'Rp 5.000/jam');
