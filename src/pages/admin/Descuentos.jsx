import React, { useState, useEffect } from 'react'
import { Percent, Plus, Search, Edit2, Trash2, Eye, Calendar } from 'lucide-react'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Modal from '../../components/common/Modal'
import Table from '../../components/common/Table'
import Card from '../../components/common/Card'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { descuentoService } from '../../services/pagoService'
import { programaService } from '../../services/planificacionService'

/**
 * Parsea una fecha evitando problemas de zona horaria
 * Cuando Laravel envía una fecha como "2025-12-31" o "2025-12-31T00:00:00", 
 * JavaScript la interpreta como UTC medianoche, causando que se muestre un día anterior.
 * Esta función SIEMPRE extrae solo la parte de la fecha (YYYY-MM-DD) y la parsea como fecha local.
 */
const parseDateLocal = (dateString) => {
  if (!dateString) return null
  
  try {
    let dateOnly = null
    
    // Extraer solo la parte de la fecha (YYYY-MM-DD) sin importar el formato
    if (typeof dateString === 'string') {
      // Si es solo fecha (YYYY-MM-DD)
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        dateOnly = dateString
      }
      // Si incluye hora o timestamp (YYYY-MM-DD HH:mm:ss o YYYY-MM-DDTHH:mm:ss)
      else if (dateString.includes('T')) {
        dateOnly = dateString.split('T')[0]
      }
      // Si incluye espacio (YYYY-MM-DD HH:mm:ss)
      else if (dateString.includes(' ')) {
        dateOnly = dateString.split(' ')[0]
      }
      // Intentar extraer fecha de cualquier formato
      else {
        const match = dateString.match(/^(\d{4}-\d{2}-\d{2})/)
        if (match) {
          dateOnly = match[1]
        }
      }
    }
    
    // Si no pudimos extraer la fecha, intentar parsear normalmente
    if (!dateOnly) {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return null
      // Si el parseo fue exitoso, extraer solo la fecha para evitar problemas de zona horaria
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      dateOnly = `${year}-${month}-${day}`
    }
    
    // Parsear la fecha manualmente como fecha local (sin zona horaria)
    if (dateOnly && /^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
      const [year, month, day] = dateOnly.split('-').map(Number)
      // Crear fecha en zona horaria local (no UTC)
      return new Date(year, month - 1, day)
    }
    
    return null
  } catch (error) {
    console.error('Error parseando fecha:', error, dateString)
    return null
  }
}

/**
 * Formatea una fecha evitando problemas de zona horaria
 */
const formatDateLocal = (dateString) => {
  const date = parseDateLocal(dateString)
  if (!date) return '-'
  
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

/**
 * Formatea una fecha con formato largo (mes en texto)
 */
const formatDateLocalLong = (dateString) => {
  const date = parseDateLocal(dateString)
  if (!date) return '-'
  
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Convierte una fecha a formato YYYY-MM-DD para inputs type="date"
 */
const formatDateForInput = (dateString) => {
  if (!dateString) return ''
  
  const date = parseDateLocal(dateString)
  if (!date) return ''
  
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const Descuentos = () => {
  const [descuentos, setDescuentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [totalRegistros, setTotalRegistros] = useState(0)
  const [from, setFrom] = useState(0)
  const [to, setTo] = useState(0)
  const [sortBy, setSortBy] = useState('nombre')
  const [sortDirection, setSortDirection] = useState('asc')
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingDescuento, setEditingDescuento] = useState(null)
  const [viewingDescuento, setViewingDescuento] = useState(null)
  const [programas, setProgramas] = useState([])
  const [cargandoProgramas, setCargandoProgramas] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    fetchDescuentos()
    fetchProgramas()
  }, [currentPage, perPage, searchTerm, sortBy, sortDirection])

  const fetchDescuentos = async () => {
    try {
      setLoading(true)
      const response = await descuentoService.get({
        page: currentPage,
        per_page: perPage,
        search: searchTerm,
        sort_by: sortBy,
        sort_direction: sortDirection
      })
      
      if (response.success && response.data) {
        setDescuentos(response.data.data || [])
        setTotalPages(response.data.last_page || 1)
        setTotalRegistros(response.data.total || 0)
        setFrom(response.data.from || 0)
        setTo(response.data.to || 0)
      } else {
        toast.error(response.message || 'Error al cargar descuentos')
        setDescuentos([])
        setTotalPages(1)
        setTotalRegistros(0)
        setFrom(0)
        setTo(0)
      }
    } catch (error) {
      toast.error('Error de conexión')
      setDescuentos([])
      setTotalPages(1)
      setTotalRegistros(0)
      setFrom(0)
      setTo(0)
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (column, direction) => {
    setSortBy(column)
    setSortDirection(direction)
    setCurrentPage(1)
  }

  const fetchProgramas = async () => {
    try {
      setCargandoProgramas(true)
      const response = await programaService.getProgramas({ per_page: 1000 })
      if (response.success && response.data) {
        setProgramas(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching programas:', error)
    } finally {
      setCargandoProgramas(false)
    }
  }

  const handleCreate = () => {
    setEditingDescuento(null)
    reset({
      programa_id: '',
      nombre: '',
      descuento: '',
      fecha_inicio: '',
      fecha_fin: ''
    })
    setShowModal(true)
  }

  const handleEdit = (descuento) => {
    setEditingDescuento(descuento)
    reset({
      programa_id: descuento.programa_id || '',
      nombre: descuento.nombre,
      descuento: descuento.descuento,
      fecha_inicio: formatDateForInput(descuento.fecha_inicio),
      fecha_fin: formatDateForInput(descuento.fecha_fin)
    })
    setShowModal(true)
  }

  const handleView = async (descuento) => {
    try {
      const response = await descuentoService.getById(descuento.id)
      if (response.success) {
        setViewingDescuento(response.data)
        setShowViewModal(true)
      }
    } catch (error) {
      toast.error('Error al cargar el descuento')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este descuento?')) return
    
    try {
      setLoading(true)
      const response = await descuentoService.remove(id)
      
      if (response.success) {
        toast.success(response.message || 'Descuento eliminado exitosamente')
        await fetchDescuentos()
      } else {
        toast.error(response.message || 'Error al eliminar el descuento')
      }
    } catch (error) {
      toast.error('Error al eliminar el descuento')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      
      let response
      
      if (editingDescuento) {
        response = await descuentoService.update(editingDescuento.id, data)
      } else {
        response = await descuentoService.create(data)
      }
      
      if (response.success) {
        toast.success(response.message || (editingDescuento ? 'Descuento actualizado exitosamente' : 'Descuento creado exitosamente'))
        setShowModal(false)
        setEditingDescuento(null)
        reset()
        await fetchDescuentos()
      } else {
        toast.error(response.message || 'Error al guardar el descuento')
        if (response.errors) {
          Object.keys(response.errors).forEach(key => {
            toast.error(`${key}: ${response.errors[key]}`)
          })
        }
      }
    } catch (error) {
      toast.error('Error al guardar el descuento')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      key: 'nombre',
      label: 'Nombre',
      sortable: true,
      render: (row) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-semibold">
              <Percent className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">{row.nombre}</div>
            <div className="text-sm text-gray-500">{row.descuento}% de descuento</div>
          </div>
        </div>
      )
    },
    {
      key: 'programa',
      label: 'Programa',
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {row.programa?.nombre || '-'}
          </div>
          {row.programa && (
            <div className="text-sm text-gray-500">
              Costo: {parseFloat(row.programa.costo || 0).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'vigencia',
      label: 'Vigencia',
      render: (row) => (
        <div className="text-sm">
          <div className="text-gray-900 dark:text-gray-100">
            {formatDateLocal(row.fecha_inicio)}
          </div>
          <div className="text-gray-500">
            hasta {formatDateLocal(row.fecha_fin)}
          </div>
        </div>
      )
    },
    {
      key: 'descuento',
      label: 'Descuento',
      render: (row) => (
        <span className="font-semibold text-green-600 dark:text-green-400">
          {row.descuento}%
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (row) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            icon={<Eye className="h-4 w-4" />}
            onClick={() => handleView(row)}
          />
          <Button
            variant="ghost"
            size="sm"
            icon={<Edit2 className="h-4 w-4" />}
            onClick={() => handleEdit(row)}
          />
          <Button
            variant="ghost"
            size="sm"
            icon={<Trash2 className="h-4 w-4" />}
            onClick={() => handleDelete(row.id)}
          />
        </div>
      )
    }
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-4 mb-4 sm:mb-0">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center shadow-glow">
            <Percent className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text">Descuentos y Becas</h1>
            <p className="text-gray-600 dark:text-gray-400">Administra los descuentos y becas del sistema</p>
          </div>
        </div>
        <Button
          variant="primary"
          icon={<Plus className="h-5 w-5" />}
          onClick={handleCreate}
        >
          Nuevo Descuento
        </Button>
      </div>

      <Card className="gradient" shadow="glow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h3 className="text-xl font-bold gradient-text mb-4 sm:mb-0">Lista de Descuentos</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar descuentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
        </div>
        
        <Table
          columns={columns}
          data={descuentos}
          loading={loading}
          onSort={handleSort}
          sortBy={sortBy}
          sortDirection={sortDirection}
          pagination={{
            currentPage,
            totalPages,
            perPage,
            total: totalRegistros,
            from,
            to,
            onPageChange: setCurrentPage,
            onPerPageChange: setPerPage
          }}
        />
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingDescuento(null)
          reset()
        }}
        title={editingDescuento ? 'Editar Descuento' : 'Nuevo Descuento'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Programa *
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
              {...register('programa_id', { required: 'El programa es obligatorio' })}
              disabled={cargandoProgramas}
            >
              <option value="">{cargandoProgramas ? 'Cargando programas...' : 'Seleccionar programa'}</option>
              {programas.map(programa => (
                <option key={programa.id} value={programa.id}>
                  {programa.nombre} - {parseFloat(programa.costo || 0).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                </option>
              ))}
            </select>
            {errors.programa_id && (
              <p className="text-red-500 text-xs mt-1">{errors.programa_id.message}</p>
            )}
          </div>

          <Input
            label="Nombre del Descuento *"
            placeholder="Ej: Promo Febrero 20%, Descuento por Convenio, etc."
            error={errors.nombre?.message}
            {...register('nombre', { required: 'El nombre es obligatorio' })}
          />

          <Input
            label="Porcentaje de Descuento *"
            type="number"
            min="0"
            max="100"
            step="0.01"
            placeholder="0.00"
            error={errors.descuento?.message}
            {...register('descuento', { 
              required: 'El porcentaje es obligatorio',
              min: { value: 0, message: 'El porcentaje debe ser mayor o igual a 0' },
              max: { value: 100, message: 'El porcentaje no puede ser mayor a 100' }
            })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Fecha de Inicio *"
              type="date"
              error={errors.fecha_inicio?.message}
              {...register('fecha_inicio', { required: 'La fecha de inicio es obligatoria' })}
            />
            <Input
              label="Fecha de Fin *"
              type="date"
              error={errors.fecha_fin?.message}
              {...register('fecha_fin', { 
                required: 'La fecha de fin es obligatoria',
                validate: (value) => {
                  const fechaInicio = document.querySelector('input[name="fecha_inicio"]')?.value
                  if (fechaInicio && value && new Date(value) < new Date(fechaInicio)) {
                    return 'La fecha de fin debe ser posterior a la fecha de inicio'
                  }
                  return true
                }
              })}
            />
          </div>
          
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowModal(false)
                setEditingDescuento(null)
                reset()
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={<Plus className="h-5 w-5" />}
            >
              {editingDescuento ? 'Actualizar' : 'Crear'} Descuento
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Detalles del Descuento"
        size="lg"
      >
        {viewingDescuento && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre
                </label>
                <p className="text-gray-900 dark:text-gray-100">{viewingDescuento.nombre}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Porcentaje
                </label>
                <p className="text-gray-900 dark:text-gray-100 font-semibold text-green-600">
                  {viewingDescuento.descuento}%
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Programa
                </label>
                <p className="text-gray-900 dark:text-gray-100">
                  {viewingDescuento.programa?.nombre || '-'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha de Inicio
                </label>
                <p className="text-gray-900 dark:text-gray-100">
                  {formatDateLocalLong(viewingDescuento.fecha_inicio)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha de Fin
                </label>
                <p className="text-gray-900 dark:text-gray-100">
                  {formatDateLocalLong(viewingDescuento.fecha_fin)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estado
                </label>
                <p className={`font-semibold ${
                  (() => {
                    const fechaInicio = parseDateLocal(viewingDescuento.fecha_inicio)
                    const fechaFin = parseDateLocal(viewingDescuento.fecha_fin)
                    if (!fechaInicio || !fechaFin) return false
                    const hoy = new Date()
                    hoy.setHours(0, 0, 0, 0)
                    const inicio = new Date(fechaInicio)
                    inicio.setHours(0, 0, 0, 0)
                    const fin = new Date(fechaFin)
                    fin.setHours(0, 0, 0, 0)
                    return hoy >= inicio && hoy <= fin
                  })()
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-gray-500'
                }`}>
                  {(() => {
                    const fechaInicio = parseDateLocal(viewingDescuento.fecha_inicio)
                    const fechaFin = parseDateLocal(viewingDescuento.fecha_fin)
                    if (!fechaInicio || !fechaFin) return 'No vigente'
                    const hoy = new Date()
                    hoy.setHours(0, 0, 0, 0)
                    const inicio = new Date(fechaInicio)
                    inicio.setHours(0, 0, 0, 0)
                    const fin = new Date(fechaFin)
                    fin.setHours(0, 0, 0, 0)
                    return hoy >= inicio && hoy <= fin ? 'Vigente' : 'No vigente'
                  })()}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Descuentos

