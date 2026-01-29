
export type CardBrand = "visa" | "mastercard" | "amex"
export type CardType = "credit" | "debit" | "virtual"
export type AccountType = 'checking' | 'savings' | 'credit_card' | 'investment' | 'cash'; // Enum para asegurar que usamos los mismos valores que la DB

export type BankCardProps = {
  bankName: string
  bankLogo?: string
  brand: CardBrand
  type: CardType
  holder: string
  last4: string
  expiry: string
  interactive?: boolean
}

// Archivo: types/index.ts (o donde tengas tus tipos)
export interface Account {
  id: string;
  user_id: string;
  institution_id?: {
    name: string;
    logo_url: string;
  }; // Opcional
  name: string;
  
  // Aquí es donde TypeScript se está quejando. Agrégalos:
  type: "savings" | "checking" | "credit_card" | "investment" | "cash"; // O string
  currency: string;
  initial_balance: number;
  current_balance: number;

  
  // --- NUEVOS CAMPOS ---
  last_4_digits?: string | null;  // <--- Agrega esto
  expiry_date?: string | null;    // <--- Agrega esto
  network?: string | null;        // <--- Agrega esto (Visa, Mastercard)
  credit_limit?: number | null;   // <--- Agrega esto
  // ---------------------

  color?: string | null;
  created_at: string;
}

export interface IncomingTransactionJSON {
  user_email: string;
  bank_name: string;
  transaction_type: 'credit_card_payment' | 'expense' | 'income';
  source_currency: string;
  target_currency: string;
  amount_paid: number; // Monto en moneda origen (DOP)
  source_last_4?: string;
  target_last_4?: string;
  date: string;
  description?: string;
}