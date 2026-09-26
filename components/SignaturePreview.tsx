'use client'

/**
 * How a typed signature will appear on the signed document: the name in
 * Great Vibes, the same face the PDFs and the onboarding pack use.
 * Ligatures are switched off: this font substitutes decorative glyphs for
 * pairs such as "em" and "en", which would misspell the signer's name.
 */
export default function SignaturePreview({ name, label = 'Your signature will appear as' }: { name: string; label?: string }) {
  const n = name.trim()
  return (
    <div style={{ margin: '14px 0 4px' }} aria-live="polite">
      <style>{`@font-face { font-family: 'GL Signature'; src: url('/fonts/GreatVibes-Regular.ttf') format('truetype'); font-display: swap; }`}</style>
      <div style={{ fontSize: 12, color: '#616161', marginBottom: 4 }}>{label}</div>
      <div style={{
        minHeight: 58, display: 'flex', alignItems: 'flex-end', padding: '4px 10px 6px', borderBottom: '1px solid #242424',
        background: '#fafafa', borderRadius: '4px 4px 0 0', maxWidth: 460,
      }}>
        <span style={{
          fontFamily: "'GL Signature', 'Brush Script MT', cursive", fontSize: 34, lineHeight: 1.1, color: n ? '#0b3d45' : '#bdbdbd',
          fontVariantLigatures: 'none', fontFeatureSettings: '"liga" 0, "dlig" 0, "calt" 0, "clig" 0',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{n || 'Type your name above'}</span>
      </div>
    </div>
  )
}
