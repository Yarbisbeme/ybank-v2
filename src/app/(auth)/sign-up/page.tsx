"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, Mail, Lock, User, Loader2 } from "lucide-react"; 
import { motion, Variants } from "framer-motion";
import { AuthCard } from "@/components/ui/AuthCard"; 
import TextReveal from "@/components/ui/TextReveal";
import { Logo } from "@/components/ui/Logo";
import { signInWithGoogle, signUpWithEmail } from "../../../lib/actions/auth";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1, 
    transition: { 
      type: "spring",
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
        router.push("/onboarding");
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
    // 💡 1. bg-background y selection adaptativa a la marca
    <section className="relative flex min-h-svh w-full sm:items-center justify-center bg-background font-inter selection:bg-primary/20 selection:text-primary overflow-hidden transition-colors">
      <div className="h-full w-full overflow-hidden flex">
        
        {/* === COLUMNA IZQUIERDA: AUTH === */}
        {/* 💡 2. Eliminamos los bg-white forzados */}
        <div className="flex w-full lg:w-1/2 flex-col justify-between overflow-y-auto h-full min-h-svh p-8 sm:px-10 sm:py-8 bg-card border-r border-border">
          
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
                {/* 💡 3. Adaptamos TextReveal para que funcione en ambos modos */}
                <TextReveal baseColor="text-foreground" hoverColor="text-primary" tamano="text-6xl 2xl:text-8xl font-bold tracking-tight">
                  Crea<br />tu cuenta.
                </TextReveal>
              </div>
              <p className="mt text-muted-foreground font-medium">
                Gestión patrimonial inteligente, simplificada.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="mt-10 space-y-6">
              
              {/* FORMULARIO DE REGISTRO */}
              <form onSubmit={handleSignUp} className="space-y-4">
                {/* Input Nombre */}
                <div className="group relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
                  <input 
                    type="text" 
                    placeholder="Nombre completo"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    className="w-full border-2 border-border bg-surface-2/50 pl-12 pr-4 py-4 font-medium text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10 rounded-[8px]"
                  />
                </div>

                {/* Input Email */}
                <div className="group relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
                  <input 
                    type="email" 
                    placeholder="Correo electrónico"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full border-2 border-border bg-surface-2/50 pl-12 pr-4 py-4 font-medium text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10 rounded-[8px]"
                  />
                </div>

                {/* Input Password */}
                <div className="group relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
                  <input 
                    type="password" 
                    placeholder="Contraseña (mín. 6 caracteres)"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full border-2 border-border bg-surface-2/50 pl-12 pr-4 py-4 font-mono text-foreground placeholder:text-muted-foreground/60 placeholder:font-sans outline-none transition-all focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10 rounded-[8px]"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  // 💡 5. Usamos btn-primary global para los botones
                  className="flex w-full items-center justify-center gap-2 bg-primary py-4 rounded-[8px] font-bold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-70 shadow-lg shadow-primary/20 mt-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : "Comenzar ahora"}
                </button>
              </form>

              <div className="relative flex items-center py-2">
                <div className="grow border-t border-border"></div>
                <span className="mx-4 shrink-0 text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase">O CONTINÚA CON</span>
                <div className="grow border-t border-border"></div>
              </div>

              <form action={signInWithGoogle}>
                <button
                  type="submit"
                  // 💡 6. Botón secundario adaptativo (claro/oscuro)
                  className="group relative flex w-full items-center justify-center gap-3 rounded-[8px] border-2 border-border bg-surface-2 px-4 py-4 font-bold text-foreground transition-all duration-300 hover:bg-background hover:border-primary/30 active:scale-95"
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

              <p className="text-center text-xs text-muted-foreground leading-relaxed mt-6">
                Al registrarte, aceptas nuestros <Link href="#" className="underline font-bold hover:text-foreground">Términos</Link> y <Link href="#" className="underline font-bold hover:text-foreground">Privacidad</Link>.
              </p>
            </motion.div>
          </motion.div>

          <div className="flex shrink-0 flex-col items-center justify-between gap-4 text-xs text-muted-foreground sm:flex-row border-t border-border pt-6 mt-auto">
            <p className="font-medium">
              ¿Ya tienes cuenta?{" "}
              <Link href="/sign-in" className="font-bold text-primary hover:underline">
                Inicia sesión
              </Link>
            </p>
            <div className="flex items-center gap-1.5 text-muted-foreground font-bold uppercase tracking-wider text-[9px]">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>Datos Seguros E2E</span>
            </div>
          </div>
        </div>

        <div className="relative hidden w-1/2 flex-col items-center justify-center bg-surface-2 p-12 lg:flex">
            {/* Patrón de puntos (adaptado al tema) */}
            <div className="absolute inset-0 opacity-[0.15] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
            
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
                <h3 className="text-2xl font-black text-foreground">Control Automático</h3>
                <p className="mt-2 text-sm text-muted-foreground font-medium max-w-xs mx-auto">
                    Tu infraestructura financiera en un solo panel de control.
                </p>
            </div>
        </div>

      </div>
      
    </section>
  );
}