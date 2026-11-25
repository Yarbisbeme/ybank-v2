/**
 * YBank — Parser Determinista de Correos Bancarios v4.8
 *
 * Changelog:
 * v4.8 (2026-07-01):
 *   - FIX: esPagoTarjeta movida fuera de try (ReferenceError line 365)
 *   - FIX: "presenta una transacción" era demasiado amplio, matcheaba "realizar una transferencia"
 *   - FIX: Detectar "acabas de pagar" como transferencia (pago de tarjeta de crédito)
 *   - FIX: Extraer cuenta de "Desde tu cuenta: XXXXXXXXX"
 *   - FIX: Invertir source↔target cuando se paga A una tarjeta de crédito
 *   - FIX: APAP - detectar "Comercio:" como gasto
 *   - FIX: APAP - "presenta un Pago al Instante ... entrante" = income (no expense)
 * v4.7: APAP fixes (merged into v4.8)
 * v4.6: Escudo anti-informativos
 */

let textoCorreo = $input.item.json.correo_limpio || "";

// ESCUDO 1: Decodificador de Entidades HTML
const decodificarHTML = (str) => {
  return str
    .replace(/&#(\d+);/g, (m, dec) => String.fromCharCode(dec))
    .replace(/&eacute;/gi, 'é')
    .replace(/&aacute;/gi, 'á')
    .replace(/&iacute;/gi, 'í')
    .replace(/&oacute;/gi, 'ó')
    .replace(/&uacute;/gi, 'ú')
    .replace(/&ntilde;/gi, 'ñ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"');
};

textoCorreo = decodificarHTML(textoCorreo);

const resultado = {
  amount: null,
  transaction_type: null,
  source_currency: null,
  target_currency: null,
  source_account_type: null,
  target_account_type: null,
  card_last_4_digits: null,
  source_account_last_4: null,
  target_account_last_4: null,
  description: null,
  detected_bank: null,
  date: null,
  time: null,
  status: "completed",
  is_third_party: false,
  is_valid: false
};

// ESCUDO 2: SALIDA TEMPRANA PARA CORREOS NO TRANSACCIONALES
const esInformativo = /balance\s+al\s+corte|pago\s+m[ií]nimo|estado\s+de\s+cuenta|inicio\s+de\s+sesi[oó]n|c[oó]digo\s+de\s+(?:seguridad|verificaci[oó]n|autorizaci[oó]n)|token|OTP/i.test(textoCorreo);

if (esInformativo) {
    resultado.status = "ignored";
    resultado.description = "Correo informativo, estado de cuenta o seguridad (Ignorado)";
    return { json: resultado };
}

// ============================================================
// DETECCIONES GLOBALES (fuera de try para acceso en seccion 11)
// ============================================================
const esPagoTarjeta = /acabas\s+de\s+pagar.*?a\s+tu\s+tarjeta\s+(?:de\s+)?cr[eé]dito/i.test(textoCorreo);

try {
  const texto = textoCorreo;

  // 1. BANCO DETECTADO
  const bancos = [
    { re: /banreservas/i,                                      nombre: "Banreservas"   },
    { re: /scotiabank|scotia\s+(?:en\s+l[ií]nea|caribbean|m[oó]vil)/i,  nombre: "Scotiabank"    },
    { re: /\bapap\b/i,                                         nombre: "APAP"          },
    { re: /\bbhd\b/i,                                          nombre: "BHD"           },
    { re: /lafise|\bblrd\b/i,                                  nombre: "LAFISE"        },
    { re: /\bqik\b/i,                                          nombre: "Qik"           },
    { re: /banco\s+popular|popular\s+dominicano/i,              nombre: "Banco Popular" },
    { re: /\bjmmb\b/i,                                         nombre: "JMMB"          },
    { re: /asociaci[oó]n\s+caixa|caix/i,                       nombre: "Caixa"         },
    { re: /\bpaypal\b/i,                                       nombre: "PayPal"        },
  ];
  for (const { re, nombre } of bancos) {
    if (re.test(texto)) { resultado.detected_bank = nombre; break; }
  }

  // 2. TIPO DE TRANSACCIÓN
  // IMPORTANTE: esIngreso se verifica ANTES que esTransferencia para que
  // "pago al instante entrante" se clasifique como income, no como transfer
  const esIngreso =
    /(?:has\s+recibido|recib(?:iste|ió|imos)|le\s+ha\s+enviado)\b/i.test(texto)          ||
    /recibido\s+(?:un\s+)?(?:dep[oó]sito|pago|transferencia|monto|cr[eé]dito)/i.test(texto) ||
    /\bdep[oó]sito\b/i.test(texto)                                                       ||
    /cr[eé]dito\s+a\s+cuenta/i.test(texto)                                               ||
    /n[oó]mina/i.test(texto)                                                             ||
    /pago\s+al\s+instante[^.\n]*entrante/i.test(texto);

  const esGasto =
    /\b(?:compra|consumo|pago\s+de\s+servicio|se\s+hizo\s+una\s+transacci[oó]n|transacci[oó]n\s+de|recarga|se\s+realiz[oó]\s+la\s+siguiente\s+transacci[oó]n|ha\s+pagado|retiro\s+de\s+efectivo|atm\s+withdrawal)\b/i.test(texto) ||
    /acabas\s+de\s+pagar/i.test(texto) ||
    /comercio\s*:/i.test(texto);

  // "transferencia" excluye "pago al instante ... entrante" (que es income)
  // Tambien excluye "LBTR" + "entrante" (transferencia entrante = income)
  const esTransferencia =
    (/\b(?:ach|lbtr|transfiriendo\s+fondos)\b/i.test(texto) && !/entrante/i.test(texto)) ||
    (/\btransferencia\b/i.test(texto) && !/entrante/i.test(texto)) ||
    (/\bpago\s+al\s+instante\b/i.test(texto) && !/entrante/i.test(texto));

  if (esPagoTarjeta)        resultado.transaction_type = "transfer";
  else if (esIngreso)       resultado.transaction_type = "income";
  else if (esTransferencia) resultado.transaction_type = "transfer";
  else if (esGasto)         resultado.transaction_type = "expense";

  // 3. TERCERO
  if (resultado.transaction_type === "transfer" || resultado.transaction_type === "income") {
    resultado.is_third_party =
      /\b(?:ach|sip|lbtr|transferencia\s+a\s+tercero|transfer\s+to\s+third\s+party|pago\s+al\s+instante|le\s+ha\s+enviado)\b/i.test(texto) ||
      /destino\s*:[^.\n]*(fideicomiso|s\.a\.|s\.r\.l\.|[A-ZÁÉÍÓÚÑ]{3,}[\s,]+[A-ZÁÉÍÓÚÑ]{3,})/i.test(texto) ||
      /a\s+la\s+cuenta\s+\d{5,}\s+de\s+\w+/i.test(texto);

    if (/yarbis\s+beltre/i.test(texto)) {
      resultado.is_third_party = false;
    }
  }

  // 4. MONTO Y MONTO OBJETIVO (NETO)
  if (resultado.detected_bank === "PayPal") {
    const rePaypalIncome = /importe\s+recibido\s*(?:US\$|USD|\$)\s*([\d,]+\.?\d*).*?comisi[oó]n\s*(?:US\$|USD|\$)\s*([\d,]+\.?\d*).*?total\s*(?:US\$|USD|\$)\s*([\d,]+\.?\d*)/i;
    const mPaypal = texto.match(rePaypalIncome);
    if (mPaypal) {
      resultado.amount = parseFloat(mPaypal[1].replace(/,/g, ""));
      resultado.target_amount = parseFloat(mPaypal[3].replace(/,/g, ""));
    }
  }

  if (resultado.amount === null) {
    const reAmount = /(?:RD\$|DOP|US\$|USD|\$)\s*:?\s*([\d,]+\.?\d*)|(?:monto|importe|total)\s*:\s*([\d,]+\.?\d*)/i;
    const mA = texto.match(reAmount);
    if (mA) {
      resultado.amount = parseFloat((mA[1] || mA[2]).replace(/,/g, ""));
      resultado.target_amount = resultado.amount;
    }
  }

  // 5. MONEDA
  const regexMonedaCercana = new RegExp(`(?:US\\$|USD).{0,15}?${resultado.amount}|${resultado.amount}.{0,15}?(?:US\\$|USD)`, 'i');
  if (resultado.amount && regexMonedaCercana.test(texto)) {
    resultado.source_currency = "USD";
    resultado.target_currency = "USD";
  } else {
    resultado.source_currency = "DOP";
    resultado.target_currency = "DOP";
  }

  // 6. ÚLTIMOS 4 DÍGITOS
  const extraer4 = (fragmento) => {
    if (!fragmento) return null;
    let m = fragmento.match(/Cuenta\s+bancaria.*?(?:[a-záéíóú]\s+)?(\d{4})\b/i);
    if (m) return m[1];
    m = fragmento.match(/Desde\s+tu\s+cuenta\s*:?\s*(?:[\d\*]{0,8})?(\d{4})\b/i);
    if (m) return m[1];
    m = fragmento.match(/[A-Z0-9X*]{10,}(\d{4})\b/i) || fragmento.match(/Producto\s*:\s*.*?(\d{4})\b/i);
    if (m) return m[1];
    m = fragmento.match(/\bterminal\s+(\d{4})\b/i) || fragmento.match(/termina(?:da)?\s+en\s+(\d{4})\b/i) || fragmento.match(/\*{2,}\s*[-–]?\s*(\d{4})\b/);
    if (m) return m[1];
    m = fragmento.match(/tarjeta\b.{0,20}?(?<!de\s+)(\d{4})\b/i) || fragmento.match(/(?:cuenta|tarjeta|banco)[^:.\n]{0,60}?(?<!de\s+)(?<!el\s+)(\d{4})\b/i);
    return m ? m[1] : null;
  };

  // v4.8: Para pago a tarjeta, extraer源y destino de forma específica
  // "termina en 0802" = target (la tarjeta), "Desde tu cuenta: 30100409287" = source
  if (esPagoTarjeta) {
    const mTC = texto.match(/termina(?:da)?\s+en\s+(\d{4})\b/i);
    const mCta = texto.match(/Desde\s+tu\s+cuenta\s*:?\s*(?:[\d\*]{0,8})?(\d{4})\b/i);
    resultado.target_account_last_4 = mTC ? mTC[1] : null;
    resultado.target_account_type = "credit_card";
    resultado.source_account_last_4 = mCta ? mCta[1] : null;
    resultado.source_account_type = "savings";
    resultado.card_last_4_digits = resultado.target_account_last_4;
  } else {
    const idxOrigen  = texto.search(/\borigen\s*:/i);
    const idxDestino = texto.search(/\bdestino\s*:/i);
    let bloqueOrigen = (idxOrigen !== -1 && idxDestino !== -1) ? texto.slice(idxOrigen, idxDestino) : texto;
    let bloqueDestino = (idxOrigen !== -1 && idxDestino !== -1) ? texto.slice(idxDestino, idxDestino + 200) : null;

    const digOrigen = extraer4(bloqueOrigen);
    let digDestino = extraer4(bloqueDestino);

    if (!digDestino && bloqueDestino === null && resultado.transaction_type === "transfer") {
      const todasOcurrencias = [...texto.matchAll(/\*{2,}\s*[-–]?\s*(\d{4})\b/g)];
      if (todasOcurrencias.length >= 2) {
        digDestino = todasOcurrencias[1][1];
        if (!digOrigen) {
          resultado.source_account_last_4 = todasOcurrencias[0][1];
          resultado.card_last_4_digits    = todasOcurrencias[0][1];
        }
      }
    }

    if (digOrigen) {
      resultado.source_account_last_4 = digOrigen;
      resultado.card_last_4_digits    = digOrigen;
    }
    if (digDestino) {
      resultado.target_account_last_4 = digDestino;
    }
  }

  // 7. TIPO DE CUENTA
  const mapearTipoCuenta = (fragmento) => {
    if (!fragmento) return null;
    if (/corriente/i.test(fragmento))  return "checking";
    if (/cr[eé]dito/i.test(fragmento)) return "credit_card";
    if (/ahorro/i.test(fragmento))     return "savings";
    if (/d[eé]bito/i.test(fragmento))  return "savings";
    return null;
  };

  const mOrigen   = texto.match(/origen\s*:(?:(?!destino).)*?(ahorro|corriente|cr[eé]dito|d[eé]bito)/is);
  const mDestino  = texto.match(/destino\s*:[^.\n]*(ahorro|corriente|cr[eé]dito|d[eé]bito)/i);
  const mTipoProd = texto.match(/tipo\s+de\s+producto\s*:\s*(cuenta\s+(?:corriente|ahorro|cr[eé]dito|d[eé]bito))/i);
  // v4.8: Para pago a TC, NO usar mGenerico (matchea "tarjeta de crédito" y sobreescribe)
  const mGenerico = esPagoTarjeta ? null : texto.match(/(?:cuenta|tarjeta)\s+(?:de\s+)?(ahorro|corriente|cr[eé]dito|d[eé]bito)/i);

  resultado.source_account_type = mapearTipoCuenta(mOrigen ? mOrigen[1] : mTipoProd ? mTipoProd[1] : mGenerico ? mGenerico[1] : null);
  resultado.target_account_type = mapearTipoCuenta(mDestino ? mDestino[1] : null);

  if (!resultado.source_account_type && /tarjeta\s+cr[eé]dito/i.test(texto)) {
    resultado.source_account_type = "credit_card";
  }

  if (esPagoTarjeta) {
    resultado.source_account_type = resultado.source_account_type || "savings";
    resultado.target_account_type = "credit_card";
  }

  if (/transfiriendo\s+fondos\s+de\s+paypal/i.test(texto)) {
    resultado.target_account_last_4 = resultado.source_account_last_4 || resultado.target_account_last_4;
    resultado.target_account_type = resultado.source_account_type || "savings";
    resultado.source_account_last_4 = null;
    resultado.source_account_type = null;
    resultado.card_last_4_digits = null;
  }

  // 8. FECHA Y HORA
  const meses = {
    enero:1, ene:1, febrero:2, feb:2, marzo:3, mar:3, abril:4, abr:4, mayo:5, may:5, junio:6, jun:6,
    julio:7, jul:7, agosto:8, ago:8, septiembre:9, sep:9, octubre:10, oct:10, noviembre:11, nov:11, diciembre:12, dic:12
  };
  const bancoFormatoUSA = resultado.detected_bank === "Qik";

  const reFechaTexto  = /\b(\d{1,2})\s*(?:de\s*)?([a-záéíóú]{3,12})\s*(?:de\s*)?(\d{4})\b/i;
  const reFechaNumero = /\b(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})\b/;
  const mFT = texto.match(reFechaTexto);
  const mFN = texto.match(reFechaNumero);

  if (mFT) {
    const dia = mFT[1].padStart(2, "0");
    const mes = String(meses[mFT[2].toLowerCase()] || 1).padStart(2, "0");
    resultado.date = `${mFT[3]}-${mes}-${dia}`;
  } else if (mFN) {
    const [, p1, p2, anio] = mFN;
    let dia, mes;
    if (parseInt(p1) > 12) { dia = p1; mes = p2; } else if (bancoFormatoUSA) { dia = p2; mes = p1; } else { dia = p1; mes = p2; }
    resultado.date = `${anio}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
  }

  if (!resultado.date) {
    const hoy = new Date();
    hoy.setHours(hoy.getHours() - 4);
    resultado.date = hoy.toISOString().split('T')[0];
  }

  const matchHora = texto.match(/\b(\d{1,2}:\d{2}\s*(?:AM|PM|A\.M\.|P\.M\.|hrs)?)\b/i);
  if (matchHora) {
    resultado.time = matchHora[1].toUpperCase().replace(/\./g, '');
  }

  // 9. DESCRIPCIÓN
  const extraerDescripcion = (textoBreve) => {
    const matchBancoOrigen = textoBreve.match(/Banco\s+Origen\s*:\s*([^:\n\r]+?)(?:\s+Ordenante|\s+Monto|$)/i);
    if (matchBancoOrigen) {
      let bancoLimpio = matchBancoOrigen[1].replace(/Banco\s+M[uú]ltiple/i, '').trim();
      bancoLimpio = bancoLimpio.replace(/,\s*S\.?A\.?/i, '').trim();
      return "Transferencia desde " + bancoLimpio;
    }

    if (/Has recibido una transferencia/i.test(textoBreve)) {
      const ordenante = textoBreve.match(/Ordenante\s*:\s*([^:\n\r]+)/i);
      if (ordenante) return "Transferencia de " + ordenante[1].replace(/[\d\/]+/g, '').trim();
      return "Transferencia Recibida";
    }

    // v4.8: Pago a tarjeta de crédito
    const mPagarTC = textoBreve.match(/pagar\s+(?:DOP|RD\$)?\s*[\d,]+\.?\d*\s+a\s+tu\s+tarjeta\s+(?:de\s+)?cr[eé]dito\s+(\w+)/i);
    if (mPagarTC) return `Pago TC ${mPagarTC[1]}`;

    const patrones = [
      /([A-ZÁÉÍÓÚÑ][a-záéíóúñA-ZÁÉÍÓÚÑ\s]+)\s+le\s+ha\s+enviado/i,
      /ha\s+pagado\s+.*?\s+a\s+([^\n\r]+)/i,
      /comercio\s*:\s*([^\n\r]+)/i,
      /motivo\s+fue\s+['"]([^'"]+)['"]/i,
      /(?:concepto|descripci[oó]n|beneficiario|a\s+favor\s+de)\s*(?::|\r?\n)\s*([^\n\r]+)/i,
      /destino\s*:\s*([^,\n\r]+)/i,
      /(?:localidad|lugar)\s+([A-Z0-9\s*.\-]+?)(?:\s{2,}|\n|Fecha|Monto|Si\s+no)/i,
      /transacci[oó]n[^e\n]*en\s+([A-Z0-9\s*.\-]+?)(?:\s{2,}|\n|con\s+tu|fecha)/i,
      // "Tipo: Transferencia LBTR - Entrante" (corta en "Los" o "Fines")
      /tipo\s*:\s*(.{2,}?)\s+(?:Los|Fines|Las|Consult|En caso)/i
    ];

    for (let patron of patrones) {
      const match = textoBreve.match(patron);
      if (match && match[1]) {
        let desc = match[1].trim();
        desc = desc.replace(/(?:fecha|monto|balance|impuestos|origen|si\s+no\s+hiciste|Id\.).*$/i, '').trim();
        desc = desc.replace(/[,.\-:]+$/, '').trim();
        if (desc.length > 2 && !/^(cuenta\s+(?:de\s+)?|tarjeta\s+(?:de\s+)?)(?:ahorro|corriente|cr[eé]dito)/i.test(desc)) {
          return desc;
        }
      }
    }
    return null;
  };

  resultado.description = extraerDescripcion(texto);

  if (!resultado.description) {
    if (/transfiriendo\s+fondos\s+de\s+paypal/i.test(texto)) resultado.description = "Retiro a cuenta bancaria";
    else if (/retiro\s+de\s+efectivo|atm\s+withdrawal/i.test(texto)) resultado.description = "Retiro en Cajero Automático (ATM)";
    else if (/dep[oó]sito\s+de\s+n[oó]mina/i.test(texto)) resultado.description = "Depósito de nómina";
    else if (resultado.detected_bank) resultado.description = `Transacción ${resultado.detected_bank}`;
    else resultado.description = "Transacción bancaria";
  }

} catch (err) {
  resultado.description = `ERROR_PARSER: ${err.message}`;
  resultado.status = "error";
}

// 10. LÓGICA DE REVERSIONES
const esReversion = /reversad[oa]|rechazad[oa]|anulad[oa]/i.test(textoCorreo);

if (esReversion) {
  resultado.status = "reversed";
  if (resultado.transaction_type === "expense" || resultado.transaction_type === null) {
    resultado.transaction_type = "income";
    resultado.target_account_last_4 = resultado.source_account_last_4;
    resultado.target_account_type = resultado.source_account_type;
    resultado.source_account_last_4 = null;
    resultado.source_account_type = null;
  } else if (resultado.transaction_type === "income") {
    resultado.transaction_type = "expense";
    resultado.source_account_last_4 = resultado.target_account_last_4 || resultado.source_account_last_4;
    resultado.source_account_type = resultado.target_account_type || resultado.source_account_type;
    resultado.target_account_last_4 = null;
    resultado.target_account_type = null;
  }
  resultado.description = resultado.description ? `(REVERSADO) ${resultado.description}` : "(REVERSADO) Transacción devuelta";
}

// 11. CORRECCIÓN NATIVA DE DIRECCIÓN (Ingresos y Transferencias Entrantes)
const esEntrante = /(?:has\s+recibido|recib(?:iste|ió|imos)|entrante|dep[oó]sito|cr[eé]dito\s+a\s+cuenta)\b/i.test(textoCorreo);

// v4.8: esPagoTarjeta ya está definida fuera de try
if (!esPagoTarjeta && (resultado.transaction_type === "income" || (resultado.transaction_type === "transfer" && esEntrante)) &&
    resultado.source_account_last_4 && !resultado.target_account_last_4) {
    resultado.target_account_last_4 = resultado.source_account_last_4;
    resultado.target_account_type = resultado.source_account_type;
    resultado.source_account_last_4 = null;
    resultado.source_account_type = null;
}

if (resultado.target_account_last_4 && (resultado.transaction_type === "income" || esEntrante)) {
    resultado.card_last_4_digits = resultado.target_account_last_4;
} else if (resultado.source_account_last_4) {
    resultado.card_last_4_digits = resultado.source_account_last_4;
}

// 12. VALIDACIÓN FINAL
resultado.is_valid = (resultado.amount !== null && resultado.transaction_type !== null);

if (!resultado.is_valid) {
    resultado.status = "ignored";
    resultado.description = "Correo informativo ignorado: " + (resultado.description || "");
}

return { json: resultado };
