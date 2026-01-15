import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white font-inter p-6 text-center">
      
      {/* Logo Animado */}
      <div className="relative flex items-center justify-center mb-8">
        <div className="absolute size-28 rounded-full bg-bankGradient blur-3xl opacity-20 animate-pulse" />
        <Image 
          src="/icons/logoy.svg" 
          width={80} 
          height={80} 
          alt="yBank Logo"
          className="relative z-10"
        />
      </div>

      <h1 className="text-4xl md:text-6xl font-bold text-gray-900 font-ibm-plex-serif mb-4">
        yBank <span className="text-bankGradient">v2</span>
      </h1>
      
      <p className="text-lg md:text-xl text-gray-600 max-w-2xl mb-10">
        Tu sistema financiero automatizado con Inteligencia Artificial.
        <br className="hidden md:block" />
        Olvídate de las hojas de cálculo manuales.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
        <Link 
          href="/sign-in"
          className="flex-1 rounded-lg bg-bankGradient px-6 py-4 text-white font-semibold shadow-lg hover:opacity-90 transition-all"
        >
          Iniciar Sesión
        </Link>
        
        <Link 
          href="/sign-up"
          className="flex-1 rounded-lg border border-gray-200 bg-white px-6 py-4 text-gray-700 font-semibold hover:bg-gray-50 transition-all"
        >
          Crear Cuenta
        </Link>
      </div>

      <footer className="mt-20 text-sm text-gray-400">
        &copy; 2026 YBM S.A.S. - Proyecto Privado
      </footer>
    </main>
  );
}