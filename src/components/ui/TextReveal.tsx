import { ReactNode } from "react";

interface TextRevealProps {
  children: ReactNode;      // El texto o contenido (soporta <br/>)
  baseColor?: string;       // Color del texto quieto (ej: text-neutral-500)
  hoverColor?: string;      // Color del texto que aparece (ej: text-blue-500)
  tamano?: string;        // Tamaño del texto (ej: text-3xl, text-5xl)
}

export default function TextReveal({
  children,
  baseColor = "text-neutral-950",
  hoverColor = "text-[#0179FE]",
  tamano = "text-3xl",
}: TextRevealProps) {
  return (
    <h3
      className={`
        group relative block
        ${tamano}
        font-medium tracking-[-0.03em]
        leading-[0.95]
        ${baseColor}
        whitespace-pre-line
        pb-2
      `}
    >
      {children}

      <span
        aria-hidden
        className={`
          pointer-events-none
          absolute inset-0 block
          ${hoverColor}
          leading-[0.95]
          whitespace-pre-line

          mask-[linear-gradient(to_right,#000_0%,#000_100%)]
          mask-size-[0%_100%]
          mask-no-repeat

          [-webkit-mask-image:linear-gradient(to_right,#000_0%,#000_100%)]
          [-webkit-mask-size:0%_100%]
          [-webkit-mask-repeat:no-repeat]

          transition-[mask-size]
          duration-700 ease-out
          group-hover:mask-size-[100%_100%]
          group-hover:[-webkit-mask-size:100%_100%]
        `}
      >
        {children}
      </span>
    </h3>
  );
}
