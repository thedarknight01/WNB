export const DocumentationPage = () => (
  <main style={{ minHeight: '100vh', padding: '48px max(24px, 8vw)', background: '#f8fafc', color: '#0f172a' }}>
    <a href="/" style={{ color: '#2563eb' }}>← Home</a>
    <h1>WBN documentation</h1>
    <p>Use the workspace to turn diagrams into durable documentation.</p>
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16, marginTop: 28 }}>
      {[
        ['Whiteboard', 'Draw shapes, arrows, tables, text, and images on an infinite canvas. Select objects for properties, then group them to move and reference an entire diagram.'],
        ['Notebook', 'Write formatted notes with headings, lists, tables, links, images, and @label references to whiteboard artwork.'],
        ['Labels', 'Label an object or group on the whiteboard. Type @ in a notebook, choose the label, and WBN inserts a visual snapshot with a clickable source link.'],
        ['Files', 'Save selected notebooks and whiteboards together as one encrypted .wnb file, then open it later to restore the workspace.'],
      ].map(([title, text]) => <article key={title} style={{ padding: 20, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14 }}><h2>{title}</h2><p style={{ color: '#475569', lineHeight: 1.6 }}>{text}</p></article>)}
    </section>
    <a href="/board" style={{ display: 'inline-block', marginTop: 30, color: '#2563eb', fontWeight: 700 }}>Go to the board →</a>
  </main>
);
