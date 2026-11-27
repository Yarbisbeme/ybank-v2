import Link from 'next/link';
import { YMark } from '@/components/atoms';
import { YCard } from '@/components/organisms';

export interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  asideHeadline?: string;
  asideDescription?: string;
}

/** Two-column YBank 2.0 authentication shell with flat surface and card showcase. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  asideHeadline = 'Control claro desde el primer día',
  asideDescription = 'Organiza tus cuentas, tarjetas y movimientos en DOP y USD desde un solo lugar.',
}: AuthShellProps) {
  return (
    <section className="min-h-svh w-full grid grid-cols-1 lg:grid-cols-2 bg-canvas text-ink">
      <div className="flex flex-col justify-between bg-surface lg:border-r border-line px-6 py-8 sm:px-10">
        <div className="shrink-0">
          <Link
            href="/"
            aria-label="Volver al inicio"
            className="inline-flex items-center rounded-control focus-visible:outline-2 focus-visible:outline-action focus-visible:outline-offset-2"
          >
            <YMark lockup size={26} />
          </Link>
        </div>

        <div className="w-full max-w-md mx-auto py-10 flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <h1 className="title-l text-ink">{title}</h1>
            <p className="body text-ink-2">{subtitle}</p>
          </div>

          {children}
        </div>

        <div className="border-t border-line pt-5 small text-ink-2">
          {footer}
        </div>
      </div>

      <div className="hidden lg:flex flex-col items-center justify-center bg-surface-sunk p-12 gap-8">
        <YCard
          name="Cuenta principal"
          balance={48250}
          currency="DOP"
          accountType="savings"
          bankName="YBank Personal"
          last4="4821"
          color="ultramar"
          base="materia"
          shape="hojas"
          className="max-w-sm"
        />

        <div className="text-center max-w-sm flex flex-col gap-2">
          <h2 className="title text-ink">{asideHeadline}</h2>
          <p className="body text-ink-2">{asideDescription}</p>
        </div>
      </div>
    </section>
  );
}
