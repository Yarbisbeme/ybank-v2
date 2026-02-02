import Link from "next/link";
import Image from "next/image"; // Asegúrate de tener configurado Next Image
import { Fingerprint, ArrowRight, ShieldCheck, CreditCard } from "lucide-react"; 
// Asumo que ya tienes tu AuthCard refactorizada
import { AuthCard } from "@/components/ui/AuthCard"; 
import TextReveal from "@/components/ui/TextReveal";
import { Logo } from "@/components/ui/Logo";
import { signInWithGoogle } from "../../../actions/auth";

export default function SignUp() {
  return (
    <section className="relative flex min-h-svh w-full sm:items-center justify-center bg-white font-inter selection:bg-blue-100 selection:text-blue-900 overflow-hidden">
      {/* === CONTENEDOR PRINCIPAL === 
         Aquí está el cambio clave:
         - w-[90vw]: 90% del ancho de la ventana.
         - h-[90vh]: 90% del alto de la ventana.
         - max-w-none: Quitamos límites de ancho máximo.
      */}
      <div className="h-full w-full overflow-hidden flex">
        
        {/* === COLUMNA IZQUIERDA: AUTH === */}
        {/* Agregamos 'overflow-y-auto' por si la pantalla es muy bajita y el contenido no cabe */}
        <div className="flex w-full lg:w-1/2 flex-col justify-between bg-white overflow-y-auto h-full min-h-svh p-8 sm:px-10 sm:py-8">
        {/* 1. min-h-screen: Asegura que la caja ocupe AL MENOS toda la altura del celular.
            2. justify-between: Separa los elementos (Header arriba, Footer abajo).
        */}

        {/* Header (shrink-0 para que no se aplaste) */}
        <div className="flex items-center justify-between shrink-0">
            <Logo />
        </div>

        {/* Main Content 
            - flex-1: Hace que este div ocupe todo el espacio sobrante.
            - flex flex-col justify-center: Centra el contenido internamente.
        */}
        <div className="flex flex-1 flex-col justify-center w-full lg:w-120 2xl:w-130 mx-auto py-10">
            
            <div className="mb-2">
            <TextReveal baseColor="text-neutral-900" hoverColor="text-blue-600" tamano="text-6xl 2xl:text-8xl font-bold">
                Crea
                <br /> 
                tu cuenta.
            </TextReveal>
            </div>
            
            <p className="mt text-neutral-500 font-medium">
            Gestión patrimonial inteligente, simplificada.
            </p>

            <div className="mt-10">

              <form action={signInWithGoogle}>
                <button
                  className="group relative flex w-full items-center justify-center gap-3 rounded-full border border-neutral-200 bg-white px-4 py-4 font-medium text-neutral-700 transition-all duration-300 hover:border-neutral-300 hover:bg-neutral-50 hover:shadow-sm active:scale-[0.98]"
                >
                  <Image 
                      src="/icons/google.svg" 
                      width={20} 
                      height={20} 
                      alt="G" 
                      className="opacity-80 transition-opacity group-hover:opacity-100"
                  />
                  <span className="tracking-wide">Registrarse con Google</span>
                </button>
              </form> 
              {/* Botón Google (Estilo Industrial) */}

              <p className="mt-6 text-center text-xs text-neutral-400">
                Al registrarte, aceptas nuestros <Link href="#" className="underline hover:text-neutral-600">Términos</Link> y <Link href="#" className="underline hover:text-neutral-600">Privacidad</Link>.
              </p>
            
            </div>
        </div>

        {/* Footer (shrink-0 para asegurar que siempre se vea y no se colapse) */}
        <div className="flex shrink-0 flex-col items-center justify-between gap-4 text-xs text-neutral-500 sm:flex-row border-t border-neutral-100 pt-6 mt-auto">
            <p>
              ¿Ya tienes cuenta?{" "}
              <Link href="/sign-in" className="font-semibold text-black hover:text-blue-600 transition-colors hover:underline">
                Inicia sesión
              </Link>
            </p>
            <div className="flex items-center gap-1.5 text-neutral-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Datos Seguros</span>
            </div>
        </div>
        </div>

        {/* === COLUMNA DERECHA: VISUAL (Estilo Industrial / Bento) === */}
        <div className="relative hidden w-4/8 flex-col items-center justify-center bg-neutral-50 p-12 lg:flex border-l border-neutral-200">
            
            {/* Background pattern sutil */}
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[20px_20px]"></div>
            
            {/* ELEMENTO VISUAL: Tarjeta "Corporate" (Consistente con Home) */}
            <div className="relative z-10 w-full max-w-xs transition-transform duration-700 hover:rotate-y-12 hover:rotate-x-12 perspective-1000">
                              
                {/* La Tarjeta Física **/}
 

                <AuthCard showTransaction={true} className="scale-120 2xl:scale-140"/>
                <div className="h-18 2xl:h-30" /> {/* ← RESERVA ESPACIO */}

                {/* Notificación Flotante (Consistente con tu diseño anterior) */}{/** 
                <div className="absolute -right-12 z-40 top-10 flex animate-bounce items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3 shadow-xl [animation-duration:4s]">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                    <div>
                        <p className="text-xs font-bold text-neutral-900">Nómina Recibida</p>
                        <p className="text-[10px] text-neutral-500">+$3,250.00</p>
                    </div>
                </div>
                */}
            </div>

            <div className="mt-12 text-center relative z-10">
                <h3 className="text-2xl font-bold text-neutral-900">Control Automático</h3>
                <p className="mt-2 text-sm text-neutral-500 max-w-xs mx-auto">
                    Tu infraestructura financiera en un solo panel de control.
                </p>
            </div>
        </div>

      </div>
    </section>
  );
}