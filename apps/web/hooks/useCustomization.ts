import { create } from "zustand";

type Store = {
  logo: string | null;

  setLogo: (logo: string) => void;
};

export const useCustomization =
  create<Store>((set) => ({
    logo: null,

    setLogo: (logo) =>
      set({
        logo,
      }),
  }));