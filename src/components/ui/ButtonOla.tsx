"use client";

import Link from "next/link";

interface ButtonOlaProps {
  label: string;
  href?: string;
  onClick?: () => void;
}

export function ButtonOla({ label, href, onClick }: ButtonOlaProps) {
  
  const containerClasses = `
    group relative flex items-center justify-center overflow-hidden
    bg-black px-8 py-3 font-semibold text-white rounded-lg
    transition-shadow duration-300 w-full
    hover:shadow-[0_0_40px_rgba(1,121,254,0.45)]
  `;

  const innerContent = (
    <>
      <span className="relative z-30 tracking-wide">
        {label}
      </span>

      <div
        className="
          absolute inset-0 z-10 h-[200%] w-[200%]
          origin-bottom-left rotate-[-8deg]
          translate-x-[-20%] translate-y-[160%]
          transition-transform duration-700 ease-out
          group-hover:translate-y-[-20%]
        "
      >
        <WaveLayer color="#014ba0" className="opacity-30" />

        <WaveLayer color="#0179FE" className="opacity-80 translate-y-2" />

        <div className="absolute -bottom-[98%] left-0 h-full w-full bg-[#0179FE]" />
      </div>

      <div
        className="
          pointer-events-none
          absolute inset-0 z-20
          bg-[#0179FE]
          opacity-0
          transition-opacity duration-300 delay-400
          group-hover:opacity-100
        "
      />
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={containerClasses}>
        {innerContent}
      </button>
    );
  }

  return (
    <Link href={href || "#"} className={containerClasses}>
      {innerContent}
    </Link>
  );
}


function WaveLayer({
  color,
  className = "",
}: {
  color: string;
  className?: string;
}) {
  return (
    <div className={`absolute bottom-0 left-0 h-full w-[200%] ${className}`}>
      <WavePath color={color} />
    </div>
  );
}

function WavePath({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 1200 120"
      preserveAspectRatio="none"
      className="absolute bottom-0 h-35 w-full"
    >
      <path
        d="M0,0 V40 Q300,90 600,40 T1200,40 V120 H0 Z"
        fill={color}
        transform="scale(1,-1) translate(0,-120)"
      />
    </svg>
  );
}