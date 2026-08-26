import { create } from "zustand";

export type FeedFilter = "all" | "unsolved" | "following" | "university";

interface UIState {
  activeFeedFilter: FeedFilter;
  isOffline: boolean;
  setActiveFeedFilter: (filter: FeedFilter) => void;
  setOffline: (isOffline: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeFeedFilter: "all",
  isOffline: false,
  setActiveFeedFilter: (activeFeedFilter) => set({ activeFeedFilter }),
  setOffline: (isOffline) => set({ isOffline }),
}));
