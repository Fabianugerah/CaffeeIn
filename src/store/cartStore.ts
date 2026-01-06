import { create } from 'zustand';
import { Masakan } from '@/types';

interface CartItem extends Masakan {
  jumlah: number;
  keterangan?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (masakan: Masakan, jumlah?: number) => void;
  removeItem: (id_masakan: number) => void;
  updateQuantity: (id_masakan: number, jumlah: number) => void;
  updateKeterangan: (id_masakan: number, keterangan: string) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  
  addItem: (masakan, jumlah = 1) => {
    const items = get().items;
    const existingItem = items.find(item => item.id_masakan === masakan.id_masakan);
    
    if (existingItem) {
      set({
        items: items.map(item =>
          item.id_masakan === masakan.id_masakan
            ? { ...item, jumlah: item.jumlah + jumlah }
            : item
        ),
      });
    } else {
      set({ items: [...items, { ...masakan, jumlah }] });
    }
  },
  
  removeItem: (id_masakan) => {
    set({ items: get().items.filter(item => item.id_masakan !== id_masakan) });
  },
  
  updateQuantity: (id_masakan, jumlah) => {
    if (jumlah <= 0) {
      get().removeItem(id_masakan);
    } else {
      set({
        items: get().items.map(item =>
          item.id_masakan === id_masakan ? { ...item, jumlah } : item
        ),
      });
    }
  },
  
  updateKeterangan: (id_masakan, keterangan) => {
    set({
      items: get().items.map(item =>
        item.id_masakan === id_masakan ? { ...item, keterangan } : item
      ),
    });
  },
  
  clearCart: () => set({ items: [] }),
  
  getTotalPrice: () => {
    return get().items.reduce((total, item) => total + (item.harga * item.jumlah), 0);
  },
}));