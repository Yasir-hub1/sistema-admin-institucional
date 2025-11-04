import React, { useState, useEffect } from 'react'
import {
  ClipboardList,
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
  Clock,
  UserCheck,
  QrCode,
  Smartphone,
  MapPin
} from 'lucide-react'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Modal from '../components/common/Modal'
import Table from '../components/common/Table'
import Card from '../components/common/Card'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { horarioService } from '../services/horarioService'
import { docenteService } from '../services/docenteService'
import { asistenciaService } from '../services/asistenciaService'
import RegistroGeolocalizacion from '../components/asistencias/RegistroGeolocalizacion'
import QRScanner from '../components/asistencias/QRScanner'
import { exportToCSV } from '../utils/helpers'

const Asistencias = () => {
  const { user } = useAuth()
  const [asistencias, setAsistencias] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showGeoModal, setShowGeoModal] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [editingAsistencia, setEditingAsistencia] = useState(null)
  const [viewingAsistencia, setViewingAsistencia] = useState(null)
  const [horarioSeleccionado, setHorarioSeleccionado] = useState(null)
  const [docenteSeleccionado, setDocenteSeleccionado] = useState(null)
  const [horarios, setHorarios] = useState([])
  const [docentes, setDocentes] = useState([])
  const [cargandoHorarios, setCargandoHorarios] = useState(false)
  const [qrData, setQrData] = useState(null)

  const { register, handleSubmit, reset, formState: { errors }, getValues } = useForm()

  useEffect(() => {
    fetchAsistencias()
    if (user?.rol === 'docente') {
      fetchDocenteActual()
    } else {
      fetchDocentes()
      fetchHorarios() // Cargar horarios para el formulario
    }
  }, [currentPage, perPage, searchTerm, user])

  const fetchAsistencias = async () => {
    try {
      setLoading(true)
      const response = await asistenciaService.getAsistencias({
        page: currentPage,
        per_page: perPage,
        search: searchTerm
      })
      
      if (response.success && response.data) {
        // Asegurar que los datos tienen la estructura correcta
        const asistenciasData = response.data.data || []
        setAsistencias(asistenciasData)
        setTotalPages(response.data.last_page || 1)
      } else {
        toast.error(response.message || 'Error al cargar asistencias')
        setAsistencias([])
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error de conexión: No se pudo cargar las asistencias'
      toast.error(errorMessage)
      console.error('Error al cargar asistencias:', error)
      setAsistencias([])
    } finally {
      setLoading(false)
    }
  }

  const fetchDocenteActual = async () => {
    try {
      // Si es docente, obtener su perfil de docente
      const docentesResult = await docenteService.getDocentes({ search: user.email })
      if (docentesResult.success && docentesResult.data?.data?.length > 0) {
        const docente = docentesResult.data.data[0]
        setDocenteSeleccionado(docente)
        // Obtener horarios del docente
        const horariosResult = await horarioService.getHorarios({ docente_id: docente.id })
        if (horariosResult.success) {
          setHorarios(horariosResult.data?.data || [])
        }
      }
    } catch (error) {
      console.error('Error al obtener docente:', error)
    }
  }

  const fetchDocentes = async () => {
    try {
      const result = await docenteService.getDocentes({ per_page: 100 })
      if (result.success) {
        setDocentes(result.data?.data || [])
      }
    } catch (error) {
      console.error('Error al cargar docentes:', error)
    }
  }

  const fetchHorarios = async (docenteId = null) => {
    try {
      setCargandoHorarios(true)
      const params = {}
      if (docenteId) {
        params.docente_id = docenteId
      }
      const result = await horarioService.getHorarios({ ...params, per_page: 100 })
      if (result.success) {
        setHorarios(result.data?.data || [])
      }
    } catch (error) {
      console.error('Error al cargar horarios:', error)
      toast.error('Error al cargar horarios')
    } finally {
      setCargandoHorarios(false)
    }
  }

  const handleOpenGeoModal = async () => {
    try {
      if (user?.rol === 'docente') {
        // Si es docente, obtener su perfil si no está cargado
        if (!docenteSeleccionado) {
          await fetchDocenteActual()
        }
        
        // Si tiene docente y horarios, usar el primer horario disponible
        if (docenteSeleccionado && horarios.length > 0) {
          setHorarioSeleccionado(horarios[0])
          setDocenteSeleccionado(docenteSeleccionado)
          setShowGeoModal(true)
        } else if (docenteSeleccionado && horarios.length === 0) {
          toast.error('No tienes horarios asignados para registrar asistencia')
        } else {
          toast.error('No se pudo obtener tu información de docente')
        }
      } else {
        // Si no es docente, mostrar selector de horario/docente primero
        setShowGeoModal(true)
      }
    } catch (error) {
      console.error('Error al abrir modal de geolocalización:', error)
      toast.error('Error al abrir el modal de geolocalización')
    }
  }

  const handleGenerateQR = async (asistencia) => {
    try {
      // Obtener el horario_id desde la asistencia
      // La asistencia puede venir con horario_id directo o con la relación horario cargada
      let horarioId = asistencia.horario_id
      
      // Si no hay horario_id directo, intentar obtenerlo de la relación
      if (!horarioId && asistencia.horario) {
        horarioId = asistencia.horario.id || asistencia.horario
      }
      
      // Si aún no hay horario_id, intentar obtenerlo desde el horario del row
      if (!horarioId && asistencia.horario_id === undefined) {
        // Buscar en la estructura de datos del backend
        if (asistencia.horario?.id) {
          horarioId = asistencia.horario.id
        }
      }
      
      // Validar que el horarioId sea un número válido
      horarioId = parseInt(horarioId)
      
      if (!horarioId || isNaN(horarioId) || horarioId <= 0) {
        toast.error('No se pudo obtener un horario válido para generar el código QR. Por favor, selecciona un horario primero.')
        console.error('Horario ID inválido:', asistencia)
        
        // Si es docente, intentar usar el primer horario disponible
        if (user?.rol === 'docente' && horarios.length > 0) {
          const primerHorario = horarios[0]
          if (primerHorario && primerHorario.id) {
            const result = await asistenciaService.generarQR(primerHorario.id)
            if (result.success) {
              setQrData(result.data)
              setShowQRModal(true)
              toast.success('Código QR generado usando tu próximo horario')
            }
          }
        }
        return
      }
      
      const result = await asistenciaService.generarQR(horarioId)
      
      if (result.success) {
        setQrData(result.data)
        setShowQRModal(true)
        toast.success('Código QR generado exitosamente')
      } else {
        toast.error(result.message || 'Error al generar código QR')
      }
    } catch (error) {
      console.error('Error al generar QR:', error)
      console.error('Asistencia recibida:', asistencia)
      const errorMessage = error.response?.data?.message || error.message || 'Error al generar código QR'
      toast.error(errorMessage)
    }
  }

  const columns = [
    {
      key: 'docente',
      label: 'Docente',
      sortable: true,
      render: (row) => {
        // Extraer datos de la estructura real del backend
        const docente = row.docente?.user?.name || row.docente || row.horario?.docente?.user?.name || 'N/A'
        const materia = row.horario?.grupo?.materia?.nombre || row.materia || 'N/A'
        return (
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-semibold">
                <GraduationCap className="h-5 w-5" />
              </div>
            </div>
            <div>
              <div className="font-medium text-gray-900">{docente}</div>
              <div className="text-sm text-gray-500">{materia}</div>
            </div>
          </div>
        )
      }
    },
    {
      key: 'grupo',
      label: 'Grupo',
      sortable: true,
      render: (row) => {
        const grupo = row.horario?.grupo?.numero_grupo || row.grupo || 'N/A'
        return (
          <div className="flex items-center space-x-2">
            <UserCheck className="h-4 w-4 text-gray-400" />
            <span className="text-gray-900">{grupo}</span>
          </div>
        )
      }
    },
    {
      key: 'aula',
      label: 'Aula',
      sortable: true,
      render: (row) => {
        const aula = row.horario?.aula?.nombre || row.aula || 'N/A'
        return (
          <div className="flex items-center space-x-2">
            <Building className="h-4 w-4 text-gray-400" />
            <span className="text-gray-900">{aula}</span>
          </div>
        )
      }
    },
    {
      key: 'fecha',
      label: 'Fecha',
      sortable: true,
      render: (row) => (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-gray-900">{row.fecha}</span>
        </div>
      )
    },
    {
      key: 'hora_inicio',
      label: 'Horario',
      sortable: true,
      render: (row) => {
        const horaInicio = row.horario?.hora_inicio || row.hora_inicio || 'N/A'
        const horaFin = row.horario?.hora_fin || row.hora_fin || 'N/A'
        return (
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-gray-900">{horaInicio} - {horaFin}</span>
          </div>
        )
      }
    },
    {
      key: 'estado',
      label: 'Estado',
      sortable: true,
      render: (row) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          row.estado === 'presente' 
            ? 'bg-success-100 text-success-800' 
            : row.estado === 'tardanza'
            ? 'bg-warning-100 text-warning-800'
            : 'bg-error-100 text-error-800'
        }`}>
          {row.estado === 'presente' ? (
            <CheckCircle className="h-3 w-3 mr-1" />
          ) : row.estado === 'tardanza' ? (
            <Clock className="h-3 w-3 mr-1" />
          ) : (
            <XCircle className="h-3 w-3 mr-1" />
          )}
          {row.estado}
        </span>
      )
    },
    {
      key: 'porcentaje_asistencia',
      label: 'Asistencia',
      sortable: true,
      render: (row) => (
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">{row.porcentaje_asistencia}%</div>
          <div className="text-xs text-gray-500">{row.estudiantes_presentes}/{row.estudiantes_totales}</div>
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
            icon={<QrCode className="h-4 w-4" />}
            onClick={() => handleGenerateQR(row)}
            title="Generar código QR para este horario"
          />
          <Button
            variant="ghost"
            size="sm"
            icon={<Edit2 className="h-4 w-4" />}
            onClick={() => handleEdit(row)}
          />
        </div>
      )
    }
  ]

  const handleView = (asistencia) => {
    setViewingAsistencia(asistencia)
    setShowViewModal(true)
  }

  const handleEdit = (asistencia) => {
    setEditingAsistencia(asistencia)
    reset(asistencia)
    setShowModal(true)
  }

  const handleExport = async () => {
    try {
      setLoading(true)
      const response = await asistenciaService.exportarAsistencias({ 
        search: searchTerm,
        docente_id: docenteSeleccionado?.id 
      })
      
      if (response.success && response.data) {
        // Si el backend devuelve un blob, descargarlo directamente
        if (response.data instanceof Blob) {
          const url = window.URL.createObjectURL(response.data)
          const link = document.createElement('a')
          link.href = url
          link.download = `asistencias_${new Date().toISOString().split('T')[0]}.xlsx`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
          toast.success('Asistencias exportadas exitosamente')
        } else {
          // Si devuelve datos, convertir a CSV
          const datosExportar = response.data.map(asistencia => ({
            'Fecha': asistencia.fecha || '',
            'Docente': asistencia.docente || asistencia.horario?.docente?.user?.name || '',
            'Materia': asistencia.horario?.grupo?.materia?.nombre || asistencia.materia || '',
            'Grupo': asistencia.horario?.grupo?.numero_grupo || asistencia.grupo || '',
            'Aula': asistencia.horario?.aula?.nombre || asistencia.aula || '',
            'Estado': asistencia.estado || '',
            'Hora Inicio': asistencia.horario?.hora_inicio || '',
            'Hora Fin': asistencia.horario?.hora_fin || ''
          }))
          
          exportToCSV(datosExportar, `asistencias_${new Date().toISOString().split('T')[0]}.csv`)
          toast.success('Asistencias exportadas exitosamente')
        }
      } else {
        toast.error(response.message || 'Error al exportar asistencias')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Error al exportar asistencias')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      
      if (editingAsistencia) {
        // Actualizar asistencia existente
        const result = await asistenciaService.updateAsistencia(editingAsistencia.id, {
          horario_id: data.horario_id || editingAsistencia.horario_id,
          docente_id: data.docente_id || editingAsistencia.docente_id,
          fecha: data.fecha,
          estado: data.estado || 'presente',
          observaciones: data.observaciones
        })
        
        if (result.success) {
          toast.success('Asistencia actualizada exitosamente')
          await fetchAsistencias()
          setShowModal(false)
          setEditingAsistencia(null)
          reset()
        } else {
          toast.error(result.message || 'Error al actualizar asistencia')
        }
      } else {
        // Crear nueva asistencia
        // Necesitamos obtener horario_id y docente_id desde los selectores
        if (!data.horario_id || !data.docente_id) {
          toast.error('Debes seleccionar un horario y docente')
          return
        }
        
        const result = await asistenciaService.registrarAsistencia({
          horario_id: data.horario_id,
          docente_id: data.docente_id,
          fecha: data.fecha,
          estado: data.estado || 'presente',
          observaciones: data.observaciones,
          latitud: data.latitud,
          longitud: data.longitud
        })
        
        if (result.success) {
          toast.success('Asistencia registrada exitosamente')
          await fetchAsistencias()
          setShowModal(false)
          setEditingAsistencia(null)
          reset()
        } else {
          toast.error(result.message || 'Error al registrar asistencia')
          if (result.errors) {
            console.error('Errores de validación:', result.errors)
          }
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al guardar asistencia'
      toast.error(errorMessage)
      console.error('Error al guardar asistencia:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingAsistencia(null)
    reset()
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
            <h1 className="text-3xl font-bold gradient-text">Control de Asistencias</h1>
            <p className="text-gray-600 dark:text-gray-400">Registra y gestiona las asistencias</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="primary"
            icon={<Plus className="h-5 w-5" />}
            onClick={() => setShowModal(true)}
          >
            Nueva Asistencia
          </Button>
          <Button
            variant="success"
            icon={<MapPin className="h-5 w-5" />}
            onClick={handleOpenGeoModal}
          >
            Geolocalización
          </Button>
          <Button
            variant="info"
            icon={<QrCode className="h-5 w-5" />}
            onClick={() => setShowQRScanner(true)}
          >
            Escanear QR
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="gradient" shadow="glow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Total Registros</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{asistencias.length}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-glow">
              <ClipboardList className="h-6 w-6 text-white" />
            </div>
          </div>
        </Card>
        
        <Card className="gradient" shadow="glow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Presentes</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {asistencias.filter(a => a.estado === 'presente').length}
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
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Tardanzas</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {asistencias.filter(a => a.estado === 'tardanza').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-warning-500 to-warning-600 rounded-xl flex items-center justify-center shadow-glow">
              <Clock className="h-6 w-6 text-white" />
            </div>
          </div>
        </Card>
        
        <Card className="gradient" shadow="glow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Promedio Asistencia</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {asistencias.length > 0 ? Math.round(asistencias.reduce((sum, a) => sum + a.porcentaje_asistencia, 0) / asistencias.length) : 0}%
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center shadow-glow">
              <UserCheck className="h-6 w-6 text-white" />
            </div>
          </div>
        </Card>
      </div>
      
      {/* Tabla de Asistencias */}
      <Card className="gradient" shadow="glow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h3 className="text-xl font-bold gradient-text mb-4 sm:mb-0">Registro de Asistencias</h3>
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar asistencias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
            <div className="flex space-x-2">
              {user?.rol === 'docente' && horarios.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  icon={<QrCode className="h-4 w-4" />}
                  onClick={() => handleGenerateQR({ horario_id: horarios[0].id })}
                >
                  Generar QR
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                icon={<Download className="h-4 w-4" />}
                onClick={handleExport}
                disabled={loading}
              >
                Exportar
              </Button>
            </div>
          </div>
        </div>
        
        <Table
          columns={columns}
          data={asistencias}
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
        title={editingAsistencia ? 'Editar Asistencia' : 'Nueva Asistencia'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                Horario *
              </label>
              <select
                {...register('horario_id', { required: 'El horario es obligatorio' })}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
                onChange={(e) => {
                  const horarioId = e.target.value
                  if (horarioId) {
                    const horario = horarios.find(h => h.id == horarioId)
                    if (horario && !editingAsistencia) {
                      // Pre-llenar datos del horario seleccionado
                      reset({
                        ...getValues(),
                        horario_id: horarioId,
                        docente_id: horario.docente_id || getValues('docente_id')
                      })
                    }
                  }
                }}
              >
                <option value="">Seleccionar horario...</option>
                {horarios.map(h => (
                  <option key={h.id} value={h.id}>
                    {h.grupo?.materia?.nombre || 'N/A'} - {h.grupo?.numero_grupo || 'N/A'} - {h.aula?.nombre || 'N/A'} ({h.hora_inicio} - {h.hora_fin})
                  </option>
                ))}
              </select>
              {errors.horario_id && (
                <p className="mt-1 text-sm text-error-600">{errors.horario_id.message}</p>
              )}
            </div>
            
            <Input
              label="Fecha"
              type="date"
              error={errors.fecha?.message}
              {...register('fecha', { required: 'La fecha es obligatoria' })}
              defaultValue={new Date().toISOString().split('T')[0]}
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estado *
              </label>
              <select
                {...register('estado', { required: 'El estado es obligatorio' })}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
              >
                <option value="presente">Presente</option>
                <option value="ausente">Ausente</option>
                <option value="tardanza">Tardanza</option>
                <option value="justificado">Justificado</option>
              </select>
              {errors.estado && (
                <p className="mt-1 text-sm text-error-600">{errors.estado.message}</p>
              )}
            </div>
            
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Observaciones
              </label>
              <textarea
                {...register('observaciones')}
                rows={3}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
                placeholder="Observaciones adicionales (opcional)"
              />
            </div>
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
              {editingAsistencia ? 'Actualizar' : 'Registrar'} Asistencia
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Ver */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Detalles de la Asistencia"
        size="lg"
      >
        {viewingAsistencia && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Docente
                </label>
                <p className="text-gray-900 dark:text-gray-100">{viewingAsistencia.docente}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Materia
                </label>
                <p className="text-gray-900 dark:text-gray-100">{viewingAsistencia.materia}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Grupo
                </label>
                <p className="text-gray-900 dark:text-gray-100">{viewingAsistencia.grupo}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Aula
                </label>
                <p className="text-gray-900 dark:text-gray-100">{viewingAsistencia.aula}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha
                </label>
                <p className="text-gray-900 dark:text-gray-100">{viewingAsistencia.fecha}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Horario
                </label>
                <p className="text-gray-900 dark:text-gray-100">{viewingAsistencia.hora_inicio} - {viewingAsistencia.hora_fin}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estado
                </label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  viewingAsistencia.estado === 'presente' 
                    ? 'bg-success-100 text-success-800' 
                    : viewingAsistencia.estado === 'tardanza'
                    ? 'bg-warning-100 text-warning-800'
                    : 'bg-error-100 text-error-800'
                }`}>
                  {viewingAsistencia.estado}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Asistencia
                </label>
                <p className="text-gray-900 dark:text-gray-100">
                  {viewingAsistencia.estudiantes_presentes}/{viewingAsistencia.estudiantes_totales} ({viewingAsistencia.porcentaje_asistencia}%)
                </p>
              </div>
        </div>
      </div>
        )}
      </Modal>

      {/* Modal de Selección de Horario para Geolocalización */}
      <Modal
        isOpen={showGeoModal && !horarioSeleccionado && user?.rol !== 'docente'}
        onClose={() => {
          setShowGeoModal(false)
          setHorarioSeleccionado(null)
          setDocenteSeleccionado(null)
        }}
        title="Seleccionar Horario para Registro con Geolocalización"
        size="md"
      >
        <div className="space-y-4">
          {user?.rol !== 'docente' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Docente
              </label>
              <select
                value={docenteSeleccionado?.id || ''}
                onChange={(e) => {
                  const docenteId = e.target.value
                  const docente = docentes.find(d => d.id == docenteId)
                  setDocenteSeleccionado(docente)
                  if (docenteId) {
                    fetchHorarios(docenteId)
                  }
                }}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Seleccionar docente...</option>
                {docentes.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.user?.name || d.codigo_docente}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Horario
            </label>
            <select
              value={horarioSeleccionado?.id || ''}
              onChange={(e) => {
                const horarioId = e.target.value
                const horario = horarios.find(h => h.id == horarioId)
                setHorarioSeleccionado(horario)
              }}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
              disabled={cargandoHorarios || (!docenteSeleccionado && user?.rol !== 'docente')}
            >
              <option value="">Seleccionar horario...</option>
              {horarios.map(h => (
                <option key={h.id} value={h.id}>
                  {h.grupo?.materia?.nombre || 'N/A'} - {h.grupo?.numero_grupo || 'N/A'} - {h.aula?.nombre || 'N/A'} ({h.hora_inicio} - {h.hora_fin})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={() => {
                setShowGeoModal(false)
                setHorarioSeleccionado(null)
                setDocenteSeleccionado(null)
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (horarioSeleccionado) {
                  setShowGeoModal(true)
                } else {
                  toast.error('Selecciona un horario primero')
                }
              }}
              disabled={!horarioSeleccionado}
            >
              Continuar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Registro con Geolocalización */}
      <RegistroGeolocalizacion
        isOpen={showGeoModal && (horarioSeleccionado || user?.rol === 'docente')}
        onClose={() => {
          setShowGeoModal(false)
          setHorarioSeleccionado(null)
          setDocenteSeleccionado(null)
        }}
        horario={horarioSeleccionado || (horarios.length > 0 && horarios[0])}
        docente={docenteSeleccionado}
        docenteId={docenteSeleccionado?.id || horarioSeleccionado?.docente_id}
        fecha={new Date().toISOString().split('T')[0]}
        onSuccess={(data) => {
          fetchAsistencias()
          setShowGeoModal(false)
          setHorarioSeleccionado(null)
        }}
      />

      {/* Modal de Generación de QR */}
      <Modal
        isOpen={showQRModal}
        onClose={() => {
          setShowQRModal(false)
          setQrData(null)
        }}
        title="Código QR para Asistencia"
        size="md"
      >
        {qrData && (
          <div className="space-y-4 text-center">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {qrData.horario?.grupo?.materia?.nombre || 'N/A'} - Grupo {qrData.horario?.grupo?.numero_grupo || 'N/A'}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {qrData.horario?.aula?.nombre || 'N/A'} - {qrData.horario?.hora_inicio} - {qrData.horario?.hora_fin}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Fecha: {qrData.fecha}
              </p>
            </div>
            
            {qrData.qr_image && (
              <div className="flex justify-center">
                <img 
                  src={qrData.qr_image} 
                  alt="Código QR" 
                  className="border-4 border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-white"
                />
              </div>
            )}
            
            <div className="p-3 bg-info-50 dark:bg-info-900/20 rounded-lg">
              <p className="text-xs text-info-700 dark:text-info-300">
                Presenta este código QR al inicio de la clase para registrar la asistencia
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Escáner QR */}
      <Modal
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        title="Escanear Código QR"
        size="lg"
      >
        <QRScanner
          onScan={(codigoQR) => {
            fetchAsistencias()
            setShowQRScanner(false)
          }}
          onClose={() => setShowQRScanner(false)}
        />
      </Modal>
    </div>
  )
}

export default Asistencias