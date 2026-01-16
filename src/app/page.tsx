import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-[#F3F4F6] font-inter text-gray-900 selection:bg-black selection:text-white">

      {/* Header */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-8 py-10">
        <div className="flex items-center">
          <Image src="/icons/logoy.svg" width={36} height={36} alt="Ybank" />
          <span className="text-2xl font-bold tracking-tight text-gray-900">
            Bank
          </span>
        </div>

        <Link
          href="/sign-in"
          className="text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          Iniciar sesión
        </Link>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-16 px-8 py-20 md:grid-cols-2">

        {/* Texto */}
        <div className="flex flex-col justify-center">
          <h1 className="text-5xl font-semibold tracking-tight leading-[1.05] text-gray-900">
            Finanzas claras
            <span className="relative block text-gray-700">
              para decisiones reales
              <span className="absolute -bottom-1 left-0 h-[2px] w-12 rounded-full bg-blue-500"></span>
            </span>
          </h1>


          <p className="mt-8 max-w-md text-lg text-gray-600">
            Ybank organiza tu información financiera en un solo lugar y
            te ayuda a entenderla, no solo a verla.
          </p>

          <div className="mt-12 flex gap-4">
            <Link
              href="/sign-up"
              className="group relative inline-flex items-center gap-2 rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              <span className="absolute -inset-px rounded-lg bg-blue-500/20 opacity-0 blur transition group-hover:opacity-100"></span>
              Crear cuenta
              <ArrowRight className="relative h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>


            <Link
              href="/sign-in"
              className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Ya tengo cuenta
            </Link>
          </div>
        </div>

        {/* Visual */}
        <div className="relative flex items-center justify-center">
          <div className="relative w-full max-w-md">

            {/* Glow controlado */}
            <div className="absolute -top-20 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-blue-500/15 blur-[120px]" />

            {/* Card */}
            <div className="relative rounded-2xl border border-gray-300 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">
                  Patrimonio total
                </span>
                <span className="text-xs text-gray-400">Ybank</span>
              </div>

              <p className="mt-6 text-3xl font-semibold tracking-tight text-gray-900">
                $124,560.00
              </p>

              <p className="mt-2 text-sm font-medium text-emerald-600">
                +4.2% este mes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-300 px-8 py-8 text-center text-xs text-gray-500">
        © 2026 Ybank
      </footer>
    </main>
  );
}
