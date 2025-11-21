import React, { useState, useEffect } from 'react'
import {
  Globe,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  MapPin,
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
import { paisService } from '../../services/configuracionService'

const Paises = () => {
  const [paises, setPaises] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingPais, setEditingPais] = useState(null)
  const [viewingPais, setViewingPais] = useState(null)

  const { register, handleSubmit, reset, formState: { errors }, trigger, setValue, watch } = useForm({
    mode: 'onChange',
    defaultValues: {
      nombre_pais: '',
      codigo_iso: '',
      codigo_telefono: ''
    }
  })

  useEffect(() => {
    fetchPaises()
  }, [currentPage, perPage, searchTerm])

  const fetchPaises = async () => {
    try {
      setLoading(true)
      const response = await paisService.getPaises({
        page: currentPage,
        per_page: perPage,
        search: searchTerm
      })
      
      if (response.success && response.data) {
        setPaises(response.data.data || [])
        setTotalPages(response.data.last_page || 1)
      } else {
        const errorMessage = response.message || 'Error al cargar países'
        toast.error(errorMessage)
        setPaises([])
        setTotalPages(1)
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error de conexión. Por favor, verifica tu conexión a internet'
      toast.error(errorMessage)
      setPaises([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingPais(null)
    reset({
      nombre_pais: '',
      codigo_iso: '',
      codigo_telefono: ''
    })
    setShowModal(true)
  }

  const handleEdit = (pais) => {
    setEditingPais(pais)
    reset({
      nombre_pais: pais.nombre_pais,
      codigo_iso: pais.codigo_iso || '',
      codigo_telefono: pais.codigo_telefono || ''
    })
    setShowModal(true)
  }

  const handleView = async (pais) => {
    try {
      const response = await paisService.getPais(pais.id)
      if (response.success) {
        setViewingPais(response.data)
        setShowViewModal(true)
      } else {
        toast.error(response.message || 'Error al cargar el país')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al cargar el país'
      toast.error(errorMessage)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este país?')) return
    
    try {
      setLoading(true)
      const response = await paisService.deletePais(id)
      
      if (response.success) {
        toast.success(response.message || 'País eliminado exitosamente')
        await fetchPaises()
      } else {
        toast.error(response.message || 'Error al eliminar el país')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Error al eliminar el país')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data) => {
    // Validación adicional antes de enviar
    if (!data.nombre_pais || data.nombre_pais.trim() === '') {
      toast.error('El nombre del país es obligatorio')
      return
    }

    if (data.nombre_pais.length > 100) {
      toast.error('El nombre del país no puede tener más de 100 caracteres')
      return
    }

    if (data.codigo_iso && data.codigo_iso.length > 3) {
      toast.error('El código ISO no puede tener más de 3 caracteres')
      return
    }

    if (data.codigo_telefono && data.codigo_telefono.length > 10) {
      toast.error('El código telefónico no puede tener más de 10 caracteres')
      return
    }

    try {
      setLoading(true)
      
      // Limpiar espacios en blanco
      const cleanData = {
        nombre_pais: data.nombre_pais.trim(),
        codigo_iso: data.codigo_iso ? data.codigo_iso.trim().toUpperCase() : null,
        codigo_telefono: data.codigo_telefono ? data.codigo_telefono.trim() : null
      }

      // Eliminar campos vacíos
      if (!cleanData.codigo_iso) delete cleanData.codigo_iso
      if (!cleanData.codigo_telefono) delete cleanData.codigo_telefono
      
      let response
      
      if (editingPais) {
        response = await paisService.updatePais(editingPais.id, cleanData)
      } else {
        response = await paisService.createPais(cleanData)
      }
      
      if (response.success) {
        toast.success(response.message || (editingPais ? 'País actualizado exitosamente' : 'País creado exitosamente'))
        setShowModal(false)
        setEditingPais(null)
        reset()
        await fetchPaises()
      } else {
        // Mostrar mensaje principal
        toast.error(response.message || 'Error al guardar el país')
        
        // Mostrar errores de validación individuales
        if (response.errors) {
          const errorMessages = Array.isArray(response.errors) 
            ? response.errors 
            : Object.values(response.errors).flat()
          
          errorMessages.forEach((errorMsg) => {
            if (typeof errorMsg === 'string' && errorMsg.trim()) {
              toast.error(errorMsg, { duration: 4000 })
            }
          })
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al guardar el país'
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
          }
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      key: 'nombre_pais',
      label: 'País',
      sortable: true,
      render: (row) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-semibold">
              <Globe className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">{row.nombre_pais}</div>
            {row.codigo_iso && (
              <div className="text-sm text-gray-500">ISO: {row.codigo_iso}</div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'codigo_telefono',
      label: 'Código Tel.',
      render: (row) => (
        <span className="text-gray-900 dark:text-gray-100">
          {row.codigo_telefono || '-'}
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
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center shadow-glow">
            <Globe className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text">Gestión de Países</h1>
            <p className="text-gray-600 dark:text-gray-400">Administra los países del sistema</p>
          </div>
        </div>
        <Button
          variant="primary"
          icon={<Plus className="h-5 w-5" />}
          onClick={handleCreate}
        >
          Nuevo País
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="gradient" shadow="glow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Total Países</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{paises.length}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-glow">
              <Globe className="h-6 w-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabla de Países */}
      <Card className="gradient" shadow="glow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h3 className="text-xl font-bold gradient-text mb-4 sm:mb-0">Lista de Países</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar países..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
        </div>
        
        <Table
          columns={columns}
          data={paises}
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

      {/* Modal de Crear/Editar País */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingPais(null)
          reset()
        }}
        title={editingPais ? 'Editar País' : 'Nuevo País'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input
              label="Nombre del País *"
              placeholder="Ej: Bolivia"
              error={errors.nombre_pais?.message}
              {...register('nombre_pais', { 
                required: 'El nombre del país es obligatorio',
                maxLength: {
                  value: 100,
                  message: 'El nombre del país no puede tener más de 100 caracteres'
                },
                validate: (value) => {
                  if (value && value.trim().length === 0) {
                    return 'El nombre del país no puede estar vacío'
                  }
                  return true
                }
              })}
              onBlur={() => trigger('nombre_pais')}
            />
            
            <Input
              label="Código ISO"
              placeholder="Ej: BOL"
              error={errors.codigo_iso?.message}
              {...register('codigo_iso', {
                maxLength: {
                  value: 3,
                  message: 'El código ISO no puede tener más de 3 caracteres'
                },
                pattern: {
                  value: /^[A-Za-z]*$/,
                  message: 'El código ISO solo puede contener letras'
                }
              })}
              onBlur={() => trigger('codigo_iso')}
              onChange={(e) => {
                const value = e.target.value.toUpperCase().replace(/[^A-Za-z]/g, '')
                setValue('codigo_iso', value, { shouldValidate: true })
              }}
            />

            <Input
              label="Código Telefónico"
              placeholder="Ej: +591"
              error={errors.codigo_telefono?.message}
              {...register('codigo_telefono', {
                maxLength: {
                  value: 10,
                  message: 'El código telefónico no puede tener más de 10 caracteres'
                },
                pattern: {
                  value: /^[+]?[0-9]*$/,
                  message: 'El código telefónico solo puede contener números y el símbolo +'
                }
              })}
              onBlur={() => trigger('codigo_telefono')}
            />
          </div>
          
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowModal(false)
                setEditingPais(null)
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
              {editingPais ? 'Actualizar' : 'Crear'} País
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Ver País */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Detalles del País"
        size="lg"
      >
        {viewingPais && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre del País
                </label>
                <p className="text-gray-900 dark:text-gray-100">{viewingPais.nombre_pais}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Código ISO
                </label>
                <p className="text-gray-900 dark:text-gray-100">{viewingPais.codigo_iso || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Código Telefónico
                </label>
                <p className="text-gray-900 dark:text-gray-100">{viewingPais.codigo_telefono || '-'}</p>
              </div>
              {viewingPais.provincias && viewingPais.provincias.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Provincias
                  </label>
                  <p className="text-gray-900 dark:text-gray-100">{viewingPais.provincias.length} provincias</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Paises

