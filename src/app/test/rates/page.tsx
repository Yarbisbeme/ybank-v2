'use client'

import { useState, useEffect } from 'react'
import { getInstitutions } from "@/actions/accounts" // Reusamos esta action para listar bancos
import { getSmartRate } from "@/services/currency"

export default function TestRatesPage() {
  const [banks, setBanks] = useState<any[]>([])
  const [results, setResults] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      const data = await getInstitutions()
      setBanks(data)
    }
    load()
  }, [])

  const testBank = async (bankId: string) => {
    // Probamos ambos escenarios: Compra y Venta
    const sell = await getSmartRate(bankId, 'sell') // Banco Vende
    const buy = await getSmartRate(bankId, 'buy')   // Banco Compra
    
    setResults([sell, buy])
  }

  return (
    <div className="p-10 font-mono space-y-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold">💰 Auditoría de Tasas (YB-13)</h1>
      <p className="text-gray-600">Tasa Base del Mercado: <strong>RD$ 60.00</strong></p>

      {/* SELECCIONAR BANCO */}
      <div className="flex gap-2 flex-wrap">
        {banks.map(b => (
          <button 
            key={b.id} 
            onClick={() => testBank(b.id)}
            className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700"
          >
            Testear {b.name}
          </button>
        ))}
      </div>

      {/* RESULTADOS */}
      {results.length > 0 && (
        <div className="bg-slate-900 text-green-400 p-6 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* VENTA (El usuario paga) */}
          <div className="border-r border-gray-700 pr-4">
            <h3 className="text-red-400 font-bold text-xl">VENTA (Pagar Tarjeta)</h3>
            <p className="text-sm opacity-80 mb-4">El banco te vende dólares (Caro)</p>
            
            <div className="text-5xl font-bold mb-2">{results[0]?.rate}</div>
            
            <div className="text-xs space-y-1 opacity-60">
              <p>Banco: {results[0]?.institutionName}</p>
              <p>Base: {results[0]?.baseRate}</p>
              <p>Margen Banco: +{results[0]?.margin}</p>
            </div>
          </div>

          {/* COMPRA (El usuario recibe) */}
          <div>
            <h3 className="text-blue-400 font-bold text-xl">COMPRA (Recibir Remesa)</h3>
            <p className="text-sm opacity-80 mb-4">El banco te compra dólares (Barato)</p>
            
            <div className="text-5xl font-bold mb-2">{results[1]?.rate}</div>
            
            <div className="text-xs space-y-1 opacity-60">
              <p>Banco: {results[1]?.institutionName}</p>
              <p>Base: {results[1]?.baseRate}</p>
              <p>Margen Banco: -{results[1]?.margin}</p>
            </div>
          </div>

          <div className="col-span-full text-center border-t border-gray-700 pt-4 mt-2 text-yellow-300">
             Ganancia del Banco (Spread): 
             <strong> RD$ {((results[0]?.rate || 0) - (results[1]?.rate || 0)).toFixed(2)} </strong> 
             por cada dólar.
          </div>

        </div>
      )}
    </div>
  )
}