export type UserRole = 'Penitip' | 'Jastiper';

export interface User {
  id: number;
  nama: string;
  email: string;
  role: UserRole;
  saldo: number;
}

export interface Category {
  id: number;
  nama_kategori: string;
}

export interface Item {
  id: number;
  trip_id: number;
  nama_barang: string;
  harga: number;
  stok: number;
  deskripsi: string;
  foto_url: string;
  nama_trip?: string;
  lokasi_tujuan?: string;
  trip_status?: 'Aktif' | 'Live' | 'Selesai';
  jastiper_nama?: string;
  categories?: string;
  category_list?: string[];
}

export interface Trip {
  id: number;
  user_id: number;
  nama_trip: string;
  lokasi_tujuan: string;
  tgl_berangkat: string;
  tgl_kembali: string;
  status: 'Aktif' | 'Live' | 'Selesai';
  items?: Item[];
}

export interface CustomRequest {
  id: number;
  user_id: number;
  trip_id: number;
  nama_barang: string;
  perkiraan_harga: number;
  catatan: string;
  foto_referensi: string;
  status: 'Menunggu' | 'ACC' | 'Ditolak';
  stok_disetujui: number;
  pemohon_nama?: string;
  nama_trip?: string;
}

export interface CartItem {
  id: number;
  item_id: number;
  nama_barang: string;
  harga: number;
  qty: number;
  foto_url: string;
  stok: number;
  nama_trip?: string;
  selected?: boolean;
}

export interface OrderDetail {
  id: number;
  order_id: number;
  item_id: number;
  nama_barang: string;
  harga: number;
  qty: number;
  subtotal: number;
}

export interface Order {
  id: number;
  order_code: string;
  penitip_id: number;
  jastiper_id: number;
  total_harga: number;
  status: 'Dipesan' | 'Dibeli' | 'Dikirim' | 'Tiba' | 'Selesai';
  is_saldo_released: number;
  created_at: string;
  penitip_nama?: string;
  jastiper_nama?: string;
  nama_trip?: string;
  details?: OrderDetail[];
  rating?: number;
  review_comment?: string;
}

export interface TripCheckin {
  id: number;
  trip_id: number;
  jastiper_id: number;
  nama_lokasi: string;
  latitude: number;
  longitude: number;
  foto_selfie_url: string;
  waktu_checkin: string;
  nama_trip?: string;
  jastiper_nama?: string;
  is_new?: boolean;
}

export interface OrderSummaryItem {
  nama_barang: string;
  total_qty: number;
  pemesan: string;
  nama_trip?: string;
  status?: string;
}

export interface WalletTransaction {
  id: number;
  user_id: number;
  type: 'in' | 'out'; // in = uang masuk (+), out = uang keluar (-)
  title: string;
  description?: string;
  amount: number;
  created_at: string;
}
