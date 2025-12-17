import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  GraduationCap, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit2, 
  Trash2,
  Plus,
  Users,
  UserCheck,
  UserX,
  CheckCircle,
  XCircle,
  Info,
  LogIn,
  FileText
} from 'lucide-react'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Modal from '../../components/common/Modal'
import Table from '../../components/common/Table'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { estudianteService } from '../../services/estudianteService'
import { exportToCSV } from '../../utils/helpers'

const Estudiantes = () => {
  const navigate = useNavigate()
  const [estudiantes, setEstudiantes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [totalRegistros, setTotalRegistros] = useState(0)
  const [from, setFrom] = useState(0)
  const [to, setTo] = useState(0)
  const [sortBy, setSortBy] = useState('registro_estudiante')
  const [sortDirection, setSortDirection] = useState('desc')
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingEstudiante, setEditingEstudiante] = useState(null)
  const [viewingEstudiante, setViewingEstudiante] = useState(null)
  const [stats, setStats] = useState({
    total: 0,
    activos: 0,
    inactivos: 0
  })
  const [showFilters, setShowFilters] = useState(false)
  const [filtrosAvanzados, setFiltrosAvanzados] = useState({
    estado: '',
    provincia: '',
    sexo: ''
  })

  const { register, handleSubmit, reset, formState: { errors }, trigger } = useForm({
    mode: 'onChange'
  })

  useEffect(() => {
    fetchEstudiantes()
  }, [searchTerm, filtrosAvanzados, currentPage, perPage, sortBy, sortDirection])

  const fetchEstudiantes = async () => {
    try {
      setLoading(true)
      const params = {
        page: currentPage,
        per_page: perPage,
        sort_by: sortBy,
        sort_direction: sortDirection
      }
      
      if (searchTerm) {
        params.search = searchTerm
      }
      
      // Agregar filtros avanzados solo si tienen valor
      if (filtrosAvanzados.estado !== '') {
        params.estado = filtrosAvanzados.estado
      }
      if (filtrosAvanzados.provincia) {
        params.provincia = filtrosAvanzados.provincia
      }
      if (filtrosAvanzados.sexo !== '') {
        params.sexo = filtrosAvanzados.sexo
      }
      
      const response = await estudianteService.getEstudiantes(params)
      
      if (response.success) {
        const data = response.data
        let estudiantesData = []
        
        // Manejar paginación
        if (data.data && Array.isArray(data.data)) {
          estudiantesData = data.data
        } else if (Array.isArray(data)) {
          estudiantesData = data
        }
        
        setEstudiantes(estudiantesData)
        setTotalPages(data.last_page || 1)
        setTotalRegistros(data.total || estudiantesData.length)
        setFrom(data.from || (estudiantesData.length > 0 ? 1 : 0))
        setTo(data.to || estudiantesData.length)
        
        // Calcular estadísticas
        setStats({
          total: data.total || estudiantesData.length,
          activos: estudiantesData.filter(e => e.activo === true || e.estado_id === 4).length,
          inactivos: estudiantesData.filter(e => e.activo !== true && e.estado_id !== 4).length
        })
      } else {
        setError('No se pudieron cargar los estudiantes')
        toast.error(response.message || 'Error al cargar estudiantes')
        setEstudiantes([])
        setTotalPages(1)
        setTotalRegistros(0)
        setFrom(0)
        setTo(0)
      }
    } catch (error) {
      console.error('Error cargando estudiantes:', error)
      setError('Error al cargar los estudiantes')
      toast.error('Error de conexión al cargar estudiantes')
      setEstudiantes([])
      setTotalPages(1)
      setTotalRegistros(0)
      setFrom(0)
      setTo(0)
    } finally {
      setLoading(false)
    }
  }

  const handleView = async (estudiante) => {
    try {
      const estudianteId = estudiante.registro_estudiante || estudiante.id
      
      if (!estudianteId) {
        toast.error('No se pudo identificar el estudiante')
        return
      }
      
      const response = await estudianteService.getEstudianteById(estudianteId)
      if (response.success) {
        setViewingEstudiante(response.data)
        setShowViewModal(true)
      } else {
        toast.error(response.message || 'Error al cargar detalles del estudiante')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al cargar el estudiante'
      toast.error(errorMessage)
    }
  }

  const handleEdit = async (estudiante) => {
    try {
      const estudianteId = estudiante.registro_estudiante || estudiante.id
      
      if (!estudianteId) {
        toast.error('No se pudo identificar el estudiante')
        return
      }
      
      const response = await estudianteService.getEstudianteById(estudianteId)
      if (response.success) {
        const estudianteData = response.data
        setEditingEstudiante(estudianteData)
        reset({
          ci: estudianteData.ci || '',
          nombre: estudianteData.nombre || '',
          apellido: estudianteData.apellido || '',
          celular: estudianteData.celular || '',
          sexo: estudianteData.sexo || '',
          fecha_nacimiento: estudianteData.fecha_nacimiento || '',
          direccion: estudianteData.direccion || '',
          provincia: estudianteData.provincia || ''
        })
        setShowModal(true)
      } else {
        toast.error(response.message || 'Error al cargar datos del estudiante')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al cargar el estudiante'
      toast.error(errorMessage)
    }
  }

  const handleNew = () => {
    setEditingEstudiante(null)
    reset({
      ci: '',
      nombre: '',
      apellido: '',
      celular: '',
      sexo: '',
      fecha_nacimiento: '',
      direccion: '',
      provincia: ''
    })
    setShowModal(true)
  }

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      
      // Validaciones en JavaScript antes de enviar
      const errors = []
      
      // Validar CI
      if (!data.ci || data.ci.trim() === '') {
        errors.push('El CI es obligatorio')
      } else if (!/^\d+$/.test(data.ci.trim())) {
        errors.push('El CI solo debe contener números')
      } else if (data.ci.trim().length > 20) {
        errors.push('El CI no puede tener más de 20 caracteres')
      }
      
      // Validar Nombre
      if (!data.nombre || data.nombre.trim() === '') {
        errors.push('El nombre es obligatorio')
      } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(data.nombre.trim())) {
        errors.push('El nombre solo debe contener letras')
      } else if (data.nombre.trim().length > 100) {
        errors.push('El nombre no puede tener más de 100 caracteres')
      }
      
      // Validar Apellido
      if (!data.apellido || data.apellido.trim() === '') {
        errors.push('El apellido es obligatorio')
      } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(data.apellido.trim())) {
        errors.push('El apellido solo debe contener letras')
      } else if (data.apellido.trim().length > 100) {
        errors.push('El apellido no puede tener más de 100 caracteres')
      }
      
      // Validar Celular
      if (!data.celular || data.celular.trim() === '') {
        errors.push('El celular es obligatorio')
      } else if (!/^\d+$/.test(data.celular.trim())) {
        errors.push('El celular solo debe contener números')
      } else if (data.celular.trim().length > 20) {
        errors.push('El celular no puede tener más de 20 caracteres')
      } else if (data.celular.trim().length < 7) {
        errors.push('El celular debe tener al menos 7 dígitos')
      }
      
      // Validar Sexo (opcional pero si se proporciona debe ser válido)
      if (data.sexo && !['M', 'F'].includes(data.sexo)) {
        errors.push('El sexo debe ser Masculino (M) o Femenino (F)')
      }
      
      // Validar Fecha de Nacimiento (opcional pero si se proporciona debe ser válida)
      if (data.fecha_nacimiento) {
        const fechaNac = new Date(data.fecha_nacimiento)
        const hoy = new Date()
        if (fechaNac > hoy) {
          errors.push('La fecha de nacimiento no puede ser mayor a la fecha actual')
        }
        // Validar que no sea menor de 10 años (opcional, ajustar según necesidad)
        const edad = hoy.getFullYear() - fechaNac.getFullYear()
        if (edad < 10) {
          errors.push('La fecha de nacimiento no es válida (el estudiante debe tener al menos 10 años)')
        }
      }
      
      // Validar Provincia (opcional pero si se proporciona validar longitud)
      if (data.provincia && data.provincia.trim().length > 50) {
        errors.push('La provincia no puede tener más de 50 caracteres')
      }
      
      // Validar Dirección (opcional pero si se proporciona validar longitud)
      if (data.direccion && data.direccion.trim().length > 255) {
        errors.push('La dirección no puede tener más de 255 caracteres')
      }
      
      // Si hay errores, mostrarlos y no continuar
      if (errors.length > 0) {
        errors.forEach(error => {
          toast.error(error, { duration: 4000 })
        })
        setLoading(false)
        return
      }

      const estudianteData = {
        ci: data.ci.trim(),
        nombre: data.nombre.trim(),
        apellido: data.apellido.trim(),
        celular: data.celular.trim(),
        sexo: data.sexo || null,
        fecha_nacimiento: data.fecha_nacimiento || null,
        direccion: data.direccion ? data.direccion.trim() : null,
        provincia: data.provincia ? data.provincia.trim() : null
      }

      let response
      if (editingEstudiante) {
        const estudianteId = editingEstudiante.registro_estudiante || editingEstudiante.id
        response = await estudianteService.updateEstudiante(estudianteId, estudianteData)
      } else {
        response = await estudianteService.createEstudiante(estudianteData)
      }

      if (response.success) {
        toast.success(response.message || (editingEstudiante ? 'Estudiante actualizado exitosamente' : 'Estudiante creado exitosamente'))
        setShowModal(false)
        reset()
        setEditingEstudiante(null)
        await fetchEstudiantes()
      } else {
        toast.error(response.message || 'Error al guardar estudiante')
        if (response.errors) {
          const errorMessages = Array.isArray(response.errors) 
            ? response.errors 
            : Object.values(response.errors).flat()
          
          errorMessages.forEach((errorMsg) => {
            if (typeof errorMsg === 'string' && errorMsg.trim()) {
              toast.error(errorMsg, { duration: 4000 })
            } else if (Array.isArray(errorMsg) && errorMsg.length > 0) {
              toast.error(errorMsg[0], { duration: 4000 })
            }
          })
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al guardar estudiante'
      toast.error(errorMessage)
      
      if (error.response?.data?.errors) {
        const backendErrors = error.response.data.errors
        const errorMessages = Array.isArray(backendErrors) 
          ? backendErrors 
          : Object.values(backendErrors).flat()
        
        errorMessages.forEach((errorMsg) => {
          if (typeof errorMsg === 'string' && errorMsg.trim()) {
            toast.error(errorMsg, { duration: 4000 })
          } else if (Array.isArray(errorMsg) && errorMsg.length > 0) {
            toast.error(errorMsg[0], { duration: 4000 })
          }
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (estudiante) => {
    if (!window.confirm(`¿Estás seguro de eliminar a ${estudiante.nombre} ${estudiante.apellido}?`)) {
      return
    }
    
    try {
      setLoading(true)
      const estudianteId = estudiante.registro_estudiante || estudiante.id
      
      if (!estudianteId) {
        toast.error('No se pudo identificar el estudiante')
        return
      }

      const response = await estudianteService.removeEstudiante(estudianteId)
      if (response.success) {
        toast.success(response.message || 'Estudiante eliminado exitosamente')
        await fetchEstudiantes()
      } else {
        toast.error(response.message || 'Error al eliminar estudiante')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al eliminar estudiante'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (column, direction) => {
    setSortBy(column)
    setSortDirection(direction)
    setCurrentPage(1)
  }

  const handleExport = async () => {
    try {
      setLoading(true)
      
      // Obtener todos los estudiantes con los filtros aplicados
      const params = {}
      if (searchTerm) {
        params.search = searchTerm
      }
      if (filtrosAvanzados.estado !== '') {
        params.estado = filtrosAvanzados.estado
      }
      if (filtrosAvanzados.provincia) {
        params.provincia = filtrosAvanzados.provincia
      }
      if (filtrosAvanzados.sexo !== '') {
        params.sexo = filtrosAvanzados.sexo
      }
      // Obtener todos sin paginación para exportar
      params.per_page = 10000
      params.page = 1
      
      const response = await estudianteService.getEstudiantes(params)
      
      if (response.success && response.data) {
        let estudiantesData = []
        
        // Manejar paginación
        if (response.data.data && Array.isArray(response.data.data)) {
          estudiantesData = response.data.data
        } else if (Array.isArray(response.data)) {
          estudiantesData = response.data
        }
        
        if (estudiantesData.length === 0) {
          toast.error('No hay estudiantes para exportar')
          return
        }
        
        const datosExportar = estudiantesData.map(estudiante => ({
          'Registro': estudiante.registro_estudiante || estudiante.id || '',
          'CI': estudiante.ci || '',
          'Nombre': estudiante.nombre || '',
          'Apellido': estudiante.apellido || '',
          'Email': estudiante.email || 'N/A',
          'Celular': estudiante.celular || 'N/A',
          'Sexo': estudiante.sexo === 'M' ? 'Masculino' : estudiante.sexo === 'F' ? 'Femenino' : 'N/A',
          'Fecha Nacimiento': estudiante.fecha_nacimiento ? new Date(estudiante.fecha_nacimiento).toLocaleDateString('es-ES') : 'N/A',
          'Provincia': estudiante.provincia || 'N/A',
          'Dirección': estudiante.direccion || 'N/A',
          'Estado': (estudiante.activo === true || estudiante.estado_id === 4) ? 'Activo' : 'Inactivo',
          'Fecha Inscripción': estudiante.fecha_inscripcion ? new Date(estudiante.fecha_inscripcion).toLocaleDateString('es-ES') : 'N/A'
        }))
        
        exportToCSV(datosExportar, `estudiantes_${new Date().toISOString().split('T')[0]}.csv`)
        toast.success(`Se exportaron ${datosExportar.length} estudiantes exitosamente`)
      } else {
        toast.error(response.message || 'Error al exportar estudiantes: No se recibieron datos válidos')
        console.error('Error en exportación:', response)
      }
    } catch (error) {
      console.error('Error al exportar estudiantes:', error)
      toast.error(error.response?.data?.message || error.message || 'Error al exportar estudiantes')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      key: 'estudiante',
      label: 'Estudiante',
      sortable: true,
      render: (row) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-semibold">
              {row.nombre?.charAt(0) || 'E'}
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {row.nombre} {row.apellido}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              CI: {row.ci}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'registro_estudiante',
      label: 'Registro',
      sortable: true,
      render: (row) => (
        <span className="text-gray-900 dark:text-gray-100 font-medium">
          {row.registro_estudiante || row.id}
        </span>
      )
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (row) => (
        <span className="text-gray-600 dark:text-gray-400">
          {row.email || 'N/A'}
        </span>
      )
    },
    {
      key: 'celular',
      label: 'Teléfono',
      render: (row) => (
        <span className="text-gray-600 dark:text-gray-400">
          {row.celular || 'N/A'}
        </span>
      )
    },
    // {
    //   key: 'estado_id',
    //   label: 'Estado ID',
    //   sortable: true,
    //   render: (row) => {
    //     const getEstadoInfo = (estadoId) => {
    //       const estados = {
    //         1: { nombre: 'Pre-registrado', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300', desc: 'Recién registrado, sin documentos' },
    //         2: { nombre: 'Documentos incompletos', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400', desc: 'Faltan algunos documentos' },
    //         3: { nombre: 'En revisión', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400', desc: 'Documentos pendientes de validación' },
    //         4: { nombre: 'Validado - Activo', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', desc: 'Documentos aprobados, puede inscribirse' },
    //         5: { nombre: 'Rechazado', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', desc: 'Documentos rechazados' }
    //       }
    //       return estados[estadoId] || { nombre: 'Desconocido', color: 'bg-gray-100 text-gray-800', desc: 'Estado no definido' }
    //     }
        
    //     const estadoInfo = getEstadoInfo(row.estado_id)
        
    //     return (
    //       <div className="flex items-center gap-2 group relative">
    //         <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${estadoInfo.color}`}>
    //           {row.estado_id}
    //         </span>
    //         <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute left-0 top-full mt-1 z-10 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap pointer-events-none">
    //           {estadoInfo.nombre}: {estadoInfo.desc}
    //         </div>
    //       </div>
    //     )
    //   }
    // },
    {
      key: 'estado',
      label: 'Estado',
      sortable: true,
      render: (row) => {
        const getEstadoColor = (estadoNombre, estadoId) => {
          const nombre = (estadoNombre || '').toLowerCase()
          if (estadoId === 4 || nombre.includes('validado') || nombre.includes('activo')) {
            return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
          }
          if (nombre.includes('revisión') || nombre.includes('revision')) {
            return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
          }
          if (nombre.includes('rechazado') || nombre.includes('rechazado')) {
            return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
          }
          if (nombre.includes('incompleto') || nombre.includes('incompletos')) {
            return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
          }
          if (nombre.includes('pre-registrado') || nombre.includes('preregistrado')) {
            return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
          }
          return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
        }
        
        const estadoColor = getEstadoColor(row.estado, row.estado_id)
        
        return (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${estadoColor}`}>
            <FileText className="h-3 w-3 mr-1" />
            {row.estado || 'Sin estado'}
          </span>
        )
      }
    },
    {
      key: 'activo',
      label: 'Acceso',
      sortable: true,
      render: (row) => {
        // El backend devuelve 'activo: true' cuando Estado_id === 4 (Validado - Apto para inscripción)
        // También verificamos el nombre del estado como respaldo
        const estadoNombre = (row.estado || '').toLowerCase()
        const isActive = row.activo === true || 
                        row.estado_id === 4 || 
                        estadoNombre === 'validado' ||
                        estadoNombre === 'validado - activo' ||
                        estadoNombre === 'activo'
        const estudianteId = row.registro_estudiante || row.id
        
        return (
          <div className="flex items-center space-x-2 group relative">
            <button
              onClick={async (e) => {
                e.stopPropagation()
                try {
                  setLoading(true)
                  const response = isActive 
                    ? await estudianteService.desactivarEstudiante(estudianteId)
                    : await estudianteService.activarEstudiante(estudianteId)
                  
                  if (response.success) {
                    toast.success(response.message)
                    await fetchEstudiantes()
                  } else {
                    toast.error(response.message || 'Error al cambiar el estado')
                  }
                } catch (error) {
                  toast.error('Error al cambiar el estado del estudiante')
                } finally {
                  setLoading(false)
                }
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                isActive
                  ? 'bg-success-500'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
              title={isActive ? 'Desactivar acceso (no podrá loguear)' : 'Activar acceso (podrá loguear)'}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <div className="flex items-center gap-1">
              <LogIn className={`h-4 w-4 ${isActive ? 'text-success-600 dark:text-success-400' : 'text-gray-400'}`} />
              <span className={`text-xs font-medium ${
                isActive
                  ? 'text-success-600 dark:text-success-400' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                {isActive ? 'Puede loguear' : 'No puede loguear'}
              </span>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute left-0 top-full mt-1 z-10 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap pointer-events-none">
              {isActive 
                ? 'El estudiante puede iniciar sesión y acceder al portal' 
                : 'El estudiante no puede iniciar sesión. Solo activo si estado_id = 4 (Validado - Activo)'}
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
          <button
            onClick={() => handleEdit(row)}
            className="p-2 rounded-xl text-warning-600 hover:bg-warning-50 dark:hover:bg-warning-900/20 transition-colors duration-200"
            title="Editar"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="p-2 rounded-xl text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors duration-200"
            title="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ]

  if (loading && estudiantes.length === 0) {
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
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text">Gestión de Estudiantes</h1>
            <p className="text-gray-600 dark:text-gray-400">Administra y gestiona todos los estudiantes del sistema</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="primary"
            icon={<Plus className="h-5 w-5" />}
            onClick={handleNew}
          >
            Nuevo Estudiante
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="gradient" shadow="glow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Total Estudiantes</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-glow">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
        </Card>
        
        <Card className="gradient" shadow="glow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Estudiantes Activos</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.activos}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-success-500 to-success-600 rounded-xl flex items-center justify-center shadow-glow">
              <UserCheck className="h-6 w-6 text-white" />
            </div>
          </div>
        </Card>
        
        <Card className="gradient" shadow="glow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Estudiantes Inactivos</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.inactivos}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-error-500 to-error-600 rounded-xl flex items-center justify-center shadow-glow">
              <UserX className="h-6 w-6 text-white" />
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
              placeholder="Buscar por CI, nombre, apellido o registro..."
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
            onClick={() => setShowFilters(!showFilters)}
          >
            Filtros
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

        {/* Panel de filtros avanzados */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estado
                </label>
                <select
                  value={filtrosAvanzados.estado}
                  onChange={(e) => setFiltrosAvanzados(prev => ({ ...prev, estado: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 dark:text-gray-100"
                >
                  <option value="">Todos</option>
                  <option value="activo">Activos</option>
                  <option value="inactivo">Inactivos</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sexo
                </label>
                <select
                  value={filtrosAvanzados.sexo}
                  onChange={(e) => setFiltrosAvanzados(prev => ({ ...prev, sexo: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 dark:text-gray-100"
                >
                  <option value="">Todos</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Provincia
                </label>
                <Input
                  type="text"
                  placeholder="Filtrar por provincia..."
                  value={filtrosAvanzados.provincia}
                  onChange={(e) => setFiltrosAvanzados(prev => ({ ...prev, provincia: e.target.value }))}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFiltrosAvanzados({ estado: '', provincia: '', sexo: '' })
                  fetchEstudiantes()
                }}
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Leyenda de Estados */}
      <Card className="gradient" shadow="glow-lg">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <Info className="h-4 w-4" />
            Información sobre los Estados
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
              <div className="font-semibold text-blue-800 dark:text-blue-300 mb-1">Estado ID</div>
              <p className="text-blue-700 dark:text-blue-400">
                Identificador numérico del estado (1-5). Indica la etapa del proceso del estudiante.
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/10 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
              <div className="font-semibold text-purple-800 dark:text-purple-300 mb-1">Estado (Nombre)</div>
              <p className="text-purple-700 dark:text-purple-400">
                Nombre descriptivo del estado. Muestra el estado actual del proceso de validación.
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-3 border border-green-200 dark:border-green-800">
              <div className="font-semibold text-green-800 dark:text-green-300 mb-1">Acceso (Puede Loguear)</div>
              <p className="text-green-700 dark:text-green-400">
                Indica si el estudiante puede iniciar sesión. Solo activo cuando estado_id = 4 (Validado - Activo).
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabla de estudiantes */}
      <Card className="gradient" shadow="glow-lg">
        <Table
          columns={columns}
          data={estudiantes}
          loading={loading}
          emptyMessage="No se encontraron estudiantes"
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

      {/* Modal Crear/Editar */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingEstudiante(null)
          reset()
        }}
        title={editingEstudiante ? 'Editar Estudiante' : 'Nuevo Estudiante'}
        size="xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                CI <span className="text-error-500">*</span>
              </label>
              <Input
                type="text"
                {...register('ci', { 
                  required: 'El CI es requerido',
                  pattern: {
                    value: /^\d+$/,
                    message: 'El CI solo debe contener números'
                  },
                  maxLength: {
                    value: 20,
                    message: 'El CI no puede tener más de 20 caracteres'
                  }
                })}
                placeholder="Ej: 12345678"
                error={errors.ci?.message}
                disabled={!!editingEstudiante}
                onInput={(e) => {
                  e.target.value = e.target.value.replace(/\D/g, '')
                  trigger('ci')
                }}
              />
            </div>

            {!editingEstudiante && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Registro Estudiante
                </label>
                <Input
                  type="text"
                  value="Se generará automáticamente"
                  placeholder="Se generará automáticamente"
                  readOnly
                  className="bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Este código se asignará automáticamente al crear el estudiante
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre <span className="text-error-500">*</span>
              </label>
              <Input
                type="text"
                {...register('nombre', { 
                  required: 'El nombre es requerido',
                  pattern: {
                    value: /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/,
                    message: 'El nombre solo debe contener letras'
                  },
                  maxLength: {
                    value: 100,
                    message: 'El nombre no puede tener más de 100 caracteres'
                  }
                })}
                placeholder="Ej: Juan"
                error={errors.nombre?.message}
                onInput={(e) => {
                  e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '')
                  trigger('nombre')
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Apellido <span className="text-error-500">*</span>
              </label>
              <Input
                type="text"
                {...register('apellido', { 
                  required: 'El apellido es requerido',
                  pattern: {
                    value: /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/,
                    message: 'El apellido solo debe contener letras'
                  },
                  maxLength: {
                    value: 100,
                    message: 'El apellido no puede tener más de 100 caracteres'
                  }
                })}
                placeholder="Ej: Pérez"
                error={errors.apellido?.message}
                onInput={(e) => {
                  e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '')
                  trigger('apellido')
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Celular <span className="text-error-500">*</span>
              </label>
              <Input
                type="text"
                {...register('celular', {
                  required: 'El celular es requerido',
                  pattern: {
                    value: /^\d+$/,
                    message: 'El celular solo debe contener números'
                  },
                  minLength: {
                    value: 7,
                    message: 'El celular debe tener al menos 7 dígitos'
                  },
                  maxLength: {
                    value: 20,
                    message: 'El celular no puede tener más de 20 caracteres'
                  }
                })}
                placeholder="Ej: 70012345"
                error={errors.celular?.message}
                onInput={(e) => {
                  e.target.value = e.target.value.replace(/\D/g, '')
                  trigger('celular')
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sexo
              </label>
              <select
                {...register('sexo', {
                  validate: (value) => {
                    if (value && !['M', 'F'].includes(value)) {
                      return 'El sexo debe ser M o F'
                    }
                    return true
                  }
                })}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 dark:text-gray-100"
              >
                <option value="">Seleccionar...</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
              {errors.sexo && (
                <p className="mt-1 text-sm text-error-600">{errors.sexo.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha de Nacimiento
              </label>
              <Input
                type="date"
                {...register('fecha_nacimiento', {
                  validate: (value) => {
                    if (value) {
                      const fechaNac = new Date(value)
                      const hoy = new Date()
                      if (fechaNac > hoy) {
                        return 'La fecha de nacimiento no puede ser mayor a la fecha actual'
                      }
                      // Validar que no sea menor de 10 años
                      const edad = hoy.getFullYear() - fechaNac.getFullYear()
                      const mesDiff = hoy.getMonth() - fechaNac.getMonth()
                      const diaDiff = hoy.getDate() - fechaNac.getDate()
                      const edadReal = mesDiff < 0 || (mesDiff === 0 && diaDiff < 0) ? edad - 1 : edad
                      if (edadReal < 10) {
                        return 'El estudiante debe tener al menos 10 años'
                      }
                    }
                    return true
                  }
                })}
                error={errors.fecha_nacimiento?.message}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Provincia
              </label>
              <Input
                type="text"
                {...register('provincia', {
                  maxLength: {
                    value: 50,
                    message: 'La provincia no puede tener más de 50 caracteres'
                  }
                })}
                placeholder="Ej: La Paz"
                error={errors.provincia?.message}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Dirección
            </label>
            <Input
              type="text"
              {...register('direccion', {
                maxLength: {
                  value: 255,
                  message: 'La dirección no puede tener más de 255 caracteres'
                }
              })}
              placeholder="Ej: Av. Principal #123"
              error={errors.direccion?.message}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowModal(false)
                setEditingEstudiante(null)
                reset()
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {editingEstudiante ? 'Actualizar' : 'Crear'} Estudiante
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Ver */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false)
          setViewingEstudiante(null)
        }}
        title="Detalles del Estudiante"
        size="xl"
      >
        {viewingEstudiante && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Nombre Completo
                </label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {viewingEstudiante.nombre} {viewingEstudiante.apellido}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  CI
                </label>
                <p className="text-gray-700 dark:text-gray-300">
                  {viewingEstudiante.ci}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Registro Estudiante
                </label>
                <p className="text-gray-700 dark:text-gray-300">
                  {viewingEstudiante.registro_estudiante || viewingEstudiante.id}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Celular
                </label>
                <p className="text-gray-700 dark:text-gray-300">
                  {viewingEstudiante.celular || 'N/A'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Email
                </label>
                <p className="text-gray-700 dark:text-gray-300">
                  {viewingEstudiante.email || 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Sexo
                </label>
                <p className="text-gray-700 dark:text-gray-300">
                  {viewingEstudiante.sexo === 'M' ? 'Masculino' : viewingEstudiante.sexo === 'F' ? 'Femenino' : 'N/A'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Fecha de Nacimiento
                </label>
                <p className="text-gray-700 dark:text-gray-300">
                  {viewingEstudiante.fecha_nacimiento ? new Date(viewingEstudiante.fecha_nacimiento).toLocaleDateString('es-ES') : 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Provincia
                </label>
                <p className="text-gray-700 dark:text-gray-300">
                  {viewingEstudiante.provincia || 'N/A'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Dirección
              </label>
              <p className="text-gray-700 dark:text-gray-300">
                {viewingEstudiante.direccion || 'N/A'}
              </p>
            </div>

            {/* Sección de Estados - Mostrar los 3 estados claramente */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Info className="h-5 w-5 text-primary-600" />
                Información de Estado
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Estado ID */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                    <Info className="h-4 w-4" />
                    Estado ID
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                      {viewingEstudiante.estado_id || 'N/A'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                    {viewingEstudiante.estado_id === 1 && 'Pre-registrado: Recién registrado, sin documentos'}
                    {viewingEstudiante.estado_id === 2 && 'Documentos incompletos: Faltan algunos documentos'}
                    {viewingEstudiante.estado_id === 3 && 'En revisión: Documentos pendientes de validación'}
                    {viewingEstudiante.estado_id === 4 && 'Validado - Activo: Documentos aprobados, puede inscribirse'}
                    {viewingEstudiante.estado_id === 5 && 'Rechazado: Documentos rechazados'}
                    {!viewingEstudiante.estado_id && 'Estado no definido'}
                  </p>
                </div>

                {/* Estado (Nombre) */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    Estado (Nombre)
                  </label>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    viewingEstudiante.estado_id === 4 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : viewingEstudiante.estado_id === 3
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                      : viewingEstudiante.estado_id === 5
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      : viewingEstudiante.estado_id === 2
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {viewingEstudiante.estado || 'Sin estado'}
                  </span>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                    Nombre descriptivo del estado del estudiante en el sistema
                  </p>
                </div>

                {/* Acceso (Activo) */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                    <LogIn className="h-4 w-4" />
                    Acceso (Puede Loguear)
                  </label>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    (viewingEstudiante.activo === true || viewingEstudiante.estado_id === 4)
                      ? 'bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-400' 
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {(viewingEstudiante.activo === true || viewingEstudiante.estado_id === 4) ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Puede loguear
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-1" />
                        No puede loguear
                      </>
                    )}
                  </span>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                    Solo activo si estado_id = 4 (Validado - Activo). Determina si el estudiante puede iniciar sesión.
                  </p>
                </div>
              </div>
            </div>

            {viewingEstudiante.fecha_inscripcion && (
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Fecha de Inscripción
                </label>
                <p className="text-gray-700 dark:text-gray-300">
                  {viewingEstudiante.fecha_inscripcion}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Estudiantes
