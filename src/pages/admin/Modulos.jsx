import React, { useState, useEffect } from 'react'
import {
  Book,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  CheckCircle
} from 'lucide-react'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Modal from '../../components/common/Modal'
import Table from '../../components/common/Table'
import Card from '../../components/common/Card'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { moduloService } from '../../services/planificacionService'

const Modulos = () => {
  const [modulos, setModulos] = useState([])
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
  const [editingModulo, setEditingModulo] = useState(null)
  const [viewingModulo, setViewingModulo] = useState(null)
  const [stats, setStats] = useState({
    total: 0,
    conProgramas: 0
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    fetchModulos()
  }, [currentPage, perPage, searchTerm, sortBy, sortDirection])

  const fetchModulos = async () => {
    try {
      setLoading(true)
      const response = await moduloService.getModulos({
        page: currentPage,
        per_page: perPage,
        search: searchTerm,
        sort_by: sortBy,
        sort_direction: sortDirection
      })
      
      if (response.success && response.data) {
        const modulosData = response.data.data || []
        setModulos(modulosData)
        setTotalPages(response.data.last_page || 1)
        setTotalRegistros(response.data.total || 0)
        setFrom(response.data.from || 0)
        setTo(response.data.to || 0)
        setStats({
          total: response.data.total || 0,
          conProgramas: modulosData.filter(m => m.programas_count > 0).length || 0
        })
      } else {
        toast.error(response.message || 'Error al cargar módulos')
        setModulos([])
        setTotalPages(1)
        setTotalRegistros(0)
        setFrom(0)
        setTo(0)
      }
    } catch (error) {
      toast.error('Error al cargar módulos')
      setModulos([])
      setTotalPages(1)
      setTotalRegistros(0)
      setFrom(0)
      setTo(0)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data) => {
    // Validación adicional antes de enviar
    if (!data.nombre || data.nombre.trim() === '') {
      toast.error('El nombre del módulo es obligatorio')
      return
    }

    if (!data.credito || parseInt(data.credito) < 1 || parseInt(data.credito) > 20) {
      toast.error('Los créditos deben ser un número entre 1 y 20')
      return
    }

    if (!data.horas_academicas || parseInt(data.horas_academicas) < 1) {
      toast.error('Las horas académicas deben ser un número mayor a 0')
      return
    }

    try {
      setLoading(true)
      let response
      if (editingModulo) {
        // Asegurar que tenemos el ID correcto
        const moduloId = editingModulo.modulo_id || editingModulo.id
        
        if (!moduloId) {
          toast.error('No se pudo identificar el ID del módulo para actualizar')
          setLoading(false)
          return
        }

        response = await moduloService.updateModulo(moduloId, {
          nombre: data.nombre.trim(),
          credito: parseInt(data.credito),
          horas_academicas: parseInt(data.horas_academicas)
        })
      } else {
        response = await moduloService.createModulo({
          nombre: data.nombre.trim(),
          credito: parseInt(data.credito),
          horas_academicas: parseInt(data.horas_academicas)
        })
      }

      if (response.success) {
        toast.success(response.message || (editingModulo ? 'Módulo actualizado exitosamente' : 'Módulo creado exitosamente'))
        setShowModal(false)
        reset()
        setEditingModulo(null)
        await fetchModulos()
      } else {
        toast.error(response.message || 'Error al guardar módulo')
        if (response.errors) {
          const errorMessages = Array.isArray(response.errors) 
            ? response.errors 
            : Object.values(response.errors).flat()
          
          errorMessages.forEach((errorMsg) => {
            if (typeof errorMsg === 'string' && errorMsg.trim()) {
              toast.error(errorMsg, { duration: 4000 })
            } else if (Array.isArray(errorMsg) && errorMsg.length > 0) {
              toast.error(errorMsg[0], { duration: 4000 })
            }
          })
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al guardar módulo'
      toast.error(errorMessage)
      
      // Mostrar errores de validación del backend
      if (error.response?.data?.errors) {
        const backendErrors = error.response.data.errors
        const errorMessages = Array.isArray(backendErrors) 
          ? backendErrors 
          : Object.values(backendErrors).flat()
        
        errorMessages.forEach((errorMsg) => {
          if (typeof errorMsg === 'string' && errorMsg.trim()) {
            toast.error(errorMsg, { duration: 4000 })
          } else if (Array.isArray(errorMsg) && errorMsg.length > 0) {
            toast.error(errorMsg[0], { duration: 4000 })
          }
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (modulo) => {
    // Asegurar que tenemos el ID correcto
    const moduloId = modulo.modulo_id || modulo.id
    
    if (!moduloId) {
      toast.error('No se pudo identificar el ID del módulo')
      return
    }

    setEditingModulo(modulo)
    reset({
      nombre: modulo.nombre,
      credito: modulo.credito,
      horas_academicas: modulo.horas_academicas
    })
    setShowModal(true)
  }

  const handleView = async (modulo) => {
    // Asegurar que tenemos el ID correcto
    const moduloId = modulo.modulo_id || modulo.id
    
    if (!moduloId) {
      toast.error('No se pudo identificar el ID del módulo')
      return
    }

    try {
      const response = await moduloService.getModuloById(moduloId)
      if (response.success) {
        setViewingModulo(response.data)
        setShowViewModal(true)
      } else {
        toast.error(response.message || 'Error al cargar detalles del módulo')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al cargar detalles del módulo'
      toast.error(errorMessage)
    }
  }

  const handleDelete = async (modulo) => {
    // Asegurar que tenemos el ID correcto
    const moduloId = modulo.modulo_id || modulo.id
    
    if (!moduloId) {
      toast.error('No se pudo identificar el ID del módulo')
      return
    }

    if (!window.confirm(`¿Está seguro de eliminar el módulo "${modulo.nombre}"?`)) {
      return
    }

    try {
      const response = await moduloService.removeModulo(moduloId)
      if (response.success) {
        toast.success(response.message || 'Módulo eliminado exitosamente')
        await fetchModulos()
      } else {
        toast.error(response.message || 'Error al eliminar módulo')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al eliminar módulo'
      toast.error(errorMessage)
    }
  }

  const handleNew = () => {
    setEditingModulo(null)
    reset({
      nombre: '',
      credito: '',
      horas_academicas: ''
    })
    setShowModal(true)
  }

  const handleSort = (column, direction) => {
    setSortBy(column)
    setSortDirection(direction)
    setCurrentPage(1)
  }

  const columns = [
    { 
      key: 'nombre', 
      label: 'Nombre',
      render: (row) => row.nombre || '-'
    },
    { 
      key: 'credito', 
      label: 'Créditos',
      render: (row) => row.credito || 0
    },
    { 
      key: 'horas_academicas', 
      label: 'Horas Académicas',
      render: (row) => row.horas_academicas || 0
    },
    { 
      key: 'programas_count', 
      label: 'Programas',
      render: (row) => row.programas_count || 0
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleView(row)
            }}
            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="Ver detalles"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleEdit(row)
            }}
            className="p-2 text-accent-600 hover:bg-accent-50 rounded-lg transition-colors"
            title="Editar"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleDelete(row)
            }}
            className="p-2 text-error-600 hover:bg-error-50 rounded-lg transition-colors"
            title="Eliminar"
            disabled={row.programas_count > 0}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Módulos</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestión de módulos (materias) del sistema
          </p>
        </div>
        <Button onClick={handleNew} icon={<Plus className="h-5 w-5" />}>
          Nuevo Módulo
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-primary-500 to-primary-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-sm">Total Módulos</p>
              <p className="text-3xl font-bold mt-1">{stats.total}</p>
            </div>
            <Book className="h-12 w-12 text-primary-200" />
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-accent-500 to-accent-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-accent-100 text-sm">Con Programas</p>
              <p className="text-3xl font-bold mt-1">{stats.conProgramas}</p>
            </div>
            <CheckCircle className="h-12 w-12 text-accent-200" />
          </div>
        </Card>
      </div>

      {/* Búsqueda */}
      <Card>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              icon={Search}
            />
          </div>
        </div>
      </Card>

      {/* Tabla */}
      <Card>
        <Table
          columns={columns}
          data={modulos}
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

      {/* Modal Crear/Editar */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingModulo(null)
          reset()
        }}
        title={editingModulo ? 'Editar Módulo' : 'Nuevo Módulo'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre del Módulo *
            </label>
            <Input
              {...register('nombre', { required: 'El nombre es requerido' })}
              placeholder="Ej: Didáctica General, Metodología de la Investigación"
              error={errors.nombre?.message}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Créditos *
              </label>
              <Input
                type="number"
                {...register('credito', { 
                  required: 'Los créditos son requeridos',
                  min: { value: 1, message: 'Mínimo 1 crédito' },
                  max: { value: 20, message: 'Máximo 20 créditos' }
                })}
                placeholder="Ej: 3"
                error={errors.credito?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Horas Académicas *
              </label>
              <Input
                type="number"
                {...register('horas_academicas', { 
                  required: 'Las horas académicas son requeridas',
                  min: { value: 1, message: 'Mínimo 1 hora' }
                })}
                placeholder="Ej: 45"
                error={errors.horas_academicas?.message}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowModal(false)
                setEditingModulo(null)
                reset()
              }}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {editingModulo ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Ver */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false)
          setViewingModulo(null)
        }}
        title="Detalles del Módulo"
      >
        {viewingModulo && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Nombre
              </label>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {viewingModulo.nombre}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Créditos
                </label>
                <p className="text-gray-700 dark:text-gray-300">
                  {viewingModulo.credito}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Horas Académicas
                </label>
                <p className="text-gray-700 dark:text-gray-300">
                  {viewingModulo.horas_academicas}
                </p>
              </div>
            </div>

            {viewingModulo.programas && viewingModulo.programas.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Programas Asociados ({viewingModulo.programas.length})
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {viewingModulo.programas.map((programa) => (
                    <div key={programa.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {programa.nombre}
                      </p>
                      {programa.pivot?.edicion !== undefined && programa.pivot.edicion !== null && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Edición: {programa.pivot.edicion}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Modulos

