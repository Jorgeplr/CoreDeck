import { create } from "zustand";

interface VaultState {
  masterKey: CryptoKey | null;
  /** X25519 private key (raw 32 bytes) — used to decrypt entries shared with us. */
  privateKey: Uint8Array | null;
  isUnlocked: boolean;
  unlock: (key: CryptoKey, privateKey?: Uint8Array | null) => void;
  setPrivateKey: (pk: Uint8Array | null) => void;
  lock: () => void;
}

export const useVaultStore = create<VaultState>((set) => ({
  masterKey: null,
  privateKey: null,
  isUnlocked: false,
  unlock: (key, privateKey = null) =>
    set({ masterKey: key, privateKey, isUnlocked: true }),
  setPrivateKey: (pk) => set({ privateKey: pk }),
  lock: () => set({ masterKey: null, privateKey: null, isUnlocked: false }),
}));
