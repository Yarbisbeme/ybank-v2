'use client'

import { useState, useEffect } from 'react'
import { getCategories, createCategory, deleteCategory } from '@/actions/categories'
import { Category } from '@/types'
import { CategoryIcon } from '@/components/ui/Category-icon'

export default function CategoriesLab() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  
  // Formulario simple
  const [newName, setNewName] = useState('')
  const [selectedParent, setSelectedParent] = useState<string>('')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    const data = await getCategories()
    setCategories(data)
    setLoading(false)
  }

  const handleCreate = async () => {
    if (!newName) return alert("Escribe un nombre")
    
    // Si seleccionó un padre, creamos una Subcategoría
    const parentId = selectedParent === '' ? undefined : selectedParent
    
    const res = await createCategory(newName, 'expense', parentId)
    
    if (res.success) {
      setNewName('')
      loadData() // Recargar árbol
    } else {
      alert(res.error)
    }
  }

  const handleDelete = async (id: string) => {
    if(!confirm("¿Borrar categoría?")) return
    await deleteCategory(id)
    loadData()
  }

  return (
    <div className="p-10 max-w-3xl mx-auto space-y-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800">🌳 Laboratorio de Categorías (YB-12)</h1>

      {/* 1. FORMULARIO DE CREACIÓN */}
      <div className="bg-white p-6 rounded shadow space-y-4">
        <h2 className="font-semibold text-lg">Nueva Categoría</h2>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Nombre (ej: Sushi)" 
            className="border p-2 rounded flex-1"
            value={newName}
            onChange={e => setNewName(e.target.value)}
          />
          
          <select 
            className="border p-2 rounded"
            value={selectedParent}
            onChange={e => setSelectedParent(e.target.value)}
          >
            <option value="">-- Es Principal (Padre) --</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>Dentro de: {cat.name}</option>
            ))}
          </select>

          <button 
            onClick={handleCreate}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Crear
          </button>
        </div>
      </div>

      {/* 2. VISUALIZACIÓN DEL ÁRBOL */}
      <div className="space-y-4">
        <h2 className="font-semibold text-lg border-b pb-2">Mis Categorías (Árbol)</h2>
        
        {categories.map(parent => (
          <div key={parent.id} className="bg-white border rounded-lg overflow-hidden">
            
            {/* PADRE */}
            <div className="bg-slate-100 p-3 flex justify-between items-center">
              <span className="font-bold text-slate-700 flex items-center gap-2">
                <CategoryIcon iconName={parent.icon} /> {parent.name}
                {parent.user_id === null && <span className="text-[10px] bg-blue-100 text-blue-600 px-1 rounded">SISTEMA</span>}
              </span>
              
              {/* Solo permitimos borrar si es TUYA (user_id != null) */}
              {parent.user_id && (
                <button onClick={() => handleDelete(parent.id)} className="text-red-500 text-xs hover:underline">
                  Borrar
                </button>
              )}
            </div>

            {/* HIJOS (Subcategorías) */}
            <div className="p-3 pl-8 space-y-2">
              {parent.subcategories?.length === 0 && <p className="text-gray-400 text-sm italic">Sin subcategorías</p>}
              
              {parent.subcategories?.map(child => (
                <div key={child.id} className="flex justify-between items-center text-sm border-b last:border-0 pb-1">
                  <span className="text-gray-600"><CategoryIcon iconName={child.icon} /> {child.name}</span>
                  {child.user_id && (
                    <button onClick={() => handleDelete(child.id)} className="text-red-400 text-xs hover:text-red-600">
                      x
                    </button>
                  )}
                </div>
              ))}
            </div>

          </div>
        ))}
      </div>
    </div>
  )
}