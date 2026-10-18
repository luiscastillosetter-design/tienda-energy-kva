import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CartItem = {
  id: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
};

export type Currency = 'USD' | 'VES' | 'USDT';

type CartState = {
  items: CartItem[];
  isCartOpen: boolean;
  currency: Currency;
  bcvRate: number;
  usdtRate: number;
  setCurrency: (currency: Currency) => void;
  setBcvRate: (rate: number) => void;
  setUsdtRate: (rate: number) => void;
  addItem: (item: Omit<CartItem, 'quantity'>, quantity: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  toggleCart: () => void;
  clearCart: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isCartOpen: false,
      currency: 'USD',
      bcvRate: 0,
      usdtRate: 1,

      setCurrency: (currency) => set({ currency }),
      setBcvRate: (bcvRate) => set({ bcvRate }),
      setUsdtRate: (usdtRate) => set({ usdtRate }),

      addItem: (item, quantity) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === item.id);
          if (existing) {
            return { items: state.items.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i) };
          }
          return { items: [...state.items, { ...item, quantity }] };
        }),
      removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      updateQuantity: (id, quantity) =>
        set((state) => ({ items: state.items.map((i) => i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i) })),
      toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
      clearCart: () => set({ items: [] }),
    }),
    { name: 'kva_cart_storage' }
  )
);