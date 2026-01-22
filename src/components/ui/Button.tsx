'use client'

type ButtonProps = {
  logo: string
  alt: string
  className?: string
  children: React.ReactNode
}

export default function Button({
  logo,
  alt,
  className = '',
  children,
}: ButtonProps) {
  return (
    <button className={className}>
      <img src={logo} alt={alt} />
      <span>{children}</span>
    </button>
  )
}
