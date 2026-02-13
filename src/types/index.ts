import { ReactNode } from "react";

// Valores Fijos
export type TransactionType = 'income' | 'expense' | 'transfer' | 'payment';
export type AccountType = 'checking' | 'savings' | 'credit_card' | 'investment' | 'loan' | 'cash';
export type CurrencyCode = 'DOP' | 'USD' | 'EUR';

// Entidades de la base de datos
export interface Institution {
  id: string;
  name: string;
  logo_url: string | null;
  // Vitales para el cálculo de tasas
  exchange_rate_adjustment: number;     // Margen Venta (+)
  exchange_rate_buy_adjustment: number; // Margen Compra (-)
  created_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  institution_id: string | null;
  
  name: string;
  type: AccountType;
  currency: CurrencyCode;
  
  // Datos Financieros
  current_balance: number;
  initial_balance: number;
  
  // Datos de IA y Tarjetas
  last_4_digits: string | null; // "4288"
  expiry_date?: string | null;  // "12/28"
  credit_limit?: number | null;
  
  // Control de Estado (Borrado Lógico)
  is_active: boolean; 
  
  created_at: string;
  updated_at: string;

  // Relaciones (Opcionales, se llenan al hacer joins)
  institution?: Institution; 
}

export interface Category {
  id: string;
  user_id: string | null; // Null = Categoría del sistema
  parent_id: string | null;
  name: string;
  type: 'income' | 'expense';
  icon: string | null;
  color: string | null;
  
  // Relaciones
  subcategories?: Category[];
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string | null;
  
  // Transferencias
  transfer_to_account_id: string | null;
  
  type: TransactionType;
  description: string;
  date: string; // ISO String
  status: 'pending' | 'posted' | 'reconciled';
  
  // Multi-moneda Core
  amount: number;          // Lo que sale (siempre positivo)
  target_amount?: number;  // Lo que entra (en transferencias multi-moneda)
  exchange_rate?: number;  // Tasa de cambio aplicada
  
  created_at: string;

  // Relaciones (Joins)
  account?: Account;           // Datos de la cuenta origen
  transfer_to_account?: Account; // Datos de la cuenta destino
  category?: Category;
  tags?: Tag[];
}
export interface GetTransactionsParams {
  page?: number;     // Página 1, 2, 3...
  pageSize?: number; // Cuántas por página (ej: 20)
  accountId?: string; // Filtro opcional por cuenta
}

export interface CreateTransactionInput {
  account_id: string;
  category_id?: string; // Opcional para transferencias
  
  // Transferencias
  transfer_to_account_id?: string;
  
  type: TransactionType;
  description: string;
  date: string; // ISO String o 'YYYY-MM-DD'
  amount: number; // Siempre positivo
  
  // Multi-moneda (Solo para transferencias complejas)
  target_amount?: number;
  exchange_rate?: number;

  tags?: string[]; // Array de nombres de tags
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
}

// ==========================================
// 3. INPUT TYPES (Para formularios y Server Actions)
// ==========================================

// Lo que necesitamos para crear una transferencia manual
export interface TransferInput {
  sourceAccountId: string;
  targetAccountId: string;
  amount: number;
  date: Date;
  description: string;
  // Opcional: Si el usuario quiere forzar una tasa manual
  manualExchangeRate?: number; 
}


export type Button = {
  logo: string;
  alt: string;
  cls?: string;
}

export type NotificationProps = {
    message: string;
    description?: string;
    icon?: ReactNode;
    type?: "success" | "error" | "info" | "warning" | "default";
    duration?: number;
}
