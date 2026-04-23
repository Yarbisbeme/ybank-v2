import { GetTransactionsParams } from "@/types/index";

export type CardBrand = "visa" | "mastercard" | "amex"
export type CardType = "credit" | "debit" | "virtual"

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

export interface TransactionFilters {
  type?: 'income' | 'expense' | 'transfer' | null;
  categoryId?: string | null;
  tagId?: string | null;
  accountId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  color?: string;
}

export interface ExtendedGetTransactionsParams extends GetTransactionsParams {
  filters?: TransactionFilters;
}