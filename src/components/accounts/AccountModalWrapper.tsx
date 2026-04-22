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
      // 💡 MAPEO DE LOS NUEVOS DATOS
      initial_balance: account.initial_balance,
      expiry_date: account.expiry_date,
      credit_limit: account.credit_limit,
      is_active: account.is_active,
      created_at: account.created_at,
      updated_at: account.updated_at
    };
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      {/* 💡 CAMBIO: De max-w-md a max-w-4xl para el layout de dos columnas */}
      <div className="relative w-full max-w-4xl flex flex-col items-center my-auto">
        <Link 
          href="/accounts" 
          scroll={false}
          className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors"
        >
          <X size={24} />
        </Link>

        <AccountFormWrapper initialData={initialData} institutions={institutions} />
      </div>
    </div>
  );
}