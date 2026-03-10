import { create } from "zustand";

interface VaultState {
  masterKey: CryptoKey | null;
  isUnlocked: boolean;
  unlock: (key: CryptoKey) => void;
  lock: () => void;
}

export const useVaultStore = create<VaultState>((set) => ({
  masterKey: null,
  isUnlocked: false,
  unlock: (key) => set({ masterKey: key, isUnlocked: true }),
  lock: () => set({ masterKey: null, isUnlocked: false }),
}));
