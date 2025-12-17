import React, { useState, useEffect } from 'react'
import {
  Calendar,
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
import { versionService } from '../../services/planificacionService'

const Versiones = () => {
  const [versiones, setVersiones] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [añoFilter, setAñoFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [totalRegistros, setTotalRegistros] = useState(0)
  const [from, setFrom] = useState(0)
  const [to, setTo] = useState(0)
  const [sortBy, setSortBy] = useState('año')
  const [sortDirection, setSortDirection] = useState('desc')
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingVersion, setEditingVersion] = useState(null)
  const [viewingVersion, setViewingVersion] = useState(null)
  const [stats, setStats] = useState({
    total: 0,
    conProgramas: 0
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    fetchVersiones()
  }, [currentPage, perPage, searchTerm, añoFilter, sortBy, sortDirection])

  const fetchVersiones = async () => {
    try {
      setLoading(true)
      const response = await versionService.getVersiones({
        page: currentPage,
        per_page: perPage,
        search: searchTerm,
        año: añoFilter,
        sort_by: sortBy,
        sort_direction: sortDirection
      })
      
      if (response.success && response.data) {
        const versionesData = response.data.data || []
        setVersiones(versionesData)
        setTotalPages(response.data.last_page || 1)
        setTotalRegistros(response.data.total || 0)
        setFrom(response.data.from || 0)
        setTo(response.data.to || 0)
        setStats({
          total: response.data.total || 0,
          conProgramas: versionesData.filter(v => v.programas_count > 0).length || 0
        })
      } else {
        toast.error(response.message || 'Error al cargar versiones')
        setVersiones([])
        setTotalPages(1)
        setTotalRegistros(0)
        setFrom(0)
        setTo(0)
      }
    } catch (error) {
      toast.error('Error al cargar versiones')
      setVersiones([])
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
      toast.error('El nombre de la versión es obligatorio')
      return
    }

    if (!data.año) {
      toast.error('El año es obligatorio')
      return
    }

    const año = parseInt(data.año)
    if (isNaN(año) || año < 2000 || año > new Date().getFullYear() + 10) {
      toast.error('El año debe ser un número válido entre 2000 y ' + (new Date().getFullYear() + 10))
      return
    }

    try {
      setLoading(true)
      let response
      if (editingVersion) {
        // Asegurar que tenemos el ID correcto
        const versionId = editingVersion.id || editingVersion.version_id
        
        if (!versionId) {
          toast.error('No se pudo identificar el ID de la versión para actualizar')
          setLoading(false)
          return
        }

        response = await versionService.updateVersion(versionId, {
          nombre: data.nombre.trim(),
          año: año
        })
      } else {
        response = await versionService.createVersion({
          nombre: data.nombre.trim(),
          año: año
        })
      }

      if (response.success) {
        toast.success(response.message || (editingVersion ? 'Versión actualizada exitosamente' : 'Versión creada exitosamente'))
        setShowModal(false)
        reset()
        setEditingVersion(null)
        await fetchVersiones()
      } else {
        toast.error(response.message || 'Error al guardar versión')
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
      const errorMessage = error.response?.data?.message || error.message || 'Error al guardar versión'
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

  const handleEdit = (version) => {
    // Asegurar que tenemos el ID correcto
    const versionId = version.id || version.version_id
    
    if (!versionId) {
      toast.error('No se pudo identificar el ID de la versión')
      return
    }

    setEditingVersion(version)
    reset({
      nombre: version.nombre,
      año: version.año
    })
    setShowModal(true)
  }

  const handleView = async (version) => {
    // Asegurar que tenemos el ID correcto
    const versionId = version.id || version.version_id
    
    if (!versionId) {
      toast.error('No se pudo identificar el ID de la versión')
      return
    }

    try {
      const response = await versionService.getVersionById(versionId)
      if (response.success) {
        setViewingVersion(response.data)
        setShowViewModal(true)
      } else {
        toast.error(response.message || 'Error al cargar detalles de la versión')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al cargar detalles de la versión'
      toast.error(errorMessage)
    }
  }

  const handleDelete = async (version) => {
    // Asegurar que tenemos el ID correcto
    const versionId = version.id || version.version_id
    
    if (!versionId) {
      toast.error('No se pudo identificar el ID de la versión')
      return
    }

    if (!window.confirm(`¿Está seguro de eliminar la versión "${version.nombre}"?`)) {
      return
    }

    try {
      const response = await versionService.removeVersion(versionId)
      if (response.success) {
        toast.success(response.message || 'Versión eliminada exitosamente')
        await fetchVersiones()
      } else {
        toast.error(response.message || 'Error al eliminar versión')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al eliminar versión'
      toast.error(errorMessage)
    }
  }

  const handleNew = () => {
    setEditingVersion(null)
    reset({
      nombre: '',
      año: new Date().getFullYear()
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
      key: 'año', 
      label: 'Año',
      render: (row) => row.año || 'N/A'
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
          <h1 className="text-3xl font-bold gradient-text">Versiones de Plan de Estudio</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestión de versiones de planes de estudio
          </p>
        </div>
        <Button onClick={handleNew} icon={<Plus className="h-5 w-5" />}>
          Nueva Versión
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-primary-500 to-primary-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-sm">Total Versiones</p>
              <p className="text-3xl font-bold mt-1">{stats.total}</p>
            </div>
            <Calendar className="h-12 w-12 text-primary-200" />
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

      {/* Búsqueda y filtros */}
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
          <div className="w-48">
            <Input
              type="number"
              placeholder="Filtrar por año..."
              value={añoFilter}
              onChange={(e) => {
                setAñoFilter(e.target.value)
                setCurrentPage(1)
              }}
              min="2000"
              max={new Date().getFullYear() + 10}
            />
          </div>
        </div>
      </Card>

      {/* Tabla */}
      <Card>
        <Table
          columns={columns}
          data={versiones}
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
          setEditingVersion(null)
          reset()
        }}
        title={editingVersion ? 'Editar Versión' : 'Nueva Versión'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre de la Versión *
            </label>
            <Input
              {...register('nombre', { required: 'El nombre es requerido' })}
              placeholder="Ej: Versión 2024, Plan 2020-2024"
              error={errors.nombre?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Año *
            </label>
            <Input
              type="number"
              {...register('año', { 
                required: 'El año es requerido',
                min: { value: 2000, message: 'El año debe ser mayor a 2000' },
                max: { value: new Date().getFullYear() + 10, message: 'El año no puede ser mayor a ' + (new Date().getFullYear() + 10) }
              })}
              placeholder="Ej: 2024"
              error={errors.año?.message}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowModal(false)
                setEditingVersion(null)
                reset()
              }}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {editingVersion ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Ver */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false)
          setViewingVersion(null)
        }}
        title="Detalles de la Versión"
      >
        {viewingVersion && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Nombre
                </label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {viewingVersion.nombre}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Año
                </label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {viewingVersion.año}
                </p>
              </div>
            </div>

            {viewingVersion.programas && viewingVersion.programas.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Programas Asociados ({viewingVersion.programas.length})
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {viewingVersion.programas.map((programa) => (
                    <div key={programa.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {programa.nombre}
                      </p>
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

export default Versiones

