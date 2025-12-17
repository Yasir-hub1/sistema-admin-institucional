import React, { useState, useEffect } from 'react'
import {
  FileText,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  XCircle
} from 'lucide-react'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Modal from '../../components/common/Modal'
import Table from '../../components/common/Table'
import Card from '../../components/common/Card'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { tipoConvenioService } from '../../services/configuracionService'

const TipoConvenios = () => {
  const [tiposConvenio, setTiposConvenio] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [totalRegistros, setTotalRegistros] = useState(0)
  const [from, setFrom] = useState(0)
  const [to, setTo] = useState(0)
  const [sortBy, setSortBy] = useState('nombre_tipo')
  const [sortDirection, setSortDirection] = useState('asc')
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingTipo, setEditingTipo] = useState(null)
  const [viewingTipo, setViewingTipo] = useState(null)
  const [stats, setStats] = useState({
    total: 0,
    conConvenios: 0
  })

  const { register, handleSubmit, reset, formState: { errors }, trigger } = useForm({
    mode: 'onChange',
    defaultValues: {
      nombre_tipo: '',
      descripcion: ''
    }
  })

  useEffect(() => {
    fetchTiposConvenio()
  }, [currentPage, perPage, searchTerm, sortBy, sortDirection])

  const fetchTiposConvenio = async () => {
    try {
      setLoading(true)
      const response = await tipoConvenioService.getTiposConvenio({
        page: currentPage,
        per_page: perPage,
        search: searchTerm,
        sort_by: sortBy,
        sort_direction: sortDirection
      })
      
      if (response.success && response.data) {
        setTiposConvenio(response.data.data || [])
        setTotalPages(response.data.last_page || 1)
        setTotalRegistros(response.data.total || 0)
        setFrom(response.data.from || 0)
        setTo(response.data.to || 0)
        setStats({
          total: response.data.total || 0,
          conConvenios: response.meta?.tipos_con_convenios || response.data.data?.filter(t => t.convenios_count > 0).length || 0
        })
      } else {
        const errorMessage = response.message || 'Error al cargar tipos de convenio'
        toast.error(errorMessage)
        setTiposConvenio([])
        setTotalPages(1)
        setTotalRegistros(0)
        setFrom(0)
        setTo(0)
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error de conexión. Por favor, verifica tu conexión a internet'
      toast.error(errorMessage)
      setTiposConvenio([])
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
    setCurrentPage(1) // Resetear a primera página al ordenar
  }

  const onSubmit = async (data) => {
    // Validación adicional antes de enviar
    if (!data.nombre_tipo || data.nombre_tipo.trim() === '') {
      toast.error('El nombre del tipo de convenio es obligatorio')
      return
    }

    try {
      setLoading(true)
      
      // Limpiar y preparar datos
      const datosBackend = {
        nombre_tipo: data.nombre_tipo.trim(),
        descripcion: data.descripcion ? data.descripcion.trim() : null
      }

      // Eliminar campos vacíos
      if (!datosBackend.descripcion) {
        delete datosBackend.descripcion
      }

      let response
      if (editingTipo) {
        response = await tipoConvenioService.updateTipoConvenio(editingTipo.tipo_convenio_id, datosBackend)
      } else {
        response = await tipoConvenioService.createTipoConvenio(datosBackend)
      }

      if (response.success) {
        toast.success(response.message || (editingTipo ? 'Tipo de convenio actualizado exitosamente' : 'Tipo de convenio creado exitosamente'))
        setShowModal(false)
        reset()
        setEditingTipo(null)
        await fetchTiposConvenio()
      } else {
        // Mostrar mensaje principal
        toast.error(response.message || 'Error al guardar el tipo de convenio')
        
        // Mostrar errores de validación individuales
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
      const errorMessage = error.response?.data?.message || error.message || 'Error al guardar el tipo de convenio'
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

  const handleEdit = (tipo) => {
    setEditingTipo(tipo)
    reset({
      nombre_tipo: tipo.nombre_tipo,
      descripcion: tipo.descripcion || ''
    })
    setShowModal(true)
  }

  const handleView = async (tipo) => {
    try {
      const response = await tipoConvenioService.getTipoConvenioById(tipo.tipo_convenio_id)
      if (response.success) {
        setViewingTipo(response.data)
        setShowViewModal(true)
      } else {
        toast.error(response.message || 'Error al cargar detalles del tipo de convenio')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al cargar detalles del tipo de convenio'
      toast.error(errorMessage)
    }
  }

  const handleDelete = async (tipo) => {
    if (!window.confirm(`¿Está seguro de eliminar el tipo de convenio "${tipo.nombre_tipo}"?`)) {
      return
    }

    try {
      setLoading(true)
      const response = await tipoConvenioService.removeTipoConvenio(tipo.tipo_convenio_id)
      if (response.success) {
        toast.success(response.message || 'Tipo de convenio eliminado exitosamente')
        await fetchTiposConvenio()
      } else {
        toast.error(response.message || 'Error al eliminar el tipo de convenio')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al eliminar el tipo de convenio'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleNew = () => {
    setEditingTipo(null)
    reset({
      nombre_tipo: '',
      descripcion: ''
    })
    setShowModal(true)
  }

  const columns = [
    { 
      key: 'nombre_tipo', 
      label: 'Nombre',
      sortable: true,
      render: (row) => row.nombre_tipo || '-'
    },
    { 
      key: 'descripcion', 
      label: 'Descripción',
      sortable: true,
      render: (row) => row.descripcion || '-'
    },
    { 
      key: 'convenios_count', 
      label: 'Convenios',
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
          {row.convenios_count || 0}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleView(row)}
            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="Ver detalles"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleEdit(row)}
            className="p-2 text-accent-600 hover:bg-accent-50 rounded-lg transition-colors"
            title="Editar"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="p-2 text-error-600 hover:bg-error-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Eliminar"
            disabled={row.convenios_count > 0}
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
          <h1 className="text-3xl font-bold gradient-text">Tipos de Convenio</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestión de tipos de convenio institucional
          </p>
        </div>
        <Button onClick={handleNew} icon={<Plus className="h-5 w-5" />}>
          Nuevo Tipo
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary-500 to-primary-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-sm">Total de Tipos</p>
              <p className="text-3xl font-bold mt-1">{totalRegistros}</p>
              <p className="text-xs text-primary-200 mt-1">
                {searchTerm ? `${totalRegistros} encontrados` : 'En el sistema'}
              </p>
            </div>
            <FileText className="h-12 w-12 text-primary-200" />
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-accent-500 to-accent-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-accent-100 text-sm">Con Convenios</p>
              <p className="text-3xl font-bold mt-1">{stats.conConvenios}</p>
              <p className="text-xs text-accent-200 mt-1">
                Tipos activos
              </p>
            </div>
            <CheckCircle className="h-12 w-12 text-accent-200" />
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Página Actual</p>
              <p className="text-3xl font-bold mt-1">{currentPage} / {totalPages}</p>
              <p className="text-xs text-blue-200 mt-1">
                Mostrando {from} - {to}
              </p>
            </div>
            <FileText className="h-12 w-12 text-blue-200" />
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Por Página</p>
              <p className="text-3xl font-bold mt-1">{perPage}</p>
              <p className="text-xs text-green-200 mt-1">
                Registros
              </p>
            </div>
            <CheckCircle className="h-12 w-12 text-green-200" />
          </div>
        </Card>
      </div>

      {/* Búsqueda y filtros */}
      <Card>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Buscar por nombre o descripción..."
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
          data={tiposConvenio}
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
          setEditingTipo(null)
          reset()
        }}
        title={editingTipo ? 'Editar Tipo de Convenio' : 'Nuevo Tipo de Convenio'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre del Tipo *
            </label>
            <Input
              {...register('nombre_tipo', { 
                required: 'El nombre es obligatorio',
                maxLength: {
                  value: 100,
                  message: 'El nombre no puede tener más de 100 caracteres'
                },
                validate: (value) => {
                  if (value && value.trim().length === 0) {
                    return 'El nombre no puede estar vacío'
                  }
                  return true
                }
              })}
              placeholder="Ej: Educativo, Interinstitucional, Internacional"
              error={errors.nombre_tipo?.message}
              onBlur={() => trigger('nombre_tipo')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descripción
            </label>
            <textarea
              {...register('descripcion')}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
              placeholder="Descripción del tipo de convenio..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowModal(false)
                setEditingTipo(null)
                reset()
              }}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {editingTipo ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Ver */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false)
          setViewingTipo(null)
        }}
        title="Detalles del Tipo de Convenio"
      >
        {viewingTipo && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Nombre
              </label>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {viewingTipo.nombre_tipo}
              </p>
            </div>

            {viewingTipo.descripcion && (
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Descripción
                </label>
                <p className="text-gray-700 dark:text-gray-300">
                  {viewingTipo.descripcion}
                </p>
              </div>
            )}

            {viewingTipo.convenios && viewingTipo.convenios.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Convenios Asociados ({viewingTipo.convenios.length})
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {viewingTipo.convenios.map((convenio) => (
                    <div key={convenio.convenio_id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {convenio.numero_convenio}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {convenio.objeto_convenio}
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

export default TipoConvenios

