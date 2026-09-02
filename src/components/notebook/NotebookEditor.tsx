import { useEffect, useLayoutEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Mention from '@tiptap/extension-mention';
import FontFamily from '@tiptap/extension-font-family';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { FontSize } from './FontSize';
import { useSettingsStore } from '../../core/store/useSettingsStore';
import { useBoardStore } from '../../core/store/useBoardStore';
import { storeRegistry, useAppStore } from '../../core/store/useAppStore';
import {
  Bold, Italic, Underline as UnderlineIcon, Heading1, Heading2, Heading3,
  List, ListOrdered, Table as TableIcon, Link as LinkIcon, Image as ImageIcon,
  AlignLeft, AlignCenter, AlignRight, Undo, Redo, Code, Quote,
  Strikethrough, Minus, Type, Baseline
} from 'lucide-react';
import { getSuggestionConfig, getLabelSuggestionConfig } from './suggestion';
import MentionExtension from '@tiptap/extension-mention';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { ReactNodeViewRenderer, Node } from '@tiptap/react';
import { LiveDiagramRef } from './LiveDiagramRef';
import './editor.css';

const DiagramRefExtension = Node.create({
  name: 'diagramRef',
  group: 'block',
  atom: true,
  addAttributes() {
    return {
      id: { default: null },
      label: { default: null },
      docId: { default: null }
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-type="diagramRef"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-type': 'diagramRef', ...HTMLAttributes }];
  },
  addNodeView() {
    return ReactNodeViewRenderer(LiveDiagramRef);
  },
});

// ----- Load Google Fonts from stored list on mount -----
function loadSavedFonts(fonts: string[]) {
  fonts.forEach(font => {
    const id = `gfont-${font.replace(/\s/g, '-')}`;
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font).replace(/%20/g, '+')}:wght@400;700&display=swap`;
      document.head.appendChild(link);
    }
  });
}

export const NotebookEditor = ({ docId, toolbarSlotId }: { docId: string; toolbarSlotId: string }) => {
  const [toolbarTarget, setToolbarTarget] = useState<HTMLElement | null>(null);
  const { theme, customFonts } = useSettingsStore();
  const activeMenuTab = useAppStore(s => s.activeMenuTab);
  const focusedTabId = useAppStore(s => s.focusedTabId);
  const notebookContent = useBoardStore(s => s.notebookContent);
  const setNotebookContent = useBoardStore(s => s.setNotebookContent);
  const focusCameraOn = useBoardStore(s => s.focusCameraOn);
  const isDark = theme === 'dark' || theme === 'midnight';

  // ---- State for inline dropdowns ----
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkHref, setLinkHref] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [showTableInput, setShowTableInput] = useState(false);

  // Color picker refs — these are hidden <input type="color"> elements we click programmatically
  const textColorRef = useRef<HTMLInputElement>(null);
  const highlightColorRef = useRef<HTMLInputElement>(null);

  // Load ALL saved fonts on mount (fix: fonts lost on page reload)
  useEffect(() => {
    loadSavedFonts(customFonts);
  }, [customFonts]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: false, underline: false }),
      // Text color
      TextStyle,
      Color,
      FontSize,
      // Highlight (single color via picker)
      Highlight.configure({ multicolor: true }),
      // Alignment — MUST be added explicitly
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      // Links & Images
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: false }),
      Underline,
      // Tables
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      // Mentions
      Mention.configure({
        HTMLAttributes: { class: 'mention-link' },
        suggestion: getSuggestionConfig(isDark),
        renderLabel({ node }: any) {
          return `↗ ${node.attrs.label || node.attrs.id}`;
        },
      }),
      MentionExtension.extend({
        name: 'labelMention',
        addAttributes() {
          return {
            id: { default: null },
            label: { default: null },
            docId: {
              default: null,
              renderHTML: attributes => ({ 'data-doc-id': attributes.docId }),
            },
          };
        },
      }).configure({
        HTMLAttributes: { class: 'mention-link', 'data-type': 'labelMention' },
        suggestion: getLabelSuggestionConfig(isDark),
        renderLabel({ node }: any) {
          return `@${node.attrs.label || node.attrs.id}`;
        },
      }),
      FontFamily,
      DiagramRefExtension,
    ],
    content: notebookContent,
    onUpdate: ({ editor }) => setNotebookContent(editor.getHTML()),
    editorProps: {
      attributes: {
        class: `tiptap ${isDark ? 'editor-dark' : 'editor-light'}`,
        style: 'cursor: text;',
      },
      handleDrop: (_view, event) => {
        const files = Array.from(event.dataTransfer?.files || []).filter(f => f.type.startsWith('image/'));
        if (files.length > 0) {
          event.preventDefault();
          files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
              if (ev.target?.result && editor) {
                editor.chain().focus().setImage({ src: ev.target.result as string }).run();
              }
            };
            reader.readAsDataURL(file);
          });
          return true;
        }
        return false;
      },
    },
  });

  // Sync theme class changes
  useEffect(() => {
    if (!editor) return;
    editor.setOptions({
      editorProps: {
        attributes: { class: `tiptap ${isDark ? 'editor-dark' : 'editor-light'}` },
      },
    });
  }, [isDark, editor]);

  // Mention click → focus camera
  useEffect(() => {
    const handleMentionClick = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('mention-link')) {
        const id = target.getAttribute('data-id');
        const docId = target.getAttribute('data-doc-id') || target.getAttribute('docid');
        if (id && docId) {
          const appStore = useAppStore.getState();
          appStore.openTab(docId);
          appStore.setFocusedTab(docId);
          const focusSource = () => {
            const sourceStore = storeRegistry.get(docId);
            if (sourceStore) sourceStore.getState().focusCameraOn(id);
            else window.setTimeout(() => storeRegistry.get(docId)?.getState().focusCameraOn(id), 100);
          };
          focusSource();
        } else if (id) {
          focusCameraOn(id);
        }
      }
    };
    const editorDom = document.querySelector('.tiptap');
    if (editorDom) {
      editorDom.addEventListener('click', handleMentionClick);
      return () => editorDom.removeEventListener('click', handleMentionClick);
    }
  }, [editor, focusCameraOn]);

  const insertImage = useCallback(() => {
    if (!editor || !imageUrl) return;
    editor.chain().focus().setImage({ src: imageUrl }).run();
    setImageUrl(''); setShowImageInput(false);
  }, [editor, imageUrl]);

  const insertLink = useCallback(() => {
    if (!editor || !linkHref) return;
    if (editor.isActive('link')) editor.chain().focus().unsetLink().run();
    editor.chain().focus().setLink({ href: linkHref, target: '_blank' }).run();
    setLinkHref(''); setShowLinkInput(false);
  }, [editor, linkHref]);

  const insertTable = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().insertTable({ rows: tableRows, cols: tableCols, withHeaderRow: true }).run();
    setShowTableInput(false);
  }, [editor, tableRows, tableCols]);

  const handleImageFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) editor.chain().focus().setImage({ src: ev.target.result as string }).run();
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [editor]);

  if (!editor) return null;

  // ----- Styles -----
  const btn = (active: boolean) => ({
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '5px', borderRadius: '5px', border: 'none', cursor: 'pointer', flexShrink: 0,
    backgroundColor: active ? (isDark ? '#3b82f6' : '#dbeafe') : 'transparent',
    color: active ? (isDark ? '#fff' : '#1d4ed8') : (isDark ? '#94a3b8' : '#64748b'),
    transition: 'all 0.15s ease',
  });
  const sep = { width: '1px', height: '20px', backgroundColor: isDark ? '#334155' : '#e2e8f0', margin: '0 2px', flexShrink: 0 };
  const inputSm = { padding: '2px 4px', borderRadius: '4px', border: isDark ? '1px solid #334155' : '1px solid #cbd5e1', background: isDark ? '#0f172a' : '#f8fafc', color: 'inherit', fontSize: '0.75rem' };
  const dropdown = {
    position: 'absolute' as const, top: '100%', left: 0, zIndex: 200, marginTop: '4px',
    background: isDark ? '#1e293b' : '#fff',
    border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
    borderRadius: '8px', padding: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
  };

  // Current color values from editor
  const currentTextColor = editor.getAttributes('textStyle').color || (isDark ? '#f8fafc' : '#0f172a');
  const currentHighlight = editor.getAttributes('highlight').color || '#fef08a';

  const toolbar = (
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '2px', padding: '6px 8px',
        backgroundColor: isDark ? '#0f172a' : '#f8fafc',
        borderRadius: '8px', border: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0',
        marginBottom: '8px', alignItems: 'center', flexShrink: 0,
      }}>

        {/* Undo / Redo */}
        <button onClick={() => editor.chain().focus().undo().run()} style={btn(false)} title="Undo"><Undo size={14} /></button>
        <button onClick={() => editor.chain().focus().redo().run()} style={btn(false)} title="Redo"><Redo size={14} /></button>
        <div style={sep} />

        {/* Font Family */}
        <select
          onChange={(e) => {
            const f = e.target.value;
            if (f) editor.chain().focus().setFontFamily(f).run();
          }}
          value={editor.getAttributes('textStyle').fontFamily || ''}
          title="Font Family"
          style={{
            background: isDark ? '#1e293b' : '#fff',
            color: 'inherit', border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
            borderRadius: '4px', padding: '3px 4px', fontSize: '0.75rem', outline: 'none', maxWidth: '100px',
          }}
        >
          <option value="" disabled>Font</option>
          <option value="Inter">Inter</option>
          {customFonts.map(font => (
            <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
          ))}
        </select>

        {/* Font Size */}
        <select
          onChange={(e) => {
            const size = e.target.value;
            if (size) editor.chain().focus().setFontSize(size).run();
          }}
          value={editor.getAttributes('textStyle').fontSize || ''}
          title="Font Size"
          style={{
            background: isDark ? '#1e293b' : '#fff',
            color: 'inherit', border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
            borderRadius: '4px', padding: '3px 4px', fontSize: '0.75rem', outline: 'none', width: '50px',
          }}
        >
          <option value="" disabled>Size</option>
          <option value="12px">12</option>
          <option value="14px">14</option>
          <option value="16px">16</option>
          <option value="18px">18</option>
          <option value="20px">20</option>
          <option value="24px">24</option>
          <option value="30px">30</option>
          <option value="36px">36</option>
        </select>
        <div style={sep} />

        {/* Bold / Italic / Underline / Strike / Code */}
        <button onClick={() => editor.chain().focus().toggleBold().run()} style={btn(editor.isActive('bold'))} title="Bold (Ctrl+B)"><Bold size={14} /></button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} style={btn(editor.isActive('italic'))} title="Italic (Ctrl+I)"><Italic size={14} /></button>
        <button onClick={() => editor.chain().focus().toggleUnderline().run()} style={btn(editor.isActive('underline'))} title="Underline (Ctrl+U)"><UnderlineIcon size={14} /></button>
        <button onClick={() => editor.chain().focus().toggleStrike().run()} style={btn(editor.isActive('strike'))} title="Strikethrough"><Strikethrough size={14} /></button>
        <button onClick={() => editor.chain().focus().toggleCode().run()} style={btn(editor.isActive('code'))} title="Inline Code"><Code size={14} /></button>
        <div style={sep} />

        {/* Text Color — single color picker */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }} title="Text Color">
          <button
            onClick={() => textColorRef.current?.click()}
            style={{
              ...btn(editor.isActive('textStyle')),
              position: 'relative', padding: '4px',
            }}
          >
            <Type size={14} />
            {/* Color strip at bottom of icon */}
            <span style={{
              position: 'absolute', bottom: '1px', left: '3px', right: '3px',
              height: '3px', borderRadius: '2px', background: currentTextColor,
            }} />
          </button>
          <input
            ref={textColorRef}
            type="color"
            value={currentTextColor}
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
            style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
          />
        </div>

        {/* Highlight Color — single color picker */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }} title="Highlight Color">
          <button
            onClick={() => highlightColorRef.current?.click()}
            style={{
              ...btn(editor.isActive('highlight')),
              position: 'relative', padding: '4px',
            }}
          >
            <Baseline size={14} />
            <span style={{
              position: 'absolute', bottom: '1px', left: '3px', right: '3px',
              height: '3px', borderRadius: '2px', background: currentHighlight,
            }} />
          </button>
          <input
            ref={highlightColorRef}
            type="color"
            value={currentHighlight}
            onChange={(e) => editor.chain().focus().toggleHighlight({ color: e.target.value }).run()}
            style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
          />
        </div>
        <div style={sep} />

        {/* Headings */}
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} style={btn(editor.isActive('heading', { level: 1 }))} title="H1"><Heading1 size={14} /></button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} style={btn(editor.isActive('heading', { level: 2 }))} title="H2"><Heading2 size={14} /></button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} style={btn(editor.isActive('heading', { level: 3 }))} title="H3"><Heading3 size={14} /></button>
        <div style={sep} />

        {/* Lists / Quote / Divider */}
        <button onClick={() => editor.chain().focus().toggleBulletList().run()} style={btn(editor.isActive('bulletList'))} title="Bullet List"><List size={14} /></button>
        <button onClick={() => editor.chain().focus().toggleOrderedList().run()} style={btn(editor.isActive('orderedList'))} title="Numbered List"><ListOrdered size={14} /></button>
        <button onClick={() => editor.chain().focus().toggleBlockquote().run()} style={btn(editor.isActive('blockquote'))} title="Quote"><Quote size={14} /></button>
        <button onClick={() => editor.chain().focus().setHorizontalRule().run()} style={btn(false)} title="Horizontal Rule"><Minus size={14} /></button>
        <div style={sep} />

        {/* Alignment — now works via TextAlign extension */}
        <button onClick={() => editor.chain().focus().setTextAlign('left').run()} style={btn(editor.isActive({ textAlign: 'left' }))} title="Align Left"><AlignLeft size={14} /></button>
        <button onClick={() => editor.chain().focus().setTextAlign('center').run()} style={btn(editor.isActive({ textAlign: 'center' }))} title="Center"><AlignCenter size={14} /></button>
        <button onClick={() => editor.chain().focus().setTextAlign('right').run()} style={btn(editor.isActive({ textAlign: 'right' }))} title="Align Right"><AlignRight size={14} /></button>
        <div style={sep} />

        {/* Table */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowTableInput(v => !v)} style={btn(editor.isActive('table') || showTableInput)} title="Table"><TableIcon size={14} /></button>
          {showTableInput && (
            <div style={{ ...dropdown, right: 0, left: 'auto', minWidth: '160px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: isDark ? '#94a3b8' : '#64748b', letterSpacing: '0.05em' }}>INSERT TABLE</span>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center', fontSize: '0.75rem' }}>
                <span style={{ color: isDark ? '#94a3b8' : '#64748b' }}>Rows</span>
                <input type="number" min={1} max={20} value={tableRows} onChange={e => setTableRows(+e.target.value)} onKeyDown={e => e.stopPropagation()} style={{ ...inputSm, width: '40px' }} />
                <span style={{ color: isDark ? '#94a3b8' : '#64748b' }}>Cols</span>
                <input type="number" min={1} max={10} value={tableCols} onChange={e => setTableCols(+e.target.value)} onKeyDown={e => e.stopPropagation()} style={{ ...inputSm, width: '40px' }} />
              </div>
              <button onClick={insertTable} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>Insert</button>
              {editor.isActive('table') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', borderTop: isDark ? '1px solid #334155' : '1px solid #e2e8f0', paddingTop: '8px' }}>
                  <span style={{ fontSize: '0.6rem', fontWeight: 700, color: isDark ? '#94a3b8' : '#64748b', letterSpacing: '0.05em' }}>TABLE CONTROLS</span>
                  {[
                    ['+ Row', () => editor.chain().focus().addRowAfter().run()],
                    ['- Row', () => editor.chain().focus().deleteRow().run()],
                    ['+ Column', () => editor.chain().focus().addColumnAfter().run()],
                    ['- Column', () => editor.chain().focus().deleteColumn().run()],
                  ].map(([label, action]) => (
                    <button key={label as string} onClick={action as any} style={{ ...btn(false), justifyContent: 'flex-start', fontSize: '0.72rem', padding: '4px 6px' }}>{label as string}</button>
                  ))}
                  <button onClick={() => editor.chain().focus().deleteTable().run()} style={{ ...btn(false), justifyContent: 'flex-start', fontSize: '0.72rem', padding: '4px 6px', color: '#ef4444' }}>✕ Delete</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Link */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => { setShowLinkInput(v => !v); setLinkHref(editor.getAttributes('link').href || ''); }} style={btn(editor.isActive('link') || showLinkInput)} title="Link"><LinkIcon size={14} /></button>
          {showLinkInput && (
            <div style={{ ...dropdown, right: 0, left: 'auto', display: 'flex', gap: '6px', minWidth: '220px' }}>
              <input
                type="text" value={linkHref} onChange={e => setLinkHref(e.target.value)}
                onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') insertLink(); }}
                placeholder="https://..." autoFocus
                style={{ ...inputSm, flex: 1 }}
              />
              <button onClick={insertLink} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', fontSize: '0.75rem' }}>Set</button>
              {editor.isActive('link') && (
                <button onClick={() => { editor.chain().focus().unsetLink().run(); setShowLinkInput(false); }} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '0.75rem' }}>✕</button>
              )}
            </div>
          )}
        </div>

        {/* Image */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowImageInput(v => !v)} style={btn(showImageInput)} title="Image"><ImageIcon size={14} /></button>
          {showImageInput && (
            <div style={{ ...dropdown, display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '240px' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: isDark ? '#94a3b8' : '#64748b' }}>UPLOAD FILE</span>
              <input type="file" accept="image/*" onChange={handleImageFileUpload} style={{ fontSize: '0.74rem' }} />
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: isDark ? '#94a3b8' : '#64748b', marginTop: '2px' }}>OR IMAGE URL</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)}
                  onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') insertImage(); }}
                  placeholder="https://..." autoFocus
                  style={{ ...inputSm, flex: 1 }}
                />
                <button onClick={insertImage} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', fontSize: '0.75rem' }}>Add</button>
              </div>
            </div>
          )}
        </div>

      </div>
  );

  const notebookToolbar = activeMenuTab === 'Property'
    ? <div style={{ padding: '0 8px', color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.75rem' }}>Notebook properties</div>
    : toolbar;

  useLayoutEffect(() => {
    if (focusedTabId !== docId || typeof document === 'undefined') {
      setToolbarTarget(null);
      return;
    }
    const target = document.getElementById(toolbarSlotId);
    if (target) {
      setToolbarTarget(target);
      return;
    }
    const frame = requestAnimationFrame(() => setToolbarTarget(document.getElementById(toolbarSlotId)));
    return () => cancelAnimationFrame(frame);
  }, [docId, focusedTabId, toolbarSlotId]);

  return (
    <>
      {toolbarTarget ? createPortal(notebookToolbar, toolbarTarget) : null}
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div
        className="notebook-scroll"
        style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}
        onClick={() => { setShowTableInput(false); setShowLinkInput(false); setShowImageInput(false); }}
      >
        <EditorContent editor={editor} />
      </div>
      </div>
    </>
  );
};
