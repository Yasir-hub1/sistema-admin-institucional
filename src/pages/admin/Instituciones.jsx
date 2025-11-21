import React, { useState, useEffect } from 'react'
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  MapPin,
  Phone,
  Mail,
  Globe,
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
import { institucionService, ciudadService } from '../../services/configuracionService'

const Instituciones = () => {
  const [instituciones, setInstituciones] = useState([])
  const [ciudades, setCiudades] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCiudad, setSelectedCiudad] = useState('')
  const [selectedEstado, setSelectedEstado] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingInstitucion, setEditingInstitucion] = useState(null)
  const [viewingInstitucion, setViewingInstitucion] = useState(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    fetchCiudades()
  }, [])

  useEffect(() => {
    fetchInstituciones()
  }, [currentPage, perPage, searchTerm, selectedCiudad, selectedEstado])

  const fetchCiudades = async () => {
    try {
      const response = await ciudadService.getCiudades({ per_page: 1000 })
      if (response.success && response.data) {
        setCiudades(response.data.data || [])
      }
    } catch (error) {
      console.error('Error al cargar ciudades:', error)
    }
  }

  const fetchInstituciones = async () => {
    try {
      setLoading(true)
      const response = await institucionService.getInstituciones({
        page: currentPage,
        per_page: perPage,
        search: searchTerm,
        ciudad_id: selectedCiudad || undefined,
        estado: selectedEstado !== '' ? selectedEstado : undefined
      })
      
      if (response.success && response.data) {
        setInstituciones(response.data.data || [])
        setTotalPages(response.data.last_page || 1)
      } else {
        toast.error(response.message || 'Error al cargar instituciones')
        setInstituciones([])
        setTotalPages(1)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Error de conexión')
      setInstituciones([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingInstitucion(null)
    reset({
      nombre: '',
      direccion: '',
      telefono: '',
      email: '',
      sitio_web: '',
      fecha_fundacion: '',
      estado: 1,
      ciudad_id: ''
    })
    setShowModal(true)
  }

  const handleEdit = (institucion) => {
    setEditingInstitucion(institucion)
    reset({
      nombre: institucion.nombre,
      direccion: institucion.direccion || '',
      telefono: institucion.telefono || '',
      email: institucion.email || '',
      sitio_web: institucion.sitio_web || '',
      fecha_fundacion: institucion.fecha_fundacion ? institucion.fecha_fundacion.split('T')[0] : '',
      estado: institucion.estado,
      ciudad_id: institucion.ciudad_id || institucion.ciudad?.id || ''
    })
    setShowModal(true)
  }

  const handleView = async (institucion) => {
    try {
      const response = await institucionService.getInstitucion(institucion.id)
      if (response.success) {
        setViewingInstitucion(response.data)
        setShowViewModal(true)
      }
    } catch (error) {
      toast.error('Error al cargar la institución')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta institución?')) return
    
    try {
      setLoading(true)
      const response = await institucionService.deleteInstitucion(id)
      
      if (response.success) {
        toast.success(response.message || 'Institución eliminada exitosamente')
        await fetchInstituciones()
      } else {
        toast.error(response.message || 'Error al eliminar la institución')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Error al eliminar la institución')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      
      const datosBackend = {
        ...data,
        estado: parseInt(data.estado),
        ciudad_id: parseInt(data.ciudad_id)
      }
      
      let response
      
      if (editingInstitucion) {
        response = await institucionService.updateInstitucion(editingInstitucion.id, datosBackend)
      } else {
        response = await institucionService.createInstitucion(datosBackend)
      }
      
      if (response.success) {
        toast.success(response.message || (editingInstitucion ? 'Institución actualizada exitosamente' : 'Institución creada exitosamente'))
        setShowModal(false)
        setEditingInstitucion(null)
        reset()
        await fetchInstituciones()
      } else {
        toast.error(response.message || 'Error al guardar la institución')
        if (response.errors) {
          Object.keys(response.errors).forEach(key => {
            toast.error(`${key}: ${response.errors[key]}`)
          })
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Error al guardar la institución')
      if (error.response?.data?.errors) {
        Object.keys(error.response.data.errors).forEach(key => {
          toast.error(`${key}: ${error.response.data.errors[key]}`)
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      key: 'nombre',
      label: 'Institución',
      sortable: true,
      render: (row) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-warning-500 to-accent-500 flex items-center justify-center text-white font-semibold">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">{row.nombre}</div>
            {row.ciudad && (
              <div className="text-sm text-gray-500">{row.ciudad.nombre_ciudad}</div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (row) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          row.estado === 1 || row.estado === '1'
            ? 'bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-400' 
            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
        }`}>
          {row.estado === 1 || row.estado === '1' ? (
            <>
              <CheckCircle className="h-3 w-3 mr-1" />
              Activa
            </>
          ) : (
            <>
              <XCircle className="h-3 w-3 mr-1" />
              Inactiva
            </>
          )}
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-4 mb-4 sm:mb-0">
          <div className="w-12 h-12 bg-gradient-to-br from-warning-500 to-accent-500 rounded-2xl flex items-center justify-center shadow-glow">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text">Gestión de Instituciones</h1>
            <p className="text-gray-600 dark:text-gray-400">Administra las instituciones del sistema</p>
          </div>
        </div>
        <Button
          variant="primary"
          icon={<Plus className="h-5 w-5" />}
          onClick={handleCreate}
        >
          Nueva Institución
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="gradient" shadow="glow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Total Instituciones</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{instituciones.length}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-warning-500 to-warning-600 rounded-xl flex items-center justify-center shadow-glow">
              <Building2 className="h-6 w-6 text-white" />
            </div>
          </div>
        </Card>
        <Card className="gradient" shadow="glow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Instituciones Activas</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {instituciones.filter(i => i.estado === 1 || i.estado === '1').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-success-500 to-success-600 rounded-xl flex items-center justify-center shadow-glow">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabla de Instituciones */}
      <Card className="gradient" shadow="glow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h3 className="text-xl font-bold gradient-text mb-4 sm:mb-0">Lista de Instituciones</h3>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar instituciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
            <select
              value={selectedCiudad}
              onChange={(e) => setSelectedCiudad(e.target.value)}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todas las ciudades</option>
              {ciudades.map(ciudad => (
                <option key={ciudad.id} value={ciudad.id}>{ciudad.nombre_ciudad}</option>
              ))}
            </select>
            <select
              value={selectedEstado}
              onChange={(e) => setSelectedEstado(e.target.value)}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todos los estados</option>
              <option value="1">Activas</option>
              <option value="0">Inactivas</option>
            </select>
          </div>
        </div>
        
        <Table
          columns={columns}
          data={instituciones}
          loading={loading}
          pagination={{
            currentPage,
            totalPages,
            perPage,
            onPageChange: setCurrentPage,
            onPerPageChange: setPerPage
          }}
        />
      </Card>

      {/* Modal de Crear/Editar Institución */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingInstitucion(null)
          reset()
        }}
        title={editingInstitucion ? 'Editar Institución' : 'Nueva Institución'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input
              label="Nombre de la Institución *"
              placeholder="Ej: Universidad Mayor de San Andrés"
              error={errors.nombre?.message}
              {...register('nombre', { required: 'El nombre es obligatorio' })}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ciudad *
              </label>
              <select
                {...register('ciudad_id', { required: 'La ciudad es obligatoria' })}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Seleccionar ciudad...</option>
                {ciudades.map(ciudad => (
                  <option key={ciudad.id} value={ciudad.id}>{ciudad.nombre_ciudad}</option>
                ))}
              </select>
              {errors.ciudad_id && (
                <p className="mt-1 text-sm text-error-600">{errors.ciudad_id.message}</p>
              )}
            </div>

            <Input
              label="Dirección"
              placeholder="Ej: Av. Villazón N° 1995"
              error={errors.direccion?.message}
              {...register('direccion')}
            />

            <Input
              label="Teléfono"
              placeholder="Ej: +591 2 2440000"
              error={errors.telefono?.message}
              {...register('telefono')}
            />

            <Input
              label="Email"
              type="email"
              placeholder="Ej: contacto@umsa.edu.bo"
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Sitio Web"
              type="url"
              placeholder="Ej: https://www.umsa.edu.bo"
              error={errors.sitio_web?.message}
              {...register('sitio_web')}
            />

            <Input
              label="Fecha de Fundación"
              type="date"
              error={errors.fecha_fundacion?.message}
              {...register('fecha_fundacion')}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estado *
              </label>
              <select
                {...register('estado', { required: 'El estado es obligatorio' })}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
              >
                <option value="1">Activa</option>
                <option value="0">Inactiva</option>
              </select>
              {errors.estado && (
                <p className="mt-1 text-sm text-error-600">{errors.estado.message}</p>
              )}
            </div>
          </div>
          
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowModal(false)
                setEditingInstitucion(null)
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
              {editingInstitucion ? 'Actualizar' : 'Crear'} Institución
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Ver Institución */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Detalles de la Institución"
        size="lg"
      >
        {viewingInstitucion && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre
                </label>
                <p className="text-gray-900 dark:text-gray-100">{viewingInstitucion.nombre}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ciudad
                </label>
                <p className="text-gray-900 dark:text-gray-100">
                  {viewingInstitucion.ciudad?.nombre_ciudad || '-'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Dirección
                </label>
                <p className="text-gray-900 dark:text-gray-100">{viewingInstitucion.direccion || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Teléfono
                </label>
                <p className="text-gray-900 dark:text-gray-100">{viewingInstitucion.telefono || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <p className="text-gray-900 dark:text-gray-100">{viewingInstitucion.email || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sitio Web
                </label>
                <p className="text-gray-900 dark:text-gray-100">{viewingInstitucion.sitio_web || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estado
                </label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  viewingInstitucion.estado === 1 || viewingInstitucion.estado === '1'
                    ? 'bg-success-100 text-success-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {viewingInstitucion.estado === 1 || viewingInstitucion.estado === '1' ? 'Activa' : 'Inactiva'}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Instituciones

