'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@teispace/next-themes';
import { Download, Menu, Moon, Search, Sun } from 'lucide-react';
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
import { PageTransition } from './PageTransition';

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

const emptySubscribe = () => () => { };

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

  const firstName = user.name.trim().split(/\s+/)[0] || user.name;
  const userInitials =
    user.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || 'YB';

  const todayLabel = new Date().toLocaleDateString('es-DO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
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
            <main className="flex-1 overflow-y-auto overflow-x-hidden px-5 md:px-6 lg:px-10 pt-4 md:pt-5 lg:pt-6 pb-24 lg:pb-12 flex flex-col">
              <header className="y2-vt-header mx-auto mb-3 md:mb-7 flex w-full max-w-6xl flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <IconButton
                    variant="surface"
                    size="md"
                    aria-label="Abrir menú"
                    onClick={() => setIsDrawerOpen(true)}
                    className="hidden md:inline-flex lg:hidden"
                  >
                    <Menu size={20} strokeWidth={2} />
                  </IconButton>

                  <Link
                    href="/settings"
                    aria-label="Mi perfil y ajustes"
                    className="lg:hidden flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-ink text-canvas label focus-visible:outline-2 focus-visible:outline-action focus-visible:outline-offset-2"
                  >
                    {userInitials}
                  </Link>

                    <div className="flex flex-col min-w-0">
                      <h1 className="title lg:title-l text-ink truncate">
                        Hola, {firstName}
                      </h1>
                      <p className="small text-ink-2 capitalize truncate">
                        {todayLabel}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsSearchOpen(true)}
                      className="hidden sm:flex h-10 w-64 lg:w-72 items-center gap-2 rounded-control border border-line bg-surface px-3 small text-ink-2 hover:border-line-strong hover:text-ink transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-action focus-visible:outline-offset-2"
                    >
                      <Search size={16} strokeWidth={2} className="shrink-0" />
                      <span className="truncate">Buscar movimientos, tarjetas…</span>
                      <kbd className="ml-auto rounded-chip border border-line bg-canvas px-1.5 py-0.5 nav font-mono text-ink-2">
                        ⌘K
                      </kbd>
                    </button>

                      <IconButton
                        variant="surface"
                        size="md"
                        aria-label="Buscar"
                        onClick={() => setIsSearchOpen(true)}
                        className="sm:hidden"
                      >
                <Search size={18} strokeWidth={2} />
              </IconButton>

              {isHydrated ? (
                      <IconButton
                        variant="surface"
                        size="md"
                        aria-label={
                          theme === 'dark'
                            ? 'Cambiar a tema claro'
                            : 'Cambiar a tema oscuro'
                        }
                        onClick={handleToggleTheme}
                      >
                        {theme === 'dark' ? (
                          <Sun size={18} strokeWidth={2} />
                        ) : (
                          <Moon size={18} strokeWidth={2} />
                        )}
                      </IconButton>
                    ) : null}

                    <Link
                      href="/settings"
                      className="hidden lg:flex h-10 items-center gap-2.5 rounded-control px-1.5 hover:bg-surface-sunk transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-action focus-visible:outline-offset-2"
                    >
                      {user.avatarUrl ? (
                        <Image
                          src={user.avatarUrl}
                          alt={user.name}
                          width={40}
                          height={40}
                          unoptimized
                          className="h-10 w-10 shrink-0 rounded-control object-cover border border-line"
                        />
                      ) : (
                  <span
                    aria-hidden="true"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-ink text-canvas title-s"
                  >
                    {userInitials}
                  </span>
                      )}
              <div className="flex flex-col text-left min-w-0 max-w-36">
                <span className="small font-semibold text-ink truncate">
                  {user.name}
                </span>
                {user.email ? (
                  <span className="nav text-ink-2 truncate">{user.email}</span>
                ) : null}
              </div>
            </Link>
          </div>
        </header>

          {/* The footer moves with the page height, so it transitions with it. */}
          <PageTransition>
          <div className="mx-auto w-full max-w-6xl flex-1">{children}</div>

          <footer className="mx-auto mt-10 hidden md:flex md:flex-row w-full max-w-6xl items-center justify-between gap-3 border-t border-line pt-5 small text-ink-2">
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
          </PageTransition>
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
