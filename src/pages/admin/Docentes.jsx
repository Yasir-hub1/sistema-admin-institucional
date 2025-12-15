import React, { useState, useEffect } from 'react'
import {
  UserCheck,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  GraduationCap,
  Users,
  XCircle,
  Copy,
  Check,
  Mail,
  Lock,
  AlertCircle
} from 'lucide-react'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Modal from '../../components/common/Modal'
import Table from '../../components/common/Table'
import Card from '../../components/common/Card'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { docenteService } from '../../services/asignacionService'
import { usePermissions } from '../../hooks/usePermissions'

const Docentes = () => {
  const { canView, canCreate, canEdit, canDelete } = usePermissions()
  const [docentes, setDocentes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [especializacionFilter, setEspecializacionFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showCredentialsModal, setShowCredentialsModal] = useState(false)
  const [temporaryCredentials, setTemporaryCredentials] = useState(null)
  const [copiedField, setCopiedField] = useState(null)
  const [editingDocente, setEditingDocente] = useState(null)
  const [viewingDocente, setViewingDocente] = useState(null)
  const [siguienteRegistro, setSiguienteRegistro] = useState('')
  const [stats, setStats] = useState({
    total: 0,
    conGrupos: 0
  })

  const { register, handleSubmit, reset, formState: { errors }, watch, setValue, trigger } = useForm({
    mode: 'onChange'
  })

  useEffect(() => {
    fetchDocentes()
  }, [currentPage, perPage, searchTerm, especializacionFilter])

  useEffect(() => {
    if (showModal && !editingDocente) {
      fetchSiguienteRegistro()
    }
  }, [showModal, editingDocente])

  const fetchDocentes = async () => {
    try {
      setLoading(true)
      const response = await docenteService.getDocentes({
        page: currentPage,
        per_page: perPage,
        search: searchTerm,
        especializacion: especializacionFilter
      })
      
      if (response.success && response.data) {
        setDocentes(response.data.data || [])
        setTotalPages(response.data.last_page || 1)
        setStats({
          total: response.data.total || 0,
          conGrupos: response.data.data?.filter(d => d.grupos_count > 0).length || 0
        })
      } else {
        toast.error(response.message || 'Error al cargar docentes')
      }
    } catch (error) {
      toast.error('Error al cargar docentes')
    } finally {
      setLoading(false)
    }
  }

  const fetchSiguienteRegistro = async () => {
    try {
      const response = await docenteService.getSiguienteRegistro()
      if (response.success && response.data) {
        setSiguienteRegistro(response.data.siguiente_registro || '')
      }
    } catch (error) {
      console.error('Error al obtener siguiente registro:', error)
    }
  }

  const onSubmit = async (data) => {
    // Validación adicional antes de enviar
    if (!data.ci || data.ci.trim() === '') {
      toast.error('El CI es obligatorio')
      return
    }

    // Validar que CI solo contenga números
    if (!/^\d+$/.test(data.ci.trim())) {
      toast.error('El CI solo debe contener números')
      return
    }

    if (!data.nombre || data.nombre.trim() === '') {
      toast.error('El nombre es obligatorio')
      return
    }

    // Validar que nombre solo contenga letras y espacios
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(data.nombre.trim())) {
      toast.error('El nombre solo debe contener letras')
      return
    }

    if (!data.apellido || data.apellido.trim() === '') {
      toast.error('El apellido es obligatorio')
      return
    }

    // Validar que apellido solo contenga letras y espacios
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(data.apellido.trim())) {
      toast.error('El apellido solo debe contener letras')
      return
    }

    // Validar celular si se proporciona
    if (data.celular && data.celular.trim() !== '') {
      if (!/^\d+$/.test(data.celular.trim())) {
        toast.error('El celular solo debe contener números')
        return
      }
      if (data.celular.trim().length < 7) {
        toast.error('El celular debe tener al menos 7 dígitos')
        return
      }
    }

    // Validar fecha de nacimiento si se proporciona
    if (data.fecha_nacimiento) {
      const fecha = new Date(data.fecha_nacimiento)
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)
      
      if (fecha >= hoy) {
        toast.error('La fecha de nacimiento debe ser anterior a hoy')
        return
      }
      
      // Validar que la edad sea razonable (mínimo 18 años, máximo 100 años)
      const edad = hoy.getFullYear() - fecha.getFullYear()
      const mesDiferencia = hoy.getMonth() - fecha.getMonth()
      const diaDiferencia = hoy.getDate() - fecha.getDate()
      
      const edadReal = mesDiferencia < 0 || (mesDiferencia === 0 && diaDiferencia < 0) ? edad - 1 : edad
      
      if (edadReal < 18) {
        toast.error('El docente debe tener al menos 18 años')
        return
      }
      
      if (edadReal > 100) {
        toast.error('La fecha de nacimiento no es válida (edad mayor a 100 años)')
        return
      }
    }

    // Validar dirección si se proporciona
    if (data.direccion && data.direccion.trim() !== '') {
      if (data.direccion.trim().length > 255) {
        toast.error('La dirección no puede tener más de 255 caracteres')
        return
      }
    }

    // Validar cargo si se proporciona
    if (data.cargo && data.cargo.trim() !== '') {
      if (data.cargo.trim().length > 100) {
        toast.error('El cargo no puede tener más de 100 caracteres')
        return
      }
    }

    // Validar modalidad de contratación si se proporciona
    if (data.modalidad_de_contratacion && data.modalidad_de_contratacion.trim() !== '') {
      if (data.modalidad_de_contratacion.trim().length > 100) {
        toast.error('La modalidad de contratación no puede tener más de 100 caracteres')
        return
      }
    }

    // Validar área de especialización si se proporciona
    if (data.area_de_especializacion && data.area_de_especializacion.trim() !== '') {
      if (data.area_de_especializacion.trim().length > 200) {
        toast.error('El área de especialización no puede tener más de 200 caracteres')
        return
      }
    }

    // Validar sexo si se proporciona
    if (data.sexo && data.sexo !== '') {
      if (!['M', 'F'].includes(data.sexo)) {
        toast.error('El sexo debe ser M o F')
        return
      }
    }

    // Validar email si es creación
    if (!editingDocente && (!data.email || data.email.trim() === '')) {
      toast.error('El email es obligatorio para crear las credenciales de acceso del docente')
      return
    }

    try {
      setLoading(true)
      const docenteData = {
        ci: data.ci.trim(),
        nombre: data.nombre.trim(),
        apellido: data.apellido.trim(),
        celular: data.celular && data.celular.trim() !== '' ? data.celular.trim() : null,
        sexo: data.sexo || null,
        fecha_nacimiento: data.fecha_nacimiento || null,
        direccion: data.direccion ? data.direccion.trim() : null,
        cargo: data.cargo ? data.cargo.trim() : null,
        area_de_especializacion: data.area_de_especializacion ? data.area_de_especializacion.trim() : null,
        modalidad_de_contratacion: data.modalidad_de_contratacion ? data.modalidad_de_contratacion.trim() : null
      }

      // Agregar email solo si es creación
      if (!editingDocente && data.email) {
        docenteData.email = data.email.trim().toLowerCase()
      }

      let response
      if (editingDocente) {
        // Usar siempre el id para actualizar
        const docenteId = editingDocente.id
        
        if (!docenteId) {
          toast.error('No se pudo identificar el docente. Por favor, recarga la página.')
          setLoading(false)
          return
        }
        
        console.log('🔍 Actualizando docente con ID:', docenteId)
        console.log('🔍 Datos a enviar:', docenteData)
        
        response = await docenteService.updateDocente(docenteId, docenteData)
      } else {
        response = await docenteService.createDocente(docenteData)
      }

      if (response.success) {
        // Si es creación y viene con credenciales temporales, mostrarlas
        if (!editingDocente && response.data?.usuario?.password_temporal) {
          const passwordTemporal = response.data.usuario.password_temporal
          const email = response.data.usuario.email
          
          // Guardar credenciales y mostrar modal
          setTemporaryCredentials({
            email,
            password: passwordTemporal,
            docenteNombre: `${data.nombre} ${data.apellido}`
          })
          setShowCredentialsModal(true)
          
          toast.success('Docente creado exitosamente. Revisa las credenciales temporales.', { duration: 5000 })
        } else {
          toast.success(response.message || (editingDocente ? 'Docente actualizado exitosamente' : 'Docente creado exitosamente'))
        }
        
        setShowModal(false)
        reset()
        setEditingDocente(null)
        setSiguienteRegistro('')
        await fetchDocentes()
      } else {
        toast.error(response.message || 'Error al guardar docente')
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
      const errorMessage = error.response?.data?.message || error.message || 'Error al guardar docente'
      toast.error(errorMessage)
      
      // Mostrar errores de validación del backend
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

  const handleEdit = (docente) => {
    setEditingDocente(docente)
    reset({
      ci: docente.ci,
      nombre: docente.nombre,
      apellido: docente.apellido,
      celular: docente.celular || '',
      sexo: docente.sexo || '',
      fecha_nacimiento: docente.fecha_nacimiento || '',
      direccion: docente.direccion || '',
      cargo: docente.cargo || '',
      area_de_especializacion: docente.area_de_especializacion || '',
      modalidad_de_contratacion: docente.modalidad_de_contratacion || '',
      email: '' // No se muestra el email en edición por seguridad
    })
    setShowModal(true)
  }

  const handleView = async (docente) => {
    // Usar siempre el id para ver
    const docenteId = docente.id
    
    if (!docenteId) {
      toast.error('No se pudo identificar el docente')
      return
    }
    
    console.log('🔍 Obteniendo docente con ID:', docenteId)
    
    const response = await docenteService.getDocenteById(docenteId)
    if (response.success) {
      setViewingDocente(response.data)
      setShowViewModal(true)
    } else {
      toast.error(response.message || 'Error al cargar detalles del docente')
    }
  }

  const handleDelete = async (docente) => {
    if (!window.confirm(`¿Está seguro de eliminar al docente "${docente.nombre} ${docente.apellido}"?`)) {
      return
    }

    // Usar siempre el id para eliminar
    const docenteId = docente.id
    
    if (!docenteId) {
      toast.error('No se pudo identificar el docente')
      return
    }

    try {
      const response = await docenteService.removeDocente(docenteId)
      if (response.success) {
        toast.success(response.message)
        fetchDocentes()
      } else {
        toast.error(response.message)
      }
    } catch (error) {
      toast.error('Error al eliminar docente')
    }
  }

  const handleNew = async () => {
    setEditingDocente(null)
    reset({
      ci: '',
      nombre: '',
      apellido: '',
      celular: '',
      sexo: '',
      fecha_nacimiento: '',
      direccion: '',
      cargo: '',
      area_de_especializacion: '',
      modalidad_de_contratacion: '',
      email: ''
    })
    await fetchSiguienteRegistro()
    setShowModal(true)
  }

  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      toast.success(`${field === 'email' ? 'Email' : 'Contraseña'} copiado al portapapeles`, { duration: 2000 })
      
      // Resetear el estado después de 2 segundos
      setTimeout(() => {
        setCopiedField(null)
      }, 2000)
    } catch (error) {
      console.error('Error al copiar:', error)
      toast.error('Error al copiar al portapapeles')
    }
  }

  const copyAllCredentials = async () => {
    if (!temporaryCredentials) return
    
    const credentialsText = `Email: ${temporaryCredentials.email}\nContraseña: ${temporaryCredentials.password}`
    try {
      await navigator.clipboard.writeText(credentialsText)
      toast.success('Credenciales completas copiadas al portapapeles', { duration: 2000 })
    } catch (error) {
      console.error('Error al copiar:', error)
      toast.error('Error al copiar al portapapeles')
    }
  }

  const columns = [
    {
      key: 'docente',
      label: 'Docente',
      sortable: true,
      render: (row) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-semibold">
              {row.nombre?.charAt(0) || 'D'}
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
      key: 'registro_docente',
      label: 'Registro',
      sortable: true,
      render: (row) => (
        <span className="text-gray-900 dark:text-gray-100 font-medium">
          {row.registro_docente || 'N/A'}
        </span>
      )
    },
    {
      key: 'cargo',
      label: 'Cargo',
      render: (row) => (
        <span className="text-gray-600 dark:text-gray-400">
          {row.cargo || 'N/A'}
        </span>
      )
    },
    {
      key: 'area_de_especializacion',
      label: 'Especialización',
      render: (row) => (
        <span className="text-gray-600 dark:text-gray-400">
          {row.area_de_especializacion || 'N/A'}
        </span>
      )
    },
    {
      key: 'grupos_count',
      label: 'Grupos',
      sortable: true,
      render: (row) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          row.grupos_count > 0
            ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-400'
            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
        }`}>
          {row.grupos_count || 0}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (row) => (
        <div className="flex items-center space-x-2">
          {canView('docentes') && (
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleView(row)
              }}
              className="p-2 rounded-xl text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors duration-200"
              title="Ver detalles"
            >
              <Eye className="h-4 w-4" />
            </button>
          )}
          {canEdit('docentes') && (
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleEdit(row)
              }}
              className="p-2 rounded-xl text-warning-600 hover:bg-warning-50 dark:hover:bg-warning-900/20 transition-colors duration-200"
              title="Editar"
            >
              <Edit2 className="h-4 w-4" />
            </button>
          )}
          {canDelete('docentes') && (
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleDelete(row)
              }}
              className="p-2 rounded-xl text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Eliminar"
              disabled={row.grupos_count > 0}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
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
            <UserCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text">Gestión de Docentes</h1>
            <p className="text-gray-600 dark:text-gray-400">Administra los docentes del sistema</p>
          </div>
        </div>
        {canCreate('docentes') && (
          <Button
            variant="primary"
            icon={<Plus className="h-5 w-5" />}
            onClick={handleNew}
          >
            Nuevo Docente
          </Button>
        )}
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card className="gradient" shadow="glow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Total Docentes</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-glow">
              <UserCheck className="h-6 w-6 text-white" />
            </div>
          </div>
        </Card>
        
        <Card className="gradient" shadow="glow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Con Grupos Asignados</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.conGrupos}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-success-500 to-success-600 rounded-xl flex items-center justify-center shadow-glow">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Búsqueda y filtros */}
      <Card className="gradient" shadow="glow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar por nombre, CI o registro..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-10"
            />
          </div>
          <div className="w-full sm:w-64">
            <Input
              type="text"
              placeholder="Filtrar por especialización..."
              value={especializacionFilter}
              onChange={(e) => {
                setEspecializacionFilter(e.target.value)
                setCurrentPage(1)
              }}
            />
          </div>
        </div>
      </Card>

      {/* Tabla */}
      <Card className="gradient" shadow="glow-lg">
        <Table
          columns={columns}
          data={docentes}
          loading={loading}
          emptyMessage="No se encontraron docentes"
          hover
          striped
        />
      </Card>

      {/* Modal Crear/Editar */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingDocente(null)
          setSiguienteRegistro('')
          reset()
        }}
        title={editingDocente ? 'Editar Docente' : 'Nuevo Docente'}
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
                disabled={!!editingDocente}
                onInput={(e) => {
                  e.target.value = e.target.value.replace(/\D/g, '')
                  trigger('ci')
                }}
              />
            </div>

            {!editingDocente && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Registro Docente
                </label>
                <Input
                  type="text"
                  value={siguienteRegistro}
                  placeholder="Se generará automáticamente"
                  readOnly
                  className="bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                />
                {siguienteRegistro && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Este número se asignará automáticamente al crear el docente
                  </p>
                )}
              </div>
            )}
          </div>

          {!editingDocente && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email * <span className="text-xs text-gray-500">(Para credenciales de acceso)</span>
              </label>
              <Input
                type="email"
                {...register('email', { 
                  required: 'El email es requerido para crear las credenciales de acceso',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'El email debe tener un formato válido'
                  }
                })}
                placeholder="Ej: docente@icap.edu.bo"
                error={errors.email?.message}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Se generará una contraseña temporal que el docente deberá cambiar en su primer login
              </p>
            </div>
          )}

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
                Celular
              </label>
              <Input
                type="text"
                {...register('celular', {
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

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fecha de Nacimiento
            </label>
            <Input
              type="date"
              {...register('fecha_nacimiento', {
                validate: (value) => {
                  if (value) {
                    const fecha = new Date(value)
                    const hoy = new Date()
                    hoy.setHours(0, 0, 0, 0)
                    
                    if (fecha >= hoy) {
                      return 'La fecha de nacimiento debe ser anterior a hoy'
                    }
                    
                    // Validar que la edad sea razonable (mínimo 18 años, máximo 100 años)
                    const edad = hoy.getFullYear() - fecha.getFullYear()
                    const mesDiferencia = hoy.getMonth() - fecha.getMonth()
                    const diaDiferencia = hoy.getDate() - fecha.getDate()
                    
                    const edadReal = mesDiferencia < 0 || (mesDiferencia === 0 && diaDiferencia < 0) ? edad - 1 : edad
                    
                    if (edadReal < 18) {
                      return 'El docente debe tener al menos 18 años'
                    }
                    
                    if (edadReal > 100) {
                      return 'La fecha de nacimiento no es válida (edad mayor a 100 años)'
                    }
                  }
                  return true
                }
              })}
              error={errors.fecha_nacimiento?.message}
              max={new Date().toISOString().split('T')[0]}
              min={new Date(new Date().setFullYear(new Date().getFullYear() - 100)).toISOString().split('T')[0]}
            />
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
                },
                validate: (value) => {
                  if (value && value.trim() !== '') {
                    if (value.trim().length < 5) {
                      return 'La dirección debe tener al menos 5 caracteres'
                    }
                  }
                  return true
                }
              })}
              placeholder="Ej: Av. Principal #123"
              error={errors.direccion?.message}
              onBlur={() => trigger('direccion')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cargo
              </label>
              <Input
                type="text"
                {...register('cargo', {
                  maxLength: {
                    value: 100,
                    message: 'El cargo no puede tener más de 100 caracteres'
                  },
                  validate: (value) => {
                    if (value && value.trim() !== '') {
                      if (value.trim().length < 3) {
                        return 'El cargo debe tener al menos 3 caracteres'
                      }
                    }
                    return true
                  }
                })}
                placeholder="Ej: Profesor Titular"
                error={errors.cargo?.message}
                onBlur={() => trigger('cargo')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Modalidad de Contratación
              </label>
              <Input
                type="text"
                {...register('modalidad_de_contratacion', {
                  maxLength: {
                    value: 100,
                    message: 'La modalidad no puede tener más de 100 caracteres'
                  },
                  validate: (value) => {
                    if (value && value.trim() !== '') {
                      if (value.trim().length < 3) {
                        return 'La modalidad debe tener al menos 3 caracteres'
                      }
                    }
                    return true
                  }
                })}
                placeholder="Ej: Tiempo Completo"
                error={errors.modalidad_de_contratacion?.message}
                onBlur={() => trigger('modalidad_de_contratacion')}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Área de Especialización
            </label>
            <Input
              type="text"
              {...register('area_de_especializacion', {
                maxLength: {
                  value: 200,
                  message: 'El área de especialización no puede tener más de 200 caracteres'
                },
                validate: (value) => {
                  if (value && value.trim() !== '') {
                    if (value.trim().length < 3) {
                      return 'El área de especialización debe tener al menos 3 caracteres'
                    }
                  }
                  return true
                }
              })}
              placeholder="Ej: Ciencias de la Educación"
              error={errors.area_de_especializacion?.message}
              onBlur={() => trigger('area_de_especializacion')}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowModal(false)
                setEditingDocente(null)
                reset()
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              {editingDocente ? 'Actualizar' : 'Crear'} Docente
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Ver */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false)
          setViewingDocente(null)
        }}
        title="Detalles del Docente"
        size="xl"
      >
        {viewingDocente && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Nombre Completo
                </label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {viewingDocente.nombre} {viewingDocente.apellido}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  CI
                </label>
                <p className="text-gray-700 dark:text-gray-300">
                  {viewingDocente.ci}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Registro Docente
                </label>
                <p className="text-gray-700 dark:text-gray-300">
                  {viewingDocente.registro_docente}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Cargo
                </label>
                <p className="text-gray-700 dark:text-gray-300">
                  {viewingDocente.cargo || 'N/A'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Área de Especialización
              </label>
              <p className="text-gray-700 dark:text-gray-300">
                {viewingDocente.area_de_especializacion || 'N/A'}
              </p>
            </div>

            {viewingDocente.grupos && viewingDocente.grupos.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Grupos Asignados ({viewingDocente.grupos.length})
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {viewingDocente.grupos.map((grupo) => (
                    <div key={grupo.grupo_id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {grupo.programa?.nombre || 'Sin programa'}
                      </p>
                      {grupo.modulo && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Módulo: {grupo.modulo.nombre}
                        </p>
                      )}
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {grupo.fecha_ini} - {grupo.fecha_fin}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal de Credenciales Temporales */}
      <Modal
        isOpen={showCredentialsModal}
        onClose={() => {
          setShowCredentialsModal(false)
          setTemporaryCredentials(null)
          setCopiedField(null)
        }}
        title="Credenciales Temporales del Docente"
        size="md"
      >
        {temporaryCredentials && (
          <div className="space-y-6">
            {/* Alerta importante */}
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-800 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-200 mb-1">
                    ⚠️ Importante
                  </p>
                  <p className="text-xs text-yellow-800 dark:text-yellow-300">
                    Guarda estas credenciales de forma segura. El docente <strong>{temporaryCredentials.docenteNombre}</strong> deberá cambiar su contraseña en el primer login.
                  </p>
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <Mail className="h-5 w-5 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                  <code className="flex-1 text-sm font-mono text-gray-900 dark:text-gray-100 break-all">
                    {temporaryCredentials.email}
                  </code>
                </div>
                <Button
                  type="button"
                  variant={copiedField === 'email' ? 'success' : 'outline'}
                  size="md"
                  icon={copiedField === 'email' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  onClick={() => copyToClipboard(temporaryCredentials.email, 'email')}
                  className="flex-shrink-0"
                >
                  {copiedField === 'email' ? 'Copiado' : 'Copiar'}
                </Button>
              </div>
            </div>

            {/* Contraseña */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Contraseña Temporal
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <Lock className="h-5 w-5 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                  <code className="flex-1 text-sm font-mono text-gray-900 dark:text-gray-100 break-all">
                    {temporaryCredentials.password}
                  </code>
                </div>
                <Button
                  type="button"
                  variant={copiedField === 'password' ? 'success' : 'outline'}
                  size="md"
                  icon={copiedField === 'password' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  onClick={() => copyToClipboard(temporaryCredentials.password, 'password')}
                  className="flex-shrink-0"
                >
                  {copiedField === 'password' ? 'Copiado' : 'Copiar'}
                </Button>
              </div>
            </div>

            {/* Botón para copiar todo */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="primary"
                fullWidth
                icon={<Copy className="h-5 w-5" />}
                onClick={copyAllCredentials}
              >
                Copiar Credenciales Completas
              </Button>
            </div>

            {/* Información adicional */}
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-800 dark:text-blue-300">
                💡 <strong>Tip:</strong> Puedes copiar cada credencial individualmente o copiar ambas a la vez. 
                Comparte estas credenciales de forma segura con el docente.
              </p>
            </div>

            {/* Botón de cierre */}
            <div className="flex justify-end pt-2">
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  setShowCredentialsModal(false)
                  setTemporaryCredentials(null)
                  setCopiedField(null)
                }}
              >
                Entendido
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Docentes
