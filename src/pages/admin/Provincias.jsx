import React, { useState, useEffect } from 'react'
import {
  Map,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
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
import { provinciaService, paisService } from '../../services/configuracionService'

const Provincias = () => {
  const [provincias, setProvincias] = useState([])
  const [paises, setPaises] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPais, setSelectedPais] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingProvincia, setEditingProvincia] = useState(null)
  const [viewingProvincia, setViewingProvincia] = useState(null)

  const { register, handleSubmit, reset, formState: { errors }, watch } = useForm()

  useEffect(() => {
    fetchPaises()
  }, [])

  useEffect(() => {
    fetchProvincias()
  }, [currentPage, perPage, searchTerm, selectedPais])

  const fetchPaises = async () => {
    try {
      const response = await paisService.getPaises({ per_page: 1000 })
      if (response.success && response.data) {
        setPaises(response.data.data || [])
      }
    } catch (error) {
      console.error('Error al cargar países:', error)
    }
  }

  const fetchProvincias = async () => {
    try {
      setLoading(true)
      const response = await provinciaService.getProvincias({
        page: currentPage,
        per_page: perPage,
        search: searchTerm,
        pais_id: selectedPais || undefined
      })
      
      if (response.success && response.data) {
        setProvincias(response.data.data || [])
        setTotalPages(response.data.last_page || 1)
      } else {
        toast.error(response.message || 'Error al cargar provincias')
        setProvincias([])
        setTotalPages(1)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Error de conexión')
      setProvincias([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingProvincia(null)
    reset({
      nombre_provincia: '',
      codigo_provincia: '',
      pais_id: ''
    })
    setShowModal(true)
  }

  const handleEdit = (provincia) => {
    setEditingProvincia(provincia)
    reset({
      nombre_provincia: provincia.nombre_provincia,
      codigo_provincia: provincia.codigo_provincia || '',
      pais_id: provincia.pais_id || provincia.pais?.id || ''
    })
    setShowModal(true)
  }

  const handleView = async (provincia) => {
    try {
      const response = await provinciaService.getProvincia(provincia.id)
      if (response.success) {
        setViewingProvincia(response.data)
        setShowViewModal(true)
      }
    } catch (error) {
      toast.error('Error al cargar la provincia')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta provincia?')) return
    
    try {
      setLoading(true)
      const response = await provinciaService.deleteProvincia(id)
      
      if (response.success) {
        toast.success(response.message || 'Provincia eliminada exitosamente')
        await fetchProvincias()
      } else {
        toast.error(response.message || 'Error al eliminar la provincia')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Error al eliminar la provincia')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      
      let response
      
      if (editingProvincia) {
        response = await provinciaService.updateProvincia(editingProvincia.id, data)
      } else {
        response = await provinciaService.createProvincia(data)
      }
      
      if (response.success) {
        toast.success(response.message || (editingProvincia ? 'Provincia actualizada exitosamente' : 'Provincia creada exitosamente'))
        setShowModal(false)
        setEditingProvincia(null)
        reset()
        await fetchProvincias()
      } else {
        toast.error(response.message || 'Error al guardar la provincia')
        if (response.errors) {
          Object.keys(response.errors).forEach(key => {
            toast.error(`${key}: ${response.errors[key]}`)
          })
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Error al guardar la provincia')
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
      key: 'nombre_provincia',
      label: 'Provincia',
      sortable: true,
      render: (row) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-accent-500 to-primary-500 flex items-center justify-center text-white font-semibold">
              <Map className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">{row.nombre_provincia}</div>
            {row.pais && (
              <div className="text-sm text-gray-500">{row.pais.nombre_pais}</div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'codigo_provincia',
      label: 'Código',
      render: (row) => (
        <span className="text-gray-900 dark:text-gray-100">
          {row.codigo_provincia || '-'}
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
          <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-primary-500 rounded-2xl flex items-center justify-center shadow-glow">
            <Map className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text">Gestión de Provincias</h1>
            <p className="text-gray-600 dark:text-gray-400">Administra las provincias del sistema</p>
          </div>
        </div>
        <Button
          variant="primary"
          icon={<Plus className="h-5 w-5" />}
          onClick={handleCreate}
        >
          Nueva Provincia
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="gradient" shadow="glow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Total Provincias</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{provincias.length}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center shadow-glow">
              <Map className="h-6 w-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabla de Provincias */}
      <Card className="gradient" shadow="glow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h3 className="text-xl font-bold gradient-text mb-4 sm:mb-0">Lista de Provincias</h3>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar provincias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
            <select
              value={selectedPais}
              onChange={(e) => setSelectedPais(e.target.value)}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todos los países</option>
              {paises.map(pais => (
                <option key={pais.id} value={pais.id}>{pais.nombre_pais}</option>
              ))}
            </select>
          </div>
        </div>
        
        <Table
          columns={columns}
          data={provincias}
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

      {/* Modal de Crear/Editar Provincia */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingProvincia(null)
          reset()
        }}
        title={editingProvincia ? 'Editar Provincia' : 'Nueva Provincia'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                País *
              </label>
              <select
                {...register('pais_id', { required: 'El país es obligatorio' })}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Seleccionar país...</option>
                {paises.map(pais => (
                  <option key={pais.id} value={pais.id}>{pais.nombre_pais}</option>
                ))}
              </select>
              {errors.pais_id && (
                <p className="mt-1 text-sm text-error-600">{errors.pais_id.message}</p>
              )}
            </div>

            <Input
              label="Nombre de la Provincia *"
              placeholder="Ej: La Paz"
              error={errors.nombre_provincia?.message}
              {...register('nombre_provincia', { required: 'El nombre de la provincia es obligatorio' })}
            />
            
            <Input
              label="Código de la Provincia"
              placeholder="Ej: LP"
              error={errors.codigo_provincia?.message}
              {...register('codigo_provincia')}
            />
          </div>
          
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowModal(false)
                setEditingProvincia(null)
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
              {editingProvincia ? 'Actualizar' : 'Crear'} Provincia
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Ver Provincia */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Detalles de la Provincia"
        size="lg"
      >
        {viewingProvincia && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre de la Provincia
                </label>
                <p className="text-gray-900 dark:text-gray-100">{viewingProvincia.nombre_provincia}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  País
                </label>
                <p className="text-gray-900 dark:text-gray-100">{viewingProvincia.pais?.nombre_pais || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Código
                </label>
                <p className="text-gray-900 dark:text-gray-100">{viewingProvincia.codigo_provincia || '-'}</p>
              </div>
              {viewingProvincia.ciudades && viewingProvincia.ciudades.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ciudades
                  </label>
                  <p className="text-gray-900 dark:text-gray-100">{viewingProvincia.ciudades.length} ciudades</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Provincias

