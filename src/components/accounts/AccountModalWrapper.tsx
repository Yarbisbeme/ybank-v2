// components/accounts/AccountModalWrapper.tsx
import { getAccountById } from '@/lib/actions/accounts';
import { getInstitutions } from '@/lib/actions/institutions'; 
import AccountFormWrapper from './AccountFormWrapper';
import { EditCreateAccount, Institution } from '@/types'; 
import Link from 'next/link';
import { X } from 'lucide-react';

const fallbackInstitution: Institution = {
  id: '', name: '', logo_url: null, exchange_rate_adjustment: 0, exchange_rate_buy_adjustment: 0, created_at: new Date().toISOString(), brand_color_primary: '#1e3a8a'
};

export default async function AccountModalWrapper({ accountId }: { accountId?: string }) {
  let initialData: EditCreateAccount | undefined = undefined;

  const [account, institutions] = await Promise.all([
    accountId ? getAccountById(accountId) : Promise.resolve(null),
    getInstitutions() 
  ]);

  if (account) {
    initialData = {
      id: account.id,
      name: account.name,
      type: account.type,
      currency: account.currency,
      color: account.color || '#1e3a8a',
      custom_pattern: account.custom_pattern || 'solid',
      custom_text_theme: account.custom_text_theme || 'light',
      current_balance: account.current_balance || 0,
      last_4_digits: account.last_4_digits || '',
      institution: account.institution || fallbackInstitution,
      initial_balance: account.initial_balance,
      expiry_date: account.expiry_date,
      credit_limit: account.credit_limit,
      is_active: account.is_active,
      created_at: account.created_at,
      updated_at: account.updated_at
    };
  }

  return (
    // 💡 FIX 1: p-0 en móvil para que toque los bordes, md:p-4 para mantener el margen en PC
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 md:p-4 overflow-hidden md:overflow-y-auto">
      
      {/* 💡 FIX 2: h-[100dvh] y w-full en móvil. Fondo adaptativo (tu color base en móvil, transparente en PC) */}
      <div className="relative w-full h-[100dvh] md:h-auto max-w-4xl flex flex-col bg-[#F8F9FB] md:bg-transparent overflow-y-auto md:overflow-visible">
        
        {/* 💡 FIX 3: Botón camaleónico. 
            Móvil: Adentro (top-4 right-4), gris/oscuro.
            PC: Afuera (-top-12 right-0), blanco con blur. */}
        <Link 
          href="/accounts" 
          scroll={false}
          className="absolute top-4 right-4 md:-top-12 md:right-0 z-[160] p-2 bg-slate-200/50 md:bg-white/10 hover:bg-slate-300/50 md:hover:bg-white/20 text-slate-800 md:text-white rounded-full md:backdrop-blur-md transition-colors"
        >
          <X size={24} />
        </Link>

        {/* Contenedor del formulario que empuja a llenar el espacio en móvil */}
        <div className="flex-1 w-full flex flex-col pt-16 md:pt-0 md:pb-0 px-4 md:px-0">
          <AccountFormWrapper initialData={initialData} institutions={institutions} />
        </div>

      </div>
    </div>
  );
}