'use client'

import { useState, useMemo, useEffect } from 'react';
import { Account, Transaction } from '@/types';
import NetWorthMobile from './NetWorthMobile';
import NetWorthDesktop from './NetWorthDesktop';

export default function NetWorthCard({ accounts, transactions }: { accounts: Account[], transactions: Transaction[] }) {
  const [includeCredit, setIncludeCredit] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const stats = useMemo(() => {
    const filteredAccounts = includeCredit 
      ? accounts 
      : accounts.filter(a => a.type !== 'credit_card');

    const totalUSD = filteredAccounts
      .filter(a => a.currency === 'USD')
      .reduce((sum, a) => sum + (Number(a.current_balance) || 0), 0);

    const totalDOP = filteredAccounts
      .filter(a => a.currency === 'DOP')
      .reduce((sum, a) => sum + (Number(a.current_balance) || 0), 0);

    const groups = filteredAccounts.reduce((acc, account) => {
      const type = account.type || 'other';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { totalUSD, totalDOP, groups };
  }, [accounts, includeCredit]);

  if (!mounted) return null; // Evita el desajuste visual inicial

  return (
    <>
      <div className="block md:hidden">
        <NetWorthMobile 
          totalDOP={stats.totalDOP}
          totalUSD={stats.totalUSD}
          includeCredit={includeCredit}
          onToggleCredit={() => setIncludeCredit(!includeCredit)}
          transactions={transactions}
        />
      </div>
      <div className="hidden md:block h-full">
        <NetWorthDesktop 
          totalDOP={stats.totalDOP}
          totalUSD={stats.totalUSD}
          groups={stats.groups}
          includeCredit={includeCredit}
          onToggleCredit={() => setIncludeCredit(!includeCredit)}
          transactions={transactions}
        />
      </div>
    </>
  );
}