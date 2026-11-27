'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import type { CurrencyCode } from '@/types';
import { createAccount } from '@/lib/actions/accounts';
import { completeOnboarding } from '@/lib/actions/auth';
import { cn } from '@/lib/utils';
import { Button, IconButton } from '@/components/atoms';
import { AmountInput, Field, TextInput } from '@/components/molecules';

interface InstitutionItem {
  id: string;
  name: string;
}

export interface OnboardingFormProps {
  initialStep: number;
  defaultName: string;
  institutions: InstitutionItem[];
}

/** Four-step account setup wizard styled with flat YBank 2.0 controls. */
export default function OnboardingForm({
  initialStep,
  defaultName,
  institutions,
}: OnboardingFormProps) {
  const [step, setStep] = useState(initialStep);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: defaultName,
    password: '',
    currency: 'DOP' as CurrencyCode,
    accountName: '',
    institutionId: institutions.length > 0 ? institutions[0].id : '',
    initialBalance: '',
  });

  const handleNext = () => setStep((prev) => prev + 1);
  const handleBack = () => setStep((prev) => prev - 1);

  const isValidStep1 = formData.fullName.trim().length > 0;
  const isValidStep2 = formData.password.length >= 6;
  const isValidStep3 =
    formData.accountName.trim().length > 0 && formData.institutionId !== '';

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const accountResult = await createAccount({
        institution_id: formData.institutionId,
        name: formData.accountName,
        type: 'savings',
        initial_balance: Number(formData.initialBalance) || 0,
        currency: formData.currency,
        is_active: true,
      });

      if (!accountResult.success) {
        throw new Error(
          `Error creando tu cuenta. ${accountResult.error || ''}`,
        );
      }

      const resultData = (accountResult as { success: true; data: { id: string } })
        .data;
      const newAccountId = resultData?.id;

      if (!newAccountId) {
        throw new Error(
          'La cuenta se creó, pero no se pudo obtener su identificador.',
        );
      }

      const result = await completeOnboarding({
        fullName: formData.fullName,
        password: formData.password,
        currency: formData.currency,
        primaryAccountId: newAccountId,
      });

      if (result.success) {
        toast.success('Cuenta configurada');
        window.location.href = '/dashboard';
        return;
      }
      toast.error(result.error);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Error al completar la configuración.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="rounded-panel border border-line bg-surface p-6 sm:p-8 flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <span className="label text-ink-2 tabular-nums">Paso {step} de 4</span>
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {[1, 2, 3, 4].map((s) => (
            <span
              key={s}
              className={cn(
                'h-1.5 rounded-chip transition-all duration-150',
                s === step
                  ? 'w-6 bg-action'
                  : s < step
                    ? 'w-3 bg-ink'
                    : 'w-3 bg-surface-sunk',
              )}
            />
          ))}
        </div>
      </div>

      {step === 1 ? (
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="title text-ink">Tu nombre</h2>
            <p className="small text-ink-2 mt-1">
              Así te saludaremos en tu panel principal.
            </p>
          </div>

          <Field label="Nombre completo" htmlFor="fullName" required>
            <TextInput
              id="fullName"
              value={formData.fullName}
              placeholder="¿Cómo te llamas?"
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, fullName: e.target.value }))
              }
            />
          </Field>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={!isValidStep1}
            rightIcon={<ArrowRight size={16} strokeWidth={2} />}
            onClick={handleNext}
          >
            Continuar
          </Button>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="title text-ink">Tu contraseña</h2>
            <p className="small text-ink-2 mt-1">
              También podrás entrar con tu correo y contraseña.
            </p>
          </div>

          <Field
            label="Contraseña"
            htmlFor="password"
            hint="Debe tener al menos 6 caracteres."
            required
          >
            <TextInput
              id="password"
              type="password"
              value={formData.password}
              placeholder="Mínimo 6 caracteres"
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, password: e.target.value }))
              }
            />
          </Field>

          <div className="flex items-center gap-3">
            <IconButton
              size="lg"
              variant="surface"
              aria-label="Paso anterior"
              onClick={handleBack}
            >
              <ArrowLeft size={18} strokeWidth={2} />
            </IconButton>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={!isValidStep2}
              rightIcon={<ArrowRight size={16} strokeWidth={2} />}
              onClick={handleNext}
            >
              Continuar
            </Button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="title text-ink">Tu primera cuenta</h2>
            <p className="small text-ink-2 mt-1">
              Elige tu banco principal y su saldo actual.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Institución" htmlFor="institution" required>
              <select
                id="institution"
                value={formData.institutionId}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    institutionId: e.target.value,
                  }))
                }
                className="h-10 w-full rounded-control border border-line-strong bg-surface px-3 body text-ink focus:border-action focus:outline-none"
              >
                <option value="" disabled>
                  Banco...
                </option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Nombre de la cuenta" htmlFor="accountName" required>
              <TextInput
                id="accountName"
                value={formData.accountName}
                placeholder="Ej. Nómina"
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    accountName: e.target.value,
                  }))
                }
              />
            </Field>
          </div>

          <Field label="Saldo inicial" htmlFor="initialBalance">
            <AmountInput
              id="initialBalance"
              size="lg"
              currency={formData.currency}
              value={formData.initialBalance}
              placeholder="0.00"
              onChange={(val) =>
                setFormData((prev) => ({ ...prev, initialBalance: val }))
              }
            />
          </Field>

          <div className="flex items-center gap-3">
            <IconButton
              size="lg"
              variant="surface"
              aria-label="Paso anterior"
              onClick={handleBack}
            >
              <ArrowLeft size={18} strokeWidth={2} />
            </IconButton>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={!isValidStep3}
              rightIcon={<ArrowRight size={16} strokeWidth={2} />}
              onClick={handleNext}
            >
              Guardar cuenta
            </Button>
          </div>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="title text-ink">Moneda principal</h2>
            <p className="small text-ink-2 mt-1">
              Usaremos esta moneda para resumir tu balance total.
            </p>
          </div>

          <Field label="Moneda" htmlFor="currency">
            <select
              id="currency"
              value={formData.currency}
              disabled={loading}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  currency: e.target.value as CurrencyCode,
                }))
              }
              className="h-10 w-full rounded-control border border-line-strong bg-surface px-3 body text-ink focus:border-action focus:outline-none disabled:opacity-50"
            >
              <option value="DOP">DOP — Peso dominicano</option>
              <option value="USD">USD — Dólar estadounidense</option>
            </select>
          </Field>

          <div className="flex items-center gap-3">
            <IconButton
              size="lg"
              variant="surface"
              aria-label="Paso anterior"
              disabled={loading}
              onClick={handleBack}
            >
              <ArrowLeft size={18} strokeWidth={2} />
            </IconButton>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              loadingLabel="Guardando..."
              leftIcon={<CheckCircle2 size={16} strokeWidth={2} />}
              onClick={() => {
                void handleSubmit();
              }}
            >
              Entrar a YBank
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
