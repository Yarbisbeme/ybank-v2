import Link from "next/link";
import { ArrowRight, ShieldCheck, CreditCard, LayoutGrid } from "lucide-react";
import { ButtonOla } from "@/components/ui/ButtonOla";
import { Logo } from "@/components/ui/Logo";

export default function Home() {
  return (
    // 💡 1. Usamos bg-background y text-foreground en lugar de colores estáticos
    <main className="min-h-screen w-full bg-background font-inter text-foreground selection:bg-primary selection:text-primary-foreground">

      {/* --- NAVBAR: Simple, pegado arriba, sin transparencia rara --- */}
      <nav className="flex w-full items-center justify-between border-b border-border bg-card px-6 py-4 sticky top-0 z-50">

        {/* Componente del logo */}
        <Logo/>
        
        <div className="flex items-center gap-4 text-sm font-medium">
          {/* 💡 2. text-muted-foreground para enlaces secundarios */}
          <Link href="/sign-up" className="hidden text-md text-muted-foreground hover:text-foreground transition-colors sm:block mr-6">
            Crear
          </Link>
          <ButtonOla href="sign-in" label={'Log In'} />
        </div>
      </nav>

      {/* --- HERO: Estructura de Rejilla (Bento Grid) --- */}
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        
        {/* TÍTULO PRINCIPAL */}
        <div className="mb-12 max-w-4xl pt-10">
        <h1
          className="
            group relative block
            text-5xl sm:text-7xl md:text-8xl
            font-medium tracking-[-0.03em]
            leading-[0.95]
            text-foreground
            whitespace-pre-line
            pb-2
          "
          id="Titulo"
        >
          Infraestructura para
          <br />
          tu capital.

          <span
            className="
              pointer-events-none
              absolute inset-0 block
              text-primary
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


          {/* 💡 3. text-muted-foreground para el subtítulo */}
          <p className="mt-6 max-w-xl text-xl text-muted-foreground leading-relaxed">
            Una cuenta financiera diseñada con la precisión de la ingeniería. 
            Sin adornos. Solo control total sobre tus finanzas.
          </p>
          
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/sign-up"
              className="group relative inline-flex items-center gap-2 pb-1 text-sm font-bold text-foreground"
              id="Sign-Up"
            >
              <span className="relative z-10 text-foreground group-hover:text-primary transition-colors">Crea tu cuenta</span>

              <ArrowRight className="h-4 w-4 transition-colors duration-300 group-hover:text-primary" />

              {/* Línea base */}
              <span className="absolute inset-x-0 bottom-0 h-px bg-border"/>

              {/* Línea animada (Azul YBank) */}
              <span
                className="
                  absolute inset-x-0 bottom-0 h-[2px]
                  origin-left scale-x-0 bg-primary 
                  transition-transform duration-300 ease-out
                  group-hover:scale-x-100
                "
              />
            </Link>
          </div>
        </div>

        {/* --- GRID DE CONTENIDO (Bento Gritty Style) --- */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:grid-rows-2 h-auto md:h-[600px]">

          {/* CAJA 1: TARJETA PRINCIPAL (Grande) */}
          <div className="group relative col-span-1 md:col-span-7 md:row-span-2 overflow-hidden rounded-[6px] border border-border bg-card p-8 sm:p-12 transition-all hover:border-primary/50 shadow-sm">
            <div className="flex h-full flex-col justify-between">
              <div>
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface-2">
                  <CreditCard className="h-5 w-5 text-foreground group-hover:text-primary transition-colors" />
                </div>
                <h3 className="text-2xl font-medium tracking-tight text-foreground">Gasto Global</h3>
                <p className="mt-2 max-w-sm text-muted-foreground">
                  Tarjetas físicas y virtuales ilimitadas con controles de gasto en tiempo real.
                </p>
              </div>

              {/* REPRESENTACIÓN LITERAL DE TARJETA */}
              {/* 💡 4. Estilizamos la tarjeta para que parezca una tarjeta YBank Real (Dark Mode forzado) */}
              <div className="mt-10 relative w-full max-w-md self-center shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] rounded-xl overflow-hidden border border-white/10">
                 {/* Parte superior tarjeta (Siempre negra pura para contrastar) */}
                 <div className="bg-[#000000] p-6 text-white h-56 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-[-20%] left-[-10%] w-[120%] h-[120%] rounded-full border-[2px] border-white/20 opacity-30" />
                    
                    <div className="flex justify-between relative z-10">
                        <span className="font-mono text-xs opacity-50 tracking-widest">CORPORATE</span>
                        <div className="h-6 w-8 bg-blue-600 rounded-sm"></div>
                    </div>
                    <div className="font-mono text-2xl tracking-widest relative z-10">
                        •••• 4288
                    </div>
                    <div className="flex justify-between text-[10px] opacity-70 tracking-widest relative z-10">
                        <span>YARBIS BELTRE</span>
                        <span>VISA INFINITE</span>
                    </div>
                 </div>
                 {/* Parte inferior (simulando UI de app debajo) */}
                 <div className="bg-card p-4 border-t border-border flex justify-between items-center">
                    <div className="flex gap-3 items-center">
                        <div className="h-8 w-8 bg-primary/10 rounded-[8px] flex items-center justify-center text-primary text-[10px] font-black border border-primary/20">AWS</div>
                        <div>
                            <p className="text-xs font-bold text-foreground">Amazon Web Services</p>
                            <p className="text-[9px] text-muted-foreground uppercase tracking-widest mt-0.5">Infraestructura</p>
                        </div>
                    </div>
                    <span className="text-sm font-mono font-bold text-foreground">-$240.00</span>
                 </div>
              </div>
            </div>
          </div>

          {/* CAJA 2: MÉTRICAS (Arriba Derecha) */}
          <div className="group col-span-1 md:col-span-5 rounded-[6px] border border-border bg-card p-8 transition-all hover:border-primary/50 shadow-sm flex flex-col justify-center">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface-2">
              <LayoutGrid className="h-5 w-5 text-foreground group-hover:text-primary transition-colors" />
            </div>
            <h3 className="text-xl font-medium tracking-tight text-foreground">API First</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Conecta tu contabilidad directamente a nuestra API. Automatiza conciliaciones.
            </p>
            {/* 💡 5. Bloque de código con la fuente Mono de tu tema */}
            <div className="mt-6 rounded-[8px] bg-[#000000] p-4 font-mono text-xs text-neutral-300 border border-border shadow-inner">
               <span className="text-[#2563EB] font-bold">GET</span> /v1/transactions <br/>
               <span className="text-[#4ADE80] font-bold">200 OK</span> <span className="opacity-50">- 45ms</span>
            </div>
          </div>

          {/* CAJA 3: SEGURIDAD (Abajo Derecha) */}
          <div className="group col-span-1 md:col-span-5 rounded-[6px] border border-border bg-primary p-8 text-primary-foreground transition-all hover:brightness-110 shadow-sm">
            <div className="flex h-full flex-col justify-between">
              <div>
                <ShieldCheck className="h-8 w-8 text-white mb-4" />
                <h3 className="text-xl font-medium tracking-tight">Seguridad Blindada</h3>
                <p className="mt-2 text-sm text-primary-foreground/80">
                  Tus fondos están asegurados y protegidos por encriptación de grado bancario.
                </p>
              </div>
              <div className="mt-6 flex gap-2">
                 <div className="h-1.5 flex-1 bg-black/20 rounded-full overflow-hidden">
                    <div className="h-full w-full bg-white"></div>
                 </div>
                 <div className="h-1.5 flex-1 bg-black/20 rounded-full"></div>
                 <div className="h-1.5 flex-1 bg-black/20 rounded-full"></div>
              </div>
            </div>
          </div>

        </div>

        {/* --- FOOTER SIMPLE --- */}
        <div className="mt-20 border-t border-border pt-8 pb-12 flex flex-col md:flex-row justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <p>© 2026 Ybank Inc. SDQ / NYC</p>
            <div className="flex gap-6 mt-4 md:mt-0 group">
                <Link href="#" className="hover:text-foreground transition-colors">Privacidad</Link>
                <Link href="#" className="hover:text-foreground transition-colors">Términos</Link>
                <div className="flex items-center gap-2 hover:text-foreground transition-colors">
                    <div className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </div>
                    Systems Normal
                </div>
            </div>
        </div>
      </div>
    </main>
  );
}