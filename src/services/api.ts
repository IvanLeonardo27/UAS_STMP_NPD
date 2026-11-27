import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  User,
  Item,
  Trip,
  CustomRequest,
  CartItem,
  Order,
  TripCheckin,
  OrderSummaryItem,
  UserRole,
  WalletTransaction,
  JastipReview
} from '@/types/jastip';

// Ganti NRP di sini sesuai kebutuhan server ubaya.fun
export const API_BASE_URL = 'https://ubaya.fun/160423189';

// Storage Keys
const STORAGE_KEYS = {
  USER_SESSION: 'jastipgo_user_session',
  USERS: 'jastipgo_users',
  ITEMS: 'jastipgo_items',
  TRIPS: 'jastipgo_trips',
  REQUESTS: 'jastipgo_requests',
  CART: 'jastipgo_cart',
  ORDERS: 'jastipgo_orders',
  CHECKINS: 'jastipgo_checkins',
  TRANSACTIONS: 'jastipgo_transactions',
};

// INITIAL SEED DATA FOR DEMO & OFFLINE RESILIENCE
const INITIAL_USERS: (User & { password?: string })[] = [
  {
    id: 1,
    nama: 'Kevin Jastiper',
    email: 'kevin@jastipgo.com',
    role: 'Jastiper',
    saldo: 1250000,
    password: '123456',
  },
  {
    id: 2,
    nama: 'Rani Wijaya',
    email: 'rani@email.com',
    role: 'Penitip',
    saldo: 350000,
    password: '123456',
  },
];

const INITIAL_TRIPS: Trip[] = [
  {
    id: 1,
    user_id: 1,
    nama_trip: 'Tokyo Spring Trip',
    lokasi_tujuan: 'Tokyo, Jepang',
    tgl_berangkat: '2026-04-12',
    tgl_kembali: '2026-04-20',
    status: 'Live',
  },
  {
    id: 2,
    user_id: 1,
    nama_trip: 'Seoul Beauty Run',
    lokasi_tujuan: 'Seoul, Korea Selatan',
    tgl_berangkat: '2026-05-01',
    tgl_kembali: '2026-05-08',
    status: 'Aktif',
  },
];

const INITIAL_ITEMS: Item[] = [
  {
    id: 1,
    trip_id: 1,
    nama_barang: 'Tokyo Banana',
    harga: 85000,
    stok: 12,
    deskripsi: 'Kue pisang lembut isi custard khas Tokyo, dibeli langsung di toko resmi stasiun Tokyo & bandara Haneda.',
    foto_url: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=400&q=80',
    nama_trip: 'Tokyo Spring Trip',
    lokasi_tujuan: 'Tokyo, Jepang',
    trip_status: 'Live',
    jastiper_nama: 'Kevin Jastiper',
    category_list: ['Kuliner', 'Oleh-oleh'],
  },
  {
    id: 2,
    trip_id: 2,
    nama_barang: 'Hada Labo Lotion',
    harga: 120000,
    stok: 6,
    deskripsi: 'Hydrating lotion dengan hyaluronic acid premium untuk menjaga kelembapan kulit secara intensif.',
    foto_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=80',
    nama_trip: 'Seoul Beauty Run',
    lokasi_tujuan: 'Seoul, Korea Selatan',
    trip_status: 'Aktif',
    jastiper_nama: 'Kevin Jastiper',
    category_list: ['Kosmetik'],
  },
  {
    id: 3,
    trip_id: 1,
    nama_barang: 'Matcha KitKat',
    harga: 45000,
    stok: 15,
    deskripsi: 'Kitkat otentik dengan matcha khas Uji Kyoto, rasa manis dan pahit yang pas.',
    foto_url: 'https://images.unsplash.com/photo-1582293041079-7814c2f12063?auto=format&fit=crop&w=400&q=80',
    nama_trip: 'Tokyo Spring Trip',
    lokasi_tujuan: 'Tokyo, Jepang',
    trip_status: 'Live',
    jastiper_nama: 'Kevin Jastiper',
    category_list: ['Kuliner', 'Oleh-oleh'],
  },
  {
    id: 4,
    trip_id: 2,
    nama_barang: 'Mini Totebag',
    harga: 150000,
    stok: 4,
    deskripsi: 'Totebag aesthetic kanvas tebal khas butik indie di jalanan Hongdae.',
    foto_url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=400&q=80',
    nama_trip: 'Seoul Beauty Run',
    lokasi_tujuan: 'Seoul, Korea Selatan',
    trip_status: 'Aktif',
    jastiper_nama: 'Kevin Jastiper',
    category_list: ['Fashion'],
  },
];

const INITIAL_REQUESTS: CustomRequest[] = [
  {
    id: 1,
    user_id: 2,
    trip_id: 1,
    nama_barang: 'Sushi Roll Mini',
    perkiraan_harga: 90000,
    catatan: 'Varian salmon matang',
    foto_referensi: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=400&q=80',
    status: 'Menunggu',
    stok_disetujui: 0,
    pemohon_nama: 'Rani Wijaya',
    nama_trip: 'Tokyo Spring Trip',
  },
  {
    id: 2,
    user_id: 3,
    trip_id: 1,
    nama_barang: 'Pocky Matcha',
    perkiraan_harga: 35000,
    catatan: 'Isi 2 pack ukuran besar',
    foto_referensi: 'https://images.unsplash.com/photo-1621236378699-8597fee6a1ce?auto=format&fit=crop&w=400&q=80',
    status: 'Menunggu',
    stok_disetujui: 0,
    pemohon_nama: 'Dimas Pratama',
    nama_trip: 'Tokyo Spring Trip',
  },
];

const INITIAL_CHECKINS: TripCheckin[] = [
  {
    id: 1,
    trip_id: 1,
    jastiper_id: 1,
    nama_lokasi: 'Big C Supercenter Bangkok',
    latitude: 13.7466,
    longitude: 100.5403,
    foto_selfie_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    waktu_checkin: '14:20',
    nama_trip: 'Bangkok Snack & Beauty Hunt',
    jastiper_nama: 'Kevin Jastiper',
    is_new: true,
  },
  {
    id: 2,
    trip_id: 1,
    jastiper_id: 1,
    nama_lokasi: 'Don Quijote Shibuya',
    latitude: 35.6595,
    longitude: 139.7005,
    foto_selfie_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    waktu_checkin: '11:05',
    nama_trip: 'Tokyo Spring Trip',
    jastiper_nama: 'Kevin Jastiper',
    is_new: false,
  },
];

const INITIAL_ORDERS: Order[] = [
  {
    id: 1,
    order_code: 'JTG-0142',
    penitip_id: 2,
    jastiper_id: 1,
    total_harga: 290000,
    status: 'Tiba',
    is_saldo_released: 0,
    created_at: '2026-04-13 10:00:00',
    penitip_nama: 'Rani Wijaya',
    jastiper_nama: 'Kevin Jastiper',
    nama_trip: 'Tokyo Spring Trip',
    details: [
      { id: 1, order_id: 1, item_id: 1, nama_barang: 'Tokyo Banana', harga: 85000, qty: 2, subtotal: 170000 },
      { id: 2, order_id: 1, item_id: 2, nama_barang: 'Hada Labo Lotion', harga: 120000, qty: 1, subtotal: 120000 },
    ],
  },
  {
    id: 2,
    order_code: 'JTG-0139',
    penitip_id: 2,
    jastiper_id: 1,
    total_harga: 150000,
    status: 'Dibeli',
    is_saldo_released: 0,
    created_at: '2026-04-12 15:30:00',
    penitip_nama: 'Rani Wijaya',
    jastiper_nama: 'Kevin Jastiper',
    nama_trip: 'Tokyo Spring Trip',
    details: [
      { id: 3, order_id: 2, item_id: 4, nama_barang: 'Mini Totebag', harga: 150000, qty: 1, subtotal: 150000 },
    ],
  },
  {
    id: 3,
    order_code: 'JTG-0128',
    penitip_id: 2,
    jastiper_id: 1,
    total_harga: 210000,
    status: 'Selesai',
    is_saldo_released: 1,
    created_at: '2026-04-10 14:00:00',
    penitip_nama: 'Rani Wijaya',
    jastiper_nama: 'Kevin Jastiper',
    nama_trip: 'Tokyo Spring Trip',
    rating: 5,
    review_comment: 'Titipan dibelikan lengkap dan packing sangat rapi pakai bubble wrap tebal! Jastiper sangat ramah dan amanah ⭐⭐⭐⭐⭐',
    details: [
      { id: 4, order_id: 3, item_id: 1, nama_barang: 'Pocky Matcha', harga: 35000, qty: 6, subtotal: 210000 },
    ],
  },
];

const INITIAL_TRANSACTIONS: WalletTransaction[] = [
  {
    id: 1,
    user_id: 1, // Kevin Jastiper
    type: 'in',
    title: 'Pencairan Jastip (Tokyo Banana)',
    description: 'Pesanan JTG-0142 diselesaikan oleh Rani Wijaya',
    amount: 290000,
    created_at: '2026-04-14 11:20',
  },
  {
    id: 2,
    user_id: 1, // Kevin Jastiper
    type: 'in',
    title: 'Top Up Modal Jastiper',
    description: 'Pengisian saldo modal belanja via Virtual Account',
    amount: 1000000,
    created_at: '2026-04-10 09:15',
  },
  {
    id: 3,
    user_id: 1, // Kevin Jastiper
    type: 'out',
    title: 'Pembelian Belanjaan Toko',
    description: 'Pembelian barang kebutuhan penitip',
    amount: 40000,
    created_at: '2026-04-11 14:00',
  },
  {
    id: 4,
    user_id: 2, // Rani Wijaya
    type: 'in',
    title: 'Top Up Saldo',
    description: 'Pengisian saldo dompet via Bank BCA',
    amount: 500000,
    created_at: '2026-04-11 10:00',
  },
  {
    id: 5,
    user_id: 2, // Rani Wijaya
    type: 'out',
    title: 'Pembayaran Tokyo Banana x2',
    description: 'Checkout pesanan JTG-0142 - Tokyo Spring Trip',
    amount: 290000,
    created_at: '2026-04-12 15:30',
  },
  {
    id: 6,
    user_id: 2, // Rani Wijaya
    type: 'in',
    title: 'Top Up Saldo Instan',
    description: 'Top up saldo JasTipGo',
    amount: 140000,
    created_at: '2026-04-13 08:45',
  },
];

class JastipApiService {
  // Ensure storage is seeded once
  private async ensureSeeded() {
    try {
      const items = await AsyncStorage.getItem(STORAGE_KEYS.ITEMS);
      if (!items) {
        await AsyncStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(INITIAL_ITEMS));
      }
      const trips = await AsyncStorage.getItem(STORAGE_KEYS.TRIPS);
      if (!trips) {
        await AsyncStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(INITIAL_TRIPS));
      }
      const requests = await AsyncStorage.getItem(STORAGE_KEYS.REQUESTS);
      if (!requests) {
        await AsyncStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(INITIAL_REQUESTS));
      }
      const checkins = await AsyncStorage.getItem(STORAGE_KEYS.CHECKINS);
      if (!checkins) {
        await AsyncStorage.setItem(STORAGE_KEYS.CHECKINS, JSON.stringify(INITIAL_CHECKINS));
      }
      const orders = await AsyncStorage.getItem(STORAGE_KEYS.ORDERS);
      if (!orders) {
        await AsyncStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
      }
      const users = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      if (!users) {
        await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
      }
      const txs = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (!txs) {
        await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS));
      }
    } catch (e) {
      console.warn('Seeding storage error:', e);
    }
  }

  // --- AUTH & SESSION ---
  async getSavedSession(): Promise<User | null> {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER_SESSION);
    return raw ? JSON.parse(raw) : null;
  }

  async saveSession(user: User): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(user));
  }

  async clearSession(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_SESSION);
  }

  async login(email: string, pass: string): Promise<User> {
    await this.ensureSeeded();
    // Try remote server first
    try {
      const form = new URLSearchParams({ email, password: pass, action: 'login' });
      const resp = await fetch(`${API_BASE_URL}/api.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
      });
      const data = await resp.json();
      if (data.result === 'success') {
        const user: User = data.data;
        await this.saveSession(user);
        return user;
      } else if (data.result === 'error' && data.message) {
        throw new Error(data.message);
      }
    } catch (remoteErr: any) {
      if (remoteErr.message && !remoteErr.message.includes('fetch') && !remoteErr.message.includes('JSON')) {
        throw remoteErr;
      }
      // Fallback to local accounts
    }

    // Local authentication fallback
    const rawUsers = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
    let usersList: (User & { password?: string })[] = rawUsers ? JSON.parse(rawUsers) : [];

    // Pastikan akun default Kevin & Rani selalu ada
    for (const initU of INITIAL_USERS) {
      if (!usersList.some((u) => u.email.toLowerCase() === initU.email.toLowerCase())) {
        usersList.push(initU);
      }
    }

    const matchedUser = usersList.find((u) => u.email.trim().toLowerCase() === email.trim().toLowerCase());
    if (!matchedUser) {
      throw new Error(`Akun dengan email "${email}" belum terdaftar. Silakan periksa kembali atau pilih menu Daftar.`);
    }

    // Verifikasi kata sandi
    const expectedPassword = matchedUser.password || '123456';
    if (pass !== expectedPassword) {
      throw new Error('Kata sandi yang Anda masukkan salah. Silakan coba lagi.');
    }

    const sessionUser: User = {
      id: matchedUser.id,
      nama: matchedUser.nama,
      email: matchedUser.email,
      role: matchedUser.role,
      saldo: matchedUser.saldo,
    };
    await this.saveSession(sessionUser);
    return sessionUser;
  }

  async register(nama: string, email: string, pass: string, role: UserRole): Promise<User> {
    await this.ensureSeeded();
    try {
      const form = new URLSearchParams({ nama, email, password: pass, role, action: 'register' });
      const resp = await fetch(`${API_BASE_URL}/api.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
      });
      const data = await resp.json();
      if (data.result === 'success') {
        const user: User = data.data;
        await this.saveSession(user);
        return user;
      } else if (data.result === 'error' && data.message) {
        throw new Error(data.message);
      }
    } catch (remoteErr: any) {
      if (remoteErr.message && !remoteErr.message.includes('fetch') && !remoteErr.message.includes('JSON')) {
        throw remoteErr;
      }
      // Fallback
    }

    const rawUsers = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
    let usersList: (User & { password?: string })[] = rawUsers ? JSON.parse(rawUsers) : [...INITIAL_USERS];

    if (usersList.some((u) => u.email.trim().toLowerCase() === email.trim().toLowerCase())) {
      throw new Error(`Email "${email}" sudah terdaftar. Silakan pilih tab Masuk.`);
    }

    const newUser: User & { password?: string } = {
      id: Math.floor(Math.random() * 9000) + 100,
      nama,
      email,
      role,
      saldo: role === 'Jastiper' ? 1250000 : 350000,
      password: pass,
    };
    usersList.push(newUser);
    await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(usersList));

    const sessionUser: User = {
      id: newUser.id,
      nama: newUser.nama,
      email: newUser.email,
      role: newUser.role,
      saldo: newUser.saldo,
    };
    await this.saveSession(sessionUser);
    return sessionUser;
  }

  async switchRole(user: User, newRole: UserRole): Promise<User> {
    const updatedUser: User = { ...user, role: newRole };
    await this.saveSession(updatedUser);
    try {
      const form = new URLSearchParams({ user_id: String(user.id), role: newRole, action: 'switch_role' });
      await fetch(`${API_BASE_URL}/api.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
      });
    } catch {
      // Ignore network error
    }
    return updatedUser;
  }

  // --- CATALOG & MULTI-FILTER ---
  async getCatalog(search: string = '', category: string = 'Semua'): Promise<Item[]> {
    await this.ensureSeeded();
    try {
      const url = `${API_BASE_URL}/api.php?action=get_catalog&search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}`;
      const resp = await fetch(url);
      const data = await resp.json();
      if (data.result === 'success' && Array.isArray(data.data)) {
        return data.data;
      }
    } catch {
      // Fallback
    }

    const raw = await AsyncStorage.getItem(STORAGE_KEYS.ITEMS);
    let items: Item[] = raw ? JSON.parse(raw) : INITIAL_ITEMS;

    // Bersihkan seluruh duplikasi berdasarkan nama barang (pertahankan yang terbaru)
    const uniqueMap = new Map<string, Item>();
    const sortedItems = [...items].sort((a, b) => (b.id || 0) - (a.id || 0));
    for (const it of sortedItems) {
      const key = it.nama_barang.trim().toLowerCase();
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, it);
      }
    }
    items = Array.from(uniqueMap.values());
    await AsyncStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));

    // Filter by active/live trips
    items = items.filter((it) => it.stok > 0);

    if (category && category !== 'Semua') {
      items = items.filter((it) => it.category_list?.includes(category));
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (it) =>
          it.nama_barang.toLowerCase().includes(q) ||
          (it.nama_trip && it.nama_trip.toLowerCase().includes(q)) ||
          (it.lokasi_tujuan && it.lokasi_tujuan.toLowerCase().includes(q)) ||
          it.category_list?.some((c) => c.toLowerCase().includes(q))
      );
    }

    return items;
  }

  async getItemDetail(id: number): Promise<Item | null> {
    const catalog = await this.getCatalog();
    return catalog.find((i) => i.id === id) || null;
  }

  // --- TRIPS ---
  async getTrips(): Promise<Trip[]> {
    await this.ensureSeeded();
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.TRIPS);
    return raw ? JSON.parse(raw) : INITIAL_TRIPS;
  }

  async createTrip(trip: Omit<Trip, 'status'> & { id?: number }): Promise<Trip> {
    await this.ensureSeeded();
    const trips = await this.getTrips();
    const newTrip: Trip = {
      ...trip,
      id: trip.id || Date.now(),
      status: 'Aktif',
      items: [],
    };
    trips.unshift(newTrip);
    await AsyncStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(trips));
    return newTrip;
  }

  async updateTrip(trip: Trip): Promise<void> {
    const trips = await this.getTrips();
    const idx = trips.findIndex((t) => t.id === trip.id);
    if (idx !== -1) {
      trips[idx] = trip;
      await AsyncStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(trips));
    }
  }

  // --- SAVE / EDIT ITEM ---
  async saveItem(item: Omit<Item, 'id'> & { id?: number }): Promise<Item> {
    await this.ensureSeeded();
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.ITEMS);
    const items: Item[] = raw ? JSON.parse(raw) : INITIAL_ITEMS;

    if (item.id) {
      const idx = items.findIndex((i) => i.id === item.id);
      if (idx !== -1) {
        items[idx] = { ...items[idx], ...item, id: item.id };
        await AsyncStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
        return items[idx];
      }
    }

    // Jika barang dengan nama yang sama sudah ada pada trip yang sama, update saja
    const existingIdx = items.findIndex(
      (i) =>
        i.nama_barang.trim().toLowerCase() === item.nama_barang.trim().toLowerCase() &&
        (i.trip_id || 1) === (item.trip_id || 1)
    );
    if (existingIdx !== -1) {
      items[existingIdx] = { ...items[existingIdx], ...item, id: items[existingIdx].id };
      await AsyncStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
      return items[existingIdx];
    }

    const trips = await this.getTrips();
    let matchedTrip = trips.find(
      (t) =>
        (item.trip_id && String(t.id) === String(item.trip_id)) ||
        (item.nama_trip && t.nama_trip.trim().toLowerCase() === item.nama_trip.trim().toLowerCase())
    );
    if (!matchedTrip) {
      matchedTrip = trips[0] || INITIAL_TRIPS[0];
    }

    const newItem: Item = {
      ...item,
      id: Date.now(),
      trip_id: item.trip_id || (matchedTrip ? matchedTrip.id : 1),
      nama_trip: item.nama_trip || (matchedTrip ? matchedTrip.nama_trip : 'Trip Aktif'),
      lokasi_tujuan: matchedTrip ? matchedTrip.lokasi_tujuan : 'Tujuan Trip',
      trip_status: matchedTrip ? (matchedTrip.status || 'Live') : 'Live',
      jastiper_nama: 'Kevin Jastiper',
    };
    items.unshift(newItem);
    await AsyncStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
    return newItem;
  }

  async deleteItem(itemId: number): Promise<void> {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.ITEMS);
    if (raw) {
      let items: Item[] = JSON.parse(raw);
      items = items.filter((i) => i.id !== itemId);
      await AsyncStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
    }
  }

  // --- REQUESTS ---
  async getRequests(): Promise<CustomRequest[]> {
    await this.ensureSeeded();
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.REQUESTS);
    return raw ? JSON.parse(raw) : INITIAL_REQUESTS;
  }

  async createRequest(req: Omit<CustomRequest, 'id' | 'status' | 'stok_disetujui'>): Promise<CustomRequest> {
    await this.ensureSeeded();
    const requests = await this.getRequests();
    const newId = Date.now();
    const newReq: CustomRequest = {
      ...req,
      id: newId,
      status: 'Menunggu',
      stok_disetujui: 0,
    };
    requests.unshift(newReq);
    await AsyncStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));

    // Langsung buat Order di Pesanan Saya agar penitip bisa langsung memantau
    const rawOrders = await AsyncStorage.getItem(STORAGE_KEYS.ORDERS);
    const orders: Order[] = rawOrders ? JSON.parse(rawOrders) : [...INITIAL_ORDERS];
    const newOrder: Order = {
      id: newId,
      order_code: `REQ-${String(newId).slice(-4)}`,
      penitip_id: req.user_id,
      penitip_nama: req.pemohon_nama || 'Penitip',
      jastiper_id: 1,
      jastiper_nama: 'Kevin Jastiper',
      nama_trip: req.nama_trip || 'Bangkok Snack & Beauty Hunt',
      total_harga: req.perkiraan_harga,
      status: 'Dipesan',
      is_saldo_released: 0,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      details: [
        {
          id: 1,
          order_id: newId,
          item_id: 0,
          nama_barang: `${req.nama_barang} (Request Titipan)`,
          harga: req.perkiraan_harga,
          qty: 1,
          subtotal: req.perkiraan_harga,
        },
      ],
    };
    orders.unshift(newOrder);
    await AsyncStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));

    return newReq;
  }

  async accRequest(requestId: number, stok: number, harga?: number): Promise<void> {
    const requests = await this.getRequests();
    const req = requests.find((r) => r.id === requestId);
    if (req) {
      req.status = 'ACC';
      req.stok_disetujui = stok;
      await AsyncStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));

      // Otomatis majukan status pesanan terkait menjadi 'Dibeli' atau buat jika belum ada
      const rawOrders = await AsyncStorage.getItem(STORAGE_KEYS.ORDERS);
      if (rawOrders) {
        const orders: Order[] = JSON.parse(rawOrders);
        const targetOrder = orders.find(
          (o) =>
            o.order_code === `REQ-${req.id}` ||
            o.order_code === `REQ-${String(req.id).slice(-4)}` ||
            (o.details &&
              o.details.some(
                (d) =>
                  d.nama_barang.toLowerCase().includes(req.nama_barang.toLowerCase()) ||
                  req.nama_barang.toLowerCase().includes(d.nama_barang.toLowerCase())
              ))
        );
        if (targetOrder) {
          targetOrder.status = 'Dibeli';
        } else {
          orders.unshift({
            id: 800000 + req.id,
            order_code: `REQ-${req.id}`,
            penitip_id: req.user_id,
            penitip_nama: req.pemohon_nama || 'Penitip',
            jastiper_id: 1,
            jastiper_nama: 'Kevin Jastiper',
            nama_trip: req.nama_trip || 'Tokyo Spring Trip',
            total_harga: req.perkiraan_harga,
            status: 'Dibeli',
            is_saldo_released: 0,
            created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
            details: [
              {
                id: 1,
                order_id: 800000 + req.id,
                item_id: 0,
                nama_barang: `${req.nama_barang} (Request Titipan)`,
                harga: req.perkiraan_harga,
                qty: 1,
                subtotal: req.perkiraan_harga,
              },
            ],
          });
        }
        await AsyncStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
      }

      // Otomatis masukkan ke katalog barang trip
      await this.saveItem({
        trip_id: req.trip_id || 1,
        nama_barang: req.nama_barang,
        harga: harga || req.perkiraan_harga,
        stok: stok,
        deskripsi: `Request titipan dari ${req.pemohon_nama ?? 'penitip'}: ${req.catatan}`,
        foto_url: req.foto_referensi || 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=400&q=80',
        category_list: ['Kuliner'],
      });
    }
  }

  async rejectRequest(requestId: number): Promise<void> {
    const requests = await this.getRequests();
    const req = requests.find((r) => r.id === requestId);
    if (req) {
      req.status = 'Ditolak';
      await AsyncStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));

      // Hapus dari daftar orders jika ditolak
      const rawOrders = await AsyncStorage.getItem(STORAGE_KEYS.ORDERS);
      if (rawOrders) {
        let orders: Order[] = JSON.parse(rawOrders);
        orders = orders.filter(
          (o) =>
            o.id !== req.id &&
            o.order_code !== `REQ-${String(req.id).slice(-4)}` &&
            !(o.details && o.details.some((d) => d.nama_barang.toLowerCase().includes(req.nama_barang.toLowerCase())))
        );
        await AsyncStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
      }
    }
  }

  // --- CART ---
  async getCart(): Promise<CartItem[]> {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.CART);
    return raw ? JSON.parse(raw) : [];
  }

  async addToCart(item: Item, qty: number = 1): Promise<{ cart: CartItem[]; remainingStock: number }> {
    const cart = await this.getCart();
    const existing = cart.find((c) => c.item_id === item.id);
    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({
        id: Date.now(),
        item_id: item.id,
        nama_barang: item.nama_barang,
        harga: item.harga,
        qty: qty,
        foto_url: item.foto_url,
        stok: item.stok,
        nama_trip: item.nama_trip,
        selected: true,
      });
    }
    await AsyncStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));

    // Langsung kurangi sisa stok barang di storage katalog
    let remainingStock = item.stok - qty;
    if (remainingStock < 0) remainingStock = 0;

    const rawItems = await AsyncStorage.getItem(STORAGE_KEYS.ITEMS);
    if (rawItems) {
      const items: Item[] = JSON.parse(rawItems);
      const target = items.find((i) => i.id === item.id);
      if (target) {
        target.stok = remainingStock;
        await AsyncStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
      }
    }

    return { cart, remainingStock };
  }

  async updateCartQty(itemId: number, delta: number): Promise<CartItem[]> {
    let cart = await this.getCart();
    const item = cart.find((c) => c.item_id === itemId);
    if (item) {
      item.qty += delta;

      // Sinkronkan sisa stok barang di katalog
      const rawItems = await AsyncStorage.getItem(STORAGE_KEYS.ITEMS);
      if (rawItems) {
        const items: Item[] = JSON.parse(rawItems);
        const catalogItem = items.find((i) => i.id === itemId);
        if (catalogItem) {
          // Jika kuantitas keranjang dikurangi (delta < 0), stok kembali bertambah
          catalogItem.stok = Math.max(0, catalogItem.stok - delta);
          await AsyncStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
        }
      }

      if (item.qty <= 0) {
        cart = cart.filter((c) => c.item_id !== itemId);
      }
    }
    await AsyncStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    return cart;
  }

  async removeCartItem(itemId: number): Promise<CartItem[]> {
    let cart = await this.getCart();
    const item = cart.find((c) => c.item_id === itemId);
    if (item) {
      // Kembalikan seluruh kuantitas ke stok katalog
      const rawItems = await AsyncStorage.getItem(STORAGE_KEYS.ITEMS);
      if (rawItems) {
        const items: Item[] = JSON.parse(rawItems);
        const catalogItem = items.find((i) => i.id === itemId);
        if (catalogItem) {
          catalogItem.stok += item.qty;
          await AsyncStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
        }
      }
      cart = cart.filter((c) => c.item_id !== itemId);
      await AsyncStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    }
    return cart;
  }

  async clearCart(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.CART);
  }

  // --- SALDO & CHECKOUT ---
  async getSaldo(userId: number): Promise<number> {
    const session = await this.getSavedSession();
    if (session && session.id === userId) {
      return session.saldo;
    }
    return 350000;
  }

  async topupSaldo(userId: number, amount: number): Promise<number> {
    const session = await this.getSavedSession();
    if (session) {
      session.saldo += amount;
      await this.saveSession(session);
      await this.addTransaction({
        user_id: userId,
        type: 'in',
        title: 'Top Up Saldo',
        description: 'Pengisian saldo dompet JasTipGo',
        amount,
      });
      return session.saldo;
    }
    return amount;
  }

  async checkoutWithSaldo(user: User, cartItems: CartItem[], total: number): Promise<Order> {
    if (user.saldo < total) {
      throw new Error('Saldo tidak mencukupi untuk melakukan checkout.');
    }

    // 1. Kurangi saldo penitip
    user.saldo -= total;
    await this.saveSession(user);

    // Cari nama trip dari item pertama
    let tripName = 'Bangkok Snack & Beauty Hunt';
    const rawItems = await AsyncStorage.getItem(STORAGE_KEYS.ITEMS);
    if (rawItems && cartItems.length > 0) {
      const items: Item[] = JSON.parse(rawItems);
      const matched = items.find((i) => i.id === cartItems[0].item_id);
      if (matched?.nama_trip) {
        tripName = matched.nama_trip;
      }
    }

    // 2. Buat order baru
    const orderCode = `JTG-${Math.floor(1000 + Math.random() * 9000)}`;
    const orders = await this.getOrders();
    const newOrder: Order = {
      id: Date.now(),
      order_code: orderCode,
      penitip_id: user.id,
      jastiper_id: 1, // demo jastiper Kevin
      total_harga: total,
      status: 'Dipesan',
      is_saldo_released: 0,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      penitip_nama: user.nama,
      jastiper_nama: 'Kevin Jastiper',
      nama_trip: tripName,
      details: cartItems.map((c, idx) => ({
        id: idx + 1,
        order_id: Date.now(),
        item_id: c.item_id,
        nama_barang: c.nama_barang,
        harga: c.harga,
        qty: c.qty,
        subtotal: c.harga * c.qty,
      })),
    };

    orders.unshift(newOrder);
    await AsyncStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));

    // 3. Kurangi stok barang
    if (rawItems) {
      const items: Item[] = JSON.parse(rawItems);
      for (const cartIt of cartItems) {
        const item = items.find((i) => i.id === cartIt.item_id);
        if (item) {
          item.stok = Math.max(0, item.stok - cartIt.qty);
        }
      }
      await AsyncStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
    }

    // 4. Bersihkan cart
    await this.clearCart();

    // 5. Catat riwayat pengeluaran saldo
    await this.addTransaction({
      user_id: user.id,
      type: 'out',
      title: `Pembayaran ${cartItems.map((c) => c.nama_barang).join(', ')}`,
      description: `Checkout pesanan ${orderCode}`,
      amount: total,
    });

    return newOrder;
  }

  async getOrders(): Promise<Order[]> {
    await this.ensureSeeded();
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.ORDERS);
    let orders: Order[] = raw ? JSON.parse(raw) : [...INITIAL_ORDERS];

    // Sinkronkan custom request dari penitip agar pasti muncul di Pesanan Saya
    const rawRequests = await AsyncStorage.getItem(STORAGE_KEYS.REQUESTS);
    if (rawRequests) {
      const requests: CustomRequest[] = JSON.parse(rawRequests);
      for (const req of requests) {
        if (req.status === 'Ditolak') continue;
        const exists = orders.some(
          (o) =>
            o.order_code === `REQ-${req.id}` ||
            o.order_code === `REQ-${String(req.id).slice(-4)}` ||
            (o.details &&
              o.details.some(
                (d) =>
                  d.nama_barang.toLowerCase().includes(req.nama_barang.toLowerCase()) ||
                  req.nama_barang.toLowerCase().includes(d.nama_barang.toLowerCase())
              ))
        );
        if (!exists) {
          const newOrderFromReq: Order = {
            id: 800000 + req.id,
            order_code: `REQ-${req.id}`,
            penitip_id: req.user_id,
            penitip_nama: req.pemohon_nama || 'Penitip',
            jastiper_id: 1,
            jastiper_nama: 'Kevin Jastiper',
            nama_trip: req.nama_trip || 'Tokyo Spring Trip',
            total_harga: req.perkiraan_harga,
            status: req.status === 'ACC' ? 'Dibeli' : 'Dipesan',
            is_saldo_released: 0,
            created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
            details: [
              {
                id: 1,
                order_id: 800000 + req.id,
                item_id: 0,
                nama_barang: `${req.nama_barang} (Request Titipan)`,
                harga: req.perkiraan_harga,
                qty: 1,
                subtotal: req.perkiraan_harga,
              },
            ],
          };
          orders.unshift(newOrderFromReq);
        }
      }
      await AsyncStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    }

    // Pastikan setiap order memiliki nama_trip default
    for (const o of orders) {
      if (!o.nama_trip) {
        if (
          o.details?.some((d) =>
            ['Tokyo Banana', 'Hada Labo Lotion', 'Matcha KitKat', 'Mini Totebag'].some((n) =>
              d.nama_barang.includes(n)
            )
          )
        ) {
          o.nama_trip = 'Tokyo Spring Trip';
        } else {
          o.nama_trip = 'Bangkok Snack & Beauty Hunt';
        }
      }
    }

    return orders;
  }

  async confirmOrderReceived(orderId: number): Promise<void> {
    const orders = await this.getOrders();
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      order.status = 'Selesai';
      order.is_saldo_released = 1;
      await AsyncStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));

      // 1. Cairkan saldo ke dompet Jastiper
      const rawUsers = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      if (rawUsers) {
        const users: User[] = JSON.parse(rawUsers);
        const jastiper = users.find((u) => u.id === order.jastiper_id);
        if (jastiper) {
          jastiper.saldo += order.total_harga;
          await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        }
      }
      const session = await this.getSavedSession();
      if (session && session.id === order.jastiper_id) {
        session.saldo += order.total_harga;
        await this.saveSession(session);
      }

      // 2. Catat riwayat uang masuk untuk Jastiper
      const itemsText = order.details?.map((d) => d.nama_barang).join(', ') || 'Pesanan';
      await this.addTransaction({
        user_id: order.jastiper_id,
        type: 'in',
        title: `Pencairan Jastip (${itemsText})`,
        description: `Pesanan ${order.order_code} telah selesai diterima pembeli`,
        amount: order.total_harga,
      });
    }
  }

  async cancelOrder(orderId: number): Promise<void> {
    const rawOrders = await AsyncStorage.getItem(STORAGE_KEYS.ORDERS);
    if (rawOrders) {
      let orders: Order[] = JSON.parse(rawOrders);
      const target = orders.find((o) => o.id === orderId);
      if (target) {
        // 1. Refund saldo to user
        const rawUsers = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
        if (rawUsers) {
          const users: User[] = JSON.parse(rawUsers);
          const buyer = users.find((u) => u.id === target.penitip_id);
          if (buyer) {
            buyer.saldo += target.total_harga;
            await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
          }
        }
        const session = await this.getSavedSession();
        if (session && session.id === target.penitip_id) {
          session.saldo += target.total_harga;
          await this.saveSession(session);
        }

        // 2. Return stock to catalog
        const rawItems = await AsyncStorage.getItem(STORAGE_KEYS.ITEMS);
        if (rawItems && target.details) {
          const items: Item[] = JSON.parse(rawItems);
          for (const d of target.details) {
            const it = items.find((i) => i.id === d.item_id || i.nama_barang === d.nama_barang);
            if (it) {
              it.stok += d.qty;
            }
          }
          await AsyncStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
        }

        // 3. Remove order
        orders = orders.filter((o) => o.id !== orderId);
        await AsyncStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));

        // 4. Catat riwayat pengembalian dana
        await this.addTransaction({
          user_id: target.penitip_id,
          type: 'in',
          title: 'Pengembalian Dana (Refund)',
          description: `Pembatalan pesanan ${target.order_code}`,
          amount: target.total_harga,
        });
      }
    }
  }

  async submitReview(orderId: number, rating: number, comment: string): Promise<void> {
    const orders = await this.getOrders();
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      order.rating = rating;
      order.review_comment = comment;
      await AsyncStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    }
  }

  async getReviews(jastiperId?: number): Promise<JastipReview[]> {
    const orders = await this.getOrders();
    const reviewedOrders = orders.filter((o) => o.rating && o.rating > 0);
    const reviews: JastipReview[] = reviewedOrders.map((o) => ({
      id: o.id,
      order_id: o.id,
      order_code: o.order_code,
      penitip_nama: o.penitip_nama || 'Rani Wijaya',
      nama_trip: o.nama_trip || 'Tokyo Spring Trip',
      items_summary: o.details?.map((d) => `${d.nama_barang} x${d.qty}`).join(', ') || 'Barang Titipan',
      rating: o.rating || 5,
      review_comment: o.review_comment || 'Pelayanan jastip memuaskan dan barang sampai dengan aman.',
      created_at: o.created_at || '2026-04-14 12:00',
    }));

    if (reviews.length === 0) {
      reviews.push({
        id: 999,
        order_id: 999,
        order_code: 'JTG-0128',
        penitip_nama: 'Rani Wijaya',
        nama_trip: 'Tokyo Spring Trip',
        items_summary: 'Pocky Matcha x6',
        rating: 5,
        review_comment: 'Titipan dibelikan lengkap dan packing sangat rapi pakai bubble wrap tebal! Jastiper sangat ramah dan amanah ⭐⭐⭐⭐⭐',
        created_at: '2026-04-11 16:45',
      });
    }

    return reviews;
  }

  async updateItemStatus(namaBarang: string, nextStatus: 'Dibeli' | 'Dikirim' | 'Tiba'): Promise<void> {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.ORDERS);
    if (raw) {
      const orders: Order[] = JSON.parse(raw);
      let updated = false;
      for (const ord of orders) {
        if (ord.details) {
          const hasItem = ord.details.some(
            (d) =>
              d.nama_barang.toLowerCase().trim() === namaBarang.toLowerCase().trim() ||
              d.nama_barang.toLowerCase().includes(namaBarang.toLowerCase()) ||
              namaBarang.toLowerCase().includes(d.nama_barang.toLowerCase())
          );
          if (hasItem) {
            ord.status = nextStatus;
            updated = true;
          }
        }
      }
      if (updated) {
        await AsyncStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
      }
    }
  }

  // --- GPS CHECKIN ---
  async getCheckins(): Promise<TripCheckin[]> {
    await this.ensureSeeded();
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.CHECKINS);
    return raw ? JSON.parse(raw) : INITIAL_CHECKINS;
  }

  async createCheckin(checkin: Omit<TripCheckin, 'id' | 'waktu_checkin'>): Promise<TripCheckin> {
    const checkins = await this.getCheckins();
    // Nonaktifkan badge terbaru pada yang lama
    checkins.forEach((c) => (c.is_new = false));

    const now = new Date();
    const waktu = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newCheckin: TripCheckin = {
      ...checkin,
      id: Date.now(),
      waktu_checkin: waktu,
      is_new: true,
    };
    checkins.unshift(newCheckin);
    await AsyncStorage.setItem(STORAGE_KEYS.CHECKINS, JSON.stringify(checkins));
    return newCheckin;
  }

  // --- SUMMARY FOR JASTIPER ---
  async getSummary(tripFilter?: string): Promise<{
    total_barang: number;
    summary_list: OrderSummaryItem[];
    available_trips: string[];
  }> {
    const orders = await this.getOrders();
    // Hanya masukkan pesanan yang belum Selesai (karena barang yang sudah selesai diterima pembeli sudah rampung)
    const activeOrders = orders.filter((o) => o.status !== 'Selesai');

    const tripSet = new Set<string>();
    activeOrders.forEach((o) => {
      if (o.nama_trip) tripSet.add(o.nama_trip);
    });

    const filtered =
      tripFilter && tripFilter !== 'Semua'
        ? activeOrders.filter(
            (o) => o.nama_trip && o.nama_trip.toLowerCase().includes(tripFilter.toLowerCase())
          )
        : activeOrders;

    const summaryMap: Record<
      string,
      { qty: number; buyers: Set<string>; trip?: string; status: string }
    > = {};

    for (const ord of filtered) {
      const buyer = ord.penitip_nama ?? 'Pembeli';
      if (ord.details) {
        for (const d of ord.details) {
          if (!summaryMap[d.nama_barang]) {
            summaryMap[d.nama_barang] = {
              qty: 0,
              buyers: new Set(),
              trip: ord.nama_trip || 'Bangkok Snack & Beauty Hunt',
              status: ord.status === 'Dipesan' ? 'Perlu Dibeli' : ord.status,
            };
          }
          summaryMap[d.nama_barang].qty += d.qty;
          summaryMap[d.nama_barang].buyers.add(buyer);
          // Jika ada yang masih dipesan, prioritaskan label 'Perlu Dibeli'
          if (ord.status === 'Dipesan') {
            summaryMap[d.nama_barang].status = 'Perlu Dibeli';
          }
        }
      }
    }

    let total = 0;
    const list: OrderSummaryItem[] = Object.keys(summaryMap).map((name) => {
      total += summaryMap[name].qty;
      return {
        nama_barang: name,
        total_qty: summaryMap[name].qty,
        pemesan: Array.from(summaryMap[name].buyers).join(', '),
        nama_trip: summaryMap[name].trip,
        status: summaryMap[name].status,
      };
    });

    return {
      total_barang: total,
      summary_list: list,
      available_trips: Array.from(tripSet),
    };
  }

  // --- WALLET TRANSACTIONS ---
  async getTransactions(userId?: number): Promise<WalletTransaction[]> {
    await this.ensureSeeded();
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    const all: WalletTransaction[] = raw ? JSON.parse(raw) : [...INITIAL_TRANSACTIONS];
    if (userId) {
      return all.filter((t) => t.user_id === userId);
    }
    return all;
  }

  async addTransaction(tx: Omit<WalletTransaction, 'id' | 'created_at'>): Promise<WalletTransaction> {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    const all: WalletTransaction[] = raw ? JSON.parse(raw) : [...INITIAL_TRANSACTIONS];
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newTx: WalletTransaction = {
      ...tx,
      id: Date.now(),
      created_at: dateStr,
    };
    all.unshift(newTx);
    await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(all));
    return newTx;
  }

  // --- BASE64 UPLOADER (RUBRIK D) ---
  async uploadBase64Image(id: string, base64: string): Promise<string> {
    try {
      const form = new URLSearchParams({ id, image: base64 });
      const resp = await fetch(`${API_BASE_URL}/uploadimage.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
      });
      const data = await resp.json();
      if (data.result === 'success' && data.image_url) {
        return data.image_url;
      }
    } catch {
      // Fallback: return data URI
    }
    return `data:image/png;base64,${base64}`;
  }
}

export const api = new JastipApiService();
