'use client'

import { useState, useEffect } from 'react'
import { createTag, getTags, deleteTag } from '@/actions/tags'
import { createTransaction, getTransactions, deleteTransaction } from '@/actions/transactions'
import { getAccounts } from '@/actions/accounts'
import { Account, Tag } from '@/types'

export default function TagsLabPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [newTagName, setNewTagName] = useState('')

  const addLog = (msg: string) => setLogs(p => [`> ${msg}`, ...p])

  // Carga inicial
  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const [t, a] = await Promise.all([getTags(), getAccounts()])
    setTags(t)
    setAccounts(a)
  }

  // 1. CREAR TAG
  const handleCreateTag = async () => {
    if (!newTagName) return alert("Escribe un nombre")
    addLog(`Creando Tag: #${newTagName}...`)
    
    const res = await createTag(newTagName)
    if (res.success) {
      addLog('✅ Tag creado exitosamente')
      setNewTagName('')
      loadData()
    } else {
      addLog(`❌ Error creando tag: ${res.error}`)
    }
  }

  // 2. PRUEBA DE FUEGO: Transacción con Tag
  const handleCreateTxWithTag = async (tagId: string, tagName: string) => {
    if (accounts.length === 0) return alert("Necesitas una cuenta bancaria primero")
    
    const account = accounts[0]
    addLog(`➡️ Creando Gasto en ${account.name} con el tag #${tagName}...`)

    // AQUI OCURRE LA MAGIA: Enviamos el ID del Tag
    const res = await createTransaction({
      account_id: account.id,
      type: 'expense',
      description: `Prueba con Tag #${tagName}`,
      amount: 150,
      date: new Date().toISOString(),
      tags: [tagId] // <--- ARRAY DE IDs
    })

    if (res.success) {
      addLog('✅ Transacción creada. Verificando vínculo...')
      await verifyTx(tagName)
    } else {
      addLog(`❌ Error en Transacción: ${res.error}`)
    }
  }

  // 3. VERIFICACIÓN (Leer si el tag vino de vuelta)
  const verifyTx = async (tagName: string) => {
    const { transactions } = await getTransactions({ pageSize: 1 }) // Traer la última
    const lastTx = transactions[0]

    // TypeScript a veces no sabe que 'tags' viene en el join, lo forzamos un poco para la prueba
    const txTags = (lastTx as any).tags || []
    
    addLog(`🔎 Inspeccionando última transacción: "${lastTx.description}"`)
    addLog(`🏷️ Tags encontrados: ${JSON.stringify(txTags)}`)

    const hasTag = txTags.some((t: any) => t.name === tagName)

    if (hasTag) {
      addLog('🎉 ÉXITO TOTAL: El Tag está vinculado correctamente.')
      
      // Limpieza automática
      addLog('🧹 Borrando transacción de prueba...')
      await deleteTransaction(lastTx.id)
    } else {
      addLog('⚠️ ALERTA: La transacción se creó, pero NO veo el tag vinculado.')
    }
  }

  // 4. BORRAR TAG
  const handleDeleteTag = async (id: string) => {
    if(!confirm("¿Borrar tag?")) return
    await deleteTag(id)
    addLog('🗑️ Tag eliminado')
    loadData()
  }

  return (
    <div className="p-10 max-w-4xl mx-auto space-y-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800">🏷️ Laboratorio de Tags (YB-12)</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* COLUMNA IZQUIERDA: GESTIÓN DE TAGS */}
        <div className="space-y-4 bg-white p-6 rounded shadow">
          <h2 className="font-bold border-b pb-2">1. Mis Etiquetas</h2>
          
          <div className="flex gap-2">
            <input 
              value={newTagName}
              onChange={e => setNewTagName(e.target.value)}
              placeholder="#NuevoTag"
              className="border p-2 rounded flex-1"
            />
            <button onClick={handleCreateTag} className="bg-slate-800 text-white px-4 rounded">
              Crear
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {tags.map(tag => (
              <div key={tag.id} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center gap-2 text-sm">
                <span>#{tag.name}</span>
                <button onClick={() => handleCreateTxWithTag(tag.id, tag.name)} title="Crear Gasto con este Tag">
                  💸
                </button>
                <button onClick={() => handleDeleteTag(tag.id)} className="text-red-500 hover:text-red-700 ml-1">
                  ×
                </button>
              </div>
            ))}
            {tags.length === 0 && <p className="text-gray-400 text-sm">No hay tags.</p>}
          </div>
          <p className="text-xs text-gray-500 mt-2">💡 Click en 💸 para probar crear un gasto con ese tag.</p>
        </div>

        {/* COLUMNA DERECHA: LOGS */}
        <div className="bg-slate-900 text-green-400 p-4 rounded h-[400px] overflow-auto font-mono text-xs">
          <div className="flex justify-between border-b border-green-800 pb-2 mb-2">
            <span className="font-bold">CONSOLA DE PRUEBAS</span>
            <button onClick={() => setLogs([])} className="text-gray-500 hover:text-white">Limpiar</button>
          </div>
          {logs.map((l, i) => <div key={i} className="mb-1">{l}</div>)}
        </div>
      </div>
    </div>
  )
}