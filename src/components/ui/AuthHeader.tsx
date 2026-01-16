import Image from "next/image"
import Link from "next/link"

export function AuthHeader() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <Image
        src="/icons/logoy.svg"
        width={28}
        height={28}
        alt="Ybank"
      />
      <span className="text-2xl font-semibold tracking-tight text-[var(--color-text-main)]">
        Ybank
      </span>
    </Link>
  )
}
