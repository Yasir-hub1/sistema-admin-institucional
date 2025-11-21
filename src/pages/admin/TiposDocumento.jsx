import React, { useState, useEffect } from 'react'
import { FileText, Plus, Search, Edit2, Trash2, Eye } from 'lucide-react'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Modal from '../../components/common/Modal'
import Table from '../../components/common/Table'
import Card from '../../components/common/Card'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { tipoDocumentoService } from '../../services/documentoService'

const TiposDocumento = () => {
  const [tipos, setTipos] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingTipo, setEditingTipo] = useState(null)
  const [viewingTipo, setViewingTipo] = useState(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    fetchTipos()
  }, [currentPage, perPage, searchTerm])

  const fetchTipos = async () => {
    try {
      setLoading(true)
      const response = await tipoDocumentoService.get({
        page: currentPage,
        per_page: perPage,
        search: searchTerm
      })
      
      if (response.success && response.data) {
        setTipos(response.data.data || [])
        setTotalPages(response.data.last_page || 1)
      } else {
        toast.error(response.message || 'Error al cargar tipos de documento')
        setTipos([])
        setTotalPages(1)
      }
    } catch (error) {
      toast.error('Error de conexión')
      setTipos([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingTipo(null)
    reset({ nombre_entidad: '' })
    setShowModal(true)
  }

  const handleEdit = (tipo) => {
    setEditingTipo(tipo)
    reset({ nombre_entidad: tipo.nombre_entidad })
    setShowModal(true)
  }

  const handleView = async (tipo) => {
    try {
      const response = await tipoDocumentoService.getById(tipo.tipo_documento_id)
      if (response.success) {
        setViewingTipo(response.data)
        setShowViewModal(true)
      }
    } catch (error) {
      toast.error('Error al cargar el tipo de documento')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este tipo de documento?')) return
    
    try {
      setLoading(true)
      const response = await tipoDocumentoService.remove(id)
      
      if (response.success) {
        toast.success(response.message || 'Tipo de documento eliminado exitosamente')
        await fetchTipos()
      } else {
        toast.error(response.message || 'Error al eliminar el tipo de documento')
      }
    } catch (error) {
      toast.error('Error al eliminar el tipo de documento')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      
      let response
      
      if (editingTipo) {
        response = await tipoDocumentoService.update(editingTipo.tipo_documento_id, data)
      } else {
        response = await tipoDocumentoService.create(data)
      }
      
      if (response.success) {
        toast.success(response.message || (editingTipo ? 'Tipo de documento actualizado exitosamente' : 'Tipo de documento creado exitosamente'))
        setShowModal(false)
        setEditingTipo(null)
        reset()
        await fetchTipos()
      } else {
        toast.error(response.message || 'Error al guardar el tipo de documento')
        if (response.errors) {
          Object.keys(response.errors).forEach(key => {
            toast.error(`${key}: ${response.errors[key]}`)
          })
        }
      }
    } catch (error) {
      toast.error('Error al guardar el tipo de documento')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      key: 'nombre_entidad',
      label: 'Nombre',
      sortable: true,
      render: (row) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-semibold">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">{row.nombre_entidad}</div>
            {row.documentos_count !== undefined && (
              <div className="text-sm text-gray-500">{row.documentos_count} documentos</div>
            )}
          </div>
        </div>
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
            onClick={() => handleDelete(row.tipo_documento_id)}
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
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text">Tipos de Documento</h1>
            <p className="text-gray-600 dark:text-gray-400">Administra los tipos de documento del sistema</p>
          </div>
        </div>
        <Button
          variant="primary"
          icon={<Plus className="h-5 w-5" />}
          onClick={handleCreate}
        >
          Nuevo Tipo
        </Button>
      </div>

      <Card className="gradient" shadow="glow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h3 className="text-xl font-bold gradient-text mb-4 sm:mb-0">Lista de Tipos</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar tipos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
        </div>
        
        <Table
          columns={columns}
          data={tipos}
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
          setEditingTipo(null)
          reset()
        }}
        title={editingTipo ? 'Editar Tipo de Documento' : 'Nuevo Tipo de Documento'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            label="Nombre del Tipo *"
            placeholder="Ej: Estudiante, Docente, etc."
            error={errors.nombre_entidad?.message}
            {...register('nombre_entidad', { required: 'El nombre es obligatorio' })}
          />
          
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
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
            <Button
              type="submit"
              variant="primary"
              icon={<Plus className="h-5 w-5" />}
            >
              {editingTipo ? 'Actualizar' : 'Crear'} Tipo
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Detalles del Tipo de Documento"
        size="lg"
      >
        {viewingTipo && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre
              </label>
              <p className="text-gray-900 dark:text-gray-100">{viewingTipo.nombre_entidad}</p>
            </div>
            {viewingTipo.documentos && viewingTipo.documentos.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Documentos Asociados
                </label>
                <p className="text-gray-900 dark:text-gray-100">{viewingTipo.documentos.length} documentos</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default TiposDocumento

