'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { loginWithEmail, signInWithGoogle } from '@/lib/actions/auth';
import { Button, IconButton } from '@/components/atoms';
import { Field, TextInput } from '@/components/molecules';
import { AuthShell } from '@/components/templates';

export default function SignInPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleEmailLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setFormError(null);

    try {
      const result = await loginWithEmail({ email, password });
      if (result.success) {
        toast.success('Bienvenido de nuevo');
        router.push('/dashboard');
        router.refresh();
        return;
      }

      const message = result.error || 'Credenciales incorrectas';
      setFormError(message);
      toast.error(message);
      setLoading(false);
    } catch {
      const fallback = 'Ocurrió un error inesperado al iniciar sesión.';
      setFormError(fallback);
      toast.error(fallback);
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Bienvenido de nuevo"
      subtitle="Entra para revisar tus cuentas y movimientos."
      footer={
        <p>
          ¿No tienes cuenta?{' '}
          <Link href="/sign-up" className="body-strong text-action hover:underline">
            Crear cuenta
          </Link>
        </p>
      }
    >
      <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
        <Field label="Correo electrónico" htmlFor="signin-email" required>
          <TextInput
            id="signin-email"
            type="email"
            autoComplete="email"
            placeholder="tu@correo.com"
            required
            value={email}
            invalid={Boolean(formError)}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        <Field
          label="Contraseña"
          htmlFor="signin-password"
          required
          error={formError ?? undefined}
        >
          <div className="relative flex items-center">
            <TextInput
              id="signin-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Tu contraseña"
              required
              value={password}
              invalid={Boolean(formError)}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-11"
            />
            <IconButton
              size="sm"
              variant="ghost"
              aria-label={
                showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
              }
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-1.5"
            >
              {showPassword ? (
                <EyeOff size={16} strokeWidth={2} />
              ) : (
                <Eye size={16} strokeWidth={2} />
              )}
            </IconButton>
          </div>
        </Field>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          loadingLabel="Entrando..."
        >
          Iniciar sesión
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-line" />
        <span className="small text-ink-2">o continúa con</span>
        <div className="h-px flex-1 bg-line" />
      </div>

      <form action={signInWithGoogle}>
        <Button
          type="submit"
          variant="secondary"
          size="lg"
          fullWidth
          leftIcon={
            <Image
              src="/icons/google.svg"
              width={18}
              height={18}
              alt=""
              aria-hidden="true"
            />
          }
        >
          Continuar con Google
        </Button>
      </form>
    </AuthShell>
  );
}
