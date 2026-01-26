import Link from "next/link";
import { ArrowRight, ShieldCheck, CreditCard, LayoutGrid } from "lucide-react";
import { ButtonOla } from "@/components/ui/ButtonOla";
import { Logo } from "@/components/ui/Logo";

export default function Home() {
  return (
    <main className="min-h-screen w-full bg-[#FAFAFA] font-inter text-neutral-900 selection:bg-black selection:text-white">

      {/* --- NAVBAR: Simple, pegado arriba, sin transparencia rara --- */}
      <nav className="flex w-full items-center justify-between border-b border-neutral-200 bg-white px-6 py-4">

        {/* Componente del logo */}
        <Logo />
        
        <div className="flex items-center gap-4 text-sm font-medium">
          <Link href="/sign-up" className="hidden text-neutral-600 hover:text-black sm:block">
            Crear
          </Link>
          <ButtonOla href="sign-in" label={'Log In'} />
        </div>
      </nav>

      {/* --- HERO: Estructura de Rejilla (Bento Grid) --- */}
      <div className="mx-auto max-w-350 p-4 sm:p-6 lg:p-8">
        
        {/* TÍTULO PRINCIPAL */}
        <div className="mb-12 max-w-4xl pt-10">
        <h1
          className="
            group relative block
            text-5xl sm:text-7xl md:text-8xl
            font-medium tracking-[-0.03em]
            leading-[0.95]
            text-neutral-950
            whitespace-pre-line
            pb-2
          "
        >
          Infraestructura para
          <br />
          tu capital.

          <span
            className="
              pointer-events-none
              absolute inset-0 block
              text-[#0179FE]
              leading-[0.95]
              whitespace-pre-line

              mask-[linear-gradient(to_right,#000_0%,#000_100%)]
              mask-size-[0%_100%]
              mask-no-repeat

              transition-[mask-size]
              duration-700 ease-out
              group-hover:mask-size-[100%_100%]
            "
            aria-hidden
          >
            Infraestructura para
            <br />
            tu capital.
          </span>
        </h1>


          <p className="mt-6 max-w-xl text-xl text-neutral-500 leading-relaxed">
            Una cuenta financiera diseñada con la precisión de la ingeniería. 
            Sin adornos. Solo control total sobre tus finanzas.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/sign-up"
              className="group relative inline-flex items-center gap-2 pb-1 text-sm font-medium text-black"
            >
              <span className="relative z-10 text-gray-700 group-hover:text-blue-600">Crea tu cuenta</span>

              <ArrowRight className="h-4 w-4 transition-colors duration-300 group-hover:text-blue-600" />

              {/* Línea base */}
              <span className="absolute inset-x-0 bottom-0 h-px bg-gray-400"/>

              {/* Línea animada */}
              <span
                className="
                  absolute inset-x-0 bottom-0 h-px
                  origin-left scale-x-0 bg-blue-600 
                  transition-transform duration-300 ease-out
                  group-hover:scale-x-100
                "
              />
            </Link>
          </div>
        </div>

        {/* --- GRID DE CONTENIDO (Bento Gritty Style) --- */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:grid-rows-2 h-auto md:h-150">

          {/* CAJA 1: TARJETA PRINCIPAL (Grande) */}
          <div className="group relative col-span-1 md:col-span-7 md:row-span-2 overflow-hidden rounded-none border border-neutral-200 bg-white p-8 sm:p-12 transition hover:border-neutral-300">
            <div className="flex h-full flex-col justify-between">
              <div>
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
                  <CreditCard className="h-5 w-5 text-neutral-700 group-hover:text-blue-600" />
                </div>
                <h3 className="text-2xl font-medium tracking-tight">Gasto Global</h3>
                <p className="mt-2 max-w-sm text-neutral-500">
                  Tarjetas físicas y virtuales ilimitadas con controles de gasto en tiempo real.
                </p>
              </div>

              {/* REPRESENTACIÓN LITERAL DE TARJETA (Nada flotante) */}
              <div className="mt-10 relative w-full max-w-md self-center shadow-2xl shadow-neutral-200 rounded-xl overflow-hidden border border-neutral-100">
                 {/* Parte superior tarjeta */}
                 <div className="bg-[#111] p-6 text-white h-56 flex flex-col justify-between">
                    <div className="flex justify-between">
                        <span className="font-mono text-xs opacity-50">CORPORATE</span>
                        <div className="h-6 w-8 bg-blue-600/20 rounded-sm"></div>
                    </div>
                    <div className="font-mono text-xl tracking-wider">
                        •••• 4288
                    </div>
                    <div className="flex justify-between text-xs opacity-70">
                        <span>JONATHAN DOE</span>
                        <span>VISA INFINITE</span>
                    </div>
                 </div>
                 {/* Parte inferior (simulando UI de app debajo) */}
                 <div className="bg-white p-4 border-t border-neutral-100 flex justify-between items-center">
                    <div className="flex gap-3">
                        <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-xs">AWS</div>
                        <div>
                            <p className="text-xs font-bold">Amazon Web Services</p>
                            <p className="text-[10px] text-neutral-500">Infraestructura</p>
                        </div>
                    </div>
                    <span className="text-sm font-medium">-$240.00</span>
                 </div>
              </div>
            </div>
          </div>

          {/* CAJA 2: MÉTRICAS (Arriba Derecha) */}
          <div className="group col-span-1 md:col-span-5 border border-neutral-200 bg-white p-8 transition hover:border-neutral-300">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
              <LayoutGrid className="h-5 w-5 text-neutral-700 group-hover:text-blue-600" />
            </div>
            <h3 className="text-xl font-medium tracking-tight">API First</h3>
            <p className="mt-2 text-sm text-neutral-500">
              Conecta tu contabilidad directamente a nuestra API. Automatiza conciliaciones.
            </p>
            <div className="mt-6 rounded bg-neutral-50 p-4 font-mono text-xs text-neutral-600 border border-neutral-100">
               <span className="text-blue-600">GET</span> /v1/transactions <br/>
               <span className="text-green-600">200 OK</span> - 45ms
            </div>
          </div>

          {/* CAJA 3: SEGURIDAD (Abajo Derecha) */}
          <div className="col-span-1 md:col-span-5 border border-neutral-200 bg-[#111] p-8 text-white transition hover:bg-black">
            <div className="flex h-full flex-col justify-between">
              <div>
                <ShieldCheck className="h-8 w-8 text-blue-600 mb-4" />
                <h3 className="text-xl font-medium tracking-tight">Seguridad Blindada</h3>
                <p className="mt-2 text-sm text-neutral-400">
                  Tus fondos están asegurados y protegidos por encriptación de grado bancario.
                </p>
              </div>
              <div className="mt-6 flex gap-2">
                 <div className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full w-full bg-blue-5-600"></div>
                 </div>
                 <div className="h-1 flex-1 bg-white/20 rounded-full"></div>
                 <div className="h-1 flex-1 bg-white/20 rounded-full"></div>
              </div>
            </div>
          </div>

        </div>

        {/* --- FOOTER SIMPLE --- */}
        <div className="mt-20 border-t border-neutral-200 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-neutral-500">
            <p>© 2026 Ybank Inc. New York / London / Dominican Republic</p>
            <div className="flex gap-4 mt-4 md:mt-0 group">
                <Link href="#" className="hover:text-black">Privacidad</Link>
                <Link href="#" className="hover:text-black">Términos</Link>
                <div className="flex items-center gap-1 group-hover:text-black">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-300 group-hover:bg-blue-600 transition-colors delay-100"></div>
                    Systems Normal
                </div>
            </div>
        </div>
      </div>
    </main>
  );
}