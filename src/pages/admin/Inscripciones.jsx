import React, { useState, useEffect } from 'react'
import { 
  ClipboardList, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Calendar,
  User,
  GraduationCap,
  DollarSign,
  TrendingUp,
  FileText
} from 'lucide-react'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Table from '../../components/common/Table'
import Modal from '../../components/common/Modal'
import { adminInscripcionService } from '../../services/adminInscripcionService'
import { programaService } from '../../services/planificacionService'
import { estudianteService } from '../../services/estudianteService'
import { exportToCSV } from '../../utils/helpers'
import toast from 'react-hot-toast'
import { X } from 'lucide-react'

const Inscripciones = () => {
  const [inscripciones, setInscripciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [totalRegistros, setTotalRegistros] = useState(0)
  const [from, setFrom] = useState(0)
  const [to, setTo] = useState(0)
  const [sortBy, setSortBy] = useState('fecha')
  const [sortDirection, setSortDirection] = useState('desc')
  const [error, setError] = useState(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showFiltersModal, setShowFiltersModal] = useState(false)
  const [viewingInscripcion, setViewingInscripcion] = useState(null)
  const [programas, setProgramas] = useState([])
  const [estudiantes, setEstudiantes] = useState([])
  const [filtros, setFiltros] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    programa_id: '',
    estudiante_id: ''
  })
  const [stats, setStats] = useState({
    total: 0,
    este_mes: 0,
    este_anio: 0
  })

  useEffect(() => {
    fetchProgramas()
    fetchEstudiantes()
  }, [])

  useEffect(() => {
    // Debounce para la búsqueda
    const timeoutId = setTimeout(() => {
      fetchInscripciones()
    }, 500) // Esperar 500ms después de que el usuario deje de escribir

    return () => clearTimeout(timeoutId)
  }, [searchTerm, filtros, currentPage, perPage, sortBy, sortDirection])

  useEffect(() => {
    fetchEstadisticas()
  }, [])

  const fetchProgramas = async () => {
    try {
      const response = await programaService.getProgramas({ per_page: 100 })
      if (response.success && response.data) {
        const programasData = response.data.data || response.data
        setProgramas(Array.isArray(programasData) ? programasData : [])
      }
    } catch (error) {
      console.error('Error cargando programas:', error)
    }
  }

  const fetchEstudiantes = async () => {
    try {
      const response = await estudianteService.getEstudiantes({ per_page: 100 })
      if (response.success && response.data) {
        const estudiantesData = response.data.data || response.data
        setEstudiantes(Array.isArray(estudiantesData) ? estudiantesData : [])
      }
    } catch (error) {
      console.error('Error cargando estudiantes:', error)
    }
  }

  const fetchInscripciones = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = {
        page: currentPage,
        per_page: perPage,
        sort_by: sortBy,
        sort_direction: sortDirection
      }
      if (searchTerm && searchTerm.trim() !== '') {
        params.search = searchTerm.trim()
      }
      // Agregar filtros
      if (filtros.fecha_inicio) {
        params.fecha_inicio = filtros.fecha_inicio
      }
      if (filtros.fecha_fin) {
        params.fecha_fin = filtros.fecha_fin
      }
      if (filtros.programa_id) {
        params.programa_id = filtros.programa_id
      }
      if (filtros.estudiante_id) {
        params.estudiante_id = filtros.estudiante_id
      }
      const response = await adminInscripcionService.getInscripciones(params)
      
      if (response.success) {
        const data = response.data
        let inscripcionesData = []
        
        // Manejar paginación
        if (data.data && Array.isArray(data.data)) {
          inscripcionesData = data.data
        } else if (Array.isArray(data)) {
          inscripcionesData = data
        }
        
        setInscripciones(inscripcionesData)
        setTotalPages(data.last_page || 1)
        setTotalRegistros(data.total || inscripcionesData.length)
        setFrom(data.from || (inscripcionesData.length > 0 ? 1 : 0))
        setTo(data.to || inscripcionesData.length)
      } else {
        setError('No se pudieron cargar las inscripciones')
        toast.error(response.message || 'Error al cargar inscripciones')
        setInscripciones([])
        setTotalPages(1)
        setTotalRegistros(0)
        setFrom(0)
        setTo(0)
      }
    } catch (error) {
      console.error('Error cargando inscripciones:', error)
      setError('Error al cargar las inscripciones')
      toast.error('Error de conexión al cargar inscripciones')
      setInscripciones([])
      setTotalPages(1)
      setTotalRegistros(0)
      setFrom(0)
      setTo(0)
    } finally {
      setLoading(false)
    }
  }

  const fetchEstadisticas = async () => {
    try {
      const response = await adminInscripcionService.getEstadisticas()
      if (response.success) {
        setStats({
          total: response.data.total || 0,
          este_mes: response.data.este_mes || 0,
          este_anio: response.data.este_anio || 0
        })
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error)
    }
  }

  const handleView = async (inscripcion) => {
    try {
      const response = await adminInscripcionService.getInscripcionById(inscripcion.id)
      if (response.success) {
        setViewingInscripcion(response.data)
        setShowViewModal(true)
      } else {
        toast.error(response.message || 'Error al cargar detalles de la inscripción')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al cargar la inscripción'
      toast.error(errorMessage)
    }
  }

  const handleSort = (column, direction) => {
    setSortBy(column)
    setSortDirection(direction)
    setCurrentPage(1)
  }

  const handleAplicarFiltros = () => {
    setShowFiltersModal(false)
    setCurrentPage(1)
    fetchInscripciones()
  }

  const handleLimpiarFiltros = () => {
    setFiltros({
      fecha_inicio: '',
      fecha_fin: '',
      programa_id: '',
      estudiante_id: ''
    })
    setShowFiltersModal(false)
  }

  const tieneFiltrosActivos = () => {
    return filtros.fecha_inicio || filtros.fecha_fin || filtros.programa_id || filtros.estudiante_id
  }

  const handleExport = async () => {
    try {
      setLoading(true)
      
      // Obtener todas las inscripciones con los filtros aplicados
      const params = {}
      if (searchTerm && searchTerm.trim() !== '') {
        params.search = searchTerm.trim()
      }
      // Agregar filtros
      if (filtros.fecha_inicio) {
        params.fecha_inicio = filtros.fecha_inicio
      }
      if (filtros.fecha_fin) {
        params.fecha_fin = filtros.fecha_fin
      }
      if (filtros.programa_id) {
        params.programa_id = filtros.programa_id
      }
      if (filtros.estudiante_id) {
        params.estudiante_id = filtros.estudiante_id
      }
      // Obtener todos sin paginación para exportar
      params.per_page = 10000
      params.page = 1
      
      const response = await adminInscripcionService.getInscripciones(params)
      
      if (response.success && response.data) {
        let inscripcionesData = []
        
        // Manejar paginación
        if (response.data.data && Array.isArray(response.data.data)) {
          inscripcionesData = response.data.data
        } else if (Array.isArray(response.data)) {
          inscripcionesData = response.data
        }
        
        if (inscripcionesData.length === 0) {
          toast.error('No hay inscripciones para exportar')
          return
        }
        
        const datosExportar = inscripcionesData.map(inscripcion => ({
          'ID': inscripcion.id || '',
          'Fecha': inscripcion.fecha_formatted || (inscripcion.fecha ? new Date(inscripcion.fecha).toLocaleDateString('es-ES') : 'N/A'),
          'Registro Estudiante': inscripcion.estudiante?.registro_estudiante || 'N/A',
          'CI Estudiante': inscripcion.estudiante?.ci || 'N/A',
          'Nombre Estudiante': inscripcion.estudiante?.nombre || 'N/A',
          'Apellido Estudiante': inscripcion.estudiante?.apellido || 'N/A',
          'Email Estudiante': inscripcion.estudiante?.email || 'N/A',
          'Celular Estudiante': inscripcion.estudiante?.celular || 'N/A',
          'Programa': inscripcion.programa?.nombre || 'N/A',
          'Institución': inscripcion.programa?.institucion || 'N/A',
          'Rama Académica': inscripcion.programa?.rama_academica || 'N/A',
          'Tipo Programa': inscripcion.programa?.tipo_programa || 'N/A',
          'Costo Programa': inscripcion.programa?.costo ? `$${inscripcion.programa.costo.toLocaleString('es-ES')}` : 'N/A',
          'Duración (meses)': inscripcion.programa?.duracion_meses || 'N/A',
          'Monto Total Plan': inscripcion.plan_pago?.monto_total ? `$${inscripcion.plan_pago.monto_total.toLocaleString('es-ES')}` : 'N/A',
          'Monto Pagado': inscripcion.plan_pago?.monto_pagado ? `$${inscripcion.plan_pago.monto_pagado.toLocaleString('es-ES')}` : 'N/A',
          'Monto Pendiente': inscripcion.plan_pago?.monto_pendiente ? `$${inscripcion.plan_pago.monto_pendiente.toLocaleString('es-ES')}` : 'N/A',
          'Total Cuotas': inscripcion.plan_pago?.total_cuotas || 'N/A',
          'Cuotas Pagadas': inscripcion.estado_pagos?.cuotas_pagadas || 0,
          'Porcentaje Pagado': inscripcion.estado_pagos?.porcentaje_pagado ? `${inscripcion.estado_pagos.porcentaje_pagado.toFixed(2)}%` : '0%',
          'Descuento': inscripcion.descuento ? `${inscripcion.descuento.nombre} (${inscripcion.descuento.descuento}%)` : 'Sin descuento'
        }))
        
        exportToCSV(datosExportar, `inscripciones_${new Date().toISOString().split('T')[0]}.csv`)
        toast.success(`Se exportaron ${datosExportar.length} inscripciones exitosamente`)
      } else {
        toast.error(response.message || 'Error al exportar inscripciones: No se recibieron datos válidos')
        console.error('Error en exportación:', response)
      }
    } catch (error) {
      console.error('Error al exportar inscripciones:', error)
      toast.error(error.response?.data?.message || error.message || 'Error al exportar inscripciones')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      key: 'fecha',
      label: 'Fecha',
      sortable: true,
      render: (row) => (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-gray-900 dark:text-gray-100">
            {row.fecha_formatted || (row.fecha ? new Date(row.fecha).toLocaleDateString('es-ES') : 'N/A')}
          </span>
        </div>
      )
    },
    {
      key: 'estudiante',
      label: 'Estudiante',
      sortable: true,
      render: (row) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-semibold">
              {row.estudiante?.nombre?.charAt(0) || 'E'}
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {row.estudiante?.nombre} {row.estudiante?.apellido}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              CI: {row.estudiante?.ci} | Reg: {row.estudiante?.registro_estudiante}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'programa',
      label: 'Programa',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {row.programa?.nombre || 'N/A'}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {row.programa?.tipo_programa} - {row.programa?.rama_academica}
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500">
            {row.programa?.institucion}
          </div>
        </div>
      )
    },
    {
      key: 'plan_pago',
      label: 'Plan de Pago',
      render: (row) => {
        const planPago = row.plan_pago
        if (!planPago) {
          return <span className="text-gray-400">Sin plan de pago</span>
        }
        return (
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {planPago.total_cuotas} cuotas
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Total: ${planPago.monto_total?.toLocaleString('es-ES') || '0'}
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500">
              Pagado: ${planPago.monto_pagado?.toLocaleString('es-ES') || '0'} | 
              Pendiente: ${planPago.monto_pendiente?.toLocaleString('es-ES') || '0'}
            </div>
          </div>
        )
      }
    },
    {
      key: 'estado_pagos',
      label: 'Estado Pagos',
      render: (row) => {
        const estadoPagos = row.estado_pagos
        if (!estadoPagos) {
          return <span className="text-gray-400">N/A</span>
        }
        const porcentaje = estadoPagos.porcentaje_pagado || 0
        const isComplete = porcentaje >= 100
        return (
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    isComplete 
                      ? 'bg-success-500' 
                      : porcentaje > 50 
                        ? 'bg-warning-500' 
                        : 'bg-error-500'
                  }`}
                  style={{ width: `${Math.min(porcentaje, 100)}%` }}
                />
              </div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {porcentaje.toFixed(0)}%
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {estadoPagos.cuotas_pagadas}/{estadoPagos.total_cuotas} cuotas pagadas
            </div>
          </div>
        )
      }
    },
    {
      key: 'descuento',
      label: 'Descuento',
      render: (row) => {
        if (!row.descuento) {
          return <span className="text-gray-400">Sin descuento</span>
        }
        return (
          <div>
            <div className="font-medium text-success-600 dark:text-success-400">
              {row.descuento.nombre}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {row.descuento.descuento}%
            </div>
          </div>
        )
      }
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleView(row)}
            className="p-2 rounded-xl text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors duration-200"
            title="Ver detalles"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ]

  if (loading && inscripciones.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-4 mb-4 sm:mb-0">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center shadow-glow">
            <ClipboardList className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text">Gestión de Inscripciones</h1>
            <p className="text-gray-600 dark:text-gray-400">Administra todas las inscripciones de estudiantes a programas</p>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="gradient" shadow="glow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Total Inscripciones</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-glow">
              <FileText className="h-6 w-6 text-white" />
            </div>
          </div>
        </Card>
        
        <Card className="gradient" shadow="glow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Este Mes</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.este_mes}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-success-500 to-success-600 rounded-xl flex items-center justify-center shadow-glow">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
        </Card>
        
        <Card className="gradient" shadow="glow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Este Año</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.este_anio}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center shadow-glow">
              <Calendar className="h-6 w-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Barra de búsqueda y filtros */}
      <Card className="gradient" shadow="glow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por estudiante, CI, programa..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-10"
            />
          </div>
          <Button 
            variant="outline" 
            icon={<Filter className="h-5 w-5" />}
            onClick={() => setShowFiltersModal(true)}
            className={tieneFiltrosActivos() ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : ''}
          >
            Filtros {tieneFiltrosActivos() && `(${Object.values(filtros).filter(f => f).length})`}
          </Button>
          <Button 
            variant="outline" 
            icon={<Download className="h-5 w-5" />}
            onClick={handleExport}
            disabled={loading}
          >
            Exportar
          </Button>
        </div>
      </Card>

      {/* Tabla de inscripciones */}
      <Card className="gradient" shadow="glow-lg">
        <Table
          columns={columns}
          data={inscripciones}
          loading={loading}
          emptyMessage="No se encontraron inscripciones"
          hover
          striped
          onSort={handleSort}
          sortBy={sortBy}
          sortDirection={sortDirection}
          pagination={{
            currentPage,
            totalPages,
            perPage,
            total: totalRegistros,
            from,
            to,
            onPageChange: setCurrentPage,
            onPerPageChange: setPerPage
          }}
        />
      </Card>

      {/* Modal Ver Detalles */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false)
          setViewingInscripcion(null)
        }}
        title="Detalles de la Inscripción"
        size="xl"
      >
        {viewingInscripcion && (
          <div className="space-y-6">
            {/* Información del Estudiante */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-primary-500" />
                Información del Estudiante
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Nombre Completo
                  </label>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {viewingInscripcion.estudiante?.nombre} {viewingInscripcion.estudiante?.apellido}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    CI
                  </label>
                  <p className="text-gray-700 dark:text-gray-300">
                    {viewingInscripcion.estudiante?.ci}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Registro Estudiante
                  </label>
                  <p className="text-gray-700 dark:text-gray-300">
                    {viewingInscripcion.estudiante?.registro_estudiante}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Email
                  </label>
                  <p className="text-gray-700 dark:text-gray-300">
                    {viewingInscripcion.estudiante?.email}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Celular
                  </label>
                  <p className="text-gray-700 dark:text-gray-300">
                    {viewingInscripcion.estudiante?.celular || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Dirección
                  </label>
                  <p className="text-gray-700 dark:text-gray-300">
                    {viewingInscripcion.estudiante?.direccion || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Información del Programa */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <GraduationCap className="h-5 w-5 mr-2 text-primary-500" />
                Información del Programa
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Nombre del Programa
                  </label>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {viewingInscripcion.programa?.nombre}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Institución
                  </label>
                  <p className="text-gray-700 dark:text-gray-300">
                    {viewingInscripcion.programa?.institucion}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Rama Académica
                  </label>
                  <p className="text-gray-700 dark:text-gray-300">
                    {viewingInscripcion.programa?.rama_academica}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Tipo de Programa
                  </label>
                  <p className="text-gray-700 dark:text-gray-300">
                    {viewingInscripcion.programa?.tipo_programa}
                  </p>
                </div>
                {viewingInscripcion.programa?.duracion_meses && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Duración
                  </label>
                  <p className="text-gray-700 dark:text-gray-300">
                    {viewingInscripcion.programa.duracion_meses} meses
                  </p>
                </div>
                )}
                {viewingInscripcion.programa?.costo && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Costo Base
                  </label>
                    <p className="text-gray-700 dark:text-gray-300">
                      ${parseFloat(viewingInscripcion.programa.costo || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                )}
                {viewingInscripcion.costo_base && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Costo Base (Inscripción)
                    </label>
                    <p className="text-gray-700 dark:text-gray-300">
                      ${parseFloat(viewingInscripcion.costo_base || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                )}
                {viewingInscripcion.costo_final && viewingInscripcion.costo_final !== viewingInscripcion.costo_base && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Costo Final (con descuento)
                    </label>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      ${parseFloat(viewingInscripcion.costo_final || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Información de Descuento */}
            {viewingInscripcion.descuento && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
                  Descuento Aplicado
                </h3>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Nombre del Descuento
                      </label>
                      <p className="text-lg font-bold text-green-700 dark:text-green-300">
                        {viewingInscripcion.descuento.nombre}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Porcentaje de Descuento
                      </label>
                      <p className="text-lg font-bold text-green-700 dark:text-green-300">
                        {viewingInscripcion.descuento.descuento}%
                      </p>
                    </div>
                    {viewingInscripcion.costo_base && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Costo Base
                          </label>
                          <p className="text-gray-700 dark:text-gray-300">
                            ${parseFloat(viewingInscripcion.costo_base || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Descuento Aplicado
                          </label>
                          <p className="text-green-600 dark:text-green-400 font-semibold">
                            - ${parseFloat((viewingInscripcion.costo_base * (viewingInscripcion.descuento.descuento / 100)) || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                        {viewingInscripcion.costo_final && (
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                              Costo Final (con descuento)
                            </label>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                              ${parseFloat(viewingInscripcion.costo_final || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Información de Pago */}
            {viewingInscripcion.plan_pago && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <DollarSign className="h-5 w-5 mr-2 text-primary-500" />
                  Información de Pago
                </h3>
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg space-y-4">
                  {!viewingInscripcion.descuento && viewingInscripcion.costo_base && (
                    <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Costo Base:</span> ${parseFloat(viewingInscripcion.costo_base || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        {viewingInscripcion.costo_final && viewingInscripcion.costo_final !== viewingInscripcion.costo_base && (
                          <span className="ml-2 text-green-600 dark:text-green-400">
                            → Costo Final: ${parseFloat(viewingInscripcion.costo_final || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Monto Total
                      </label>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        ${viewingInscripcion.plan_pago.monto_total?.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Monto Pagado
                      </label>
                      <p className="text-lg font-bold text-success-600 dark:text-success-400">
                        ${viewingInscripcion.plan_pago.monto_pagado?.toLocaleString('es-ES') || '0'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Monto Pendiente
                      </label>
                      <p className="text-lg font-bold text-error-600 dark:text-error-400">
                        ${viewingInscripcion.plan_pago.monto_pendiente?.toLocaleString('es-ES') || '0'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Progreso
                      </label>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {viewingInscripcion.estado_pagos?.porcentaje_pagado?.toFixed(1) || '0'}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Cuotas: {viewingInscripcion.plan_pago.cuotas_pagadas}/{viewingInscripcion.plan_pago.total_cuotas} pagadas
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${
                          viewingInscripcion.estado_pagos?.porcentaje_pagado >= 100 
                            ? 'bg-success-500' 
                            : viewingInscripcion.estado_pagos?.porcentaje_pagado > 50 
                              ? 'bg-warning-500' 
                              : 'bg-error-500'
                        }`}
                        style={{ width: `${Math.min(viewingInscripcion.estado_pagos?.porcentaje_pagado || 0, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Detalle de Cuotas */}
                  {viewingInscripcion.plan_pago.cuotas && viewingInscripcion.plan_pago.cuotas.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
                        Detalle de Cuotas
                      </h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {viewingInscripcion.plan_pago.cuotas.map((cuota, index) => (
                          <div key={cuota.id} className="p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  Cuota {index + 1}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {cuota.fecha_ini ? new Date(cuota.fecha_ini).toLocaleDateString('es-ES') : 'N/A'} - 
                                  {cuota.fecha_fin ? new Date(cuota.fecha_fin).toLocaleDateString('es-ES') : 'N/A'}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-gray-900 dark:text-white">
                                  ${cuota.monto?.toLocaleString('es-ES') || '0'}
                                </p>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  cuota.estado === 'Pagado'
                                    ? 'bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-400'
                                    : cuota.estado === 'Retrasado'
                                      ? 'bg-error-100 text-error-800 dark:bg-error-900/20 dark:text-error-400'
                                      : 'bg-warning-100 text-warning-800 dark:bg-warning-900/20 dark:text-warning-400'
                                }`}>
                                  {cuota.estado}
                                  {cuota.estado === 'Retrasado' && cuota.dias_retraso > 0 && (
                                    <span className="ml-1">({cuota.dias_retraso} días)</span>
                                  )}
                                </span>
                              </div>
                            </div>
                            {cuota.pagos && cuota.pagos.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Pagos realizados:</p>
                                {cuota.pagos.map((pago) => (
                                  <div key={pago.id} className="text-xs text-gray-600 dark:text-gray-400">
                                    ${pago.monto?.toLocaleString('es-ES')} - {pago.fecha ? new Date(pago.fecha).toLocaleDateString('es-ES') : 'N/A'} 
                                    {pago.metodo && ` (${pago.metodo})`}
                                    {pago.verificado && <span className="ml-2 text-success-600">✓ Verificado</span>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Descuento */}
            {viewingInscripcion.descuento && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Descuento Aplicado
                </h3>
                <div className="bg-success-50 dark:bg-success-900/20 p-4 rounded-lg">
                  <p className="font-medium text-success-900 dark:text-success-400">
                    {viewingInscripcion.descuento.nombre}
                  </p>
                  <p className="text-sm text-success-700 dark:text-success-500">
                    Descuento: {viewingInscripcion.descuento.descuento}%
                  </p>
                </div>
              </div>
            )}

            {/* Fecha de Inscripción */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Fecha de Inscripción:
                </span>
                <span className="text-sm text-gray-900 dark:text-white">
                  {viewingInscripcion.fecha_formatted || (viewingInscripcion.fecha ? new Date(viewingInscripcion.fecha).toLocaleDateString('es-ES') : 'N/A')}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Filtros */}
      <Modal
        isOpen={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        title="Filtros Avanzados"
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha Inicio
              </label>
              <Input
                type="date"
                value={filtros.fecha_inicio}
                onChange={(e) => setFiltros({ ...filtros, fecha_inicio: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha Fin
              </label>
              <Input
                type="date"
                value={filtros.fecha_fin}
                onChange={(e) => setFiltros({ ...filtros, fecha_fin: e.target.value })}
                min={filtros.fecha_inicio || undefined}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Programa
            </label>
            <select
              value={filtros.programa_id}
              onChange={(e) => setFiltros({ ...filtros, programa_id: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 dark:text-gray-100"
            >
              <option value="">Todos los programas</option>
              {programas.map((programa) => (
                <option key={programa.id} value={programa.id}>
                  {programa.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Estudiante
            </label>
            <select
              value={filtros.estudiante_id}
              onChange={(e) => setFiltros({ ...filtros, estudiante_id: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 dark:text-gray-100"
            >
              <option value="">Todos los estudiantes</option>
              {estudiantes.map((estudiante) => {
                // Usar el id del estudiante (que es el mismo que persona_id ya que Estudiante hereda de Persona)
                const estudianteId = estudiante.id || estudiante.persona_id
                return (
                  <option key={estudianteId || estudiante.registro_estudiante} value={estudianteId}>
                    {estudiante.nombre} {estudiante.apellido} - {estudiante.ci} {estudiante.registro_estudiante ? `(Reg: ${estudiante.registro_estudiante})` : ''}
                  </option>
                )
              })}
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={handleLimpiarFiltros}
              icon={<X className="h-4 w-4" />}
            >
              Limpiar Filtros
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleAplicarFiltros}
            >
              Aplicar Filtros
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Inscripciones
