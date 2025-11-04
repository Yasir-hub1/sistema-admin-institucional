import React, { useState, useEffect } from 'react'
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Filter,
  Download,
  Upload,
  X,
  Mail,
  Phone,
  GraduationCap,
  Building,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { docenteService } from '../services/docenteService'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Modal from '../components/common/Modal'
import Table from '../components/common/Table'
import Card from '../components/common/Card'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { exportToCSV } from '../utils/helpers'

const Docentes = () => {
  const [docentes, setDocentes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [perPage, setPerPage] = useState(10)
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [editingDocente, setEditingDocente] = useState(null)
  const [viewingDocente, setViewingDocente] = useState(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const fileInputRef = React.useRef(null)
  const [filtrosAvanzados, setFiltrosAvanzados] = useState({
    especialidad: '',
    grado_academico: '',
    activo: ''
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    fetchDocentes()
  }, [currentPage, perPage, searchTerm, filtrosAvanzados])

  const fetchDocentes = async () => {
    try {
      setLoading(true)
      const params = {
        page: currentPage,
        per_page: perPage,
        search: searchTerm
      }

      // Agregar filtros avanzados solo si tienen valor
      if (filtrosAvanzados.especialidad) {
        params.especialidad = filtrosAvanzados.especialidad
      }
      if (filtrosAvanzados.grado_academico) {
        params.grado_academico = filtrosAvanzados.grado_academico
      }
      if (filtrosAvanzados.activo !== '') {
        params.activo = filtrosAvanzados.activo
      }

      const response = await docenteService.getDocentes(params)
      
      if (response.success && response.data) {
        setDocentes(response.data.data || [])
        setTotalPages(response.data.last_page || 1)
        setTotalItems(response.data.total || 0)
      } else {
        toast.error(response.message || 'Error al cargar docentes')
        setDocentes([])
        setTotalPages(1)
        setTotalItems(0)
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error de conexión: No se pudo cargar los docentes'
      toast.error(errorMessage)
      console.error('Error al cargar docentes:', error)
      setDocentes([])
      setTotalPages(1)
      setTotalItems(0)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingDocente(null)
    reset({
      name: '',
      email: '',
      codigo_docente: '',
      especialidad: '',
      grado_academico: '',
      telefono: '',
      direccion: ''
    })
    setShowModal(true)
  }

  const handleEdit = (docente) => {
    setEditingDocente(docente)
    reset({
      name: docente.user?.name || '',
      email: docente.user?.email || '',
      codigo_docente: docente.codigo_docente,
      especialidad: docente.especialidad,
      grado_academico: docente.grado_academico,
      telefono: docente.telefono || '',
      direccion: docente.direccion || ''
    })
    setShowModal(true)
  }

  const handleView = async (docente) => {
    try {
      const response = await docenteService.getDocente(docente.id)
      if (response.success) {
        setViewingDocente(response.data)
        setShowViewModal(true)
      } else {
        toast.error(response.message || 'Error al cargar los detalles del docente')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al cargar los detalles del docente'
      toast.error(errorMessage)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este docente?')) return

    try {
      const response = await docenteService.deleteDocente(id)
      if (response.success) {
        toast.success(response.message || 'Docente eliminado exitosamente')
        fetchDocentes()
      } else {
        toast.error(response.message || 'Error al eliminar el docente')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al eliminar el docente'
      toast.error(errorMessage)
    }
  }

  const onSubmit = async (data) => {
    try {
      let response
      if (editingDocente) {
        // Para actualizar, no enviar password si está vacío
        const datosActualizacion = { ...data }
        if (!datosActualizacion.password) {
          delete datosActualizacion.password
        }
        response = await docenteService.updateDocente(editingDocente.id, datosActualizacion)
      } else {
        // Para crear, password es obligatorio
        if (!data.password) {
          toast.error('La contraseña es obligatoria para crear un nuevo docente')
          return
        }
        response = await docenteService.createDocente(data)
      }
      
      if (response.success) {
        toast.success(response.message || (editingDocente ? 'Docente actualizado exitosamente' : 'Docente creado exitosamente'))
        setShowModal(false)
        fetchDocentes()
        reset()
      } else {
        toast.error(response.message || 'Error al guardar el docente')
        if (response.errors) {
          Object.keys(response.errors).forEach(key => {
            toast.error(`${key}: ${response.errors[key]}`)
          })
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al guardar el docente'
      toast.error(errorMessage)
      if (error.response?.data?.errors) {
        Object.keys(error.response.data.errors).forEach(key => {
          toast.error(`${key}: ${error.response.data.errors[key]}`)
        })
      }
    }
  }

  const handleExport = async () => {
    try {
      setLoading(true)
      const response = await docenteService.exportarDocentes({
        search: searchTerm,
        ...filtrosAvanzados
      })
      
      if (response.success && response.data && Array.isArray(response.data)) {
        if (response.data.length === 0) {
          toast.error('No hay docentes para exportar')
          return
        }
        
        // Mapear los datos para exportar
        const datosExportar = response.data.map(docente => ({
          'Código': docente.codigo_docente || '',
          'Nombre': docente.user?.name || docente.name || '',
          'Email': docente.user?.email || docente.email || '',
          'Especialidad': docente.especialidad || '',
          'Grado Académico': docente.grado_academico || '',
          'Teléfono': docente.telefono || '',
          'Dirección': docente.direccion || '',
          'Estado': docente.user?.activo !== false ? 'Activo' : 'Inactivo'
        }))
        
        exportToCSV(datosExportar, `docentes_${new Date().toISOString().split('T')[0]}.csv`)
        toast.success(`Se exportaron ${datosExportar.length} docentes exitosamente`)
      } else {
        toast.error(response.message || 'Error al exportar docentes: No se recibieron datos válidos')
        console.error('Error en exportación:', response)
      }
    } catch (error) {
      console.error('Error al exportar docentes:', error)
      toast.error(error.response?.data?.message || error.message || 'Error al exportar docentes')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file) {
      toast.error('Por favor selecciona un archivo')
      return
    }

    try {
      setImporting(true)
      setImportResult(null)
      const response = await docenteService.importarDocentes(file)
      
      if (response.success) {
        setImportResult({
          success: true,
          message: response.message || 'Docentes importados exitosamente',
          data: response.data
        })
        toast.success(response.message || 'Docentes importados exitosamente')
        await fetchDocentes()
        setTimeout(() => {
          setShowImportModal(false)
          setImportResult(null)
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        }, 2000)
      } else {
        setImportResult({
          success: false,
          message: response.message || 'Error al importar docentes',
          errors: response.errors
        })
        toast.error(response.message || 'Error al importar docentes')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al importar docentes'
      setImportResult({
        success: false,
        message: errorMessage
      })
      toast.error(errorMessage)
    } finally {
      setImporting(false)
    }
  }

  const downloadTemplate = () => {
    const template = 'codigo_docente,nombre,email,especialidad,grado_academico,telefono,direccion,password\nDOC001,Juan Pérez,juan.perez@example.com,Matemáticas,Licenciatura,1234567890,Calle 123,password123\nDOC002,María González,maria.gonzalez@example.com,Historia,Maestría,0987654321,Avenida 456,password123\n'
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'template_docentes.csv'
    link.click()
  }

  const columns = [
    {
      key: 'codigo_docente',
      label: 'Código',
      sortable: true,
      render: (row) => {
        if (!row) return <span>N/A</span>
        return (
          <span className="font-mono font-semibold text-blue-600">
            {row.codigo_docente || 'N/A'}
          </span>
        )
      }
    },
    {
      key: 'user.name',
      label: 'Nombre',
      sortable: true,
      render: (row) => {
        if (!row) return <div>N/A</div>
        return (
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                {row.name?.charAt(0) || 'D'}
              </div>
            </div>
            <div>
              <div className="font-medium text-gray-900">{row.name || 'N/A'}</div>
              <div className="text-sm text-gray-500 flex items-center">
                <Mail className="h-3 w-3 mr-1" />
                {row.email || 'N/A'}
              </div>
            </div>
          </div>
        )
      }
    },
    {
      key: 'especialidad',
      label: 'Especialidad',
      sortable: true,
      render: (row) => {
        if (!row) return <div>N/A</div>
        return (
          <div className="flex items-center text-gray-700">
            <Building className="h-4 w-4 mr-2 text-gray-400" />
            {row.especialidad || 'N/A'}
          </div>
        )
      }
    },
    {
      key: 'grado_academico',
      label: 'Grado Académico',
      sortable: true,
      render: (row) => {
        if (!row) return <div>N/A</div>
        return (
          <div className="flex items-center">
            <GraduationCap className="h-4 w-4 mr-2 text-purple-500" />
            <span className="text-sm text-gray-700">{row.grado_academico || 'N/A'}</span>
          </div>
        )
      }
    },
    {
      key: 'telefono',
      label: 'Teléfono',
      render: (row) => {
        if (!row) return <span className="text-gray-400 text-sm">N/A</span>
        return row.telefono ? (
          <div className="flex items-center text-gray-600">
            <Phone className="h-4 w-4 mr-2 text-gray-400" />
            <span className="text-sm">{row.telefono}</span>
          </div>
        ) : <span className="text-gray-400 text-sm">Sin teléfono</span>
      }
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (row) => {
        if (!row) return <div>N/A</div>
        return (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleView(row)}
              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title="Ver detalles"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleEdit(row)}
              className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-md transition-colors"
              title="Editar"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDelete(row.id)}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
              title="Eliminar"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )
      }
    }
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Users className="h-8 w-8 mr-3 text-blue-600" />
              Gestión de Docentes
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Administra la información de los docentes del sistema
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              icon={<Upload className="h-4 w-4" />}
              onClick={() => setShowImportModal(true)}
            >
              Importar
            </Button>
            <Button
              variant="primary"
              icon={<Plus className="h-5 w-5" />}
              onClick={handleCreate}
            >
              Nuevo Docente
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Buscar por nombre, código o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="h-5 w-5 text-gray-400" />}
            />
          </div>
          <Button 
            variant="outline" 
            icon={<Filter className="h-4 w-4" />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filtros
          </Button>
          <Button 
            variant="outline" 
            icon={<Upload className="h-4 w-4" />}
            onClick={() => setShowImportModal(true)}
          >
            Importar
          </Button>
          <Button 
            variant="outline" 
            icon={<Download className="h-4 w-4" />}
            onClick={handleExport}
            disabled={loading}
          >
            Exportar
          </Button>
        </div>

        {/* Panel de filtros avanzados */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Especialidad
                </label>
                <Input
                  type="text"
                  placeholder="Filtrar por especialidad..."
                  value={filtrosAvanzados.especialidad}
                  onChange={(e) => setFiltrosAvanzados(prev => ({ ...prev, especialidad: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Grado Académico
                </label>
                <Input
                  type="text"
                  placeholder="Filtrar por grado..."
                  value={filtrosAvanzados.grado_academico}
                  onChange={(e) => setFiltrosAvanzados(prev => ({ ...prev, grado_academico: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estado
                </label>
                <select
                  value={filtrosAvanzados.activo}
                  onChange={(e) => setFiltrosAvanzados(prev => ({ ...prev, activo: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Todos</option>
                  <option value="true">Activos</option>
                  <option value="false">Inactivos</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFiltrosAvanzados({ especialidad: '', grado_academico: '', activo: '' })
                  fetchDocentes()
                }}
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          data={docentes}
          loading={loading}
          emptyMessage="No hay docentes registrados"
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">Mostrar</span>
              <select
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="text-sm text-gray-700">por página</span>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-gray-700">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingDocente ? 'Editar Docente' : 'Nuevo Docente'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre Completo"
              {...register('name', { required: 'El nombre es obligatorio' })}
              error={errors.name?.message}
            />
            <Input
              label="Email"
              type="email"
              {...register('email', { required: 'El email es obligatorio' })}
              error={errors.email?.message}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Código Docente"
              {...register('codigo_docente', { required: 'El código es obligatorio' })}
              error={errors.codigo_docente?.message}
            />
            <Input
              label="Teléfono"
              {...register('telefono')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Especialidad"
              {...register('especialidad', { required: 'La especialidad es obligatoria' })}
              error={errors.especialidad?.message}
            />
            <Input
              label="Grado Académico"
              {...register('grado_academico', { required: 'El grado académico es obligatorio' })}
              error={errors.grado_academico?.message}
            />
          </div>

          <Input
            label="Dirección"
            {...register('direccion')}
          />

          {!editingDocente && (
            <Input
              label="Contraseña *"
              type="password"
              {...register('password', { 
                required: 'La contraseña es obligatoria',
                minLength: { value: 8, message: 'La contraseña debe tener al menos 8 caracteres' }
              })}
              error={errors.password?.message}
            />
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowModal(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              {editingDocente ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Detalles del Docente"
        size="lg"
      >
        {viewingDocente && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                {viewingDocente.data?.user?.name?.charAt(0) || 'D'}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {viewingDocente.data?.user?.name}
                </h3>
                <p className="text-sm text-gray-500">{viewingDocente.data?.codigo_docente}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Email</p>
                <p className="font-medium flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-gray-400" />
                  {viewingDocente.data?.user?.email}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Teléfono</p>
                <p className="font-medium flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                  {viewingDocente.data?.telefono || 'No especificado'}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Especialidad</p>
                <p className="font-medium flex items-center">
                  <Building className="h-4 w-4 mr-2 text-gray-400" />
                  {viewingDocente.data?.especialidad}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Grado Académico</p>
                <p className="font-medium flex items-center">
                  <GraduationCap className="h-4 w-4 mr-2 text-gray-400" />
                  {viewingDocente.data?.grado_academico}
                </p>
              </div>
            </div>

            {viewingDocente.data?.direccion && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Dirección</p>
                <p className="font-medium">{viewingDocente.data?.direccion}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal de Importar */}
      <Modal
        isOpen={showImportModal}
        onClose={() => {
          setShowImportModal(false)
          setImportResult(null)
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        }}
        title="Importar Docentes"
      >
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Selecciona un archivo CSV o Excel con los docentes. Puedes descargar el template para ver el formato requerido.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Archivo (CSV o Excel)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="block w-full text-sm text-gray-500 dark:text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-primary-500 file:text-white
                hover:file:bg-primary-600
                file:cursor-pointer
                border border-gray-300 dark:border-gray-600 rounded-lg"
            />
          </div>

          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
            >
              <Download className="h-4 w-4 mr-2" />
              Descargar Template
            </Button>
          </div>

          {importing && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="mt-2 text-sm text-gray-600">Importando docentes...</p>
            </div>
          )}

          {importResult && (
            <div className={`p-4 rounded-lg ${
              importResult.success 
                ? 'bg-green-50 dark:bg-green-900/20' 
                : 'bg-red-50 dark:bg-red-900/20'
            }`}>
              <p className={`text-sm ${
                importResult.success 
                  ? 'text-green-700 dark:text-green-300' 
                  : 'text-red-700 dark:text-red-300'
              }`}>
                {importResult.message}
              </p>
              {importResult.errors && (
                <ul className="mt-2 text-sm text-red-700 dark:text-red-300 list-disc list-inside">
                  {Object.entries(importResult.errors).map(([key, value]) => (
                    <li key={key}>{key}: {Array.isArray(value) ? value.join(', ') : value}</li>
                  ))}
                </ul>
              )}
              {importResult.data && (
                <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                  <p>Creados: {importResult.data.creados || 0}</p>
                  <p>Actualizados: {importResult.data.actualizados || 0}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={() => {
                setShowImportModal(false)
                setImportResult(null)
                if (fileInputRef.current) {
                  fileInputRef.current.value = ''
                }
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleImport}
              disabled={importing}
            >
              {importing ? 'Importando...' : 'Importar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Docentes
