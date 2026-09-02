import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getActiveStore } from './useAppStore';

interface Keybindings {
  select: string;
  pen: string;
  rectangle: string;
  circle: string;
  text: string;
  eraser: string;
}

interface SettingsState {
  theme: 'light' | 'dark' | 'sepia' | 'midnight' | 'forest';
  gridStyle: 'grid' | 'dot' | 'none';
  gridColor: string;
  backgroundColor: string;
  viewMode: 'canvas' | 'split' | 'notebook';
  isSettingsOpen: boolean;
  labelFontFamily: string;
  labelFontSize: number;
  labelColor: string;
  labelFontStyle: 'normal' | 'italic' | 'bold';
  customFonts: string[];
  keybindings: Keybindings;
  snapToGrid: boolean;
  showRulers: boolean;
  supabaseUrl: string;
  supabaseAnonKey: string;
  autoSyncCloud: boolean;
  // SECURITY: masterPassword is memory-only (never persisted to localStorage)
  masterPassword?: string;

  setTheme: (theme: 'light' | 'dark' | 'sepia' | 'midnight' | 'forest') => void;
  setGridStyle: (style: 'grid' | 'dot' | 'none') => void;
  setGridColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  setViewMode: (mode: 'canvas' | 'split' | 'notebook') => void;
  toggleSettings: () => void;
  updateLabelSettings: (updates: Partial<SettingsState>) => void;
  setSupabaseKeys: (url: string, key: string) => void;
  setAutoSyncCloud: (enabled: boolean) => void;
  setMasterPassword: (password: string) => void;
  addCustomFont: (fontFamily: string) => void;
  removeCustomFont: (fontFamily: string) => void;
  updateKeybinding: (action: keyof Keybindings, key: string) => void;
  toggleSnapToGrid: () => void;
  toggleRulers: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      theme: 'light', gridStyle: 'dot', gridColor: '#cbd5e1', backgroundColor: '#f8fafc',
      viewMode: 'canvas', isSettingsOpen: false,
      labelFontFamily: 'Inter', labelFontSize: 16, labelColor: '#64748b', labelFontStyle: 'normal',
      customFonts: ['Arial', 'Courier New', 'Times New Roman', 'Inter', 'Roboto'],
      keybindings: { select: 'v', pen: 'p', rectangle: 'r', circle: 'c', text: 't', eraser: 'e' },
      snapToGrid: false,
      showRulers: true,
      supabaseUrl: '',
      supabaseAnonKey: '',
      autoSyncCloud: false,
      masterPassword: '', // memory-only, excluded from persist via partialize

      setAutoSyncCloud: (enabled) => set({ autoSyncCloud: enabled }),
      setSupabaseKeys: (url, key) => set({ supabaseUrl: url, supabaseAnonKey: key }),
      setMasterPassword: (password) => set({ masterPassword: password }),
      setTheme: (theme) => set({
        theme,
        backgroundColor: theme === 'dark' || theme === 'midnight' ? '#0f172a' : theme === 'forest' ? '#eef7f0' : theme === 'sepia' ? '#fbf4e5' : '#f8fafc',
        gridColor: theme === 'dark' || theme === 'midnight' ? '#334155' : theme === 'forest' ? '#b7d7bd' : theme === 'sepia' ? '#dfcfad' : '#cbd5e1',
      }),
      setGridStyle: (style) => set({ gridStyle: style }),
      setGridColor: (color) => set({ gridColor: color }),
      setBackgroundColor: (color) => set({ backgroundColor: color }),
      setViewMode: (mode) => set({ viewMode: mode }),
      toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),
      updateLabelSettings: (updates) => set((state) => ({ ...state, ...updates })),

      addCustomFont: async (fontFamily) => {
        // SECURITY: Reject malicious font names to prevent XSS via Google Fonts URL injection
        if (!/^[a-zA-Z0-9\s-]+$/.test(fontFamily)) {
          console.error('Invalid font name');
          return;
        }
        const fonts = get().customFonts;
        if (!fonts.includes(fontFamily)) {
          set({ customFonts: [...fonts, fontFamily] });
          const link = document.createElement('link');
          link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}:wght@400;700&display=swap`;
          link.rel = 'stylesheet';
          document.head.appendChild(link);
          try {
            await document.fonts.load(`16px "${fontFamily}"`);
            getActiveStore()?.getState().showToast(`Font "${fontFamily}" installed!`);
          } catch (e) { console.error('Font loading error', e); }
        }
      },

      removeCustomFont: (fontFamily) => set((state) => ({
        customFonts: state.customFonts.filter(f => f !== fontFamily)
      })),

      updateKeybinding: (action, key) => set((state) => ({
        keybindings: { ...state.keybindings, [action]: key.toLowerCase() }
      })),
      toggleSnapToGrid: () => set((state) => ({ snapToGrid: !state.snapToGrid })),
      toggleRulers: () => set((state) => ({ showRulers: !state.showRulers })),
    }),
    {
      name: 'visual_board_settings',
      partialize: (state) => {
        // SECURITY: masterPassword must NEVER be persisted to localStorage (memory-only)
        // isSettingsOpen is ephemeral UI state, also excluded
        const { isSettingsOpen: _isSettingsOpen, masterPassword: _masterPassword, setMasterPassword: _setMasterPassword, ...rest } = state as any;
        return rest;
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.customFonts.forEach(font => {
          const id = `gfont-${font.replace(/\s/g, '-')}`;
          if (!document.getElementById(id)) {
            const link = document.createElement('link');
            link.id = id;
            link.rel = 'stylesheet';
            link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/ /g, '+')}:wght@400;700&display=swap`;
            document.head.appendChild(link);
          }
        });
      },
    }
  )
);
