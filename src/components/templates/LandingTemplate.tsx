import Link from 'next/link';
import { ArrowRight, CreditCard, Globe, ShieldCheck } from 'lucide-react';
import { YMark } from '@/components/atoms';
import { HealthMeter, MoveRow, YCard, type MoveRowData } from '@/components/organisms';

const SAMPLE_MOVES: MoveRowData[] = [
  {
    id: 'demo-1',
    type: 'expense',
    description: 'Supermercado Bravo',
    date: '2026-11-24',
    amount: 3420,
    account_id: 'demo-acc',
    category: { name: 'Alimentación', icon: 'mdi-cart' },
    account: { name: 'Ahorro principal', currency: 'DOP' },
    items: [
      { id: 'd1', name: 'Frutas y vegetales', unit_price: 1280, category: { name: 'Mercado' } },
      { id: 'd2', name: 'Despensa', unit_price: 2140, category: { name: 'Hogar' } },
    ],
  },
  {
    id: 'demo-2',
    type: 'income',
    description: 'Nómina quincenal',
    date: '2026-11-22',
    amount: 42500,
    account_id: 'demo-acc',
    category: { name: 'Salario', icon: 'mdi-cash' },
    account: { name: 'Ahorro principal', currency: 'DOP' },
  },
  {
    id: 'demo-3',
    type: 'expense',
    description: 'Café Santo Domingo',
    date: '2026-11-21',
    amount: 385,
    account_id: 'demo-acc',
    category: { name: 'Cafetería', icon: 'mdi-food' },
    account: { name: 'Ahorro principal', currency: 'DOP' },
  },
];

/** Honest YBank 2.0 public landing page without PII or unverified product claims (U4). */
export function LandingTemplate() {
  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <header className="sticky top-0 z-sticky border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            aria-label="YBank Inicio"
            className="inline-flex items-center rounded-control focus-visible:outline-2 focus-visible:outline-action focus-visible:outline-offset-2"
          >
            <YMark lockup size={26} />
          </Link>

          <nav aria-label="Acceso" className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/sign-in"
              className="inline-flex h-9 items-center justify-center rounded-control border border-line-strong bg-surface px-3.5 small text-ink hover:bg-surface-sunk transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-action focus-visible:outline-offset-2"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex h-9 items-center justify-center rounded-control bg-action px-3.5 small text-action-ink hover:bg-action-press transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-action focus-visible:outline-offset-2"
            >
              Crear cuenta
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="max-w-2xl flex flex-col gap-5">
            <h1 className="display text-ink">
              Tus cuentas y gastos, claros y sin ruido.
            </h1>
            <p className="body text-ink-2 max-w-xl">
              Lleva tus cuentas de ahorro, tarjetas y efectivo en DOP y USD en un solo
              lugar. Sabe exactamente cuánto tienes disponible hoy y en qué se va tu mes.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/sign-up"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-control bg-action px-5 body-strong text-action-ink hover:bg-action-press transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-action focus-visible:outline-offset-2"
              >
                <span>Crear cuenta gratis</span>
                <ArrowRight size={16} strokeWidth={2} />
              </Link>
              <Link
                href="/sign-in"
                className="inline-flex h-12 items-center justify-center rounded-control px-4 body-strong text-ink-2 hover:bg-surface-sunk hover:text-ink transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-action focus-visible:outline-offset-2"
              >
                Ya tengo cuenta
              </Link>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-6 rounded-panel border border-line bg-surface p-5 sm:p-6">
            <div className="lg:col-span-5 flex flex-col gap-4">
              <YCard
                name="Ahorro principal"
                balance={48250}
                currency="DOP"
                accountType="savings"
                bankName="Banco Ejemplo"
                last4="4821"
                color="ultramar"
                base="materia"
                shape="hojas"
              />
              <HealthMeter
                totalLimit={120000}
                totalUsed={26400}
                currency="DOP"
                nearestCutoffDays={11}
              />
            </div>

            <div className="lg:col-span-7 flex flex-col border-t lg:border-t-0 lg:border-l border-line pt-5 lg:pt-0 lg:pl-6">
              <div className="flex items-baseline justify-between gap-2 pb-3 border-b border-line">
                <h2 className="title-s text-ink">Movimientos recientes</h2>
                <span className="small text-ink-2">Ejemplo en DOP</span>
              </div>
              <div className="flex-1">
                {SAMPLE_MOVES.map((move) => (
                  <MoveRow key={move.id} transaction={move} activeAccountId="demo-acc" />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-line pt-10">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-ink">
                <Globe size={18} strokeWidth={2} className="text-action shrink-0" />
                <h2 className="title-s">DOP y USD en un solo lugar</h2>
              </div>
              <p className="small text-ink-2">
                Consulta tus balances en pesos y dólares con la tasa configurada para cada
                banco.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-ink">
                <CreditCard size={18} strokeWidth={2} className="text-action shrink-0" />
                <h2 className="title-s">Tus tarjetas, a tu manera</h2>
              </div>
              <p className="small text-ink-2">
                Distingue cuentas de ahorro, corriente, efectivo y crédito de un vistazo,
                sin confusiones.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-ink">
                <ShieldCheck size={18} strokeWidth={2} className="text-action shrink-0" />
                <h2 className="title-s">Uso de crédito sin sorpresas</h2>
              </div>
              <p className="small text-ink-2">
                Vigila tu porcentaje de utilización y tus días al corte antes de pasarte del
                límite recomendado.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 py-6 small text-ink-2">
          <p>© 2026 YBank · App personal de finanzas en DOP y USD</p>
          <div className="flex items-center gap-5">
            <Link href="/sign-in" className="hover:text-ink transition-colors">
              Iniciar sesión
            </Link>
            <Link href="/sign-up" className="hover:text-ink transition-colors">
              Crear cuenta
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
