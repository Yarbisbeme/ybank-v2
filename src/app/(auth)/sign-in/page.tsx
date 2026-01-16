import Link from "next/link";
import Image from "next/image";
// Asumiendo que usas Lucide o similar para iconos
import { Fingerprint, ArrowRight, ShieldCheck } from "lucide-react"; 

import Button from "@/components/ui/Button";
import { AuthCard } from "@/components/ui/AuthCard";
// import OnlinePaymentAnimation from "@/components/ui/OnlinePaymentAnimation"; // Lo reemplazaremos por una tarjeta visual

export default function SignIn2026() {
  return (
    <section className="relative flex min-h-screen w-full items-center justify-center bg-[#FAFAFA] font-inter selection:bg-black selection:text-white">
      
      {/* 1. BACKGROUND TÉCNICO (Grid Pattern) */}
      {/* Simula papel milimétrico financiero/arquitectónico */}
      <div className="absolute inset-0 z-0 h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size:24px_24px"></div>
      
      {/* Decoración sutil (Glow central) */}
      <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-77.5 w-77.5 rounded-full bg-blue-400 opacity-20 blur-[100px]"></div>

      {/* CONTENEDOR PRINCIPAL */}
      <div className="relative z-10 flex w-full max-w-6xl overflow-hidden rounded-4xl border border-gray-200 bg-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md lg:h-150">
        
        {/* === COLUMNA IZQUIERDA: AUTH === */}
        <div className="flex w-full flex-col justify-between p-8 sm:p-12 lg:w-1/2">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <Image src="/icons/logoy.svg" width={28} height={28} alt="Bank Logo" />
              <span className="font-bold tracking-tight text-black text-2xl">Bank</span>
            </Link>
            
          </div>

          {/* Main Content */}
          <div className="mx-auto w-full max-w-sm py-10">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 lg:text-4xl">
              Bienvenido de nuevo
            </h1>
            <p className="mt-2 text-gray-500">
              Gestión patrimonial inteligente, simplificada.
            </p>

            <div className="mt-8 flex flex-col gap-4">
              
              {/* Opción 1: Passkey (Tendencia 2026) */}
              <button className="group relative flex w-full items-center justify-center gap-3 rounded-xl bg-black px-4 py-3.5 text-white shadow-lg transition-all hover:bg-gray-800 hover:shadow-xl active:scale-95">
                <Fingerprint className="h-5 w-5 text-gray-300 transition-colors group-hover:text-white" />
                <span className="font-medium">Continuar con Passkey</span>
                <div className="absolute right-4 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100">
                    <ArrowRight className="h-4 w-4" />
                </div>
              </button>

              <div className="relative flex items-center py-2">
                <div className="grow border-t border-gray-200"></div>
                <span className="mx-4 shrink-0 text-xs text-gray-400">O USA TU EMAIL</span>
                <div className="grow border-t border-gray-200"></div>
              </div>

              {/* Opción 2: Legacy (Google/Email) */}
            <Button
                logo="/icons/google.svg"
                alt="Google"
                className="flex flex-row items-center justify-center gap-2 w-full p-4 rounded-sm border-gray-600 border hover:bg-gray-50"
                >
                Continuar con Google
            </Button>

            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col items-center justify-between gap-4 text-xs text-gray-500 sm:flex-row">
            <p>
              ¿No tienes cuenta?{" "}
              <Link href="/sign-up" className="font-semibold text-black hover:underline">
                Aplicar ahora
              </Link>
            </p>
            <div className="flex items-center gap-1 text-gray-400">
              <ShieldCheck className="h-3 w-3" />
              <span>Encriptación E2E</span>
            </div>
          </div>
        </div>

        {/* === COLUMNA DERECHA: VISUAL === */}
        <div className="relative hidden w-1/2 flex-col items-center justify-center bg-gray-50 p-12 lg:flex">
            {/* Background pattern derecho */}
                <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[16px_16px]"></div>
            
            {/* Elemento Visual: Glass Card Abstracta */}
            <div className="relative z-10 w-full max-w-xs">
                {/* Tarjeta Flotante */}
                <AuthCard />


                {/* Floating Notification (Micro-interacción) */}
                <div className="absolute -right-16 top-4/9 flex animate-bounce items-center gap-3 rounded-xl border border-white/60 bg-white/80 p-3 shadow-xl backdrop-blur-md [animation-duration:3s]">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-900">Ingreso Recibido</p>
                        <p className="text-[10px] text-gray-500">+$3,250.00 ahora mismo</p>
                    </div>
                </div>
            </div>

            <div className="mt-12 text-center">
                <h3 className="text-lg font-semibold text-gray-900">Finanzas Inteligentes</h3>
                <p className="mt-2 text-sm text-gray-500 max-w-xs mx-auto">
                    Tu patrimonio analizado en tiempo real por nuestra IA financiera.
                </p>
            </div>
        </div>

      </div>
    </section>
  );
}