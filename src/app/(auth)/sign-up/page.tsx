import Link from "next/link";
import Image from "next/image";

export default function SignUp() {
  return (
    <section className="flex min-h-screen w-full justify-between font-inter bg-white">
      {/* --- COLUMNA IZQUIERDA: FORMULARIO --- */}
      <div className="flex w-full max-w-[420px] flex-col justify-center gap-5 px-4 py-10 md:gap-8 lg:px-10 xl:px-20">
        
        <header className="flex flex-col gap-5 md:gap-8">
          <Link href="/" className="cursor-pointer flex items-center gap-2">
            <Image 
              src="/icons/logoy.svg" 
              width={34} 
              height={34} 
              alt="yBank Logo"
              className="size-[34px]"
            />
            <h1 className="text-[26px] font-bold text-black-1 font-ibm-plex-serif">
              yBank
            </h1>
          </Link>

          <div className="flex flex-col gap-1 md:gap-3">
            <h1 className="text-[24px] lg:text-[36px] font-semibold text-gray-900">
              Crear Cuenta
            </h1>
            <p className="text-[16px] font-normal text-gray-600">
              Conecta tus finanzas en segundos.
            </p>
          </div>
        </header>

        <div className="flex flex-col gap-4">
            {/* El mismo botón de Google, ya que Google sirve para Login Y Registro */}
            <button 
                className="flex items-center justify-center gap-3 w-full rounded-lg bg-bankGradient py-3 px-6 text-white text-[16px] font-semibold shadow-form hover:opacity-90 transition-all disabled:opacity-50"
            >
                <svg className="h-5 w-5 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Registrarse con Google
            </button>
        </div>

        <footer className="flex justify-center gap-1 mt-4">
          <p className="text-[14px] font-normal text-gray-600">
            ¿Ya tienes cuenta?
          </p>
          <Link href="/sign-in" className="text-[14px] cursor-pointer font-medium text-bankGradient hover:underline">
            Iniciar Sesión
          </Link>
        </footer>
      </div>

      {/* --- COLUMNA DERECHA --- */}
      <div className="hidden lg:flex h-screen w-[50%] sticky top-0 items-center justify-center bg-sky-1 border-l border-gray-200">
        <div className="relative flex flex-col items-center">
             <div className="text-9xl font-bold text-bankGradient opacity-10 select-none font-ibm-plex-serif">
                yBank
             </div>
             <p className="mt-4 text-gray-500 font-medium">Únete a la revolución financiera</p>
        </div>
      </div>
    </section>
  );
}