
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