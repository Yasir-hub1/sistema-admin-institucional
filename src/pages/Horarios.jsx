import React, { useState, useEffect } from 'react'
import {
  Clock,
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
  UserCheck,
  MapPin,
  Users,
  Zap
} from 'lucide-react'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Modal from '../components/common/Modal'
import Table from '../components/common/Table'
import Card from '../components/common/Card'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { horarioService } from '../services/horarioService'
import { gestionAcademicaService } from '../services/gestionAcademicaService'
import { grupoService } from '../services/grupoService'
import { docenteService } from '../services/docenteService'
import { aulaService } from '../services/aulaService'
import { exportToCSV } from '../utils/helpers'

const Horarios = () => {
  const [horarios, setHorarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [editingHorario, setEditingHorario] = useState(null)
  const [viewingHorario, setViewingHorario] = useState(null)
  const [grupos, setGrupos] = useState([])
  const [docentes, setDocentes] = useState([])
  const [aulas, setAulas] = useState([])
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const fileInputRef = React.useRef(null)
  const [filtrosAvanzados, setFiltrosAvanzados] = useState({
    gestion_id: '',
    docente_id: '',
    dia_semana: ''
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    fetchHorarios()
    fetchGrupos()
    fetchDocentes()
    fetchAulas()
  }, [currentPage, perPage, searchTerm, filtrosAvanzados])

  const fetchHorarios = async () => {
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
      if (filtrosAvanzados.docente_id) {
        params.docente_id = filtrosAvanzados.docente_id
      }
      if (filtrosAvanzados.dia_semana) {
        params.dia_semana = filtrosAvanzados.dia_semana
      }

      const response = await horarioService.getHorarios(params)
      
      if (response.success && response.data) {
        setHorarios(response.data.data || [])
        setTotalPages(response.data.last_page || 1)
      } else {
        toast.error(response.message || 'Error al cargar horarios')
        setHorarios([])
        setTotalPages(1)
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error de conexión: No se pudo cargar los horarios'
      toast.error(errorMessage)
      console.error('Error al cargar horarios:', error)
      setHorarios([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  const fetchGrupos = async () => {
    try {
      const response = await grupoService.getGrupos({ per_page: 100 })
      if (response.success) {
        setGrupos(response.data?.data || [])
      }
    } catch (error) {
      console.error('Error al cargar grupos:', error)
    }
  }

  const fetchDocentes = async () => {
    try {
      const response = await docenteService.getDocentes({ per_page: 100 })
      if (response.success) {
        setDocentes(response.data?.data || [])
      }
    } catch (error) {
      console.error('Error al cargar docentes:', error)
    }
  }

  const fetchAulas = async () => {
    try {
      const response = await aulaService.getAulas({ per_page: 100 })
      if (response.success) {
        setAulas(response.data?.data || [])
      }
    } catch (error) {
      console.error('Error al cargar aulas:', error)
    }
  }

  // Mapear día de texto a número
  const diaToNumero = (dia) => {
    const dias = {
      'Lunes': 1,
      'Martes': 2,
      'Miércoles': 3,
      'Jueves': 4,
      'Viernes': 5,
      'Sábado': 6
    }
    return dias[dia] || dia
  }

  // Mapear número a día de texto
  const numeroToDia = (numero) => {
    const dias = {
      1: 'Lunes',
      2: 'Martes',
      3: 'Miércoles',
      4: 'Jueves',
      5: 'Viernes',
      6: 'Sábado'
    }
    return dias[numero] || numero
  }

  const columns = [
    {
      key: 'docente',
      label: 'Docente',
      sortable: true,
      render: (row) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-semibold">
              <GraduationCap className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-900">{row.docente}</div>
            <div className="text-sm text-gray-500">{row.materia}</div>
          </div>
        </div>
      )
    },
    {
      key: 'grupo',
      label: 'Grupo',
      sortable: true,
      render: (row) => (
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4 text-gray-400" />
          <span className="text-gray-900">{row.grupo}</span>
        </div>
      )
    },
    {
      key: 'aula',
      label: 'Aula',
      sortable: true,
      render: (row) => (
        <div className="flex items-center space-x-2">
          <Building className="h-4 w-4 text-gray-400" />
          <span className="text-gray-900">{row.aula}</span>
        </div>
      )
    },
    {
      key: 'dia',
      label: 'Día',
      sortable: true,
      render: (row) => (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-gray-900">{row.dia}</span>
        </div>
      )
    },
    {
      key: 'hora_inicio',
      label: 'Horario',
      sortable: true,
      render: (row) => (
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-gray-400" />
          <span className="text-gray-900">{row.hora_inicio} - {row.hora_fin}</span>
        </div>
      )
    },
    {
      key: 'estudiantes_inscritos',
      label: 'Ocupación',
      sortable: true,
      render: (row) => (
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">{row.estudiantes_inscritos}/{row.capacidad}</div>
          <div className="text-xs text-gray-500">
            {Math.round((row.estudiantes_inscritos / row.capacidad) * 100)}% ocupado
          </div>
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

  const handleView = (horario) => {
    setViewingHorario(horario)
    setShowViewModal(true)
  }

  const handleEdit = (horario) => {
    setEditingHorario(horario)
    reset({
      grupo_id: horario.grupo_id || horario.grupo?.id,
      docente_id: horario.docente_id || horario.docente?.id,
      aula_id: horario.aula_id || horario.aula?.id,
      dia_semana: horario.dia_semana || horario.dia,
      hora_inicio: horario.hora_inicio,
      hora_fin: horario.hora_fin
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este horario?')) return
    
    try {
      setLoading(true)
      const response = await horarioService.deleteHorario(id)
      
      if (response.success) {
        toast.success(response.message || 'Horario eliminado exitosamente')
        await fetchHorarios()
      } else {
        toast.error(response.message || 'Error al eliminar horario')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al eliminar horario'
      toast.error(errorMessage)
      console.error('Error al eliminar horario:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      setLoading(true)
      const response = await horarioService.exportarHorarios({ search: searchTerm, ...filtrosAvanzados })
      
      if (response.success && response.data) {
        // Si el backend devuelve un blob, descargarlo directamente
        if (response.data instanceof Blob) {
          const url = window.URL.createObjectURL(response.data)
          const link = document.createElement('a')
          link.href = url
          link.download = `horarios_${new Date().toISOString().split('T')[0]}.xlsx`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
          toast.success('Horarios exportados exitosamente')
        } else {
          // Si devuelve datos, convertir a CSV
          const datosExportar = response.data.map(horario => ({
            'Día': horario.dia || '',
            'Hora Inicio': horario.hora_inicio || '',
            'Hora Fin': horario.hora_fin || '',
            'Materia': horario.materia || '',
            'Grupo': horario.grupo || '',
            'Docente': horario.docente || '',
            'Aula': horario.aula || ''
          }))
          
          exportToCSV(datosExportar, `horarios_${new Date().toISOString().split('T')[0]}.csv`)
          toast.success('Horarios exportados exitosamente')
        }
      } else {
        toast.error(response.message || 'Error al exportar horarios')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Error al exportar horarios')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error('Por favor, selecciona un archivo Excel o CSV')
      return
    }

    setImporting(true)
    setImportResult(null)

    try {
      // Para horarios, necesitamos usar el servicio de importación si existe
      // Por ahora, mostramos un mensaje de que no está disponible
      toast.error('La funcionalidad de importación de horarios aún no está disponible')
      setImporting(false)
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al importar horarios'
      toast.error(errorMessage)
      setImporting(false)
    }
  }

  const downloadTemplate = () => {
    const template = 'grupo_id,docente_id,aula_id,dia_semana,hora_inicio,hora_fin\n1,1,1,1,08:00,10:00\n1,1,1,3,10:00,12:00\n'
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'template_horarios.csv'
    link.click()
  }

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      
      // Preparar datos para el backend
      const datosBackend = {
        grupo_id: parseInt(data.grupo_id),
        docente_id: parseInt(data.docente_id),
        aula_id: parseInt(data.aula_id),
        dia_semana: typeof data.dia_semana === 'string' ? diaToNumero(data.dia_semana) : parseInt(data.dia_semana),
        hora_inicio: data.hora_inicio,
        hora_fin: data.hora_fin
      }

      let response
      
      if (editingHorario) {
        response = await horarioService.updateHorario(editingHorario.id, datosBackend)
      } else {
        response = await horarioService.createHorario(datosBackend)
      }
      
      if (response.success) {
        toast.success(response.message || (editingHorario ? 'Horario actualizado exitosamente' : 'Horario creado exitosamente'))
        setShowModal(false)
        setEditingHorario(null)
        reset()
        await fetchHorarios()
      } else {
        toast.error(response.message || 'Error al guardar horario')
        if (response.errors) {
          console.error('Errores de validación:', response.errors)
          // Mostrar errores específicos
          Object.keys(response.errors).forEach(key => {
            toast.error(`${key}: ${response.errors[key]}`)
          })
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al guardar horario'
      toast.error(errorMessage)
      console.error('Error al guardar horario:', error)
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
    setEditingHorario(null)
    reset()
  }

  const [gestiones, setGestiones] = useState([])
  const [gestionSeleccionada, setGestionSeleccionada] = useState(null)
  const [generandoAutomatico, setGenerandoAutomatico] = useState(false)

  useEffect(() => {
    fetchGestiones()
  }, [])

  const fetchGestiones = async () => {
    try {
      const result = await gestionAcademicaService.getGestiones({ per_page: 100 })
      if (result.success) {
        setGestiones(result.data?.data || [])
        const activa = result.data?.data?.find(g => g.activa)
        if (activa) {
          setGestionSeleccionada(activa.id)
        }
      }
    } catch (error) {
      console.error('Error al cargar gestiones:', error)
    }
  }

  const handleGenerarAutomatico = async () => {
    if (!gestionSeleccionada) {
      toast.error('Selecciona una gestión académica primero')
      return
    }

    if (!window.confirm('¿Deseas generar horarios automáticamente? Esto asignará horarios a todos los grupos sin horario asignado de la gestión seleccionada.')) {
      return
    }

    try {
      setGenerandoAutomatico(true)
      const result = await horarioService.generarAutomatico({
        gestion_id: parseInt(gestionSeleccionada)
      })

      if (result.success) {
        const mensaje = result.data?.horarios_generados > 0
          ? `Se generaron ${result.data.horarios_generados} horarios exitosamente`
          : 'No se pudieron generar horarios'
        
        toast.success(mensaje)
        
        if (result.data?.fallidos && result.data.fallidos.length > 0) {
          toast.warning(`${result.data.fallidos.length} grupos no pudieron asignarse: ${result.data.fallidos.slice(0, 3).join(', ')}${result.data.fallidos.length > 3 ? '...' : ''}`, {
            duration: 5000
          })
        }
        
        await fetchHorarios()
      } else {
        toast.error(result.message || 'Error al generar horarios')
      }
    } catch (error) {
      console.error('Error al generar horarios automáticamente:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Error al generar horarios automáticamente'
      toast.error(errorMessage)
    } finally {
      setGenerandoAutomatico(false)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center shadow-glow">
            <Clock className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text">Gestión de Horarios</h1>
            <p className="text-gray-600 dark:text-gray-400">Administra los horarios académicos</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="primary"
            icon={<Plus className="h-5 w-5" />}
            onClick={() => setShowModal(true)}
          >
            Nuevo Horario
          </Button>
          {gestionSeleccionada && (
            <Button
              onClick={handleGenerarAutomatico}
              disabled={generandoAutomatico}
              variant="success"
              icon={<Zap className="h-5 w-5" />}
              loading={generandoAutomatico}
            >
              {generandoAutomatico ? 'Generando...' : 'Generar Automático'}
            </Button>
          )}
        </div>
      </div>

      {/* Selector de gestión para generación automática */}
      {gestiones.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Gestión Académica para Generación Automática:
            </label>
            <select
              value={gestionSeleccionada || ''}
              onChange={(e) => setGestionSeleccionada(e.target.value)}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 text-sm"
            >
              <option value="">Seleccionar gestión...</option>
              {gestiones.map(g => (
                <option key={g.id} value={g.id}>
                  {g.nombre} {g.activa && '(Activa)'}
                </option>
              ))}
            </select>
          </div>
        </Card>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="gradient" shadow="glow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Total Horarios</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{horarios.length}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-glow">
              <Clock className="h-6 w-6 text-white" />
            </div>
          </div>
        </Card>
        
        <Card className="gradient" shadow="glow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Horarios Activos</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {horarios.filter(h => h.estado === 'activo').length}
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
                {horarios.reduce((sum, h) => sum + h.estudiantes_inscritos, 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center shadow-glow">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
        </Card>
        
        <Card className="gradient" shadow="glow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Ocupación Promedio</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {horarios.length > 0 ? Math.round(horarios.reduce((sum, h) => sum + (h.estudiantes_inscritos / h.capacidad), 0) / horarios.length * 100) : 0}%
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-warning-500 to-warning-600 rounded-xl flex items-center justify-center shadow-glow">
              <MapPin className="h-6 w-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabla de Horarios */}
      <Card className="gradient" shadow="glow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h3 className="text-xl font-bold gradient-text mb-4 sm:mb-0">Lista de Horarios</h3>
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar horarios..."
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
                  {/* Las gestiones se cargan desde el backend si es necesario */}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Docente
                </label>
                <select
                  value={filtrosAvanzados.docente_id}
                  onChange={(e) => setFiltrosAvanzados(prev => ({ ...prev, docente_id: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Todos</option>
                  {docentes.map(docente => (
                    <option key={docente.id} value={docente.id}>
                      {docente.user?.name || docente.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Día de la Semana
                </label>
                <select
                  value={filtrosAvanzados.dia_semana}
                  onChange={(e) => setFiltrosAvanzados(prev => ({ ...prev, dia_semana: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Todos</option>
                  <option value="1">Lunes</option>
                  <option value="2">Martes</option>
                  <option value="3">Miércoles</option>
                  <option value="4">Jueves</option>
                  <option value="5">Viernes</option>
                  <option value="6">Sábado</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFiltrosAvanzados({ gestion_id: '', docente_id: '', dia_semana: '' })
                  fetchHorarios()
                }}
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        )}
        
        <Table
          columns={columns}
          data={horarios}
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
        title={editingHorario ? 'Editar Horario' : 'Nuevo Horario'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Grupo *
              </label>
              <select
                {...register('grupo_id', { required: 'El grupo es obligatorio' })}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Seleccionar grupo...</option>
                {grupos.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.materia?.nombre || 'N/A'} - Grupo {g.numero_grupo || 'N/A'} - {g.gestion?.anio || 'N/A'}
                  </option>
                ))}
              </select>
              {errors.grupo_id && (
                <p className="mt-1 text-sm text-error-600">{errors.grupo_id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Docente *
              </label>
              <select
                {...register('docente_id', { required: 'El docente es obligatorio' })}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Seleccionar docente...</option>
                {docentes.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.user?.name || d.codigo_docente}
                  </option>
                ))}
              </select>
              {errors.docente_id && (
                <p className="mt-1 text-sm text-error-600">{errors.docente_id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Aula *
              </label>
              <select
                {...register('aula_id', { required: 'El aula es obligatoria' })}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Seleccionar aula...</option>
                {aulas.filter(a => a.activa).map(a => (
                  <option key={a.id} value={a.id}>
                    {a.nombre} - {a.edificio} - Piso {a.piso} (Cap: {a.capacidad})
                  </option>
                ))}
              </select>
              {errors.aula_id && (
                <p className="mt-1 text-sm text-error-600">{errors.aula_id.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Día de la Semana *
              </label>
              <select
                {...register('dia_semana', { required: 'El día es obligatorio' })}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Seleccionar día</option>
                <option value="1">Lunes</option>
                <option value="2">Martes</option>
                <option value="3">Miércoles</option>
                <option value="4">Jueves</option>
                <option value="5">Viernes</option>
                <option value="6">Sábado</option>
              </select>
              {errors.dia_semana && (
                <p className="mt-1 text-sm text-error-600">{errors.dia_semana.message}</p>
              )}
            </div>
            
            <Input
              label="Hora Inicio"
              type="time"
              error={errors.hora_inicio?.message}
              {...register('hora_inicio', { required: 'La hora de inicio es obligatoria' })}
            />
            
            <Input
              label="Hora Fin"
              type="time"
              error={errors.hora_fin?.message}
              {...register('hora_fin', { required: 'La hora de fin es obligatoria' })}
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
              {editingHorario ? 'Actualizar' : 'Crear'} Horario
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Ver */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Detalles del Horario"
        size="lg"
      >
        {viewingHorario && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Docente
                </label>
                <p className="text-gray-900 dark:text-gray-100">{viewingHorario.docente}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Materia
                </label>
                <p className="text-gray-900 dark:text-gray-100">{viewingHorario.materia}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Grupo
                </label>
                <p className="text-gray-900 dark:text-gray-100">{viewingHorario.grupo}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Aula
                </label>
                <p className="text-gray-900 dark:text-gray-100">{viewingHorario.aula}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Día
                </label>
                <p className="text-gray-900 dark:text-gray-100">{viewingHorario.dia}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Horario
                </label>
                <p className="text-gray-900 dark:text-gray-100">{viewingHorario.hora_inicio} - {viewingHorario.hora_fin}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estado
                </label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  viewingHorario.estado === 'activo' 
                    ? 'bg-success-100 text-success-800' 
                    : 'bg-error-100 text-error-800'
                }`}>
                  {viewingHorario.estado}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ocupación
                </label>
                <p className="text-gray-900 dark:text-gray-100">
                  {viewingHorario.estudiantes_inscritos}/{viewingHorario.capacidad} estudiantes
                </p>
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
        title="Importar Horarios"
        size="lg"
      >
        <div className="space-y-6">
          <div className="p-4 bg-info-50 dark:bg-info-900/20 rounded-lg">
            <h4 className="font-semibold text-info-900 dark:text-info-100 mb-2">Formato del archivo</h4>
            <p className="text-sm text-info-700 dark:text-info-300 mb-2">
              El archivo debe ser Excel (.xlsx, .xls) o CSV con las siguientes columnas:
            </p>
            <ul className="text-sm text-info-700 dark:text-info-300 list-disc list-inside space-y-1">
              <li><strong>grupo_id</strong> (obligatorio)</li>
              <li><strong>docente_id</strong> (obligatorio)</li>
              <li><strong>aula_id</strong> (obligatorio)</li>
              <li><strong>dia_semana</strong> (obligatorio: 1-6)</li>
              <li><strong>hora_inicio</strong> (obligatorio: HH:mm)</li>
              <li><strong>hora_fin</strong> (obligatorio: HH:mm)</li>
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
                accept=".xlsx,.xls,.csv"
                onChange={handleImport}
                disabled={importing}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
              <Button
                type="button"
                variant="outline"
                icon={<Download className="h-4 w-4" />}
                onClick={downloadTemplate}
              >
                Template
              </Button>
            </div>
          </div>

          {importing && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="mt-2 text-sm text-gray-600">Importando horarios...</p>
            </div>
          )}

          {importResult && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Resultado de la importación</h4>
              <div className="space-y-2">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong className="text-success-600">Creados:</strong> {importResult.creados || 0}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong className="text-info-600">Actualizados:</strong> {importResult.actualizados || 0}
                </p>
                {importResult.errores && importResult.errores.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-semibold text-error-600 mb-2">Errores:</p>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {importResult.errores.map((error, index) => (
                        <p key={index} className="text-xs text-error-600">{error}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default Horarios