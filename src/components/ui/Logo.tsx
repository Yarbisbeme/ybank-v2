import Image from "next/image";
import Link from "next/link";


export function Logo() {
    return (
        <Link href="/" className="flex items-center group">
            <Image src="/icons/logoY.svg" width={36} height={28} alt="Ybank" />
            <span className="font-bold tracking-tight text-neutral-900 text-2xl group-hover:text-blue-800/90 transition-colors">Bank</span>
        </Link>
    )
}