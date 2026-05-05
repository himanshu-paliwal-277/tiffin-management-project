import { create } from 'zustand';

const usePoolStore = create((set) => ({
  pool: null,
  setPool: (pool) => set({ pool }),
  clearPool: () => set({ pool: null }),
}));

export default usePoolStore;
