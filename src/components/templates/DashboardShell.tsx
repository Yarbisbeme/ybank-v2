'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@teispace/next-themes';
import { Download, Menu, Moon, Plus, Search, Sun } from 'lucide-react';
import type { Account, Category, Tag, Transaction } from '@/types';
import { signOut } from '@/lib/actions/auth';
import { useAccounts, useCategories, useGlobalSearch, useTags } from '@/hooks/useCatalogs';
import { useFilterStore } from '@/store/useFilterStore';
import { useModalStore } from '@/store/useModalStore';
import { Button, IconButton, YMark } from '@/components/atoms';
import {
  BottomNav,
  CommandPalette,
  MobileNavDrawer,
  Sidebar,
  type SidebarUser,
} from '@/components/organisms';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface DashboardShellProps {
  user: SidebarUser;
  initialData: {
    accounts: Account[];
    transactions: Transaction[];
    categories: Category[];
    tags: Tag[];
  };
  children: React.ReactNode;
}

const emptySubscribe = () => () => {};

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/** Responsive application shell for desktop, tablet (<lg), and mobile (<md). */
export function DashboardShell({
  user,
  initialData,
  children,
}: DashboardShellProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const openModal = useModalStore((state) => state.openModal);
  const setFilter = useFilterStore((state) => state.setFilter);
  const { theme, setTheme } = useTheme();

  const isHydrated = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  const { data: liveAccounts } = useAccounts();
  const { data: liveCategories } = useCategories();
  const { data: liveTags } = useTags();
  const { data: searchData, isFetching: isSearchingRemote } =
    useGlobalSearch(debouncedQuery);

  const accounts = liveAccounts ?? initialData.accounts;
  const categories = liveCategories ?? initialData.categories;
  const tags = liveTags ?? initialData.tags;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      Boolean((window.navigator as { standalone?: boolean }).standalone);
    if (isStandalone) {
      return;
    }

    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () =>
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const mergedTransactions = useMemo(() => {
    const query = normalizeText(searchQuery.trim());
    if (!query) {
      return [];
    }

    const isOnlineSearch =
      typeof navigator !== 'undefined' &&
      navigator.onLine &&
      debouncedQuery.trim().length > 2 &&
      Boolean(searchData?.transactions);

    if (isOnlineSearch && searchData?.transactions) {
      return searchData.transactions as Transaction[];
    }

    const cachedQueries = queryClient.getQueriesData<{
      transactions?: Transaction[];
    }>({ queryKey: ['transactions'] });

    const byId = new Map<string, Transaction>();
    for (const tx of initialData.transactions) {
      byId.set(tx.id, tx);
    }
    for (const [, cached] of cachedQueries) {
      if (cached?.transactions) {
        for (const tx of cached.transactions) {
          byId.set(tx.id, tx);
        }
      }
    }

    return Array.from(byId.values());
  }, [searchQuery, debouncedQuery, searchData, queryClient, initialData.transactions]);

  const handleSignOut = async () => {
    queryClient.clear();
    await signOut();
  };

  const handleToggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleInstallApp = async () => {
    if (!installPrompt) {
      return;
    }
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  const todayLabel = new Date().toLocaleDateString('es-DO', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });

  return (
    <div className="flex h-screen w-full overflow-hidden bg-canvas text-ink font-sans">
      <div className="hidden lg:flex h-full">
        <Sidebar
          user={user}
          theme={isHydrated ? theme : undefined}
          onToggleTheme={isHydrated ? handleToggleTheme : undefined}
          onNewTransaction={() => openModal('transaction')}
          onSignOut={handleSignOut}
        />
      </div>

      <div className="flex flex-1 min-w-0 flex-col h-full">
        <header className="sticky top-0 z-sticky flex h-16 shrink-0 items-center justify-between gap-3 border-b border-line bg-surface px-4 md:px-6 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <IconButton
              variant="ghost"
              size="md"
              aria-label="Abrir menú"
              onClick={() => setIsDrawerOpen(true)}
              className="lg:hidden -ml-1"
            >
              <Menu size={20} strokeWidth={2} />
            </IconButton>

            <div className="lg:hidden">
              <YMark lockup size={24} />
            </div>

            <div className="hidden lg:flex flex-col min-w-0">
              <p className="body-strong text-ink truncate">
                Hola, {user.name}
              </p>
              <p className="small text-ink-2 capitalize truncate">
                {todayLabel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="hidden sm:flex h-9 w-56 items-center gap-2 rounded-control border border-line-strong bg-surface-sunk px-3 small text-ink-2 hover:text-ink transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-action focus-visible:outline-offset-2"
            >
              <Search size={15} strokeWidth={2} className="shrink-0" />
              <span className="truncate">Buscar...</span>
              <kbd className="ml-auto rounded-chip border border-line bg-surface px-1.5 py-0.5 nav font-mono text-ink-2">
                ⌘K
              </kbd>
            </button>

            <IconButton
              variant="ghost"
              size="md"
              aria-label="Buscar"
              onClick={() => setIsSearchOpen(true)}
              className="sm:hidden"
            >
              <Search size={18} strokeWidth={2} />
            </IconButton>

            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Plus size={15} strokeWidth={2} />}
              onClick={() => openModal('account')}
              className="hidden sm:inline-flex"
            >
              Nueva cuenta
            </Button>

            {isHydrated ? (
              <IconButton
                variant="ghost"
                size="md"
                aria-label={
                  theme === 'dark'
                    ? 'Cambiar a tema claro'
                    : 'Cambiar a tema oscuro'
                }
                onClick={handleToggleTheme}
                className="hidden md:inline-flex lg:hidden"
              >
                {theme === 'dark' ? (
                  <Sun size={18} strokeWidth={2} />
                ) : (
                  <Moon size={18} strokeWidth={2} />
                )}
              </IconButton>
            ) : null}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-6 lg:px-8 pt-5 pb-24 md:pb-8 flex flex-col">
          <div className="mx-auto w-full max-w-6xl flex-1">{children}</div>

          <footer className="mx-auto mt-10 flex w-full max-w-6xl flex-col sm:flex-row items-center justify-between gap-3 border-t border-line pt-5 small text-ink-2">
            <div className="flex items-center gap-2">
              <YMark size={16} tone="ink" />
              <span>YBank · Tus finanzas en DOP y USD</span>
            </div>

            {installPrompt ? (
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Download size={14} strokeWidth={2} />}
                onClick={handleInstallApp}
              >
                Instalar app
              </Button>
            ) : null}
          </footer>
        </main>
      </div>

      <BottomNav onNewTransaction={() => openModal('transaction')} />

      <MobileNavDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onNewTransaction={() => openModal('transaction')}
        onNewAccount={() => openModal('account')}
        onSignOut={handleSignOut}
        user={user}
        theme={isHydrated ? theme : undefined}
        onToggleTheme={isHydrated ? handleToggleTheme : undefined}
      />

      <CommandPalette
        open={isSearchOpen}
        onClose={() => {
          setIsSearchOpen(false);
          setSearchQuery('');
          setDebouncedQuery('');
        }}
        query={searchQuery}
        onQueryChange={setSearchQuery}
        isLoading={isSearchingRemote && debouncedQuery.trim().length > 2}
        results={{
          accounts,
          transactions: mergedTransactions,
          categories,
          tags,
        }}
        onSelectAccount={(acc) => {
          setFilter('accountId', acc.id);
          router.push(`/accounts?accountId=${acc.id}`);
        }}
        onSelectTransaction={(tx) => {
          openModal('transaction', {
            transactionId: tx.id,
            accountId: tx.account_id,
            initialData: tx,
          });
        }}
        onSelectCategory={(cat) => {
          setFilter('categoryId', cat.id);
          router.push(`/transactions?categoryId=${cat.id}`);
        }}
        onSelectTag={(tag) => {
          setFilter('tagId', tag.id);
          router.push(`/transactions?tagId=${tag.id}`);
        }}
      />
    </div>
  );
}
