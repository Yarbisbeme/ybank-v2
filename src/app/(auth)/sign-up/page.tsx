"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, Mail, Lock, User, Loader2 } from "lucide-react"; 
import { motion, Variants } from "framer-motion";
import { AuthCard } from "@/components/ui/AuthCard"; 
import TextReveal from "@/components/ui/TextReveal";
import { Logo } from "@/components/ui/Logo";
import { signInWithGoogle, signUpWithEmail } from "../../../lib/actions/auth"; // 💡 Importamos la acción de registro
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Variantes para animaciones consistentes
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const itemVariants: Variants = { // 💡 Asigna el tipo aquí
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1, 
    transition: { 
      type: "spring", // Ahora TS sabe que esto es un AnimationGeneratorType
      stiffness: 300, 
      damping: 24 
    } 
  }
};

export default function SignUp() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signUpWithEmail(formData);
      
      if (result.success) {
        toast.success("¡Cuenta creada! Revisa tu correo para confirmar.");
        router.push("/onboarding"); // 💡 Lo mandamos al flujo de configuración inicial
      } else {
        toast.error(result.error || "Error al crear la cuenta");
      }
    } catch (error) {
      toast.error("Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative flex min-h-svh w-full sm:items-center justify-center bg-white font-inter selection:bg-blue-100 selection:text-blue-900 overflow-hidden">
      <div className="h-full w-full overflow-hidden flex">
        
        {/* === COLUMNA IZQUIERDA: AUTH === */}
        <div className="flex w-full lg:w-1/2 flex-col justify-between bg-white overflow-y-auto h-full min-h-svh p-8 sm:px-10 sm:py-8">
          
          <div className="flex items-center justify-between shrink-0">
            <Logo />
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-1 flex-col justify-center w-full lg:w-120 2xl:w-130 mx-auto py-10"
          >
            <motion.div variants={itemVariants}>
              <div className="mb-2">
                <TextReveal baseColor="text-neutral-900" hoverColor="text-blue-600" tamano="text-6xl 2xl:text-8xl font-bold">
                  Crea<br />tu cuenta.
                </TextReveal>
              </div>
              <p className="mt text-neutral-500 font-medium">
                Gestión patrimonial inteligente, simplificada.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="mt-10 space-y-6">
              
              {/* FORMULARIO DE REGISTRO */}
              <form onSubmit={handleSignUp} className="space-y-4">
                {/* Input Nombre */}
                <div className="group relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                  <input 
                    type="text" 
                    placeholder="Nombre completo"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    // 💡 AÑADIMOS: text-neutral-900 y placeholder:text-neutral-400
                    className="w-full border-2 border-neutral-100 bg-neutral-50/50 pl-12 pr-4 py-4 font-medium text-neutral-900 placeholder:text-neutral-400 outline-none transition-all focus:border-blue-600 focus:bg-white rounded-2xl"
                  />
                </div>

                {/* Input Email */}
                <div className="group relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                  <input 
                    type="email" 
                    placeholder="Correo electrónico"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full border-2 border-neutral-100 bg-neutral-50/50 pl-12 pr-4 py-4 font-medium text-neutral-900 placeholder:text-neutral-400 outline-none transition-all focus:border-blue-600 focus:bg-white rounded-2xl"
                  />
                </div>

                {/* Input Password */}
                <div className="group relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                  <input 
                    type="password" 
                    placeholder="Contraseña (mín. 6 caracteres)"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full border-2 border-neutral-100 bg-neutral-50/50 pl-12 pr-4 py-4 font-medium text-neutral-900 placeholder:text-neutral-400 outline-none transition-all focus:border-blue-600 focus:bg-white rounded-2xl"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 bg-neutral-900 py-4 rounded-2xl font-bold text-white transition-all hover:bg-neutral-800 active:scale-[0.98] disabled:opacity-70"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : "Comenzar ahora"}
                </button>
              </form>

              <div className="relative flex items-center py-2">
                <div className="grow border-t border-neutral-100"></div>
                <span className="mx-4 shrink-0 text-[10px] font-black tracking-[0.2em] text-neutral-400 uppercase">O CONTINÚA CON</span>
                <div className="grow border-t border-neutral-100"></div>
              </div>

              <form action={signInWithGoogle}>
                <button
                  type="submit"
                  className="group relative flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-neutral-100 bg-white px-4 py-4 font-bold text-neutral-700 transition-all duration-300 hover:border-neutral-200 hover:bg-neutral-50 active:scale-[0.98]"
                >
                  <Image 
                    src="/icons/google.svg" 
                    width={20} 
                    height={20} 
                    alt="G" 
                    className="opacity-80 transition-opacity group-hover:opacity-100"
                  />
                  <span>Registrarse con Google</span>
                </button>
              </form> 

              <p className="text-center text-xs text-neutral-400 leading-relaxed">
                Al registrarte, aceptas nuestros <Link href="#" className="underline font-bold hover:text-neutral-600">Términos</Link> y <Link href="#" className="underline font-bold hover:text-neutral-600">Privacidad</Link>.
              </p>
            </motion.div>
          </motion.div>

          <div className="flex shrink-0 flex-col items-center justify-between gap-4 text-xs text-neutral-500 sm:flex-row border-t border-neutral-100 pt-6 mt-auto">
            <p className="font-medium">
              ¿Ya tienes cuenta?{" "}
              <Link href="/sign-in" className="font-bold text-blue-600 hover:underline">
                Inicia sesión
              </Link>
            </p>
            <div className="flex items-center gap-1.5 text-neutral-400 font-bold uppercase tracking-wider text-[9px]">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>Datos Seguros E2E</span>
            </div>
          </div>
        </div>

        {/* === COLUMNA DERECHA: VISUAL === */}
        <div className="relative hidden w-4/8 flex-col items-center justify-center bg-neutral-50 p-12 lg:flex border-l border-neutral-200">
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1 }}
              whileHover={{ rotateY: 8, rotateX: 5 }}
              className="relative z-10 w-full max-w-xs perspective-1000"
            >
                <AuthCard showTransaction={true} className="scale-120 2xl:scale-140 shadow-2xl"/>
                <div className="h-18 2xl:h-30" /> 
            </motion.div>

            <div className="mt-12 text-center relative z-10">
                <h3 className="text-2xl font-black text-neutral-900">Control Automático</h3>
                <p className="mt-2 text-sm text-neutral-500 font-medium max-w-xs mx-auto">
                    Tu infraestructura financiera en un solo panel de control.
                </p>
            </div>
        </div>

      </div>
      
    </section>
  );
}