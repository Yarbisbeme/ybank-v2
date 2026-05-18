import { ReactNode } from "react";

// ==========================================
// 1. VALORES FIJOS Y TIPOS GLOBALES
// ==========================================
export type TransactionType = 'income' | 'expense' | 'transfer' | 'payment';
export type ModalType = 'transaction' | 'account' | 'tag' | null;
export type AccountType = 'checking' | 'savings' | 'credit_card' | 'investment' | 'cash';
export type CurrencyCode = 'DOP' | 'USD';
// 💡 Corrección: PascalCase
export type CustomTextTheme = 'light' | 'dark';
export type CustomPattern = 'solid' | 'waves' | 'geometric' | 'mesh' | 'lines' | 'dots';
export type operation = 'buy' | 'sell'

// ==========================================
// 2. ENTIDADES DE LA BASE DE DATOS
// ==========================================

export interface Institution {
  id: string;
  name: string;
  logo_url: string | null;
  // Vitales para el cálculo de tasas
  exchange_rate_adjustment: number;     // Margen Venta (+)
  exchange_rate_buy_adjustment: number; // Margen Compra (-)
  created_at: string;

  brand_color_primary: string; // 💡 Corrección: punto y coma
  brand_color_secondary?: string;
  card_pattern?: CustomPattern;
  text_theme?: CustomTextTheme;
}

export interface Account {
  id: string;
  user_id: string;
  institution_id: string | null;
  
  name: string;
  type: AccountType;
  currency: CurrencyCode;

  // 💡 Corrección: punto y coma y tipos estrictos
  color: string;
  custom_pattern: CustomPattern;
  custom_text_theme: CustomTextTheme;
  
  // Datos Financieros
  current_balance: number;
  initial_balance: number;
  
  // Datos de IA y Tarjetas
  last_4_digits: string | null; // "4288"
  expiry_date?: string | null;  // "12/28"
  credit_limit?: number | null;
  cutoff_day?: number | null;
  
  // Control de Estado (Borrado Lógico)
  is_active: boolean; 
  
  created_at: string;
  updated_at: string;
  // Relaciones
  institution: Institution; 
}

// 💡 Corrección: Categoría unificada
export interface Category {
  id: string;
  user_id: string | null; // Null = Categoría del sistema
  parent_id: string | null;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  created_at: string;
  
  // Relaciones
  subcategories?: Category[];
}

export interface CategoryTree extends Category {
  subcategories: Category[];
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
  account?: Account;           
  transfer_to_account?: Account; 
  category?: Category;
  tags?: Tag[];
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
}

// ==========================================
// 3. INPUT TYPES (Para formularios y Server Actions)
// ==========================================

export interface NavbarProps {
  user?: { name: string; email: string; avatarUrl?: string };
  accounts?: Account[];
  transactions?: Transaction[];
  tags?: Tag[];
  categories?: Category[];
}

export interface SidebarLinkProps {
  href: string;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  isLoading: boolean;
  onClick: (e: React.MouseEvent) => void;
}

export interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  setQuery: (q: string) => void;
  results: {
    accounts: Account[];
    transactions: Transaction[];
    tags: Tag[];
    categories: Category[];
  };
  expanded: { [key: string]: boolean };
  onToggleSection: (section: string) => void;
}

export interface EditCreateAccount {
  id?: string;
  name: string;
  type: AccountType;
  currency: CurrencyCode;
  color: string;
  custom_pattern: CustomPattern;
  custom_text_theme: CustomTextTheme;
  current_balance: number;
  last_4_digits: string | null; 
  institution: Institution; 
  // 👇 NUEVOS CAMPOS AÑADIDOS
  initial_balance?: number;
  expiry_date?: string | null;
  credit_limit?: number | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateAccountInput {
  name: string;
  institution_id: string;
  type: AccountType;
  currency: CurrencyCode;
  initial_balance: number;
  last_4_digits?: string;
  credit_limit?: number;
  
  color?: string;
  custom_pattern?: CustomPattern; // 💡 Seguridad estricta
  custom_text_theme?: CustomTextTheme;

  expiry_date?:string;
  cutoff_day?:string;
  is_active:boolean;
}

export interface UpdateAccountInput {
  name?: string;
  type?: AccountType;
  last_4_digits?: string;
  credit_limit?: number;
  is_active?: boolean;
  
  color?: string;
  custom_pattern?: CustomPattern; // 💡 Seguridad estricta
  custom_text_theme?: CustomTextTheme;
}

export interface GetTransactionsParams {
  page?: number;     
  pageSize?: number; 
  accountId?: string; 
}

export interface CreateTransactionInput {
  account_id: string;
  category_id?: string; 
  
  transfer_to_account_id?: string;
  
  type: TransactionType;
  description: string;
  date: string; 
  amount: number; 
  
  target_amount?: number;
  exchange_rate?: number;

  tags?: string[]; 
}

export interface TransferInput {
  sourceAccountId: string;
  targetAccountId: string;
  amount: number;
  date: Date;
  description: string;
  manualExchangeRate?: number; 
}

export interface YBankStore {
  currency: CurrencyCode;
  preferredRate: SmartRateResult | null;
  setCurrency: (currency: 'DOP' | 'USD') => void;
  updateRateContext: (institutionId: string) => Promise<void>;
  preferredAccountId: string | null;
  isCalculatingRate: boolean;
}

// ==========================================
// 4. UI TYPES (Componentes)
// ==========================================

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

export interface SmartRateResult {
  rate: number;           
  baseRate: number;       
  margin: number;         
  operation: operation; 
  institutionName: string; 
}

export interface ModalState {
  isOpen: boolean;
  type: ModalType;
  payload: { 
    accountId?: string | null; 
    transactionId?: string | null; 
    categoryId?: string | null; 
    initialData?: any; 
    forceEditMode?: boolean; 
  } | null;
  openModal: (type: ModalType, payload?: ModalState['payload']) => void;
  closeModal: () => void;
}

interface FilterState {
  type: 'income' | 'expense' | 'transfer' | null;
  categoryId: string | null;
  tagId: string | null;
  accountId: string | null;
  startDate: string | null;
  endDate: string | null;
  search: string | null; // 💡 Añadir este campo si no existe
  setFilter: (key: string, value: any) => void;
  clearFilters: () => void;
}

export interface ProfileUpdateInput {
  full_name?: string;
  avatar_url?: string | null;
  currency_preference?: string;
  primary_account_id?: string;
  theme_preference?: string;
  monthly_savings_goal?: string | number;
  onboarding_completed?: boolean;
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  tax_amount: number;
  tax_type: 'ITBIS' | 'PROPINA' | 'NONE' | string;
  discount_amount: number;
  total_price: number;
  category_id: string;
  created_at: string;
}