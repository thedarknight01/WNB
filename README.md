# WBN Studio

**A local-first, infinitely-scalable whiteboard + notebook workspace built with React, Konva, and TipTap.**

![License](https://img.shields.io/badge/license-MIT-blue)
![Version](https://img.shields.io/badge/version-1.0.0-green)

## ✨ Features

- **Infinite Whiteboard** — Powered by Konva.js. Draw shapes, connect diagrams, embed media.
- **Structured Notebook** — Full TipTap rich text editor with tables, highlights, and links.
- **Split View** — View and edit a whiteboard and notebook side-by-side.
- **Magic Tags (`@`)** — Reference a labeled whiteboard element directly inside your notebook.
- **Local-First** — All data saved to IndexedDB instantly. Works completely offline.
- **WNB3 Encryption** — Exported `.wnb` files are GZIP-compressed and AES-256-GCM encrypted.
- **Optional Master Password** — Strengthen your encryption with a personal session password.
- **Cloud Sync (Optional)** — Connect a Supabase project for cross-device sync.
- **Multi-tab Workspace** — Work on multiple boards/notebooks simultaneously.

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## ☁️ Cloud Sync Setup (Optional)

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **Settings → API** and copy your **Project URL** and **Anon Public Key**
3. In WBN Studio, open **Settings → Sync & Data** and paste your keys
4. Open the **Setup DB** dialog, copy the SQL, and run it in your [Supabase SQL Editor](https://supabase.com/dashboard)
5. Click **Verify Connection** — you're done!

## 🔒 Security Model

| Layer | Mechanism |
|---|---|
| Local Storage | IndexedDB (browser-native, sandboxed) |
| Exported Backups | AES-256-GCM + PBKDF2 (120k iterations) + GZIP |
| Master Password | Memory-only (never saved to localStorage) |
| Cloud Data | Anon key via Supabase RLS-disabled table (data is pre-encrypted) |
| Font Name XSS | Input validated against `^[a-zA-Z0-9\s-]+$` |

## 🛠 Tech Stack

- **React 19** + TypeScript
- **Konva.js / react-konva** — Canvas rendering
- **TipTap** — Rich text editing
- **Zustand** — State management
- **idb** — IndexedDB wrapper
- **Supabase** — Optional cloud backend
- **Framer Motion** — Animations
- **Vite** — Build tooling

## 📄 License

MIT © WBN Studio