/** Empty, consent-safe ad reservation. Add provider code only after review. */
export default function AdSlot({ label = 'Sponsored placement', className = '' }) {
  return <aside className={`ad-slot ${className}`.trim()} aria-label={label} data-ad-slot><span>{label}</span></aside>
}
