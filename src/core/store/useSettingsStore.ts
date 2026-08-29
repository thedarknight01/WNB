import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getActiveStore } from './useAppStore';

// Define the shortcuts we want to allow users to change
interface Keybindings {
  select: string;
  pen: string;
  rectangle: string;
  circle: string;
  text: string;
  eraser: string;
}

interface SettingsState {
  theme: 'light' | 'dark';
  gridStyle: 'grid' | 'dot' | 'none';
  gridColor: string;
  backgroundColor: string;
  viewMode: 'canvas' | 'split' | 'notebook';
  
  isSettingsOpen: boolean;
  labelFontFamily: string;
  labelFontSize: number;
  labelColor: string;
  labelFontStyle: 'normal' | 'italic' | 'bold';

  // NEW: Advanced Professional Settings
  customFonts: string[];
  keybindings: Keybindings;
  snapToGrid: boolean;
  showRulers: boolean;

  setTheme: (theme: 'light' | 'dark') => void;
  setGridStyle: (style: 'grid' | 'dot' | 'none') => void;
  setGridColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  setViewMode: (mode: 'canvas' | 'split' | 'notebook') => void;
  toggleSettings: () => void;
  updateLabelSettings: (updates: Partial<SettingsState>) => void;
  
  // NEW: Actions
  addCustomFont: (fontFamily: string) => void;
  removeCustomFont: (fontFamily: string) => void;
  updateKeybinding: (action: keyof Keybindings, key: string) => void;
  toggleSnapToGrid: () => void;
  toggleRulers: () => void;
}

// Wrap the entire store in `persist`
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      theme: 'light', gridStyle: 'dot', gridColor: '#cbd5e1', backgroundColor: '#f8fafc',
      viewMode: 'canvas', isSettingsOpen: false,
      labelFontFamily: 'Inter', labelFontSize: 16, labelColor: '#64748b', labelFontStyle: 'normal',
      
      // Default values
      customFonts: ['Arial', 'Courier New', 'Times New Roman', 'Inter', 'Roboto'],
      keybindings: { select: 'v', pen: 'p', rectangle: 'r', circle: 'c', text: 't', eraser: 'e' },
      snapToGrid: false,
      showRulers: true,

      setTheme: (theme) => set({ theme, backgroundColor: theme === 'dark' ? '#0f172a' : '#f8fafc', gridColor: theme === 'dark' ? '#334155' : '#cbd5e1' }),
      setGridStyle: (style) => set({ gridStyle: style }),
      setGridColor: (color) => set({ gridColor: color }),
      setBackgroundColor: (color) => set({ backgroundColor: color }),
      setViewMode: (mode) => set({ viewMode: mode }),
      toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),
      updateLabelSettings: (updates) => set((state) => ({ ...state, ...updates })),
      
      // NEW ACTIONS
      addCustomFont: async (fontFamily) => {
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
          } catch (e) { console.error("Font loading error", e); }
        }
      },
      removeCustomFont: (fontFamily) => set((state) => ({ 
        customFonts: state.customFonts.filter(f => f !== fontFamily) 
      })),

      updateKeybinding: (action, key) => set((state) => ({
        keybindings: { ...state.keybindings, [action]: key.toLowerCase() }
      })),
      toggleSnapToGrid: () => set((state) => ({ snapToGrid: !state.snapToGrid })),
      toggleRulers: () => set((state) => ({ showRulers: !state.showRulers }))
    }),
    {
      name: 'visual_board_settings', // The key used in localStorage
      partialize: (state) => {
        // We don't want to save if the modal is open, just the actual settings
        const { isSettingsOpen, ...rest } = state;
        return rest;
      },
      // Re-inject Google Font link tags after store is rehydrated from localStorage
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
