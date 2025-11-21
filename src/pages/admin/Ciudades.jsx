import React, { useState, useEffect } from 'react'
import {
  MapPin,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Map,
  Building
} from 'lucide-react'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Modal from '../../components/common/Modal'
import Table from '../../components/common/Table'
import Card from '../../components/common/Card'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { ciudadService, provinciaService } from '../../services/configuracionService'

const Ciudades = () => {
  const [ciudades, setCiudades] = useState([])
  const [provincias, setProvincias] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProvincia, setSelectedProvincia] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingCiudad, setEditingCiudad] = useState(null)
  const [viewingCiudad, setViewingCiudad] = useState(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    fetchProvincias()
  }, [])

  useEffect(() => {
    fetchCiudades()
  }, [currentPage, perPage, searchTerm, selectedProvincia])

  const fetchProvincias = async () => {
    try {
      const response = await provinciaService.getProvincias({ per_page: 1000 })
      if (response.success && response.data) {
        setProvincias(response.data.data || [])
      }
    } catch (error) {
      console.error('Error al cargar provincias:', error)
    }
  }

  const fetchCiudades = async () => {
    try {
      setLoading(true)
      const response = await ciudadService.getCiudades({
        page: currentPage,
        per_page: perPage,
        search: searchTerm,
        provincia_id: selectedProvincia || undefined
      })
      
      if (response.success && response.data) {
        setCiudades(response.data.data || [])
        setTotalPages(response.data.last_page || 1)
      } else {
        toast.error(response.message || 'Error al cargar ciudades')
        setCiudades([])
        setTotalPages(1)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Error de conexión')
      setCiudades([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingCiudad(null)
    reset({
      nombre_ciudad: '',
      codigo_postal: '',
      provincia_id: ''
    })
    setShowModal(true)
  }

  const handleEdit = (ciudad) => {
    setEditingCiudad(ciudad)
    reset({
      nombre_ciudad: ciudad.nombre_ciudad,
      codigo_postal: ciudad.codigo_postal || '',
      provincia_id: ciudad.provincia_id || ciudad.provincia?.id || ''
    })
    setShowModal(true)
  }

  const handleView = async (ciudad) => {
    try {
      const response = await ciudadService.getCiudad(ciudad.id)
      if (response.success) {
        setViewingCiudad(response.data)
        setShowViewModal(true)
      }
    } catch (error) {
      toast.error('Error al cargar la ciudad')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta ciudad?')) return
    
    try {
      setLoading(true)
      const response = await ciudadService.deleteCiudad(id)
      
      if (response.success) {
        toast.success(response.message || 'Ciudad eliminada exitosamente')
        await fetchCiudades()
      } else {
        toast.error(response.message || 'Error al eliminar la ciudad')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Error al eliminar la ciudad')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      
      let response
      
      if (editingCiudad) {
        response = await ciudadService.updateCiudad(editingCiudad.id, data)
      } else {
        response = await ciudadService.createCiudad(data)
      }
      
      if (response.success) {
        toast.success(response.message || (editingCiudad ? 'Ciudad actualizada exitosamente' : 'Ciudad creada exitosamente'))
        setShowModal(false)
        setEditingCiudad(null)
        reset()
        await fetchCiudades()
      } else {
        toast.error(response.message || 'Error al guardar la ciudad')
        if (response.errors) {
          Object.keys(response.errors).forEach(key => {
            toast.error(`${key}: ${response.errors[key]}`)
          })
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Error al guardar la ciudad')
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
      key: 'nombre_ciudad',
      label: 'Ciudad',
      sortable: true,
      render: (row) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-info-500 to-primary-500 flex items-center justify-center text-white font-semibold">
              <MapPin className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">{row.nombre_ciudad}</div>
            {row.provincia && (
              <div className="text-sm text-gray-500">{row.provincia.nombre_provincia} - {row.provincia.pais?.nombre_pais}</div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'codigo_postal',
      label: 'Código Postal',
      render: (row) => (
        <span className="text-gray-900 dark:text-gray-100">
          {row.codigo_postal || '-'}
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
          <div className="w-12 h-12 bg-gradient-to-br from-info-500 to-primary-500 rounded-2xl flex items-center justify-center shadow-glow">
            <MapPin className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text">Gestión de Ciudades</h1>
            <p className="text-gray-600 dark:text-gray-400">Administra las ciudades del sistema</p>
          </div>
        </div>
        <Button
          variant="primary"
          icon={<Plus className="h-5 w-5" />}
          onClick={handleCreate}
        >
          Nueva Ciudad
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="gradient" shadow="glow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Total Ciudades</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{ciudades.length}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-info-500 to-info-600 rounded-xl flex items-center justify-center shadow-glow">
              <MapPin className="h-6 w-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabla de Ciudades */}
      <Card className="gradient" shadow="glow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h3 className="text-xl font-bold gradient-text mb-4 sm:mb-0">Lista de Ciudades</h3>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar ciudades..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
            <select
              value={selectedProvincia}
              onChange={(e) => setSelectedProvincia(e.target.value)}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todas las provincias</option>
              {provincias.map(provincia => (
                <option key={provincia.id} value={provincia.id}>{provincia.nombre_provincia}</option>
              ))}
            </select>
          </div>
        </div>
        
        <Table
          columns={columns}
          data={ciudades}
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

      {/* Modal de Crear/Editar Ciudad */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingCiudad(null)
          reset()
        }}
        title={editingCiudad ? 'Editar Ciudad' : 'Nueva Ciudad'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Provincia *
              </label>
              <select
                {...register('provincia_id', { required: 'La provincia es obligatoria' })}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Seleccionar provincia...</option>
                {provincias.map(provincia => (
                  <option key={provincia.id} value={provincia.id}>{provincia.nombre_provincia}</option>
                ))}
              </select>
              {errors.provincia_id && (
                <p className="mt-1 text-sm text-error-600">{errors.provincia_id.message}</p>
              )}
            </div>

            <Input
              label="Nombre de la Ciudad *"
              placeholder="Ej: La Paz"
              error={errors.nombre_ciudad?.message}
              {...register('nombre_ciudad', { required: 'El nombre de la ciudad es obligatorio' })}
            />
            
            <Input
              label="Código Postal"
              placeholder="Ej: 0000"
              error={errors.codigo_postal?.message}
              {...register('codigo_postal')}
            />
          </div>
          
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowModal(false)
                setEditingCiudad(null)
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
              {editingCiudad ? 'Actualizar' : 'Crear'} Ciudad
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Ver Ciudad */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Detalles de la Ciudad"
        size="lg"
      >
        {viewingCiudad && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre de la Ciudad
                </label>
                <p className="text-gray-900 dark:text-gray-100">{viewingCiudad.nombre_ciudad}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Provincia
                </label>
                <p className="text-gray-900 dark:text-gray-100">{viewingCiudad.provincia?.nombre_provincia || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  País
                </label>
                <p className="text-gray-900 dark:text-gray-100">{viewingCiudad.provincia?.pais?.nombre_pais || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Código Postal
                </label>
                <p className="text-gray-900 dark:text-gray-100">{viewingCiudad.codigo_postal || '-'}</p>
              </div>
              {viewingCiudad.instituciones && viewingCiudad.instituciones.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Instituciones
                  </label>
                  <p className="text-gray-900 dark:text-gray-100">{viewingCiudad.instituciones.length} instituciones</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Ciudades

