import Link from "next/link";
import Image from "next/image";
import { ShieldCheck } from "lucide-react"; 
import { AuthCard } from "@/components/ui/AuthCard"; 
import TextReveal from "@/components/ui/TextReveal";
import { Logo } from "@/components/ui/Logo";
import { signInWithGoogle } from "../../../../actions/auth"; // Asegúrate que la ruta sea correcta
import { PasskeyButton } from "@/components/ui/PassKeyButton";


export default function SignIn() {

  return (
    <section className="relative flex min-h-svh w-full sm:items-center justify-center bg-white font-inter selection:bg-blue-100 selection:text-blue-900 overflow-hidden">
      <div className="h-full w-full overflow-hidden flex">
        <div className="flex w-full lg:w-1/2 flex-col justify-between bg-white overflow-y-auto h-full min-h-svh p-8 sm:px-10 sm:py-8">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0 ">
                <Logo />
            </div>

            {/* Main Content */}
            <div className="flex flex-1 flex-col justify-center w-full lg:w-120 2xl:w-130 mx-auto py-10">
                <div className="mb-2">
                    <TextReveal baseColor="text-neutral-900" hoverColor="text-blue-600" tamano="text-5xl lg:text-6xl xl:text-6xl 2xl:text-8xl font-bold">
                        Bienvenido<br />de nuevo.
                    </TextReveal>
                </div>
                
                <p className="mt text-neutral-500 font-medium">
                Gestión patrimonial inteligente, simplificada.
                </p>

                <div className="mt-8 flex flex-col gap-4">
                
                {/* 3. Botón Passkey CONECTADO */}
                <PasskeyButton/>

                {/* Separador */}
                <div className="relative flex items-center py-4">
                    <div className="grow border-t border-neutral-100"></div>
                    <span className="mx-4 shrink-0 text-[10px] font-bold tracking-widest text-neutral-400 uppercase">
                    O usa tu email
                    </span>
                    <div className="grow border-t border-neutral-100"></div>
                </div>

                {/* Opción 2: Google */}
                {/* Nota: Al usar 'use client', asegúrate de que signInWithGoogle sea compatible */}
                <form action={signInWithGoogle}>
                    <button type="submit" className="group flex w-full items-center justify-center gap-3 border border-neutral-200 bg-white px-4 py-4 font-medium text-neutral-700 transition-all hover:border-neutral-300 hover:bg-neutral-50 active:bg-neutral-100">
                        <Image src="/icons/google.svg" width={20} height={20} alt="G" className="opacity-60 group-hover:opacity-100 transition-opacity"/>
                        <span>Google Account</span>
                    </button>
                </form>
                </div>
            </div>

            {/* Footer */}
            <div className="flex shrink-0 flex-col items-center justify-between gap-4 text-xs text-neutral-500 sm:flex-row border-t border-neutral-100 pt-6 mt-auto">
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

        {/* COLUMNA DERECHA (Se mantiene igual) */}
        <div className="relative hidden w-4/8 flex-col items-center justify-center bg-neutral-50 p-12 lg:flex border-l border-neutral-200">
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[20px_20px]"></div>
            <div className="relative z-10 w-full max-w-xs transition-transform duration-700 hover:rotate-y-12 hover:rotate-x-12 perspective-1000">     
                <AuthCard showTransaction={true} className="scale-120 2xl:scale-140"/>
                <div className="h-18 2xl:h-30" />
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