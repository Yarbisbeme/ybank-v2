'use client'

import { useState, useEffect } from 'react'
import { getAccounts, createAccount, updateAccount, archiveAccount, getInstitutions } from '@/actions/accounts'
import { Account } from '@/types'

export default function TestCrudPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [banks, setBanks] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  // Cargar datos al iniciar
  useEffect(() => {
    loadData()
  }, [])

  const addLog = (msg: string) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev])

  const loadData = async () => {
    setLoading(true)
    const [misCuentas, misBancos] = await Promise.all([getAccounts(), getInstitutions()])
    setAccounts(misCuentas)
    setBanks(misBancos)
    setLoading(false)
    addLog('Datos recargados (Get)')
  }

  // 1. CREATE
  const handleCreate = async () => {
    if (banks.length === 0) return alert("No hay bancos cargados")
    
    const randomBank = banks[0] // Agarramos el primer banco que encuentre
    const randomNum = Math.floor(Math.random() * 9000) + 1000

    addLog(`Intentando crear cuenta en ${randomBank.name}...`)
    
    const res = await createAccount({
      name: `Cuenta Test ${randomNum}`,
      institution_id: randomBank.id,
      type: 'savings',
      currency: 'DOP',
      initial_balance: 5000,
      last_4_digits: String(randomNum)
    })

    if (res.success) {
      addLog('✅ Cuenta Creada')
      loadData()
    } else {
      addLog(`❌ Error: ${res.error}`)
    }
  }

  // 2. UPDATE
  const handleUpdate = async (id: string, currentName: string) => {
    const newName = `${currentName} (Editada)`
    addLog(`Actualizando nombre a: ${newName}`)
    
    const res = await updateAccount(id, { name: newName })
    
    if (res.success) {
      addLog('✅ Cuenta Actualizada')
      loadData()
    } else {
      addLog(`❌ Error: ${res.error}`)
    }
  }

  // 3. ARCHIVE (DELETE)
  const handleArchive = async (id: string) => {
    if (!confirm('¿Archivar esta cuenta?')) return
    addLog(`Archivando cuenta ID: ${id}...`)

    const res = await archiveAccount(id)

    if (res.success) {
      addLog('✅ Cuenta Archivada (Borrado Lógico)')
      loadData()
    } else {
      addLog(`❌ Error: ${res.error}`)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">🧪 Laboratorio CRUD (YB-6)</h1>
      
      <div className="flex gap-4">
        <button 
          onClick={loadData} 
          disabled={loading}
          className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600"
        >
          🔄 Recargar Lista
        </button>
        <button 
          onClick={handleCreate} 
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500"
        >
          ➕ Crear Cuenta Random
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* LISTA DE CUENTAS */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Mis Cuentas Activas ({accounts.length})</h2>
          {accounts.map(acc => (
            <div key={acc.id} className="p-4 border rounded shadow-sm bg-white dark:bg-slate-800 flex justify-between items-center">
              <div>
                <p className="font-bold">{acc.name}</p>
                <p className="text-sm text-gray-500">{acc.institution?.name} • {acc.currency}</p>
                <p className="text-xs font-mono">{acc.last_4_digits ? `**** ${acc.last_4_digits}` : 'No Card'}</p>
              </div>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => handleUpdate(acc.id, acc.name)}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  ✏️ Editar Nombre
                </button>
                <button 
                  onClick={() => handleArchive(acc.id)}
                  className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  🗑️ Archivar
                </button>
              </div>
            </div>
          ))}
          {accounts.length === 0 && <p className="text-gray-400">No hay cuentas visibles.</p>}
        </div>

        {/* LOGS DE RESULTADOS */}
        <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-[400px] overflow-auto">
          <h3 className="font-bold border-b border-green-800 pb-2 mb-2">Terminal de Logs</h3>
          {logs.map((log, i) => <div key={i}>{log}</div>)}
        </div>
      </div>
    </div>
  )
}