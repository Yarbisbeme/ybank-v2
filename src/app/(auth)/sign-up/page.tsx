'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { signInWithGoogle, signUpWithEmail } from '@/lib/actions/auth';
import { Button } from '@/components/atoms';
import { Field, TextInput } from '@/components/molecules';
import { AuthShell } from '@/components/templates';

export default function SignUpPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
  });

  const handleSignUp = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setFormError(null);

    try {
      const result = await signUpWithEmail(formData);

      if (result.success) {
        if (result.needsEmailConfirmation) {
          toast.success(
            'Cuenta creada. Revisa tu correo para confirmar tu email antes de continuar.',
          );
        } else {
          toast.success('Cuenta creada');
          router.push('/onboarding');
        }
      } else {
        const message = result.error || 'Error al crear la cuenta';
        setFormError(message);
        toast.error(message);
      }
    } catch {
      const fallback = 'Ocurrió un error inesperado al crear la cuenta.';
      setFormError(fallback);
      toast.error(fallback);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Crea tu cuenta"
      subtitle="Empieza a organizar tus cuentas en DOP y USD en un minuto."
      footer={
        <p>
          ¿Ya tienes cuenta?{' '}
          <Link href="/sign-in" className="body-strong text-action hover:underline">
            Inicia sesión
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSignUp} className="flex flex-col gap-4">
        <Field label="Nombre completo" htmlFor="signup-name" required>
          <TextInput
            id="signup-name"
            type="text"
            autoComplete="name"
            placeholder="Nombre completo"
            required
            value={formData.fullName}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, fullName: e.target.value }))
            }
          />
        </Field>

        <Field label="Correo electrónico" htmlFor="signup-email" required>
          <TextInput
            id="signup-email"
            type="email"
            autoComplete="email"
            placeholder="Correo electrónico"
            required
            value={formData.email}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, email: e.target.value }))
            }
          />
        </Field>

        <Field
          label="Contraseña"
          htmlFor="signup-password"
          required
          error={formError ?? undefined}
        >
          <TextInput
            id="signup-password"
            type="password"
            autoComplete="new-password"
            placeholder="Contraseña (mín. 6 caracteres)"
            required
            value={formData.password}
            invalid={Boolean(formError)}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, password: e.target.value }))
            }
          />
        </Field>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          loadingLabel="Creando cuenta..."
        >
          Comenzar ahora
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-line" />
        <span className="small text-ink-2">o regístrate con</span>
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
          Registrarse con Google
        </Button>
      </form>
    </AuthShell>
  );
}
