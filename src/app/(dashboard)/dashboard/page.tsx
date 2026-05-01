import { getAccounts, calculateNormalizedTotal } from '@/lib/actions/accounts';
import { getTransactions } from '@/lib/actions/transactions';
import { getCategories } from '@/lib/actions/categories';
import { getTags } from '@/lib/actions/tags';

// Componentes
import HeroBalance from '@/components/dashboard/NetWorth/HeroBalance';
import CreditHealthBento from '@/components/dashboard/CreditHealthBento'; 
import AccountCarousel from '@/components/accounts/AccountCarousel';
import { TransactionFilters as FilterType } from '@/types/database.types';
import TransactionFilterBar from '@/components/Transactions/TransactionFilterBar';
import ClientTransactionTable from '@/components/Transactions/ClientTransactionTable';

export default async function DashboardPage() {
  
  const [accounts] = await Promise.all([
    getAccounts(),
  ]);

  const { transactions } = await getTransactions({ pageSize: 20 });

  const liquidAccounts = accounts.filter(a => a.type !== 'credit_card');
  const debtAccounts = accounts.filter(a => a.type === 'credit_card');

  const [baseLiquidDOP, baseDebtDOP] = await Promise.all([
    calculateNormalizedTotal(liquidAccounts),
    calculateNormalizedTotal(debtAccounts)
  ]);

  return (
    // 💡 Aumentamos un poco el espaciado vertical (space-y-8) para que respire
    <div className="max-w-[1400px] mx-auto sm:px-4 md:px-8 sm:py-6 space-y-8 md:space-y-10">
      
      {/* =========================================
          FILA 1: MACRO INDICADORES (Bento Grid)
      ============================================= */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-auto">
        
        {/* BLOQUE PRINCIPAL - Hero Balance (8 Columnas) */}
        <div className="md:col-span-12 lg:col-span-8"> 
          <HeroBalance 
            accounts={accounts}
            transactions={transactions}
            baseLiquidDOP={baseLiquidDOP}
            baseDebtDOP={baseDebtDOP}
          />
        </div>

        {/* BLOQUE SECUNDARIO - Score Shield (4 Columnas) */}
        <div className="md:col-span-12 lg:col-span-4">
          <CreditHealthBento accounts={accounts} />
        </div>
      </div>

      {/* =========================================
          FILA 2: MICRO INDICADORES (Nodos)
      ============================================= */}
      {/* Fuera del grid para que aproveche todo el ancho en el scroll horizontal */}
      <div>
        <AccountCarousel accounts={accounts} />
      </div>

      {/* =========================================
          FILA 3: OPERATIVA (Transacciones)
      ============================================= */}
      <section className="pt-8 sm:pt-0">
        <div className="flex items-center gap-2 mb-6">
           <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
             Registro de Operaciones
           </h2>
           <span className="px-2 py-0.5 rounded-[4px] bg-surface-2 border border-border text-[9px] font-mono font-bold text-foreground">
             {transactions.length}
           </span>
        </div>
        
        <TransactionFilterBar />
        <ClientTransactionTable initialTransactions={transactions} />
      </section>
      
    </div>
  );
}