import Link from "next/link";
import Image from "next/image";
import OnlinePaymentAnimation from "@/components/ui/OnlinePaymentAnimation";

export default function SignUp() {
  return (
    <section className="flex min-h-screen w-full justify-between font-inter bg-white">
      {/* --- COLUMNA IZQUIERDA: FORMULARIO --- */}
      <div className="flex w-1/2 items-center justify-center">
        <div className="w-full max-w-md space-y-8">
          <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <header>
            <Link href="/" className="mb-8 flex items-center gap-2">
              <Image src="/icons/logoy.svg" width={32} height={32} alt="Bank" />
              <span className="text-xl font-semibold">Bank</span>
            </Link>

            <h1 className="text-4xl font-semibold tracking-tight text-gray-900">
              Crea tu cuenta
            </h1>
            <p className="mt-2 text-gray-500">
              Conecta tus finanzas en segundos.
            </p>
          </header>


            <button className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white py-3.5 text-sm font-medium text-gray-800 hover:bg-gray-50">
              {/* icon */}
              Registrarse con Google
            </button>


          <p className="text-center text-sm text-gray-500">
            ¿Ya tienes cuenta?{" "}
            <Link href="/sign-in" className="font-medium text-gray-900 hover:underline">
              Inicia sesión
            </Link>
          </p>
          </div>
        </div>
      </div>


      {/* --- COLUMNA DERECHA --- */}
      <div className="hidden lg:flex w-1/2 items-center justify-center bg-gradient-to-br from-sky-50 via-white to-sky-100">
        <div className="flex flex-col items-center gap-6 text-center">


          <OnlinePaymentAnimation />
          

          <h2 className="text-2xl font-semibold text-gray-900">
            Control total de tu dinero
          </h2>

          <p className="max-w-sm text-gray-600">
            Administra, conecta y controla tus finanzas desde un solo lugar.
          </p>

        </div>
      </div>


    </section>
  );
}