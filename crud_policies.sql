-- 1. Mengizinkan siapa saja (publik) untuk Menambahkan (Insert) data lokasi parkir
CREATE POLICY "Enable insert access for all users" ON public.parking_locations 
FOR INSERT WITH CHECK (true);

-- 2. Mengizinkan siapa saja (publik) untuk Menghapus (Delete) data lokasi parkir
CREATE POLICY "Enable delete access for all users" ON public.parking_locations 
FOR DELETE USING (true);
