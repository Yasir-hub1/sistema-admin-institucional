import React, { useState, useEffect } from 'react'
import { Percent, Plus, Search, Edit2, Trash2, Eye } from 'lucide-react'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Modal from '../../components/common/Modal'
import Table from '../../components/common/Table'
import Card from '../../components/common/Card'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { descuentoService } from '../../services/pagoService'

const Descuentos = () => {
  const [descuentos, setDescuentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingDescuento, setEditingDescuento] = useState(null)
  const [viewingDescuento, setViewingDescuento] = useState(null)
  const [inscripcionesSinDescuento, setInscripcionesSinDescuento] = useState([])

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    fetchDescuentos()
    fetchInscripcionesSinDescuento()
  }, [currentPage, perPage, searchTerm])

  const fetchDescuentos = async () => {
    try {
      setLoading(true)
      const response = await descuentoService.get({
        page: currentPage,
        per_page: perPage,
        search: searchTerm
      })
      
      if (response.success && response.data) {
        setDescuentos(response.data.data || [])
        setTotalPages(response.data.last_page || 1)
      } else {
        toast.error(response.message || 'Error al cargar descuentos')
        setDescuentos([])
        setTotalPages(1)
      }
    } catch (error) {
      toast.error('Error de conexión')
      setDescuentos([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  const fetchInscripcionesSinDescuento = async () => {
    try {
      const response = await descuentoService.getInscripcionesSinDescuento()
      if (response.success) {
        setInscripcionesSinDescuento(response.data || [])
      }
    } catch (error) {
      console.error('Error fetching inscripciones sin descuento:', error)
    }
  }

  const handleCreate = () => {
    setEditingDescuento(null)
    reset({
      inscripcion_id: '',
      nombre: '',
      descuento: ''
    })
    setShowModal(true)
  }

  const handleEdit = (descuento) => {
    setEditingDescuento(descuento)
    reset({
      nombre: descuento.nombre,
      descuento: descuento.descuento
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
        await fetchInscripcionesSinDescuento()
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
      key: 'estudiante',
      label: 'Estudiante',
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {row.inscripcion?.estudiante?.nombre} {row.inscripcion?.estudiante?.apellido}
          </div>
          <div className="text-sm text-gray-500">
            CI: {row.inscripcion?.estudiante?.ci}
          </div>
        </div>
      )
    },
    {
      key: 'programa',
      label: 'Programa',
      render: (row) => (
        <span className="text-gray-900 dark:text-gray-100">
          {row.inscripcion?.programa?.nombre || '-'}
        </span>
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
          pagination={{
            currentPage,
            totalPages,
            perPage,
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
          {!editingDescuento && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Inscripción *
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
                {...register('inscripcion_id', { required: 'La inscripción es obligatoria' })}
              >
                <option value="">Seleccionar inscripción</option>
                {inscripcionesSinDescuento.map(insc => (
                  <option key={insc.id} value={insc.id}>
                    {insc.estudiante?.nombre} {insc.estudiante?.apellido} - {insc.programa?.nombre}
                  </option>
                ))}
              </select>
              {errors.inscripcion_id && (
                <p className="text-red-500 text-xs mt-1">{errors.inscripcion_id.message}</p>
              )}
            </div>
          )}

          <Input
            label="Nombre del Descuento *"
            placeholder="Ej: Beca Académica, Descuento por Convenio, etc."
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
                  Estudiante
                </label>
                <p className="text-gray-900 dark:text-gray-100">
                  {viewingDescuento.inscripcion?.estudiante?.nombre} {viewingDescuento.inscripcion?.estudiante?.apellido}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Programa
                </label>
                <p className="text-gray-900 dark:text-gray-100">
                  {viewingDescuento.inscripcion?.programa?.nombre || '-'}
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

