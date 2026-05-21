export const DGII_TAX_RATE = 0.0015;
export const DGII_CATEGORY_ID = '79986a0a-f285-4e76-ac6e-a5833d836a87';

export const ACCOUNT_TYPE_CONFIG = {
  credit_card: {
    requiresInstitution: true,
    showCardDetails: true, // Expiry, Last 4
    showCreditLimits: true, // Límite, Fecha de Corte, Fecha de Pago
    balanceLabel: 'Deuda Actual',
    isPassive: true // Para saber que el balance debe ser negativo en BD
  },
  savings: {
    requiresInstitution: true,
    showCardDetails: true, // Opcional por si tiene tarjeta de débito
    showCreditLimits: false,
    balanceLabel: 'Balance Disponible',
    isPassive: false
  },
  cash: {
    requiresInstitution: false,
    showCardDetails: false,
    showCreditLimits: false,
    balanceLabel: 'Efectivo en Mano',
    isPassive: false
  }
}