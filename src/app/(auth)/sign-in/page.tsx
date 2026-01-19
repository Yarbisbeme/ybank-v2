import Link from "next/link";
import Image from "next/image";
import { Fingerprint, ArrowRight, ShieldCheck, CreditCard } from "lucide-react"; 

import Button from "@/components/ui/Button";
// Importamos el efecto líquido para el título
import TextReveal from "@/components/ui/TextReveal";
import { PasskeyButton } from "@/components/ui/PassKeyButton";

export default function SignIn() {
  return (
    <section className="relative flex min-h-screen w-full items-center justify-center bg-[#FAFAFA] font-inter selection:bg-blue-100 selection:text-blue-900">
      
      {/* 1. BACKGROUND TÉCNICO (Mismo que el Home) */}
      <div className="absolute inset-0 z-0 h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      {/* Decoración sutil (Glow central) */}
      <div className="absolute left-1/2 top-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-100 opacity-40 blur-[100px]"></div>

      {/* CONTENEDOR PRINCIPAL */}
      {/* Cambiado a max-w-[1100px] y bordes más sutiles para consistencia */}
      <div className="relative z-10 flex w-full mx-[10%] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl shadow-neutral-200/50 lg:h-[650px]">
        
        {/* === COLUMNA IZQUIERDA: AUTH === */}
        <div className="flex w-full flex-col justify-between p-8 sm:p-12 lg:w-3/8 bg-white">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center group">
                <Image src="/icons/logoy.svg" width={30} height={24} alt="Bank Logo" />
              <span className="font-bold tracking-tight text-neutral-900 text-xl">Bank</span>
            </Link>
          </div>

          {/* Main Content */}
          <div className="mx-auto w-full max-w-sm py-10">
            
            {/* TÍTULO CON EFECTO LÍQUIDO (TextReveal) */}
            <div className="mb-2">
        <h1
          className="
            group relative block
            text-5xl sm:text-7xl md:text-6xl
            font-medium tracking-[-0.03em]
            leading-[0.95]
            text-blue-600
            whitespace-pre-line
            pb-2
          "
        >
          Bienvenido
                    {'\n'}
                    de nuevo.

          <span
            className="
              pointer-events-none
              absolute inset-0 block
              text-neutral-950
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
            Bienvenido
                    {'\n'}
                    de nuevo.
          </span>
        </h1>
            </div>
            
            <p className="mt-4 text-neutral-500 font-medium">
              Gestión patrimonial inteligente, simplificada.
            </p>

            <div className="mt-10 flex flex-col gap-4">
              

              {/* Opción 1: Passkey (Estilo Botón Sólido Negro) */}
               
              <button className="group relative flex w-full items-center justify-center gap-3 rounded-full bg-black px-4 py-4 text-white shadow-lg transition-all duration-300 hover:shadow-blue-500/20 hover:-translate-y-0.5 active:scale-95">
                <Fingerprint className="h-5 w-5 text-neutral-400 transition-colors group-hover:text-blue-600" />
                <span className="font-semibold tracking-wide group-hover:text-blue-600">Continuar con Passkey</span>
                <div className="absolute right-6 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">
                    <ArrowRight className="h-4 w-4 text-blue-600" />
                </div>
              </button>

              <div className="relative flex items-center py-4">
                <div className="grow border-t border-neutral-100"></div>
                <span className="mx-4 shrink-0 text-[10px] font-bold tracking-widest text-neutral-400 uppercase">O usa tu email</span>
                <div className="grow border-t border-neutral-100"></div>
              </div>
             

              {/* Opción 2: Google (Estilo Borde) */}
              <button
                className="group flex w-full items-center justify-center gap-3 rounded-full border border-neutral-200 bg-white px-4 py-3.5 font-medium text-neutral-700 transition-all hover:border-neutral-300 hover:bg-neutral-50 active:bg-neutral-100"
              >
                 <Image src="/icons/google.svg" width={20} height={20} alt="G" className="opacity-60 group-hover:opacity-100 transition-opacity"/>
                 <span>Google Account</span>
              </button>

            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col items-center justify-between gap-4 text-xs text-neutral-500 sm:flex-row border-t border-neutral-100 pt-6">
            <p>
              ¿No tienes cuenta?{" "}
              <Link href="/sign-up" className="font-semibold text-black hover:text-blue-600 transition-colors hover:underline">
                Aplicar ahora
              </Link>
            </p>
            <div className="flex items-center gap-1.5 text-neutral-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Encriptación E2E</span>
            </div>
          </div>
        </div>

        {/* === COLUMNA DERECHA: VISUAL (Estilo Industrial / Bento) === */}
        <div className="relative hidden w-5/8 flex-col items-center justify-center bg-neutral-50 p-12 lg:flex border-l border-neutral-200">
            
            {/* Background pattern sutil */}
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-[size:20px_20px]"></div>
            
            {/* ELEMENTO VISUAL: Tarjeta "Corporate" (Consistente con Home) */}
            <div className="relative z-10 w-full max-w-xs transition-transform duration-700 hover:rotate-y-12 hover:rotate-x-12 perspective-1000">
                
                {/* La Tarjeta Física */}
                <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-[#1A1A1A] text-white shadow-2xl shadow-black/20">
                    
                    {/* Brillo decorativo */}
                    <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-600/20 blur-3xl"></div>

                    {/* Contenido Tarjeta */}
                    <div className="p-8 h-64 flex flex-col justify-between relative z-10">
                        <div className="flex justify-between items-start">
                            <CreditCard className="h-6 w-6 text-white/80" />
                            <div className="h-8 w-10 rounded bg-white/10 backdrop-blur-md border border-white/10"></div>
                        </div>
                        <div className="space-y-4">
                            <div className="font-mono text-xl tracking-widest text-white/90">•••• 4288</div>
                            <div className="flex justify-between text-[10px] font-medium tracking-wider opacity-60">
                                <span>JONATHAN DOE</span>
                                <span>12/28</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Panel de Transacción pegado abajo */}
                    <div className="bg-white p-4 flex items-center justify-between text-neutral-900 border-t border-neutral-100">
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-[10px] font-bold text-blue-600">AWS</div>
                            <div>
                                <p className="text-xs font-bold">Amazon Web Services</p>
                                <p className="text-[10px] text-neutral-400">Infraestructura</p>
                            </div>
                        </div>
                        <span className="text-sm font-medium">-$240.00</span>
                    </div>
                </div>

                {/* Notificación Flotante (Consistente con tu diseño anterior) */}
                <div className="absolute -right-12 top-10 flex animate-bounce items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3 shadow-xl [animation-duration:4s]">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                    <div>
                        <p className="text-xs font-bold text-neutral-900">Nómina Recibida</p>
                        <p className="text-[10px] text-neutral-500">+$3,250.00</p>
                    </div>
                </div>
            </div>

            <div className="mt-12 text-center relative z-10">
                <h3 className="text-lg font-semibold text-neutral-900">Control Automático</h3>
                <p className="mt-2 text-sm text-neutral-500 max-w-xs mx-auto">
                    Tu infraestructura financiera en un solo panel de control.
                </p>
            </div>
        </div>

      </div>
    </section>
  );
}