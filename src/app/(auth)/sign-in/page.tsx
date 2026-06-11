"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react"; 
import { motion, AnimatePresence, Variants } from "framer-motion";
import { AuthCard } from "@/components/ui/AuthCard"; 
import TituloHover from "@/components/ui/TituloHover";
import { Logo } from "@/components/ui/Logo";
import { signInWithGoogle, loginWithEmail } from "../../../lib/actions/auth";
import { PasskeyButton } from "@/components/ui/PassKeyButton";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
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

export default function SignIn() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorShake, setErrorShake] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await loginWithEmail({ email, password });
      
      if (result.success) {
        toast.success("¡Bienvenido de nuevo!");
        router.push("/dashboard");
        router.refresh();
      } else {
        setErrorShake(true);
        setTimeout(() => setErrorShake(false), 500);
        toast.error(result.error || "Credenciales incorrectas");
        setLoading(false);
      }
    } catch (error) {
      toast.error("Ocurrió un error inesperado");
      setLoading(false);
    }
  };

  return (
    <section className="relative flex min-h-svh w-full sm:items-center justify-center bg-background font-inter selection:bg-primary/20 selection:text-primary overflow-hidden transition-colors">
      <div className="h-full w-full overflow-hidden flex">
        
        {/* === COLUMNA IZQUIERDA === */}
        {/* 💡 bg-card y border-border en lugar de bg-white puro */}
        <div className="flex w-full lg:w-1/2 flex-col justify-between bg-card border-r border-border overflow-y-auto h-full min-h-svh p-8 sm:px-10 sm:py-8">
          
          {/* Logo Header */}
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
                <TituloHover title={`Bienvenido de nuevo.`} />
              </div>
              {/* 💡 text-muted-foreground para el subtítulo */}
              <p className="text-muted-foreground font-medium text-lg">
                Gestión patrimonial inteligente, simplificada.
              </p>
            </motion.div>

            <motion.div 
              variants={itemVariants}
              animate={errorShake ? { x: [-10, 10, -10, 10, 0] } : {}}
              className="mt-10"
            >
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="group relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
                  <input 
                    type="email" 
                    placeholder="Correo electrónico"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    // 💡 Inputs adaptativos idénticos a SignUp
                    className="w-full border-2 border-border bg-surface-2/50 pl-12 pr-4 py-4 font-medium text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10 rounded-[8px]"
                  />
                </div>

                <div className="group relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Contraseña"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border-2 border-border bg-surface-2/50 pl-12 pr-12 py-4 font-mono text-foreground placeholder:text-muted-foreground/60 placeholder:font-sans outline-none transition-all focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10 rounded-[8px]"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit" 
                  disabled={loading}
                  // 💡 Botón principal con semántica YBank y sombra técnica
                  className="flex w-full items-center justify-center gap-2 bg-primary py-4 rounded-[8px] font-bold text-primary-foreground transition-all hover:bg-primary/90 shadow-lg shadow-primary/20 disabled:opacity-70 mt-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : "Entrar al panel"}
                </motion.button>
              </form>

              <div className="relative flex items-center py-8">
                <div className="grow border-t border-border"></div>
                <span className="mx-4 shrink-0 text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase">
                  OTRAS OPCIONES
                </span>
                <div className="grow border-t border-border"></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <form action={signInWithGoogle} className="w-full">
                  <button type="submit" className="group flex w-full items-center justify-center gap-3 border-2 border-border bg-surface-2 px-4 py-4 rounded-[8px] font-bold text-foreground transition-all hover:bg-background hover:border-primary/30 active:scale-95">
                    <Image src="/icons/google.svg" width={20} height={20} alt="G" className="opacity-80 group-hover:opacity-100 transition-opacity" />
                    <span className="hidden sm:inline">Google</span>
                  </button>
                </form>
                <PasskeyButton />
              </div>
            </motion.div>
          </motion.div>

          {/* Footer */}
          <div className="flex shrink-0 flex-col items-center justify-between gap-4 text-xs text-muted-foreground sm:flex-row border-t border-border pt-6 mt-auto">
            <p className="font-medium">
              ¿No tienes cuenta?{" "}
              <Link href="/sign-up" className="font-bold text-primary hover:underline">
                Aplicar ahora
              </Link>
            </p>
            <div className="flex items-center gap-1.5 text-muted-foreground font-bold uppercase tracking-wider text-[9px]">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>Seguridad Bancaria E2E</span>
            </div>
          </div>
        </div>

        {/* === COLUMNA DERECHA === */}
        {/* 💡 Fondo adaptativo bg-surface-2 con patrón de puntos responsivo */}
        <div className="relative hidden w-1/2 flex-col items-center justify-center bg-surface-2 p-12 lg:flex">
          <div className="absolute inset-0 opacity-[0.15] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
          <motion.div 
            initial={{ opacity: 0, rotateY: -20 }}
            animate={{ opacity: 1, rotateY: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            whileHover={{ rotateY: 8, rotateX: 5, scale: 1.05 }}
            className="relative z-10 w-full max-w-xs perspective-1000"
          >     
            <AuthCard showTransaction={true} className="scale-120 2xl:scale-140 shadow-2xl" />
            <div className="h-18 2xl:h-30" />
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-12 text-center relative z-10"
          >
            <h3 className="text-2xl font-black text-foreground mt-12">Control Automático</h3>
            <p className="mt-2 text-muted-foreground font-medium max-w-xs mx-auto">
              Tu infraestructura financiera personal en un solo panel de control.
            </p>
          </motion.div>
        </div>

      </div>
    </section>
  );
}