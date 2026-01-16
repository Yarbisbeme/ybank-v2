export function AuthVisualCard() {
  return (
    <div className="
      relative aspect-[1.586/1] w-full overflow-hidden
      rounded-2xl
      border border-white/40
      bg-gradient-to-br
      from-[var(--color-primary-700)]
      to-[var(--color-primary-500)]
      shadow-2xl
    ">
      <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-[var(--color-accent-glow)] blur-2xl" />
      <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-[var(--color-accent-glow)] blur-2xl" />
    </div>
  )
}
