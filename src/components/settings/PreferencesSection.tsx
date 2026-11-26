'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Camera, User } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '@teispace/next-themes';
import type { CurrencyCode } from '@/types';
import {
  useProfile,
  useUpdateProfile,
  useUploadAvatar,
} from '@/hooks/useCatalogs';
import { useYBankStore } from '@/store/useYBankStore';
import { Button, Skeleton, Switch } from '@/components/atoms';
import {
  Field,
  SearchSelect,
  Segmented,
  TextInput,
} from '@/components/molecules';

type ThemeOption = 'light' | 'dark' | 'auto';

interface ProfileRecord {
  id?: string;
  email?: string | null;
  full_name?: string | null;
  phone?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  currency_preference?: CurrencyCode | null;
  theme_preference?: ThemeOption | null;
  theme?: ThemeOption | null;
  language?: string | null;
  data_collection?: boolean | null;
}

interface SettingsFormState {
  fullName: string;
  phone: string;
  bio: string;
  theme: ThemeOption;
  currency: CurrencyCode;
  language: string;
  dataCollection: boolean;
  avatarUrl: string | null;
}

const THEME_OPTIONS: { value: ThemeOption; label: string }[] = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
  { value: 'auto', label: 'Sistema' },
];

const LANGUAGE_OPTIONS = [
  { id: 'es', label: 'Español (DO)', subLabel: 'República Dominicana' },
  { id: 'en', label: 'English (US)', subLabel: 'Estados Unidos' },
];

const CURRENCY_OPTIONS = [
  { id: 'DOP', label: 'DOP (RD$)', subLabel: 'Peso dominicano' },
  { id: 'USD', label: 'USD ($)', subLabel: 'Dólar estadounidense' },
];

/** Flat YBank 2.0 profile and preference settings without synchronous effect state sync. */
export default function PreferencesSection() {
  const { setTheme } = useTheme();
  const { setCurrency } = useYBankStore();
  const { data: rawProfile, isLoading: isLoadingProfile } = useProfile();
  const { mutate: updateProfile, isPending: isSaving } = useUpdateProfile();
  const { mutateAsync: uploadAvatar } = useUploadAvatar();

  const profileData = rawProfile as ProfileRecord | undefined;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [draft, setDraft] = useState<Partial<SettingsFormState>>({});

  const baseState: SettingsFormState = {
    fullName: profileData?.full_name || '',
    phone: profileData?.phone || '',
    bio: profileData?.bio || '',
    theme: profileData?.theme || profileData?.theme_preference || 'auto',
    currency: profileData?.currency_preference || 'DOP',
    language: profileData?.language || 'es',
    dataCollection: profileData?.data_collection ?? false,
    avatarUrl: profileData?.avatar_url || null,
  };

  const current: SettingsFormState = { ...baseState, ...draft };

  const updateDraft = <K extends keyof SettingsFormState>(
    key: K,
    value: SettingsFormState[K],
  ) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    if (key === 'theme') {
      setTheme(value === 'auto' ? 'system' : String(value));
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !profileData?.id) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Selecciona una imagen válida.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 2 MB.');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    updateDraft('avatarUrl', previewUrl);
    setIsUploading(true);

    try {
      const response = await uploadAvatar({
        file,
        userId: profileData.id,
      });
      updateDraft('avatarUrl', response.url);
      toast.success('Foto lista. Guarda tus preferencias para aplicarla.');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error al procesar la imagen.';
      toast.error(message);
      updateDraft('avatarUrl', profileData.avatar_url || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    const payload = {
      theme: current.theme,
      theme_preference: current.theme,
      currency_preference: current.currency,
      language: current.language,
      data_collection: current.dataCollection,
      avatar_url: current.avatarUrl,
      full_name: current.fullName,
      phone: current.phone,
      bio: current.bio,
    };

    updateProfile(payload, {
      onSuccess: () => {
        setCurrency(current.currency);
        setTheme(current.theme === 'auto' ? 'system' : current.theme);
        setIsEditingInfo(false);
        setDraft({});
        toast.success('Preferencias actualizadas');
      },
      onError: (error) => {
        toast.error(`Error al guardar: ${error.message}`);
      },
    });
  };

  if (isLoadingProfile) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton variant="panel" label="Cargando preferencias" />
        <Skeleton variant="panel" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-panel border border-line bg-surface p-5 sm:p-6 flex flex-col gap-5">
        <h2 className="title-s text-ink">Perfil</h2>

        <div className="flex items-center gap-5">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-tile border border-line bg-surface-sunk flex items-center justify-center">
            {current.avatarUrl ? (
              <Image
                src={current.avatarUrl}
                alt={current.fullName || 'Avatar'}
                width={80}
                height={80}
                unoptimized
                className="h-full w-full object-cover"
              />
            ) : (
              <User size={28} strokeWidth={2} className="text-ink-2" />
            )}
          </div>

          <div className="flex flex-col gap-1 min-w-0">
            <p className="title-s text-ink truncate">
              {current.fullName || 'Usuario'}
            </p>
            <p className="small text-ink-2 truncate">
              {profileData?.email || 'Cuenta activa'}
            </p>
            <div className="pt-1">
              <Button
                variant="secondary"
                size="sm"
                loading={isUploading}
                loadingLabel="Subiendo..."
                leftIcon={<Camera size={14} strokeWidth={2} />}
                onClick={() => fileInputRef.current?.click()}
              >
                Cambiar foto
              </Button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp"
            onChange={(e) => {
              void handleImageUpload(e);
            }}
            className="hidden"
          />
        </div>
      </section>

      <section className="rounded-panel border border-line bg-surface p-5 sm:p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="title-s text-ink">Datos personales</h2>
          {!isEditingInfo ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsEditingInfo(true)}
            >
              Editar datos
            </Button>
          ) : null}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nombre completo" htmlFor="pref-fullname">
            <TextInput
              id="pref-fullname"
              value={current.fullName}
              disabled={!isEditingInfo || isSaving}
              onChange={(e) => updateDraft('fullName', e.target.value)}
            />
          </Field>

          <Field label="Teléfono" htmlFor="pref-phone">
            <TextInput
              id="pref-phone"
              type="tel"
              value={current.phone}
              disabled={!isEditingInfo || isSaving}
              onChange={(e) => updateDraft('phone', e.target.value)}
            />
          </Field>

          <Field
            label="Biografía"
            htmlFor="pref-bio"
            className="md:col-span-2"
          >
            <textarea
              id="pref-bio"
              rows={3}
              value={current.bio}
              disabled={!isEditingInfo || isSaving}
              placeholder="Escribe algo sobre ti..."
              onChange={(e) => updateDraft('bio', e.target.value)}
              className="w-full rounded-control border border-line-strong bg-surface px-3 py-2 body text-ink placeholder:text-ink-3 focus:border-action focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed resize-none"
            />
          </Field>
        </div>

        {isEditingInfo ? (
          <div className="flex items-center gap-3 border-t border-line pt-4">
            <Button
              variant="primary"
              loading={isSaving}
              loadingLabel="Guardando..."
              onClick={handleSave}
            >
              Guardar cambios
            </Button>
            <Button
              variant="ghost"
              disabled={isSaving}
              onClick={() => {
                setIsEditingInfo(false);
                setDraft({});
              }}
            >
              Cancelar
            </Button>
          </div>
        ) : null}
      </section>

      <section className="rounded-panel border border-line bg-surface p-5 sm:p-6 flex flex-col gap-4">
        <h2 className="title-s text-ink">Tema visual</h2>
        <Segmented<ThemeOption>
          aria-label="Tema visual"
          options={THEME_OPTIONS}
          value={current.theme}
          onChange={(nextTheme) => updateDraft('theme', nextTheme)}
          fullWidth
        />
      </section>

      <section className="rounded-panel border border-line bg-surface p-5 sm:p-6 flex flex-col gap-4">
        <h2 className="title-s text-ink">Formatos regionales</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Idioma" htmlFor="pref-language">
            <SearchSelect
              id="pref-language"
              options={LANGUAGE_OPTIONS}
              value={current.language}
              disabled={isSaving || isUploading}
              onChange={(val) => updateDraft('language', val)}
              placeholder="Buscar idioma..."
            />
          </Field>

          <Field label="Moneda principal" htmlFor="pref-currency">
            <SearchSelect
              id="pref-currency"
              options={CURRENCY_OPTIONS}
              value={current.currency}
              disabled={isSaving || isUploading}
              onChange={(val) => updateDraft('currency', val as CurrencyCode)}
              placeholder="Buscar moneda..."
            />
          </Field>
        </div>
      </section>

      <section className="rounded-panel border border-line bg-surface p-5 sm:p-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="title-s text-ink">Estadísticas de uso</h2>
          <p className="small text-ink-2 mt-0.5">
            Ayúdanos a mejorar YBank con datos anónimos de uso.
          </p>
        </div>
        <Switch
          checked={current.dataCollection}
          disabled={isSaving || isUploading}
          onCheckedChange={(checked) => updateDraft('dataCollection', checked)}
          aria-label="Activar estadísticas de uso anónimas"
        />
      </section>

      {!isEditingInfo ? (
        <div className="flex justify-end">
          <Button
            variant="primary"
            size="lg"
            loading={isSaving}
            loadingLabel="Guardando..."
            disabled={isUploading}
            onClick={handleSave}
          >
            Guardar preferencias
          </Button>
        </div>
      ) : null}
    </div>
  );
}
