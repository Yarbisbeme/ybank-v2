'use client'

import { useState, useEffect } from 'react'
import { createTransaction, getTransactions, deleteTransaction } from '@/actions/transactions'
import { getAccounts } from '@/actions/accounts'
import { getCategories } from '@/actions/categories'
import { Account, Category } from '@/types'

export default function TransactionLabPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)

  // Carga inicial de datos
  // Dentro de useEffect
useEffect(() => {
  async function init() {
    setLoading(true);
    addLog("Iniciando carga de datos desde Supabase...");
    
    try {
      const [accs, cats] = await Promise.all([getAccounts(), getCategories()]);
      
      setAccounts(accs);
      setCategories(cats);
      
      // Log detallado para depuración
      const hasDOP = accs.some(a => a.currency === 'DOP');
      const hasUSD = accs.some(a => a.currency === 'USD');
      
      addLog(`📊 Estado: ${accs.length} cuentas. DOP: ${hasDOP ? '✅' : '❌'} | USD: ${hasUSD ? '✅' : '❌'}`);
    } catch (error) {
      addLog(`❌ Error fatal en carga: ${error}`);
    } finally {
      setLoading(false);
    }
  }
  init();
}, []);

  const addLog = (msg: string) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev])

  // ==========================================
  // UTILIDADES
  // ==========================================
  const getAccountByCurrency = (currency: 'DOP' | 'USD') => accounts.find(a => a.currency === currency)

  // ==========================================
  // CASO 1: GASTO EN PESOS (Simple)
  // ==========================================
  const testExpenseDOP = async () => {
    const acc = getAccountByCurrency('DOP')
    if (!acc) return addLog('❌ Error: No tienes cuenta en DOP')

    addLog(`➡️ Test 1: Creando Gasto de RD$ 500 en ${acc.name}...`)
    
    const res = await createTransaction({
      account_id: acc.id,
      category_id: categories[0]?.id, // Usamos la primera categoría
      type: 'expense',
      description: 'Gasto de Prueba DOP (Cena)',
      date: new Date().toISOString(),
      amount: 500
    })

    if (res.success) addLog('✅ Éxito: Gasto creado. Revisa si el saldo bajó 500.')
    else addLog(`❌ Falló: ${res.error}`)
  }

  // ==========================================
  // CASO 2: INGRESO EN DÓLARES (Freelance)
  // ==========================================
  const testIncomeUSD = async () => {
    const acc = getAccountByCurrency('USD')
    if (!acc) return addLog('❌ Error: No tienes cuenta en USD')

    addLog(`➡️ Test 2: Recibiendo Pago de US$ 100 en ${acc.name}...`)

    const res = await createTransaction({
      account_id: acc.id,
      category_id: categories[0]?.id,
      type: 'income',
      description: 'Ingreso Projecto Freelance',
      date: new Date().toISOString(),
      amount: 100
    })

    if (res.success) addLog('✅ Éxito: Ingreso creado. Revisa si el saldo subió 100 USD.')
    else addLog(`❌ Falló: ${res.error}`)
  }

  // ==========================================
  // CASO 3: TRANSFERENCIA SIMPLE (DOP -> DOP)
  // ==========================================
  const testTransferSimple = async () => {
    // Buscamos 2 cuentas en pesos
    const source = accounts.find(a => a.currency === 'DOP')
    const target = accounts.find(a => a.currency === 'DOP' && a.id !== source?.id)

    if (!source || !target) return addLog('❌ Error: Necesitas 2 cuentas en DOP para este test.')

    addLog(`➡️ Test 3: Moviendo RD$ 1,000 de ${source.name} a ${target.name}...`)

    const res = await createTransaction({
      account_id: source.id,
      transfer_to_account_id: target.id,
      type: 'transfer',
      description: 'Transferencia Ahorro Local',
      date: new Date().toISOString(),
      amount: 1000
    })

    if (res.success) addLog('✅ Éxito: Transferencia simple completada.')
    else addLog(`❌ Falló: ${res.error}`)
  }

  // ==========================================
  // CASO 4: TRANSFERENCIA MULTI-MONEDA (DOP -> USD) 🔥
  // ==========================================
  const testTransferMulti = async () => {
    const source = getAccountByCurrency('DOP')
    const target = getAccountByCurrency('USD')

    if (!source || !target) return addLog('❌ Error: Faltan cuentas DOP/USD')

    // Simulamos que el Frontend calculó la tasa
    const amountDOP = 2000
    const rate = 60.50
    const targetUSD = parseFloat((amountDOP / rate).toFixed(2)) // 33.06 USD

    addLog(`➡️ Test 4: Pagando Tarjeta. Salen RD$ ${amountDOP} -> Entran US$ ${targetUSD}...`)

    const res = await createTransaction({
      account_id: source.id,
      transfer_to_account_id: target.id,
      type: 'transfer',
      description: 'Pago Tarjeta USD desde Pesos',
      date: new Date().toISOString(),
      amount: amountDOP,      // Salen Pesos
      target_amount: targetUSD, // Entran Dólares (Calculado)
      exchange_rate: rate       // Tasa Informativa
    })

    if (res.success) addLog('✅ Éxito: Transferencia Multi-moneda creada.')
    else addLog(`❌ Falló: ${res.error}`)
  }

  // ==========================================
  // CASO 5: LISTAR Y BORRAR (Rollback)
  // ==========================================
  const testDeleteLast = async () => {
    addLog('➡️ Test 5: Buscando última transacción para borrarla...')
    
    // 1. Buscamos la última
    const { transactions } = await getTransactions({ pageSize: 1 })
    
    if (transactions.length === 0) return addLog('⚠️ No hay transacciones para borrar.')

    const lastTx = transactions[0]
    addLog(`🗑️ Borrando transacción ID: ${lastTx.id} (${lastTx.description})...`)

    // 2. Borramos
    const res = await deleteTransaction(lastTx.id)

    if (res.success) addLog('✅ Éxito: Transacción eliminada. El dinero debió volver a la cuenta.')
    else addLog(`❌ Falló: ${res.error}`)
  }

  // ==========================================
  // CASO 6: AUTO-CONVERSIÓN (PRUEBA FINAL) 🤖
  // ==========================================
  const testAutoConversion = async () => {
    // 1. Buscar cuentas
    const accUSD = accounts.find(a => a.currency === 'USD')
    const accDOP = accounts.find(a => a.currency === 'DOP')

    if (!accUSD || !accDOP) return addLog('❌ Faltan cuentas USD/DOP')

    const montoUSD = 100;

    addLog(`➡️ Test Auto-Cambio: Moviendo $${montoUSD} USD desde ${accUSD.name} a ${accDOP.name}...`)
    addLog(`ℹ️ El sistema debería detectar monedas distintas y aplicar la tasa de COMPRA automáticamente.`)

    const res = await createTransaction({
      account_id: accUSD.id,
      transfer_to_account_id: accDOP.id,
      type: 'transfer',
      description: 'Prueba Cambio Automático',
      date: new Date().toISOString(),
      amount: montoUSD, 
      // NO enviamos exchange_rate ni target_amount. 
      // ¡El Backend debe calcularlo solo!
    })

    if (res.success) {
      addLog('✅ Transacción creada. Verifica los montos en la BD.')
      
      // Verificación rápida
      const { transactions } = await getTransactions({ pageSize: 1 })
      const last = transactions[0]
      addLog(`💰 Resultado: Salieron $${last.amount} USD -> Entraron RD$ ${last.target_amount} (Tasa: ${last.exchange_rate})`)
    } else {
      addLog(`❌ Falló: ${res.error}`)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6 bg-slate-50 min-h-screen">
      <h1 className="text-3xl font-bold text-slate-800">🧪 Laboratorio de Transacciones (YB-11)</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* PANEL DE CONTROL */}
        <div className="space-y-3">
          <h2 className="font-semibold text-slate-600">Escenarios de Prueba</h2>
          
          <button onClick={testExpenseDOP} className="w-full p-3 bg-red-100 text-red-700 rounded hover:bg-red-200 text-left font-mono">
            1. Crear Gasto (DOP) 💸
          </button>

          <button onClick={testIncomeUSD} className="w-full p-3 bg-green-100 text-green-700 rounded hover:bg-green-200 text-left font-mono">
            2. Crear Ingreso (USD) 💵
          </button>

          <button onClick={testTransferSimple} className="w-full p-3 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-left font-mono">
            3. Transferencia (DOP - DOP) ↔️
          </button>

          <button onClick={testTransferMulti} className="w-full p-3 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 text-left font-mono">
            4. Transferencia (DOP - USD) 🌎
          </button>

          <div className="border-t pt-2 mt-4">
            <button onClick={testDeleteLast} className="w-full p-3 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 text-left font-mono">
              5. Borrar Última (Test Rollback) 🔙
            </button>
          </div>

          <button onClick={testAutoConversion} className="w-full p-3 bg-purple-600 text-white rounded hover:bg-purple-700 text-left font-mono font-bold shadow-lg">
            6. AUTO-CONVERSIÓN (USD ➡️ DOP) 🤖
          </button>
        </div>

        {/* CONSOLA DE LOGS */}
        <div className="bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-xs h-[400px] overflow-auto shadow-inner">
          <div className="flex justify-between border-b border-green-800 pb-2 mb-2">
            <span className="font-bold">TERMINAL DE SALIDA</span>
            <button onClick={() => setLogs([])} className="text-gray-500 hover:text-white">Limpiar</button>
          </div>
          {logs.length === 0 && <span className="text-gray-600">Esperando comandos...</span>}
          {logs.map((log, i) => (
            <div key={i} className="mb-1 border-b border-green-900/30 pb-1">{log}</div>
          ))}
        </div>
      </div>
    </div>
  )
}