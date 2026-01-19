import { ReactNode } from "react";

interface TextRevealProps {
  children: ReactNode;      // El texto o contenido (soporta <br/>)
  baseColor?: string;       // Color del texto quieto (ej: text-neutral-500)
  hoverColor?: string;      // Color del texto que aparece (ej: text-blue-500)
}

export default function TextReveal({
  children,
  baseColor = "text-neutral-950", // Color por defecto (Negro)
  hoverColor = "text-[#0179FE]",  // Color por defecto (Azul Ybank)
}: TextRevealProps) {
  return (
        <h3
          className="
            group relative block
            text-3xl sm:text-5xl md:text-2xl
            font-medium tracking-[-0.03em]
            leading-[0.95]
            text-neutral-950
            whitespace-pre-line
            pb-2
          "
        >
            {children}

          <span
            className="
              pointer-events-none
              absolute inset-0 block
              text-[#0179FE]
              leading-[0.95]
              whitespace-pre-line

              mask-:[linear-gradient(to_right,#000_0%,#000_100%)]
              mask-size:[0%_100%]
              mask-repeat:no-repeat

              transition-[mask-size]
              duration-700 ease-out
              group-hover:mask-size:[100%_100%]
            "
            aria-hidden
          >
            {children}
          </span>
        </h3>
  );
}