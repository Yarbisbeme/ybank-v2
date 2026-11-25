// 1. Mapeo TOTAL de categorías y subcategorías (Main + Subs)
const categoriasMap = {
  "Compras": "2c57316d-7d3b-4f55-a7ac-7bd0c069b9c9",
  "Viajes": "bcd11ecd-2e92-4421-9f22-acbb44096858",
  "Cuidado Personal": "02f9f96e-0a07-44a2-80c3-4d22026ea94c",
  "Educación": "dbd79e10-d201-4acd-bf81-24db0f42a62a",
  "Salud y Bienestar": "3d4fb171-6c30-40fa-a6b7-0eb295ebc0bf",
  "Entretenimiento": "5d3affd9-813f-437b-afec-5b281c64c603",
  "Transporte": "6523a5cf-6805-4e18-bd9a-ea4f406703ce",
  "Alimentación": "96f4577b-32f5-42d8-ae31-7bb69e2604fd",
  "Vivienda": "8c2f2d49-b9d0-4792-a066-ce774fb5c624",
  "Mascotas": "9df8681a-1c50-4268-96ed-467f4422656a",
  "Ingresos": "d0b163a4-017d-4cb5-a9cc-b543eaae4630",
  "Servicios y Tech": "5e2dae4d-2307-42d2-96f7-3ee604327691",
  "Financiero": "3ef94b5e-b8a3-432d-81c1-4eade405f4b9",

  // --- SUBCATEGORÍAS ---
  "Spa / Masajes": "463accea-8b85-4855-afd8-888bec9ab25c",
  "Barbería / Salón": "4efa7b95-0fa5-47aa-b49e-10943d41773b",
  "Cosméticos / Higiene": "f7ec6ed4-b9db-429b-a84d-b20159fdaa9f",
  "Regalos": "b742cca4-6c83-4643-98d2-cb31dff71825",
  "Ropa y Calzado": "11f8d892-7841-4fab-a7a3-fdc45878b4ef",
  "Hogar / Decoración": "1c75d84c-75eb-40db-bead-3afa429e9cdc",
  "Gimnasio / Deportes": "9133bbfe-8d57-4c6d-9ccc-37730f7888b3",
  "Farmacia / Medicamentos": "42fe2a26-d37e-4823-8e73-383f22bd19f2",
  "Citas Médicas / Copagos": "93b79683-db70-44f9-a806-54aa023010b6",
  "Seguro Médico (ARS)": "146b1910-4624-4529-bcc0-d3520524e629",
  "Dentista": "288a1af1-4ee6-4513-906c-425af97acaa8",
  "Intereses de Préstamos": "fc9dcb0b-137b-4509-a3b5-252c9d4e67fc",
  "Impuestos / DGII": "79986a0a-f285-4e76-ac6e-a5833d836a87",
  "Seguros (Vehículo/Vida)": "c77d6017-dd70-402d-b8e2-c6480c5df032",
  "Comisiones Bancarias": "668ac616-4abf-4472-a7e9-98fe20d90133",
  "Cine": "2ed15109-2dbe-4fb4-bf60-b477651ed764",
  "Suscripciones": "15b0baeb-2283-4836-a154-edd93c5ff1e4",
  "Salidas / Bares": "f6ecdc86-e712-4907-b7a5-977c14da1e13",
  "Software / Apps": "88a64a41-4536-42a5-a2f6-c8d346c3ce87",
  "Plan de Celular": "6054e0ae-c771-4769-8def-13dfa2c7dc77",
  "Electrónicos": "244cbf2f-6ae1-45fc-88de-db617aea0d1f",
  "Mecánico": "6736e4b2-d3d2-43a4-a244-43c864452e76",
  "Uber / Taxi": "65ed01a5-6521-43a8-aaf9-7c97dc12495a",
  "Pasaje / Metro": "addba1d1-03b0-4780-84d4-90f8f7801dc8",
  "Combustible": "a537b6c1-b67c-4582-92ea-7a45f1a17e89",
  "Electricidad": "0c57eb1c-f1e4-4a27-a43d-d4cd134d3ef6",
  "Mantenimiento": "88290b16-95ae-4ad5-b84e-7c8ddb112000",
  "Alquiler / Hipoteca": "41e855de-4b03-45c3-b029-c19753e58bc7",
  "Internet / Cable": "5108ebb8-9998-4883-8960-ea6bcd03d603",
  "Delivery": "9bccee2a-47d0-4300-a639-8b1c7b6b8ea2",
  "Supermercado": "afad66d6-07b3-4879-b3ed-6d72f97a1623",
  "Restaurantes": "9d8fb2ce-edd0-4ac9-8f9d-6dd28a76ca0c",
  "Comida Rapida": "ec93c4ba-79c6-4206-94b4-72cbf7cb1e37",
  "Juguetes / Accesorios": "a8eb8330-91e1-4526-99cf-73253ce47edd",
  "Veterinario": "55733c60-2d5d-4995-a2a0-dd76c15c29d3",
  "Comida de Mascota": "6eaf86d8-5fe4-4679-baba-572bf4a6154f",
  "Hoteles / Airbnb": "acab82d1-dc18-4454-9ba3-cefe9ad3d7f0",
  "Vuelos": "d9b24d44-b37a-4cb9-8967-ed983ef7bfe3",
  "Transporte en Viaje": "5ea72488-493f-47d0-9d6a-9ccf897306d0",
  "Reembolsos": "30e18c04-9c77-42db-bcce-0d31fb33feb3",
  "Nómina / Salario": "0a87d8da-4350-4200-b9e7-a83ed8a99420",
  "Cursos / Talleres": "385a7d29-b063-40a1-a0d5-00e9df64c257",
  "Colegio / Universidad": "8d36bfc1-b040-4ad8-9d82-7a6d51fd18ab",
  "Libros y Útiles": "10ab542e-d73e-434b-a8ed-562c9c039f32"
};

// Motor de Reglas Locales
const reglasCategoria = {
  "Uber": "Uber / Taxi", "DiDi": "Uber / Taxi", "InDrive": "Uber / Taxi", "Metro": "Pasaje / Metro",
  "Shell": "Combustible", "TotalEnergies": "Combustible", "Sunix": "Combustible", "Combustible": "Combustible",
  "PedidosYa": "Delivery", "UberEats": "Delivery", "Super Pola": "Supermercado", "Nacional": "Supermercado",
  "Bravo": "Supermercado", "Sirena": "Supermercado", "Wendy": "Comida Rapida", "McDonald": "Comida Rapida",
  "Burger King": "Comida Rapida", "KFC": "Comida Rapida", "Netflix": "Suscripciones", "Spotify": "Suscripciones",
  "Cinepolis": "Cine", "Caribbean Cinemas": "Cine", "Farmacia": "Farmacia / Medicamentos", "Carol": "Farmacia / Medicamentos",
  "Los Hidalgos": "Farmacia / Medicamentos", "ITLA": "Colegio / Universidad", "Instituto": "Colegio / Universidad",
  "Universidad": "Colegio / Universidad", "Escuela": "Colegio / Universidad", "Colegio": "Colegio / Universidad",
  "Claro": "Plan de Celular", "Altice": "Plan de Celular", "Edesur": "Electricidad", "Edenorte": "Electricidad", "Edeeste": "Electricidad"
};

// 2. Extraer respuesta directamente del Parser Determinista (Ya es un objeto limpio)
const parsedData = $input.item.json;

let finalAmount = Math.abs(parseFloat(parsedData.amount || 0));

// ESCUDO ANTI-BASURA SEGURO:
if (finalAmount === 0 || !parsedData.transaction_type) {
    return {
        is_valid: false,
        description: "Ignorado: Correo informativo, no es transacción."
    }; 
}

let cleanDescription = (parsedData.description || 'Procesado por YBank').trim();

// Lógica de Categorización
let sugerenciaFinal = "Financiero"; // Por defecto

for (const [palabraClave, categoria] of Object.entries(reglasCategoria)) {
  if (cleanDescription.toLowerCase().includes(palabraClave.toLowerCase())) {
    sugerenciaFinal = categoria; 
    break; 
  }
}

const categoryId = categoriasMap[sugerenciaFinal] || categoriasMap["Financiero"];
let bancoDetectado = (parsedData.detected_bank || "General").replace(/Banco|Institución|Dominicano/gi, "").trim();

const detectedType = parsedData.transaction_type || 'expense';
let finalStatus = parsedData.status || 'completed';

const targetCurrency = parsedData.target_currency || 'DOP';
const date = parsedData.date || new Date().toISOString().split('T')[0];

// =================================================================
// VALIDACIÓN CRUZADA: ¿Es una cuenta propia o de terceros?
// (Se ejecuta ANTES de decidir pending_match)
// =================================================================

// 1. Tomamos lo que el parser adivinó inicialmente
let esTercero = parsedData.is_third_party || false;

// 2. Traemos tu lista de cuentas reales desde el nodo PrepararCuentas
let cuentasReales = [];
try {
    cuentasReales = $('PrepararCuentas').first().json.raw_data || [];
} catch (error) {
    // Silencioso en caso de que el nodo no devuelva datos o esté vacío
}

// 3. Verificamos si es una transferencia y si tenemos el número de destino
if (detectedType === 'transfer' && parsedData.target_account_last_4) {
    
    // .some() busca si AL MENOS UNA cuenta en tu DB tiene esos 4 dígitos
    const esMiCuenta = cuentasReales.some(cuenta => cuenta.last_4_digits === parsedData.target_account_last_4);
    
    if (esMiCuenta) {
        // Está en tu DB -> Transferencia interna
        esTercero = false; 
    } else {
        // No está en tu DB -> Transferencia a terceros (Incluso si el banco no lo dijo)
        esTercero = true;
    }
}

// =================================================================
// REGLA DE CONCILIACIÓN NATIVA (usa esTercero del cruce)
// =================================================================
// Si es transfer/income y falta source O target:
//   - Si es tercero → completed (no habrá segundo correo)
//   - Si NO es tercero → pending_match (esperando el segundo correo)
if (detectedType === 'transfer' || detectedType === 'income') {
    if (!parsedData.source_account_last_4 || !parsedData.target_account_last_4) {
        finalStatus = esTercero ? 'completed' : 'pending_match';
    }
}

// =================================================================
// Salida Limpia (Lista para Supabase)
// =================================================================
return {
  is_valid: true,
  transaction_type: detectedType,
  amount: finalAmount,
  match_key: `${finalAmount}-${targetCurrency}-${date}`,
  status: finalStatus,
  source_currency: parsedData.source_currency || 'DOP',
  target_currency: targetCurrency,
  currency_detected: targetCurrency,
  source_account_type: parsedData.source_account_type || 'savings',
  target_account_type: parsedData.target_account_type,
  description: cleanDescription,
  card_last_4_digits: parsedData.card_last_4_digits,
  date: date,
  source_account_last_4: parsedData.source_account_last_4,
  target_account_last_4: parsedData.target_account_last_4,
  category_id: categoryId,
  detected_bank: bancoDetectado,
  id: $('If1').first().json.id_correo,
  user_id: $('ContenidoCorreo').first().json.user_id,
  is_third_party: esTercero,
  target_amount: $input.first().json.target_amount
};
