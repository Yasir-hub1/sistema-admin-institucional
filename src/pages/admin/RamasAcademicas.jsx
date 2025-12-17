import React, { useState, useEffect } from 'react'
import {
  GraduationCap,
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
import { ramaAcademicaService } from '../../services/planificacionService'

const RamasAcademicas = () => {
  const [ramas, setRamas] = useState([])
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
  const [editingRama, setEditingRama] = useState(null)
  const [viewingRama, setViewingRama] = useState(null)
  const [stats, setStats] = useState({
    total: 0,
    conProgramas: 0
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    fetchRamas()
  }, [currentPage, perPage, searchTerm, sortBy, sortDirection])

  const fetchRamas = async () => {
    try {
      setLoading(true)
      const response = await ramaAcademicaService.getRamasAcademicas({
        page: currentPage,
        per_page: perPage,
        search: searchTerm,
        sort_by: sortBy,
        sort_direction: sortDirection
      })
      
      if (response.success && response.data) {
        const ramasData = response.data.data || []
        setRamas(ramasData)
        setTotalPages(response.data.last_page || 1)
        setTotalRegistros(response.data.total || 0)
        setFrom(response.data.from || 0)
        setTo(response.data.to || 0)
        setStats({
          total: response.data.total || 0,
          conProgramas: ramasData.filter(r => r.programas_count > 0).length || 0
        })
      } else {
        toast.error(response.message || 'Error al cargar ramas académicas')
        setRamas([])
        setTotalPages(1)
        setTotalRegistros(0)
        setFrom(0)
        setTo(0)
      }
    } catch (error) {
      toast.error('Error al cargar ramas académicas')
      setRamas([])
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
      toast.error('El nombre de la rama académica es obligatorio')
      return
    }

    try {
      setLoading(true)
      let response
      if (editingRama) {
        // Asegurar que tenemos el ID correcto
        const ramaId = editingRama.id || editingRama.rama_academica_id
        
        if (!ramaId) {
          toast.error('No se pudo identificar el ID de la rama académica para actualizar')
          setLoading(false)
          return
        }

        response = await ramaAcademicaService.updateRamaAcademica(ramaId, {
          nombre: data.nombre.trim()
        })
      } else {
        response = await ramaAcademicaService.createRamaAcademica({
          nombre: data.nombre.trim()
        })
      }

      if (response.success) {
        toast.success(response.message || (editingRama ? 'Rama académica actualizada exitosamente' : 'Rama académica creada exitosamente'))
        setShowModal(false)
        reset()
        setEditingRama(null)
        await fetchRamas()
      } else {
        toast.error(response.message || 'Error al guardar rama académica')
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
      const errorMessage = error.response?.data?.message || error.message || 'Error al guardar rama académica'
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

  const handleEdit = (rama) => {
    // Asegurar que tenemos el ID correcto
    const ramaId = rama.id || rama.rama_academica_id
    
    if (!ramaId) {
      toast.error('No se pudo identificar el ID de la rama académica')
      return
    }

    setEditingRama(rama)
    reset({
      nombre: rama.nombre
    })
    setShowModal(true)
  }

  const handleView = async (rama) => {
    // Asegurar que tenemos el ID correcto
    const ramaId = rama.id || rama.rama_academica_id
    
    if (!ramaId) {
      toast.error('No se pudo identificar el ID de la rama académica')
      return
    }

    try {
      const response = await ramaAcademicaService.getRamaAcademicaById(ramaId)
      if (response.success) {
        setViewingRama(response.data)
        setShowViewModal(true)
      } else {
        toast.error(response.message || 'Error al cargar detalles de la rama académica')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al cargar detalles de la rama académica'
      toast.error(errorMessage)
    }
  }

  const handleDelete = async (rama) => {
    // Asegurar que tenemos el ID correcto
    const ramaId = rama.id || rama.rama_academica_id
    
    if (!ramaId) {
      toast.error('No se pudo identificar el ID de la rama académica')
      return
    }

    if (!window.confirm(`¿Está seguro de eliminar la rama académica "${rama.nombre}"?`)) {
      return
    }

    try {
      const response = await ramaAcademicaService.removeRamaAcademica(ramaId)
      if (response.success) {
        toast.success(response.message || 'Rama académica eliminada exitosamente')
        fetchRamas()
      } else {
        toast.error(response.message || 'Error al eliminar rama académica')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al eliminar rama académica'
      toast.error(errorMessage)
    }
  }

  const handleNew = () => {
    setEditingRama(null)
    reset({
      nombre: ''
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
          <h1 className="text-3xl font-bold gradient-text">Ramas Académicas</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestión de ramas académicas del sistema
          </p>
        </div>
        <Button onClick={handleNew} icon={<Plus className="h-5 w-5" />}>
          Nueva Rama
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-primary-500 to-primary-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-sm">Total Ramas</p>
              <p className="text-3xl font-bold mt-1">{stats.total}</p>
            </div>
            <GraduationCap className="h-12 w-12 text-primary-200" />
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
          data={ramas}
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
          setEditingRama(null)
          reset()
        }}
        title={editingRama ? 'Editar Rama Académica' : 'Nueva Rama Académica'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre de la Rama *
            </label>
            <Input
              {...register('nombre', { required: 'El nombre es requerido' })}
              placeholder="Ej: Ciencias de la Educación, Ingeniería, etc."
              error={errors.nombre?.message}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowModal(false)
                setEditingRama(null)
                reset()
              }}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {editingRama ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Ver */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false)
          setViewingRama(null)
        }}
        title="Detalles de la Rama Académica"
      >
        {viewingRama && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Nombre
              </label>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {viewingRama.nombre}
              </p>
            </div>

            {viewingRama.programas && viewingRama.programas.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Programas Asociados ({viewingRama.programas.length})
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {viewingRama.programas.map((programa) => (
                    <div key={programa.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {programa.nombre}
                      </p>
                      {programa.tipo_programa && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {programa.tipo_programa.nombre}
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

export default RamasAcademicas

