'use client'
import { useState } from 'react'
import { createTransaction, getTransactions, deleteTransaction } from '@/actions/transactions'
import { getAccounts } from '@/actions/accounts'
import { getCategories } from '@/actions/categories'

export default function transactions() {
  const [logs, setLogs] = useState<string[]>([])
  
  const addLog = (msg: string) => setLogs(p => [`> ${msg}`, ...p])

  const runTest = async () => {
    addLog('--- INICIANDO PRUEBA DE TRANSACCIONES ---')
    
    // 1. Necesitamos datos reales (Cuentas y Categorías)
    const [accounts, categoriesRes] = await Promise.all([getAccounts(), getCategories()])
    
    if (accounts.length === 0) return addLog('❌ ERROR: Crea una cuenta primero en /test-crud')
     
    const account = accounts[0] // Usamos la primera cuenta que encontremos
    const category = categoriesRes[0] // Usamos una categoría cualquiera (si existe)

    addLog(`Usando Cuenta: ${account.name} (${account.currency})`)

    // 2. CREAR GASTO
    addLog('1. Creando Gasto de prueba...')
    const resCreate = await createTransaction({
      account_id: account.id,
      category_id: category?.id, // Puede ser null si no hay categorias
      type: 'expense',
      description: 'Gasto Test desde Next.js',
      date: new Date().toISOString(),
      amount: 150.00
    })

    if (!resCreate.success) return addLog(`❌ Falló crear: ${resCreate.error}`)
    addLog('✅ Gasto creado exitosamente')

    // 3. LEER (Verificar que aparece)
    addLog('2. Leyendo transacciones...')
    const { transactions } = await getTransactions({ pageSize: 5 })
    const myTx = transactions.find(t => t.description === 'Gasto Test desde Next.js')

    if (myTx) {
      addLog(`✅ Transacción encontrada: ID ${myTx.id} - Monto: ${myTx.amount}`)
      
      // 4. BORRAR (Limpieza)
      addLog('3. Borrando transacción...')
      await deleteTransaction(myTx.id)
      addLog('✅ Transacción borrada y saldo revertido (Gracias al Trigger)')
    } else {
      addLog('❌ No encontré la transacción recién creada')
    }
  }

  return (
    <div className="p-10 space-y-4">
      <h1 className="text-2xl font-bold">Laboratorio YB-11 🦁</h1>
      <button onClick={runTest} className="bg-blue-600 text-white px-4 py-2 rounded">
        Ejecutar Test Automático
      </button>
      <div className="bg-black text-green-400 p-4 rounded h-64 overflow-auto font-mono text-sm">
        {logs.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  )
}