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
  XCircle
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

const Estudiantes = () => {
  const navigate = useNavigate()
  const [estudiantes, setEstudiantes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
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

  const { register, handleSubmit, reset, formState: { errors }, trigger } = useForm({
    mode: 'onChange'
  })

  useEffect(() => {
    fetchEstudiantes()
  }, [searchTerm])

  const fetchEstudiantes = async () => {
    try {
      setLoading(true)
      const params = searchTerm ? { search: searchTerm } : {}
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
        
        // Calcular estadísticas
        setStats({
          total: estudiantesData.length,
          activos: estudiantesData.filter(e => e.activo !== false && e.estado !== 'Inactivo').length,
          inactivos: estudiantesData.filter(e => e.activo === false || e.estado === 'Inactivo').length
        })
      } else {
        setError('No se pudieron cargar los estudiantes')
        toast.error(response.message || 'Error al cargar estudiantes')
      }
    } catch (error) {
      console.error('Error cargando estudiantes:', error)
      setError('Error al cargar los estudiantes')
      toast.error('Error de conexión al cargar estudiantes')
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
      
      // Validar CI
      if (!data.ci || data.ci.trim() === '') {
        toast.error('El CI es obligatorio')
        return
      }

      const estudianteData = {
        ci: data.ci.trim(),
        nombre: data.nombre.trim(),
        apellido: data.apellido.trim(),
        celular: data.celular && data.celular.trim() !== '' ? data.celular.trim() : null,
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
    {
      key: 'estado',
      label: 'Estado',
      sortable: true,
      render: (row) => {
        const isActive = row.activo !== false && row.estado !== 'Inactivo'
        const estudianteId = row.registro_estudiante || row.id
        
        return (
          <div className="flex items-center space-x-2">
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
              title={isActive ? 'Desactivar estudiante' : 'Activar estudiante'}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-xs font-medium ${
              isActive
                ? 'text-success-600 dark:text-success-400' 
                : 'text-gray-600 dark:text-gray-400'
            }`}>
              {isActive ? 'Activo' : 'Inactivo'}
            </span>
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
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" icon={<Filter className="h-5 w-5" />}>
            Filtros
          </Button>
          <Button variant="outline" icon={<Download className="h-5 w-5" />}>
            Exportar
          </Button>
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
                CI *
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
                Nombre *
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
                Apellido *
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
                Celular *
              </label>
              <Input
                type="text"
                {...register('celular', {
                  required: 'El celular es requerido',
                  pattern: {
                    value: /^\d+$/,
                    message: 'El celular solo debe contener números'
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
                {...register('fecha_nacimiento')}
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

            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Estado
              </label>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                viewingEstudiante.activo !== false && viewingEstudiante.estado !== 'Inactivo'
                  ? 'bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-400' 
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
              }`}>
                {viewingEstudiante.activo !== false && viewingEstudiante.estado !== 'Inactivo' ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Activo
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3 mr-1" />
                    Inactivo
                  </>
                )}
              </span>
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
