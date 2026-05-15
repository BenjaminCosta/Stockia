'use client'

import { useEffect, useState } from 'react'
import { Plus, Eye, EyeOff, GripVertical } from 'lucide-react'
import { getAdminCategories, adminSetCategoryVisibility, adminCreateCategory, type AdminCategory } from '@/lib/data/admin.service'

// Group categories by rubric
function groupByRubric(cats: AdminCategory[]) {
  const map: Record<string, AdminCategory[]> = {}
  cats.forEach(c => {
    if (!map[c.rubric]) map[c.rubric] = []
    map[c.rubric].push(c)
  })
  return map
}

export default function AdminCategoriasPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [showModal, setShowModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newRubric, setNewRubric] = useState('')

  useEffect(() => { getAdminCategories().then(setCategories) }, [])

  const toggleVisibility = async (id: string, currentVisible: boolean) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, visible: !currentVisible } : c))
    try {
      await adminSetCategoryVisibility(id, !currentVisible)
    } catch (err) {
      console.error('Error updating category visibility:', err)
      setCategories(prev => prev.map(c => c.id === id ? { ...c, visible: currentVisible } : c))
    }
  }

  const handleCreate = async () => {
    if (!newName.trim() || !newRubric.trim()) return
    const data = { name: newName.trim(), rubric: newRubric.trim(), iconName: 'Tag', order: categories.length + 1 }
    const optimistic: AdminCategory = { id: `cat-${Date.now()}`, ...data, visible: true, distributorCount: 0 }
    setCategories(prev => [...prev, optimistic])
    setNewName('')
    setNewRubric('')
    setShowModal(false)
    try {
      await adminCreateCategory(data)
    } catch (err) {
      console.error('Error creating category:', err)
      setCategories(prev => prev.filter(c => c.id !== optimistic.id))
    }
  }

  const grouped = groupByRubric(categories)
  const rubrics = Object.keys(grouped)

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading font-bold text-2xl text-gray-900">Categorías</h1>
          <p className="text-gray-500 text-sm mt-1">{categories.length} categorías · {rubrics.length} rubros</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> Nueva categoría
        </button>
      </div>

      {/* Rubrics + Categories */}
      <div className="space-y-6">
        {rubrics.map(rubric => (
          <div key={rubric} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/50">
              <h2 className="font-semibold text-gray-700 text-sm">{rubric}</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {grouped[rubric].map(cat => (
                <div key={cat.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors group">
                  <GripVertical className="h-4 w-4 text-gray-300 cursor-grab" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-medium text-sm ${cat.visible ? 'text-gray-900' : 'text-gray-400'}`}>
                        {cat.name}
                      </p>
                      {!cat.visible && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full">Oculta</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {cat.distributorCount} distribuidora{cat.distributorCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => toggleVisibility(cat.id, cat.visible)}
                      title={cat.visible ? 'Ocultar' : 'Mostrar'}
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                    >
                      {cat.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* New category modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="font-heading font-bold text-lg text-gray-900 mb-5">Nueva categoría</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Nombre de la categoría</label>
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Ej: Frutas y Verduras"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Rubro</label>
                <input
                  value={newRubric}
                  onChange={e => setNewRubric(e.target.value)}
                  placeholder="Ej: Alimentos y Bebidas"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                  list="rubric-list"
                />
                <datalist id="rubric-list">
                  {rubrics.map(r => <option key={r} value={r} />)}
                </datalist>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || !newRubric.trim()}
                className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
