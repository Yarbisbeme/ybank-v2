import { Fingerprint, ArrowRight } from "lucide-react";
import { CSSProperties } from "react";

export function PasskeyButton() {
  // NUEVO SVG PARA MÁSCARA:
  // Es mucho más alto (viewBox 0 0 1200 600).
  // Tiene la ola arriba y un cuerpo sólido negro GIGANTE debajo.
  // Esto asegura que una vez que la ola pasa, el texto se quede "lleno".
  const waveMaskSolid = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 600' preserveAspectRatio='none'%3E%3Cpath d='M0,50 C300,100 600,0 1200,50 L1200,600 L0,600 Z' fill='%23000000' /%3E%3C/svg%3E")`;

  return (
    <>
      {/* Agregamos overflow-hidden aquí para contener todo */}
      <button className="group relative flex w-full items-center justify-center rounded-full bg-black px-4 py-4 shadow-lg transition-all duration-300 hover:shadow-blue-500/20 active:scale-95 overflow-hidden">
        
        {/* ==============================================
            CAPA 1: BASE BLANCA (Siempre visible debajo)
           ============================================== */}
        <div className="relative z-0 flex items-center gap-3 text-white">
          <Fingerprint className="h-5 w-5" />
          <span className="font-semibold tracking-wide">Continuar con Passkey</span>
          {/* Espacio reservado para la flecha base */}
          <div className="w-4 flex items-center">
             <ArrowRight className="h-4 w-4 opacity-0" /> {/* Invisible pero ocupa espacio */}
          </div>
        </div>

        {/* ==============================================
            CAPA 2: CAPA AZUL ENMASCARADA
            Esta capa tiene el contenido AZUL (#0179FE).
            La máscara la oculta inicialmente y la revela al subir.
           ============================================== */}
        <div 
          className="
            absolute inset-0 z-10 flex items-center justify-center gap-3
            text-[#0179FE] 
            pointer-events-none

            /* CONFIGURACIÓN DE LA MÁSCARA */
            [mask-image:var(--wave-mask)]
            [mask-size:200%_300%] /* Hacemos la máscara muy alta */
            [mask-position:0%_180%] /* Posición inicial: Escondida muy abajo */
            [mask-repeat:no-repeat]

            /* ANIMACIÓN LENTA Y SUAVE */
            transition-[mask-position] duration-[1000ms] ease-in-out
            
            /* HOVER: La máscara sube hasta cubrir todo. 
               Al usar 0%, alineamos la parte superior de la ola con el top del botón.
               El cuerpo sólido del SVG llena el resto. */
            group-hover:[mask-position:-100%_0%]
          "
          style={{ "--wave-mask": waveMaskSolid } as CSSProperties}
        >
          <Fingerprint className="h-5 w-5" />
          <span className="font-semibold tracking-wide">Continuar con Passkey</span>
          
          {/* CORRECCIÓN FLECHA AZUL: 
              Ya no tiene opacity-0. Siempre es visible dentro de esta capa.
              Solo tiene la animación de movimiento (translate-x).
          */}
          <div className="w-4 relative flex items-center">
             <ArrowRight className="absolute left-0 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </div>
        </div>

      </button>

      {/* Separador */}
      <div className="relative flex items-center py-4">
        <div className="grow border-t border-neutral-100"></div>
        <span className="mx-4 shrink-0 text-[10px] font-bold tracking-widest text-neutral-400 uppercase">
          O usa tu email
        </span>
        <div className="grow border-t border-neutral-100"></div>
      </div>
    </>
  );
}