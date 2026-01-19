type PrimaryActionButtonProps = {
  icon?: React.ReactNode
  children: React.ReactNode
}

export function PrimaryActionButton({
  icon,
  children,
}: PrimaryActionButtonProps) {
  return (
    <button
      type="button"
      className="
        group relative flex w-full items-center justify-center gap-3
        rounded-xl
        bg-(--color-brand-gradient)
        px-4 py-3.5
        text-white font-medium
        shadow-md
        transition-all
        hover:shadow-lg
        active:scale-95
      "
    >
      {icon}
      {children}
    </button>
  )
}
