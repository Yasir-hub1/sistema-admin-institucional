import React, { useState, useEffect } from 'react'
import {
  Building,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Filter,
  Download,
  Upload,
  MapPin,
  Users,
  Layers,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { aulaService } from '../services/aulaService'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Modal from '../components/common/Modal'
import Table from '../components/common/Table'
import Card from '../components/common/Card'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { exportToCSV } from '../utils/helpers'

const Aulas = () => {
  const [aulas, setAulas] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [editingAula, setEditingAula] = useState(null)
  const [viewingAula, setViewingAula] = useState(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const fileInputRef = React.useRef(null)
  const [filtrosAvanzados, setFiltrosAvanzados] = useState({
    tipo: '',
    edificio: '',
    activa: ''
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    fetchAulas()
  }, [currentPage, perPage, searchTerm, filtrosAvanzados])

  const fetchAulas = async () => {
    try {
      setLoading(true)
      const params = {
        page: currentPage,
        per_page: perPage,
        search: searchTerm
      }

      // Agregar filtros avanzados solo si tienen valor
      if (filtrosAvanzados.tipo) {
        params.tipo = filtrosAvanzados.tipo
      }
      if (filtrosAvanzados.edificio) {
        params.edificio = filtrosAvanzados.edificio
      }
      if (filtrosAvanzados.activa !== '') {
        params.activa = filtrosAvanzados.activa
      }

      const response = await aulaService.getAulas(params)
      
      if (response.success && response.data) {
        setAulas(response.data.data || [])
        setTotalPages(response.data.last_page || 1)
      } else {
        toast.error(response.message || 'Error al cargar aulas')
        setAulas([])
        setTotalPages(1)
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error de conexión: No se pudo cargar las aulas'
      toast.error(errorMessage)
      console.error('Error al cargar aulas:', error)
      setAulas([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingAula(null)
    reset({
      codigo_aula: '',
      nombre: '',
      capacidad: 30,
      edificio: '',
      piso: 1,
      tipo: 'aula',
      activa: true
    })
    setShowModal(true)
  }

  const handleEdit = (aula) => {
    setEditingAula(aula)
    reset(aula)
    setShowModal(true)
  }

  const handleView = async (aula) => {
    try {
      const response = await aulaService.getAula(aula.id)
      setViewingAula(response.data)
      setShowViewModal(true)
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al cargar los detalles del aula'
      toast.error(errorMessage)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar esta aula?')) return

    try {
      const response = await aulaService.deleteAula(id)
      if (response.success) {
        toast.success(response.message || 'Aula eliminada exitosamente')
        fetchAulas()
      } else {
        toast.error(response.message || 'Error al eliminar el aula')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al eliminar el aula'
      toast.error(errorMessage)
    }
  }

  const handleExport = async () => {
    try {
      setLoading(true)
      const response = await aulaService.exportarAulas({ 
        search: searchTerm, 
        ...filtrosAvanzados 
      })
      
      if (response.success && response.data && Array.isArray(response.data)) {
        if (response.data.length === 0) {
          toast.error('No hay aulas para exportar')
          return
        }
        
        const datosExportar = response.data.map(aula => ({
          'Código': aula.codigo_aula || '',
          'Nombre': aula.nombre || '',
          'Edificio': aula.edificio || '',
          'Piso': aula.piso || '',
          'Capacidad': aula.capacidad || 0,
          'Tipo': aula.tipo || '',
          'Estado': aula.activa !== false ? 'Activa' : 'Inactiva'
        }))
        
        exportToCSV(datosExportar, `aulas_${new Date().toISOString().split('T')[0]}.csv`)
        toast.success(`Se exportaron ${datosExportar.length} aulas exitosamente`)
      } else {
        toast.error(response.message || 'Error al exportar aulas: No se recibieron datos válidos')
        console.error('Error en exportación:', response)
      }
    } catch (error) {
      console.error('Error al exportar aulas:', error)
      toast.error(error.response?.data?.message || error.message || 'Error al exportar aulas')
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

    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error('Por favor, selecciona un archivo Excel o CSV')
      return
    }

    try {
      setImporting(true)
      setImportResult(null)
      const response = await aulaService.importarAulas(file)
      
      if (response.success) {
        setImportResult({
          success: true,
          message: response.message || 'Aulas importadas exitosamente',
          data: response.data
        })
        toast.success(response.message || 'Aulas importadas exitosamente')
        await fetchAulas()
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
          message: response.message || 'Error al importar aulas',
          errors: response.errors
        })
        toast.error(response.message || 'Error al importar aulas')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al importar aulas'
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
    const template = 'codigo_aula,nombre,edificio,piso,capacidad,tipo,activa\nA-101,Aula 101,Edificio A,1,40,aula,true\nLAB-201,Laboratorio 201,Edificio B,2,25,laboratorio,true\n'
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'template_aulas.csv'
    link.click()
  }

  const onSubmit = async (data) => {
    try {
      // Convertir activa a boolean y números a enteros
      const datosBackend = {
        ...data,
        activa: data.activa === 'true' || data.activa === true || data.activa === '1' || data.activa === 1,
        capacidad: parseInt(data.capacidad),
        piso: parseInt(data.piso)
      }

      let response
      if (editingAula) {
        response = await aulaService.updateAula(editingAula.id, datosBackend)
      } else {
        response = await aulaService.createAula(datosBackend)
      }
      
      if (response.success) {
        toast.success(response.message || (editingAula ? 'Aula actualizada exitosamente' : 'Aula creada exitosamente'))
        setShowModal(false)
        fetchAulas()
        reset()
      } else {
        toast.error(response.message || 'Error al guardar el aula')
        if (response.errors) {
          Object.keys(response.errors).forEach(key => {
            toast.error(`${key}: ${response.errors[key]}`)
          })
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al guardar el aula'
      toast.error(errorMessage)
      if (error.response?.data?.errors) {
        Object.keys(error.response.data.errors).forEach(key => {
          toast.error(`${key}: ${error.response.data.errors[key]}`)
        })
      }
    }
  }

  const getTipoColor = (tipo) => {
    switch(tipo) {
      case 'laboratorio': return 'bg-blue-100 text-blue-800'
      case 'auditorio': return 'bg-purple-100 text-purple-800'
      default: return 'bg-green-100 text-green-800'
    }
  }

  const getTipoLabel = (tipo) => {
    switch(tipo) {
      case 'laboratorio': return 'Laboratorio'
      case 'auditorio': return 'Auditorio'
      default: return 'Aula'
    }
  }

  const columns = [
    {
      key: 'codigo_aula',
      label: 'Código',
      sortable: true,
      render: (row) => (
        <span className="font-mono font-semibold text-purple-600">
          {row.codigo_aula}
        </span>
      )
    },
    {
      key: 'nombre',
      label: 'Aula',
      sortable: true,
      render: (row) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-semibold">
              {row.codigo_aula?.substring(0, 1) || 'A'}
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-900">{row.nombre}</div>
            <div className="text-sm text-gray-500 flex items-center">
              <MapPin className="h-3 w-3 mr-1" />
              Edificio {row.edificio} - Piso {row.piso}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'tipo',
      label: 'Tipo',
      sortable: true,
      render: (row) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTipoColor(row.tipo)}`}>
          {getTipoLabel(row.tipo)}
        </span>
      )
    },
    {
      key: 'capacidad',
      label: 'Capacidad',
      sortable: true,
      render: (row) => (
        <div className="flex items-center text-gray-700">
          <Users className="h-4 w-4 mr-2 text-gray-400" />
          <span className="font-medium">{row.capacidad} personas</span>
        </div>
      )
    },
    {
      key: 'activa',
      label: 'Estado',
      render: (row) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          row.activa ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {row.activa ? (
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
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Building className="h-8 w-8 mr-3 text-purple-600" />
              Gestión de Aulas
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Administra las aulas y espacios físicos del sistema
            </p>
          </div>
          <Button
            variant="primary"
            icon={<Plus className="h-5 w-5" />}
            onClick={handleCreate}
          >
            Nueva Aula
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Buscar por código, nombre o edificio..."
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
                  Tipo
                </label>
                <select
                  value={filtrosAvanzados.tipo}
                  onChange={(e) => setFiltrosAvanzados(prev => ({ ...prev, tipo: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Todos</option>
                  <option value="aula">Aula</option>
                  <option value="laboratorio">Laboratorio</option>
                  <option value="auditorio">Auditorio</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Edificio
                </label>
                <Input
                  type="text"
                  placeholder="Filtrar por edificio..."
                  value={filtrosAvanzados.edificio}
                  onChange={(e) => setFiltrosAvanzados(prev => ({ ...prev, edificio: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estado
                </label>
                <select
                  value={filtrosAvanzados.activa}
                  onChange={(e) => setFiltrosAvanzados(prev => ({ ...prev, activa: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Todos</option>
                  <option value="true">Activas</option>
                  <option value="false">Inactivas</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFiltrosAvanzados({ tipo: '', edificio: '', activa: '' })
                  fetchAulas()
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
          data={aulas}
          loading={loading}
          emptyMessage="No hay aulas registradas"
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
        title={editingAula ? 'Editar Aula' : 'Nueva Aula'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Código de Aula"
              {...register('codigo_aula', { required: 'El código es obligatorio' })}
              error={errors.codigo_aula?.message}
              placeholder="Ej: A-101"
            />
            <Input
              label="Nombre"
              {...register('nombre', { required: 'El nombre es obligatorio' })}
              error={errors.nombre?.message}
              placeholder="Ej: Aula 101"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Edificio"
              {...register('edificio', { required: 'El edificio es obligatorio' })}
              error={errors.edificio?.message}
              placeholder="Ej: A"
            />
            <Input
              label="Piso"
              type="number"
              min="1"
              max="10"
              {...register('piso', {
                required: 'El piso es obligatorio',
                min: 1,
                max: 10
              })}
              error={errors.piso?.message}
            />
            <Input
              label="Capacidad"
              type="number"
              min="1"
              max="500"
              {...register('capacidad', {
                required: 'La capacidad es obligatoria',
                min: 1,
                max: 500
              })}
              error={errors.capacidad?.message}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Aula
              </label>
              <select
                {...register('tipo', { required: 'El tipo es obligatorio' })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="aula">Aula</option>
                <option value="laboratorio">Laboratorio</option>
                <option value="auditorio">Auditorio</option>
              </select>
              {errors.tipo && (
                <p className="mt-1 text-sm text-red-600">{errors.tipo.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                {...register('activa', { 
                  setValueAs: (value) => value === 'true' || value === true || value === '1' || value === 1
                })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="true">Activa</option>
                <option value="false">Inactiva</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowModal(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              {editingAula ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Detalles del Aula"
        size="lg"
      >
        {viewingAula && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                {viewingAula.data?.aula?.codigo_aula?.substring(0, 1) || 'A'}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {viewingAula.data?.aula?.nombre}
                </h3>
                <p className="text-sm text-gray-500">
                  {viewingAula.data?.aula?.codigo_aula}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Edificio</p>
                <p className="font-medium flex items-center">
                  <Building className="h-4 w-4 mr-2 text-gray-400" />
                  Edificio {viewingAula.data?.aula?.edificio}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Piso</p>
                <p className="font-medium flex items-center">
                  <Layers className="h-4 w-4 mr-2 text-gray-400" />
                  Piso {viewingAula.data?.aula?.piso}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Capacidad</p>
                <p className="font-medium flex items-center">
                  <Users className="h-4 w-4 mr-2 text-gray-400" />
                  {viewingAula.data?.aula?.capacidad} personas
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Tipo</p>
                <p className="font-medium">
                  {getTipoLabel(viewingAula.data?.aula?.tipo)}
                </p>
              </div>
            </div>

            <div className={`p-4 rounded-lg ${
              viewingAula.data?.aula?.activa ? 'bg-green-50' : 'bg-red-50'
            }`}>
              <p className="text-xs text-gray-500 mb-1">Estado</p>
              <p className={`text-lg font-bold ${
                viewingAula.data?.aula?.activa ? 'text-green-600' : 'text-red-600'
              }`}>
                {viewingAula.data?.aula?.activa ? 'Activa' : 'Inactiva'}
              </p>
            </div>
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
        title="Importar Aulas"
      >
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Selecciona un archivo CSV o Excel con las aulas. Puedes descargar el template para ver el formato requerido.
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
              <p className="mt-2 text-sm text-gray-600">Importando aulas...</p>
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

export default Aulas
