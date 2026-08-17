# 🪐 WNB 
> **Think visually. Write deeply. Keep everything in one workspace.**

WNB is a modern, browser-based workspace designed for thinking, organizing, and creating. It merges visual and structured thought by combining a flexible infinite canvas with a powerful rich-text notebook, allowing ideas, notes, and visual elements to coexist seamlessly.

[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-blue?logo=github)](https://github.com/thedarknight01/WNB)
[![Status](https://img.shields.io/badge/Status-Active-success)](#-project-status)

---

## ✨ Features

### 🖼️ Infinite Canvas
*   **Infinite/Pannable Workspace:** Fluid zoom and intuitive navigation.
*   **High-Performance Rendering:** Smooth, canvas-based engine powered by Konva.
*   **Rich Interactivity:** Interactive objects, shapes, selection, and manipulation.
*   **Advanced Controls:** Context menus and a dedicated properties panel.
*   **Hybrid Rendering:** HTML overlays for richer interactions and canvas-native text editing.

### 📝 Integrated Notebook
WNB includes a robust rich-text notebook powered by Tiptap, supporting:
*   Headings, standard rich text (Bold, Italic, Underline), and alignment.
*   Text colors, highlighting, and custom font families.
*   Links, images, and tables.
*   Mentions and autocomplete capabilities.
*   Structured document editing.

### 💾 Local-First Storage
WNB is designed around browser-side persistence using **IndexedDB**. It stores all workspace data locally without requiring a traditional backend, ensuring your work is always fast, private, and available offline.

---

## 🛠️ Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **React 19** | Core UI library |
| **TypeScript** | Type safety and developer experience |
| **Vite** | Modern build tooling and development server |
| **Zustand** | Lightweight state management |
| **Konva / React-Konva** | High-performance canvas rendering engine |
| **Tiptap** | Extensible rich-text editor framework |
| **Framer Motion** | Declarative animations and gestures |
| **Lucide React** | Clean and consistent icon set |
| **Tippy.js** | Accessible tooltips and popovers |
| **IndexedDB (via `idb`)** | Client-side database for local-first storage |
| **Oxlint** | High-performance linter for code quality |

---

## 🚀 Getting Started

### Prerequisites
Make sure you have **Node.js** and **npm** installed on your system.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/thedarknight01/WNB.git
   ```
2. **Enter the project directory:**
   ```bash
   cd WNB
   ```
3. **Install dependencies:**
   ```bash
   npm install
   ```
4. **Start the development server:**
   ```bash
   npm run dev
   ```
   *Vite will provide a local development URL in your terminal.*

---

## 📦 Project Scripts

*   `npm run dev` — Starts the Vite development server.
*   `npm run build` — Creates an optimized production build.
*   `npm run preview` — Serves the production build locally for testing.
*   `npm run lint` — Runs Oxlint to analyze the codebase for errors and style issues.

---

## 🧠 Core Concept

Instead of keeping visual ideas and written notes in separate applications, WNB aims to provide a single, unified workspace.

```text
                 WNB
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
   Infinite Canvas       Notebook
 (Visual Thinking)   (Structured Notes)
        │                   │
        └─────────┬─────────┘
                  │
                  ▼
          Unified Workspace
```

### Data Architecture
Data persists strictly in the browser, flowing from UI interactions to Zustand, and ultimately safely to IndexedDB.

```text
 [User Input] ──► [React UI] ──► [Zustand Store] ──┬──► [UI Updates]
                                                   └──► [IndexedDB]
```

---

## 🏗️ Project Structure

The application is organized around modular layers separating the canvas logic from the notebook and core state.

```text
WNB/
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── components/
│   │   ├── canvas/       # Konva, Grid, Shapes, Overlays
│   │   ├── notebook/     # Tiptap Editor, Mentions
│   │   └── panels/       # Context Menus, Settings, Ribbons
│   ├── core/
│   │   └── store/        # Zustand (useBoardStore, useSettingsStore)
│   ├── hooks/
│   ├── types/
│   ├── utils/
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── index.html
├── package.json
└── vite.config.ts
```

---

## ⌨️ Keyboard Shortcuts
WNB provides intuitive keyboard interactions to support fast, keyboard-driven workflows. *(Comprehensive shortcut documentation will be added as the command system is finalized).*

---

## 🎯 Project Goals & Philosophy

1.  **Visual thinking:** Provide a flexible canvas for ideas and information.
2.  **Structured thinking:** Provide a powerful notebook for detailed writing.
3.  **Local-first workflow:** Keep core workspace data available safely in the browser.
4.  **Responsive interaction:** Make common operations feel natural and fast.
5.  **Extensible architecture:** Easily add new object types and features without rewrites.

**Development Philosophy:** 
WNB is developed incrementally to maintain a rock-solid foundation:
`Understand ➔ Design ➔ Implement ➔ Test ➔ Improve ➔ Document ➔ Release`

---

## 🗺️ Roadmap (WNB v2)

The current development phase is focused on reinforcing the application's foundation.

**Core**
- [ ] Architecture cleanup & stronger data model
- [ ] Reliable persistence & error recovery
- [ ] Undo/redo improvements

**Canvas**
- [ ] Better multi-selection, copy/paste, and object duplication
- [ ] Improved zoom, navigation, and rendering performance for large boards
- [ ] Additional object types

**Notebook & UX**
- [ ] Improved editor UX and Canvas ↔ Notebook integration
- [ ] Enhanced toolbars, properties panels, and context menus
- [ ] Command/shortcut system implementation
- [ ] Accessibility improvements, empty states, and loading/error states

**Quality Control**
- [ ] Unit, integration, and performance testing
- [ ] CI checks & developer documentation

---

## 🤝 Contributing
Contributions, ideas, bug reports, and feedback are highly welcome! 
Before making significant changes, please open an issue to discuss your proposed updates.

---

## 📌 Project Status
WNB is under **active development** and evolving toward a more stable, feature-complete v2 architecture. *Please note: APIs, internal data structures, UI behaviors, and features may change as development continues.*

---

## 📄 License
WNB is distributed under the license included in this repository. See `LICENSE` for the complete text.