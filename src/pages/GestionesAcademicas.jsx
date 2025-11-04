import React, { useState, useEffect, useRef } from 'react'
import {
  Calendar,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  CalendarDays,
  TrendingUp,
  Building,
  Download,
  Upload,
  Filter,
  X
} from 'lucide-react'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Modal from '../components/common/Modal'
import Table from '../components/common/Table'
import Card from '../components/common/Card'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { gestionAcademicaService } from '../services/gestionAcademicaService'
import { exportToCSV } from '../utils/helpers'

const GestionesAcademicas = () => {
  const [gestiones, setGestiones] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingGestion, setEditingGestion] = useState(null)
  const [viewingGestion, setViewingGestion] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const fileInputRef = useRef(null)
  const [filtrosAvanzados, setFiltrosAvanzados] = useState({
    año: '',
    periodo: '',
    activa: ''
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    fetchGestiones()
  }, [currentPage, perPage, searchTerm, filtrosAvanzados])

  const fetchGestiones = async () => {
    try {
      setLoading(true)
      const response = await gestionAcademicaService.getGestiones({
        page: currentPage,
        per_page: perPage,
        search: searchTerm,
        ...filtrosAvanzados
      })
      
      console.log('📊 GestionesAcademicas.jsx - Response recibida:', response)
      console.log('📊 GestionesAcademicas.jsx - response.success:', response.success)
      console.log('📊 GestionesAcademicas.jsx - response.data:', response.data)
      
      if (response.success && response.data) {
        // response.data es el objeto paginado: { data: [...], last_page: 1, total: X, ... }
        const gestionesArray = response.data.data || []
        const lastPage = response.data.last_page || 1
        
        console.log('✅ GestionesAcademicas.jsx - Gestiones array:', gestionesArray)
        console.log('✅ GestionesAcademicas.jsx - Total gestiones:', gestionesArray.length)
        console.log('✅ GestionesAcademicas.jsx - Last page:', lastPage)
        
        setGestiones(gestionesArray)
        setTotalPages(lastPage)
      } else {
        console.error('❌ GestionesAcademicas.jsx - Response sin éxito:', response)
        toast.error(response.message || 'Error al cargar gestiones académicas')
        setGestiones([])
        setTotalPages(1)
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error de conexión: No se pudo cargar las gestiones académicas'
      toast.error(errorMessage)
      console.error('Error al cargar gestiones académicas:', error)
      setGestiones([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingGestion(null)
    reset({
      nombre: '',
      año: new Date().getFullYear(),
      periodo: 1,
      fecha_inicio: '',
      fecha_fin: '',
      activa: false
    })
    setShowModal(true)
  }

  const handleEdit = (gestion) => {
    setEditingGestion(gestion)
    reset({
      nombre: gestion.nombre,
      año: gestion.año || gestion.anio,
      periodo: gestion.periodo,
      fecha_inicio: gestion.fecha_inicio ? gestion.fecha_inicio.split('T')[0] : '',
      fecha_fin: gestion.fecha_fin ? gestion.fecha_fin.split('T')[0] : '',
      activa: gestion.activa || false
    })
    setShowModal(true)
  }

  const handleView = async (gestion) => {
    try {
      const response = await gestionAcademicaService.getGestion(gestion.id)
      if (response.success) {
        setViewingGestion(response.data)
        setShowViewModal(true)
      } else {
        toast.error(response.message || 'Error al cargar los detalles de la gestión')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al cargar los detalles de la gestión'
      toast.error(errorMessage)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta gestión académica?')) return
    
    try {
      setLoading(true)
      const response = await gestionAcademicaService.deleteGestion(id)
      
      if (response.success) {
        toast.success(response.message || 'Gestión académica eliminada exitosamente')
        await fetchGestiones()
      } else {
        toast.error(response.message || 'Error al eliminar la gestión académica')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al eliminar la gestión académica'
      toast.error(errorMessage)
      console.error('Error al eliminar gestión académica:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleActivar = async (id) => {
    try {
      const response = await gestionAcademicaService.activarGestion(id)
      if (response.success) {
        toast.success('Gestión académica activada exitosamente')
        await fetchGestiones()
      } else {
        toast.error(response.message || 'Error al activar la gestión académica')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al activar la gestión académica'
      toast.error(errorMessage)
    }
  }

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      
      // Preparar datos para el backend
      const datosBackend = {
        nombre: data.nombre,
        año: parseInt(data.año),
        periodo: parseInt(data.periodo),
        fecha_inicio: data.fecha_inicio,
        fecha_fin: data.fecha_fin,
        activa: data.activa === 'true' || data.activa === true || data.activa === '1' || data.activa === 1
      }

      let response
      
      if (editingGestion) {
        response = await gestionAcademicaService.updateGestion(editingGestion.id, datosBackend)
      } else {
        response = await gestionAcademicaService.createGestion(datosBackend)
      }
      
      if (response.success) {
        toast.success(response.message || (editingGestion ? 'Gestión académica actualizada exitosamente' : 'Gestión académica creada exitosamente'))
        setShowModal(false)
        setEditingGestion(null)
        reset()
        await fetchGestiones()
      } else {
        toast.error(response.message || 'Error al guardar la gestión académica')
        if (response.errors) {
          Object.keys(response.errors).forEach(key => {
            toast.error(`${key}: ${response.errors[key]}`)
          })
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al guardar la gestión académica'
      toast.error(errorMessage)
      console.error('Error al guardar gestión académica:', error)
      if (error.response?.data?.errors) {
        Object.keys(error.response.data.errors).forEach(key => {
          toast.error(`${key}: ${error.response.data.errors[key]}`)
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingGestion(null)
    reset()
  }

  const handleExport = async () => {
    try {
      setLoading(true)
      const response = await gestionAcademicaService.exportarGestiones({
        search: searchTerm,
        ...filtrosAvanzados
      })
      
      if (response.success && response.data) {
        const datosExportar = response.data.map(gestion => ({
          'Nombre': gestion.nombre || '',
          'Año': gestion.año || gestion.anio || '',
          'Periodo': gestion.periodo || '',
          'Fecha Inicio': gestion.fecha_inicio || '',
          'Fecha Fin': gestion.fecha_fin || '',
          'Activa': gestion.activa ? 'Sí' : 'No',
          'Creado': gestion.created_at || ''
        }))
        
        exportToCSV(datosExportar, `gestiones_academicas_${new Date().toISOString().split('T')[0]}.csv`)
        toast.success('Gestiones académicas exportadas exitosamente')
      } else {
        toast.error(response.message || 'Error al exportar gestiones académicas')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Error al exportar gestiones académicas')
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
      const response = await gestionAcademicaService.importarGestiones(file)
      
      if (response.success) {
        setImportResult({
          success: true,
          message: response.message || 'Gestiones académicas importadas exitosamente',
          data: response.data
        })
        toast.success(response.message || 'Gestiones académicas importadas exitosamente')
        await fetchGestiones()
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
          message: response.message || 'Error al importar gestiones académicas',
          errors: response.errors
        })
        toast.error(response.message || 'Error al importar gestiones académicas')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al importar gestiones académicas'
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
    const template = 'nombre,año,periodo,fecha_inicio,fecha_fin,activa\nGestión 2024,2024,1,2024-01-01,2024-06-30,0\nGestión 2024-2,2024,2,2024-07-01,2024-12-31,0\n'
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'template_gestiones_academicas.csv'
    link.click()
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
              <CalendarDays className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">{row.nombre}</div>
            <div className="text-sm text-gray-500">{row.año || row.anio} - Periodo {row.periodo}</div>
          </div>
        </div>
      )
    },
    {
      key: 'periodo',
      label: 'Año/Periodo',
      sortable: true,
      render: (row) => (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-gray-900 dark:text-gray-100">
            {row.año || row.anio} - P{row.periodo}
          </span>
        </div>
      )
    },
    {
      key: 'fecha_inicio',
      label: 'Fecha Inicio',
      sortable: true,
      render: (row) => {
        const fecha = row.fecha_inicio ? new Date(row.fecha_inicio).toLocaleDateString('es-ES') : 'N/A'
        return (
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-gray-900 dark:text-gray-100">{fecha}</span>
          </div>
        )
      }
    },
    {
      key: 'fecha_fin',
      label: 'Fecha Fin',
      sortable: true,
      render: (row) => {
        const fecha = row.fecha_fin ? new Date(row.fecha_fin).toLocaleDateString('es-ES') : 'N/A'
        return (
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-gray-900 dark:text-gray-100">{fecha}</span>
          </div>
        )
      }
    },
    {
      key: 'activa',
      label: 'Estado',
      sortable: true,
      render: (row) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          row.activa 
            ? 'bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-400' 
            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
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
          <Button
            variant="ghost"
            size="sm"
            icon={<Eye className="h-4 w-4" />}
            onClick={() => handleView(row)}
          />
          {!row.activa && (
            <Button
              variant="success"
              size="sm"
              icon={<CheckCircle className="h-4 w-4" />}
              onClick={() => handleActivar(row.id)}
              title="Activar gestión"
            />
          )}
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
            <CalendarDays className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text">Gestión Académica</h1>
            <p className="text-gray-600 dark:text-gray-400">Administra los periodos académicos</p>
          </div>
        </div>
        <Button
          variant="primary"
          icon={<Plus className="h-5 w-5" />}
          onClick={handleCreate}
        >
          Nueva Gestión
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="gradient" shadow="glow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Total Gestiones</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{gestiones.length}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-glow">
              <CalendarDays className="h-6 w-6 text-white" />
            </div>
          </div>
        </Card>
        
        <Card className="gradient" shadow="glow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Gestiones Activas</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {gestiones.filter(g => g.activa).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-success-500 to-success-600 rounded-xl flex items-center justify-center shadow-glow">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
          </div>
        </Card>
        
        <Card className="gradient" shadow="glow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Año Actual</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {new Date().getFullYear()}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center shadow-glow">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
        </Card>
        
        <Card className="gradient" shadow="glow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Gestión Activa</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {gestiones.find(g => g.activa)?.nombre || 'Ninguna'}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-info-500 to-info-600 rounded-xl flex items-center justify-center shadow-glow">
              <Building className="h-6 w-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabla de Gestiones */}
      <Card className="gradient" shadow="glow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h3 className="text-xl font-bold gradient-text mb-4 sm:mb-0">Lista de Gestiones Académicas</h3>
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar gestiones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                icon={<Filter className="h-4 w-4" />}
                onClick={() => setShowFilters(!showFilters)}
              >
                Filtros
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                icon={<Download className="h-4 w-4" />}
                onClick={handleExport}
                disabled={loading}
              >
                Exportar
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                icon={<Upload className="h-4 w-4" />}
                onClick={() => setShowImportModal(true)}
              >
                Importar
              </Button>
            </div>
          </div>
        </div>

        {/* Panel de Filtros Avanzados */}
        {showFilters && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Filtros Avanzados</h4>
              <Button
                variant="ghost"
                size="sm"
                icon={<X className="h-4 w-4" />}
                onClick={() => {
                  setShowFilters(false)
                  setFiltrosAvanzados({ año: '', periodo: '', activa: '' })
                }}
              >
                Limpiar
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Año
                </label>
                <Input
                  type="number"
                  placeholder="Ej: 2024"
                  value={filtrosAvanzados.año}
                  onChange={(e) => setFiltrosAvanzados({ ...filtrosAvanzados, año: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Periodo
                </label>
                <Input
                  type="number"
                  placeholder="Ej: 1"
                  value={filtrosAvanzados.periodo}
                  onChange={(e) => setFiltrosAvanzados({ ...filtrosAvanzados, periodo: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Estado
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  value={filtrosAvanzados.activa}
                  onChange={(e) => setFiltrosAvanzados({ ...filtrosAvanzados, activa: e.target.value })}
                >
                  <option value="">Todos</option>
                  <option value="1">Activa</option>
                  <option value="0">Inactiva</option>
                </select>
              </div>
            </div>
          </div>
        )}
        
        <Table
          columns={columns}
          data={gestiones}
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

      {/* Modal de Crear/Editar */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingGestion ? 'Editar Gestión Académica' : 'Nueva Gestión Académica'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input
              label="Nombre *"
              placeholder="Ej: Gestión 2024-I"
              error={errors.nombre?.message}
              {...register('nombre', { required: 'El nombre es obligatorio' })}
            />
            
            <Input
              label="Año *"
              type="number"
              min="2000"
              max="2100"
              placeholder="Ej: 2024"
              error={errors.año?.message}
              {...register('año', { 
                required: 'El año es obligatorio',
                min: { value: 2000, message: 'El año mínimo es 2000' },
                max: { value: 2100, message: 'El año máximo es 2100' }
              })}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Período *
              </label>
              <select
                {...register('periodo', { required: 'El período es obligatorio' })}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Seleccionar período</option>
                <option value="1">Primer Semestre (I)</option>
                <option value="2">Segundo Semestre (II)</option>
              </select>
              {errors.periodo && (
                <p className="mt-1 text-sm text-error-600">{errors.periodo.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estado
              </label>
              <select
                {...register('activa', { 
                  setValueAs: (value) => value === 'true' || value === true || value === '1' || value === 1
                })}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
              >
                <option value="false">Inactiva</option>
                <option value="true">Activa</option>
              </select>
            </div>
            
            <Input
              label="Fecha Inicio *"
              type="date"
              error={errors.fecha_inicio?.message}
              {...register('fecha_inicio', { required: 'La fecha de inicio es obligatoria' })}
            />
            
            <Input
              label="Fecha Fin *"
              type="date"
              error={errors.fecha_fin?.message}
              {...register('fecha_fin', { 
                required: 'La fecha de fin es obligatoria',
                validate: (value) => {
                  const fechaInicio = document.querySelector('input[name="fecha_inicio"]')?.value
                  if (fechaInicio && value <= fechaInicio) {
                    return 'La fecha de fin debe ser posterior a la fecha de inicio'
                  }
                  return true
                }
              })}
            />
          </div>

          <div className="p-3 bg-info-50 dark:bg-info-900/20 rounded-lg">
            <p className="text-xs text-info-700 dark:text-info-300">
              Nota: Si marcas esta gestión como activa, las demás gestiones se desactivarán automáticamente.
            </p>
          </div>
          
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseModal}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={<Plus className="h-5 w-5" />}
            >
              {editingGestion ? 'Actualizar' : 'Crear'} Gestión
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Ver */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Detalles de la Gestión Académica"
        size="lg"
      >
        {viewingGestion && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre
                </label>
                <p className="text-gray-900 dark:text-gray-100">{viewingGestion.nombre}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Año
                </label>
                <p className="text-gray-900 dark:text-gray-100">{viewingGestion.año || viewingGestion.anio}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Período
                </label>
                <p className="text-gray-900 dark:text-gray-100">
                  {viewingGestion.periodo === 1 ? 'Primer Semestre (I)' : 'Segundo Semestre (II)'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estado
                </label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  viewingGestion.activa 
                    ? 'bg-success-100 text-success-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {viewingGestion.activa ? 'Activa' : 'Inactiva'}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha Inicio
                </label>
                <p className="text-gray-900 dark:text-gray-100">
                  {viewingGestion.fecha_inicio ? new Date(viewingGestion.fecha_inicio).toLocaleDateString('es-ES') : 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha Fin
                </label>
                <p className="text-gray-900 dark:text-gray-100">
                  {viewingGestion.fecha_fin ? new Date(viewingGestion.fecha_fin).toLocaleDateString('es-ES') : 'N/A'}
                </p>
              </div>
            </div>

            {viewingGestion.grupos && viewingGestion.grupos.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Grupos Asociados
                </label>
                <p className="text-gray-900 dark:text-gray-100">{viewingGestion.grupos.length} grupos</p>
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
        title="Importar Gestiones Académicas"
      >
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Selecciona un archivo CSV o Excel con las gestiones académicas. Puedes descargar el template para ver el formato requerido.
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

export default GestionesAcademicas

