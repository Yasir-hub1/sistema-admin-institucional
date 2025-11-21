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
  GraduationCap,
  Building,
  CheckCircle,
  XCircle,
  Calendar,
  BookOpen,
  UserCheck
} from 'lucide-react'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Modal from '../components/common/Modal'
import Table from '../components/common/Table'
import Card from '../components/common/Card'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { grupoService } from '../services/grupoService'
import { materiaService } from '../services/materiaService'
import { gestionAcademicaService } from '../services/gestionAcademicaService'
import { exportToCSV } from '../utils/helpers'

const Grupos = () => {
  const [grupos, setGrupos] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [editingGrupo, setEditingGrupo] = useState(null)
  const [viewingGrupo, setViewingGrupo] = useState(null)
  const [materias, setMaterias] = useState([])
  const [gestiones, setGestiones] = useState([])
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const fileInputRef = React.useRef(null)
  const [filtrosAvanzados, setFiltrosAvanzados] = useState({
    gestion_id: '',
    materia_id: '',
    activo: ''
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    fetchGrupos()
    fetchMaterias()
    fetchGestiones()
  }, [currentPage, perPage, searchTerm, filtrosAvanzados])

  const fetchGrupos = async () => {
    try {
      setLoading(true)
      const params = {
        page: currentPage,
        per_page: perPage,
        search: searchTerm
      }

      // Agregar filtros avanzados solo si tienen valor
      if (filtrosAvanzados.gestion_id) {
        params.gestion_id = filtrosAvanzados.gestion_id
      }
      if (filtrosAvanzados.materia_id) {
        params.materia_id = filtrosAvanzados.materia_id
      }
      if (filtrosAvanzados.activo !== '') {
        params.activo = filtrosAvanzados.activo
      }

      const response = await grupoService.getGrupos(params)
      
      if (response.success && response.data) {
        setGrupos(response.data.data || [])
        setTotalPages(response.data.last_page || 1)
      } else {
        toast.error(response.message || 'Error al cargar grupos')
        setGrupos([])
      setTotalPages(1)
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error de conexión: No se pudo cargar los grupos'
      toast.error(errorMessage)
      console.error('Error al cargar grupos:', error)
      setGrupos([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  const fetchMaterias = async () => {
    try {
      const response = await materiaService.getMaterias({ per_page: 100 })
      if (response.success) {
        setMaterias(response.data?.data || [])
      }
    } catch (error) {
      console.error('Error al cargar materias:', error)
    }
  }

  const fetchGestiones = async () => {
    try {
      const response = await gestionAcademicaService.getGestiones({ per_page: 100 })
      if (response.success) {
        setGestiones(response.data?.data || [])
      }
    } catch (error) {
      console.error('Error al cargar gestiones:', error)
    }
  }

  const columns = [
    {
      key: 'nombre',
      label: 'Grupo',
      sortable: true,
      render: (row) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-semibold">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-900">{row.nombre}</div>
            <div className="text-sm text-gray-500">{row.codigo}</div>
          </div>
        </div>
      )
    },
    {
      key: 'materia',
      label: 'Materia',
      sortable: true,
      render: (row) => (
        <div className="flex items-center space-x-2">
          <BookOpen className="h-4 w-4 text-gray-400" />
          <span className="text-gray-900">{row.materia}</span>
        </div>
      )
    },
    {
      key: 'docente',
      label: 'Docente',
      sortable: true,
      render: (row) => (
        <div className="flex items-center space-x-2">
          <GraduationCap className="h-4 w-4 text-gray-400" />
          <span className="text-gray-900">{row.docente}</span>
        </div>
      )
    },
    {
      key: 'estudiantes',
      label: 'Estudiantes',
      sortable: true,
      render: (row) => (
        <div className="flex items-center space-x-2">
          <UserCheck className="h-4 w-4 text-gray-400" />
          <span className="font-medium text-gray-900">{row.estudiantes}</span>
        </div>
      )
    },
    {
      key: 'estado',
      label: 'Estado',
      sortable: true,
      render: (row) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          row.estado === 'activo' 
            ? 'bg-success-100 text-success-800' 
            : 'bg-error-100 text-error-800'
        }`}>
          {row.estado === 'activo' ? (
            <CheckCircle className="h-3 w-3 mr-1" />
          ) : (
            <XCircle className="h-3 w-3 mr-1" />
          )}
          {row.estado}
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

  const handleView = (grupo) => {
    setViewingGrupo(grupo)
    setShowViewModal(true)
  }

  const handleEdit = (grupo) => {
    setEditingGrupo(grupo)
    reset({
      materia_id: grupo.materia_id || grupo.materia?.id,
      gestion_id: grupo.gestion_id || grupo.gestion?.id,
      numero_grupo: grupo.numero_grupo,
      cupo_maximo: grupo.cupo_maximo
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este grupo?')) return
    
    try {
      setLoading(true)
      const response = await grupoService.deleteGrupo(id)
      
      if (response.success) {
        toast.success(response.message || 'Grupo eliminado exitosamente')
        await fetchGrupos()
      } else {
        toast.error(response.message || 'Error al eliminar grupo')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al eliminar grupo'
      toast.error(errorMessage)
      console.error('Error al eliminar grupo:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      setLoading(true)
      const response = await grupoService.exportarGrupos({ 
        search: searchTerm, 
        ...filtrosAvanzados 
      })
      
      if (response.success && response.data && Array.isArray(response.data)) {
        if (response.data.length === 0) {
          toast.error('No hay grupos para exportar')
          return
        }
        
        const datosExportar = response.data.map(grupo => ({
          'Código': grupo.codigo || grupo.nombre_completo || '',
          'Número Grupo': grupo.numero_grupo || '',
          'Materia': grupo.materia?.nombre || '',
          'Gestión': grupo.gestion?.nombre || grupo.gestion?.anio || '',
          'Cupo Máximo': grupo.cupo_maximo || 0,
          'Estudiantes': grupo.estudiantes || 0,
          'Turno': grupo.turno || '',
          'Estado': grupo.activo !== false ? 'Activo' : 'Inactivo'
        }))
        
        exportToCSV(datosExportar, `grupos_${new Date().toISOString().split('T')[0]}.csv`)
        toast.success(`Se exportaron ${datosExportar.length} grupos exitosamente`)
      } else {
        toast.error(response.message || 'Error al exportar grupos: No se recibieron datos válidos')
        console.error('Error en exportación:', response)
      }
      } catch (error) {
      console.error('Error al exportar grupos:', error)
      toast.error(error.response?.data?.message || error.message || 'Error al exportar grupos')
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
      const response = await grupoService.importarGrupos(file)
      
      if (response.success) {
        setImportResult({
          success: true,
          message: response.message || 'Grupos importados exitosamente',
          data: response.data
        })
        toast.success(response.message || 'Grupos importados exitosamente')
        await fetchGrupos()
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
          message: response.message || 'Error al importar grupos',
          errors: response.errors
        })
        toast.error(response.message || 'Error al importar grupos')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al importar grupos'
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
    const template = 'materia_id,gestion_id,numero_grupo,cupo_maximo,turno\n1,1,1,40,mañana\n1,1,2,40,tarde\n'
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'template_grupos.csv'
    link.click()
  }

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      
      // Preparar datos para el backend
      const datosBackend = {
        materia_id: parseInt(data.materia_id),
        gestion_id: parseInt(data.gestion_id),
        numero_grupo: parseInt(data.numero_grupo),
        cupo_maximo: parseInt(data.cupo_maximo)
      }

      let response
      
      if (editingGrupo) {
        response = await grupoService.updateGrupo(editingGrupo.id, datosBackend)
      } else {
        response = await grupoService.createGrupo(datosBackend)
      }
      
      if (response.success) {
        toast.success(response.message || (editingGrupo ? 'Grupo actualizado exitosamente' : 'Grupo creado exitosamente'))
      setShowModal(false)
      setEditingGrupo(null)
      reset()
        await fetchGrupos()
      } else {
        toast.error(response.message || 'Error al guardar grupo')
        if (response.errors) {
          console.error('Errores de validación:', response.errors)
          Object.keys(response.errors).forEach(key => {
            toast.error(`${key}: ${response.errors[key]}`)
          })
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al guardar grupo'
      toast.error(errorMessage)
      console.error('Error al guardar grupo:', error)
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
    setEditingGrupo(null)
    reset()
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-4 mb-4 sm:mb-0">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center shadow-glow">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text">Gestión de Grupos</h1>
            <p className="text-gray-600 dark:text-gray-400">Administra los grupos académicos</p>
          </div>
        </div>
        <Button
          variant="primary"
          icon={<Plus className="h-5 w-5" />}
          onClick={() => setShowModal(true)}
        >
          Nuevo Grupo
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="gradient" shadow="glow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Total Grupos</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{grupos.length}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-glow">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
        </Card>
        
        <Card className="gradient" shadow="glow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Grupos Activos</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {grupos.filter(g => g.estado === 'activo').length}
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
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Total Estudiantes</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {grupos.reduce((sum, g) => sum + g.estudiantes, 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center shadow-glow">
              <UserCheck className="h-6 w-6 text-white" />
            </div>
          </div>
        </Card>
        
        <Card className="gradient" shadow="glow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Promedio por Grupo</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {grupos.length > 0 ? Math.round(grupos.reduce((sum, g) => sum + g.estudiantes, 0) / grupos.length) : 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-warning-500 to-warning-600 rounded-xl flex items-center justify-center shadow-glow">
              <Calendar className="h-6 w-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabla de Grupos */}
      <Card className="gradient" shadow="glow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h3 className="text-xl font-bold gradient-text mb-4 sm:mb-0">Lista de Grupos</h3>
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar grupos..."
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

        {/* Panel de filtros avanzados */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Gestión Académica
                </label>
                <select
                  value={filtrosAvanzados.gestion_id}
                  onChange={(e) => setFiltrosAvanzados(prev => ({ ...prev, gestion_id: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Todas</option>
                  {gestiones.map(gestion => (
                    <option key={gestion.id} value={gestion.id}>
                      {gestion.nombre} ({gestion.año})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Materia
                </label>
                <select
                  value={filtrosAvanzados.materia_id}
                  onChange={(e) => setFiltrosAvanzados(prev => ({ ...prev, materia_id: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Todas</option>
                  {materias.map(materia => (
                    <option key={materia.id} value={materia.id}>
                      {materia.nombre}
                    </option>
                  ))}
                </select>
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
                  setFiltrosAvanzados({ gestion_id: '', materia_id: '', activo: '' })
                  fetchGrupos()
                }}
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        )}
        
        <Table
          columns={columns}
          data={grupos}
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
        title={editingGrupo ? 'Editar Grupo' : 'Nuevo Grupo'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Materia *
              </label>
              <select
                {...register('materia_id', { required: 'La materia es obligatoria' })}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Seleccionar materia...</option>
                {materias.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.codigo_materia} - {m.nombre} ({m.sigla})
                  </option>
                ))}
              </select>
              {errors.materia_id && (
                <p className="mt-1 text-sm text-error-600">{errors.materia_id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Gestión Académica *
              </label>
              <select
                {...register('gestion_id', { required: 'La gestión académica es obligatoria' })}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Seleccionar gestión...</option>
                {gestiones.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.anio} - {g.periodo} {g.activa ? '(Activa)' : ''}
                  </option>
                ))}
              </select>
              {errors.gestion_id && (
                <p className="mt-1 text-sm text-error-600">{errors.gestion_id.message}</p>
              )}
            </div>
            
            <Input
              label="Número de Grupo *"
              type="number"
              min="1"
              placeholder="Ej: 1"
              error={errors.numero_grupo?.message}
              {...register('numero_grupo', { 
                required: 'El número de grupo es obligatorio',
                min: { value: 1, message: 'El número debe ser mayor a 0' }
              })}
            />
            
            <Input
              label="Cupo Máximo *"
              type="number"
              min="1"
              max="100"
              placeholder="Ej: 30"
              error={errors.cupo_maximo?.message}
              {...register('cupo_maximo', { 
                required: 'El cupo máximo es obligatorio',
                min: { value: 1, message: 'El cupo debe ser mayor a 0' },
                max: { value: 100, message: 'El cupo máximo es 100' }
              })}
            />
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
              {editingGrupo ? 'Actualizar' : 'Crear'} Grupo
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Ver */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Detalles del Grupo"
        size="lg"
      >
        {viewingGrupo && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre
                </label>
                <p className="text-gray-900 dark:text-gray-100">{viewingGrupo.nombre}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Código
                </label>
                <p className="text-gray-900 dark:text-gray-100">{viewingGrupo.codigo}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Gestión
                </label>
                <p className="text-gray-900 dark:text-gray-100">{viewingGrupo.gestion}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Materia
                </label>
                <p className="text-gray-900 dark:text-gray-100">{viewingGrupo.materia}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Docente
                </label>
                <p className="text-gray-900 dark:text-gray-100">{viewingGrupo.docente}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estudiantes
                </label>
                <p className="text-gray-900 dark:text-gray-100">{viewingGrupo.estudiantes}</p>
              </div>
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
        title="Importar Grupos"
        size="lg"
      >
        <div className="space-y-6">
          <div className="p-4 bg-info-50 dark:bg-info-900/20 rounded-lg">
            <h4 className="font-semibold text-info-900 dark:text-info-100 mb-2">Formato del archivo</h4>
            <p className="text-sm text-info-700 dark:text-info-300 mb-2">
              El archivo debe ser Excel (.xlsx, .xls) o CSV con las siguientes columnas:
            </p>
            <ul className="text-sm text-info-700 dark:text-info-300 list-disc list-inside space-y-1">
              <li><strong>materia_id</strong> (obligatorio)</li>
              <li><strong>gestion_id</strong> (obligatorio)</li>
              <li><strong>numero_grupo</strong> (obligatorio)</li>
              <li><strong>cupo_maximo</strong> (opcional)</li>
              <li><strong>turno</strong> (opcional: mañana, tarde, noche)</li>
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Seleccionar archivo
            </label>
            <div className="flex items-center space-x-4">
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
              <Button
                variant="outline"
                size="sm"
                onClick={downloadTemplate}
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar Template
              </Button>
            </div>
          </div>

          {importing && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="mt-2 text-sm text-gray-600">Importando grupos...</p>
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

export default Grupos