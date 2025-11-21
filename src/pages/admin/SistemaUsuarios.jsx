import React, { useState, useEffect } from 'react'
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Shield,
  Mail,
  User,
  CheckCircle,
  XCircle
} from 'lucide-react'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Modal from '../../components/common/Modal'
import Table from '../../components/common/Table'
import Card from '../../components/common/Card'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { sistemaUsuarioService } from '../../services/configuracionService'
import { useAuth } from '../../contexts/AuthContext'

const SistemaUsuarios = () => {
  const { user: currentUser } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRol, setSelectedRol] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingUsuario, setEditingUsuario] = useState(null)
  const [viewingUsuario, setViewingUsuario] = useState(null)

  const { register, handleSubmit, reset, formState: { errors }, watch, trigger, setValue } = useForm({
    mode: 'onChange',
    defaultValues: {
      ci: '',
      nombre: '',
      apellido: '',
      celular: '',
      sexo: '',
      fecha_nacimiento: '',
      direccion: '',
      email: '',
      password: '',
      password_confirmation: '',
      rol_id: ''
    }
  })

  useEffect(() => {
    fetchRoles()
  }, [])

  useEffect(() => {
    fetchUsuarios()
  }, [currentPage, perPage, searchTerm, selectedRol])

  const fetchRoles = async () => {
    try {
      const response = await sistemaUsuarioService.getRoles()
      if (response.success) {
        // Filtrar roles para excluir ESTUDIANTE (solo ADMIN y DOCENTE)
        const rolesFiltrados = (response.data || []).filter(rol => 
          rol.nombre_rol !== 'ESTUDIANTE' && rol.nombre_rol !== 'estudiante'
        )
        setRoles(rolesFiltrados)
      } else {
        toast.error(response.message || 'Error al cargar roles')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al cargar roles'
      toast.error(errorMessage)
    }
  }

  const fetchUsuarios = async () => {
    try {
      setLoading(true)
      const response = await sistemaUsuarioService.getUsuarios({
        page: currentPage,
        per_page: perPage,
        search: searchTerm,
        rol_id: selectedRol || undefined
      })
      
      if (response.success && response.data) {
        // Filtrar usuarios para excluir estudiantes (solo ADMIN y DOCENTE)
        const usuariosFiltrados = (response.data.data || []).filter(usuario => {
          const rolNombre = usuario.rol?.nombre_rol || ''
          return rolNombre !== 'ESTUDIANTE' && rolNombre !== 'estudiante'
        })
        setUsuarios(usuariosFiltrados)
        setTotalPages(response.data.last_page || 1)
      } else {
        const errorMessage = response.message || 'Error al cargar usuarios'
        toast.error(errorMessage)
        setUsuarios([])
        setTotalPages(1)
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error de conexión. Por favor, verifica tu conexión a internet'
      toast.error(errorMessage)
      setUsuarios([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingUsuario(null)
    reset({
      ci: '',
      nombre: '',
      apellido: '',
      celular: '',
      sexo: '',
      fecha_nacimiento: '',
      direccion: '',
      email: '',
      password: '',
      password_confirmation: '',
      rol_id: ''
    })
    setShowModal(true)
  }

  const handleEdit = (usuario) => {
    setEditingUsuario(usuario)
    const persona = usuario.persona || {}
    reset({
      ci: persona.ci || '',
      nombre: persona.nombre || '',
      apellido: persona.apellido || '',
      celular: persona.celular || '',
      sexo: persona.sexo || '',
      fecha_nacimiento: persona.fecha_nacimiento ? persona.fecha_nacimiento.split('T')[0] : '',
      direccion: persona.direccion || '',
      email: usuario.email || '',
      password: '',
      password_confirmation: '',
      rol_id: usuario.rol_id || ''
    })
    setShowModal(true)
  }

  const handleView = async (usuario) => {
    try {
      const response = await sistemaUsuarioService.getUsuario(usuario.usuario_id || usuario.id)
      if (response.success) {
        // Verificar que no sea estudiante
        if (response.data?.rol?.nombre_rol === 'ESTUDIANTE' || response.data?.rol?.nombre_rol === 'estudiante') {
          toast.error('Los usuarios estudiantes se gestionan desde el módulo de estudiantes')
          return
        }
        setViewingUsuario(response.data)
        setShowViewModal(true)
      } else {
        toast.error(response.message || 'Error al cargar el usuario')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al cargar el usuario'
      toast.error(errorMessage)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) return
    
    try {
      setLoading(true)
      const response = await sistemaUsuarioService.deleteUsuario(id)
      
      if (response.success) {
        toast.success(response.message || 'Usuario eliminado exitosamente')
        await fetchUsuarios()
      } else {
        toast.error(response.message || 'Error al eliminar el usuario')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Error al eliminar el usuario')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data) => {
    // Validación adicional antes de enviar
    if (!data.ci || data.ci.trim() === '') {
      toast.error('El CI es obligatorio')
      return
    }

    if (!data.nombre || data.nombre.trim() === '') {
      toast.error('El nombre es obligatorio')
      return
    }

    if (!data.apellido || data.apellido.trim() === '') {
      toast.error('El apellido es obligatorio')
      return
    }

    if (!data.email || data.email.trim() === '') {
      toast.error('El email es obligatorio')
      return
    }

    // Validar formato de email
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
    if (!emailRegex.test(data.email)) {
      toast.error('El email no es válido')
      return
    }

    if (!data.rol_id) {
      toast.error('El rol es obligatorio')
      return
    }

    // Validar que el rol no sea ESTUDIANTE
    const rolSeleccionado = roles.find(r => r.rol_id === parseInt(data.rol_id))
    if (rolSeleccionado && (rolSeleccionado.nombre_rol === 'ESTUDIANTE' || rolSeleccionado.nombre_rol === 'estudiante')) {
      toast.error('No se puede crear un usuario con rol ESTUDIANTE desde este módulo. Los estudiantes se registran desde el portal de estudiantes.')
      return
    }

    // Validar contraseña para nuevos usuarios
    if (!editingUsuario) {
      if (!data.password || data.password.length < 6) {
        toast.error('La contraseña es obligatoria y debe tener al menos 6 caracteres')
        return
      }
      if (data.password !== data.password_confirmation) {
        toast.error('Las contraseñas no coinciden')
        return
      }
    } else {
      // Para edición, validar contraseña solo si se proporciona
      // Si password está vacío, no se valida ni se envía (se mantiene la actual)
      if (data.password && data.password.trim() !== '') {
        if (data.password.length < 6) {
          toast.error('La contraseña debe tener al menos 6 caracteres')
          return
        }
        // Solo validar confirmación si password fue proporcionado
        if (data.password !== data.password_confirmation) {
          toast.error('Las contraseñas no coinciden')
          return
        }
      }
      // Si password está vacío, no se valida password_confirmation (puede estar vacío)
    }

    try {
      setLoading(true)
      
      // Limpiar y preparar datos
      const datosBackend = {
        ci: data.ci.trim(),
        nombre: data.nombre.trim(),
        apellido: data.apellido.trim(),
        celular: data.celular ? data.celular.trim() : null,
        sexo: data.sexo || null,
        fecha_nacimiento: data.fecha_nacimiento || null,
        direccion: data.direccion ? data.direccion.trim() : null,
        email: data.email.trim().toLowerCase(),
        rol_id: parseInt(data.rol_id)
      }

      // Eliminar campos vacíos
      Object.keys(datosBackend).forEach(key => {
        if (datosBackend[key] === null || datosBackend[key] === '') {
          delete datosBackend[key]
        }
      })

      // Si es edición, no enviar password si está vacío (se mantiene la actual)
      if (editingUsuario) {
        // Solo enviar password si se proporcionó uno nuevo
        if (data.password && data.password.trim() !== '') {
          datosBackend.password = data.password.trim()
          datosBackend.password_confirmation = data.password_confirmation ? data.password_confirmation.trim() : ''
        }
        // Si password está vacío, no se agrega al objeto (el backend mantendrá la contraseña actual)
      } else {
        // En creación, password es obligatorio
        datosBackend.password = data.password
        datosBackend.password_confirmation = data.password_confirmation
      }
      
      let response
      
      if (editingUsuario) {
        response = await sistemaUsuarioService.updateUsuario(editingUsuario.usuario_id || editingUsuario.id, datosBackend)
      } else {
        response = await sistemaUsuarioService.createUsuario(datosBackend)
      }
      
      if (response.success) {
        toast.success(response.message || (editingUsuario ? 'Usuario actualizado exitosamente' : 'Usuario creado exitosamente'))
        setShowModal(false)
        setEditingUsuario(null)
        reset()
        await fetchUsuarios()
      } else {
        // Mostrar mensaje principal
        toast.error(response.message || 'Error al guardar el usuario')
        
        // Mostrar errores de validación individuales
        if (response.errors) {
          const errorMessages = Array.isArray(response.errors) 
            ? response.errors 
            : Object.values(response.errors).flat()
          
          errorMessages.forEach((errorMsg) => {
            if (typeof errorMsg === 'string' && errorMsg.trim()) {
              toast.error(errorMsg, { duration: 4000 })
            }
          })
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al guardar el usuario'
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
          }
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      key: 'persona',
      label: 'Usuario',
      sortable: true,
      render: (row) => {
        const persona = row.persona || {}
        const nombreCompleto = `${persona.nombre || ''} ${persona.apellido || ''}`.trim() || row.email
        return (
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-semibold">
                {nombreCompleto.charAt(0) || 'U'}
              </div>
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">{nombreCompleto}</div>
              <div className="text-sm text-gray-500">{row.email}</div>
            </div>
          </div>
        )
      }
    },
    {
      key: 'rol',
      label: 'Rol',
      sortable: true,
      render: (row) => (
        <div className="flex items-center space-x-2">
          <Shield className="h-4 w-4 text-gray-400" />
          <span className="text-gray-900 dark:text-gray-100 capitalize">
            {row.rol?.nombre_rol || 'Sin rol'}
          </span>
        </div>
      )
    },
    {
      key: 'ci',
      label: 'CI',
      render: (row) => (
        <span className="text-gray-900 dark:text-gray-100">
          {row.persona?.ci || '-'}
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
          {(row.usuario_id || row.id) !== currentUser?.id && (
            <Button
              variant="ghost"
              size="sm"
              icon={<Trash2 className="h-4 w-4" />}
              onClick={() => handleDelete(row.usuario_id || row.id)}
            />
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
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text">Gestión de Usuarios del Sistema</h1>
            <p className="text-gray-600 dark:text-gray-400">Administra los usuarios base del sistema</p>
          </div>
        </div>
        <Button
          variant="primary"
          icon={<Plus className="h-5 w-5" />}
          onClick={handleCreate}
        >
          Nuevo Usuario
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <Card className="gradient" shadow="glow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Total Usuarios</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{usuarios.length}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-glow">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
        </Card>
        <Card className="gradient" shadow="glow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Administradores</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {usuarios.filter(u => u.rol?.nombre_rol === 'ADMIN').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center shadow-glow">
              <Shield className="h-6 w-6 text-white" />
            </div>
          </div>
        </Card>
        <Card className="gradient" shadow="glow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Docentes</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {usuarios.filter(u => u.rol?.nombre_rol === 'DOCENTE').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-info-500 to-info-600 rounded-xl flex items-center justify-center shadow-glow">
              <User className="h-6 w-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabla de Usuarios */}
      <Card className="gradient" shadow="glow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h3 className="text-xl font-bold gradient-text mb-4 sm:mb-0">Lista de Usuarios</h3>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar usuarios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
            <select
              value={selectedRol}
              onChange={(e) => setSelectedRol(e.target.value)}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todos los roles</option>
              {roles.map(rol => (
                <option key={rol.rol_id} value={rol.rol_id}>{rol.nombre_rol}</option>
              ))}
            </select>
          </div>
        </div>
        
        <Table
          columns={columns}
          data={usuarios}
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

      {/* Modal de Crear/Editar Usuario */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingUsuario(null)
          reset()
        }}
        title={editingUsuario ? 'Editar Usuario' : 'Nuevo Usuario'}
        size="xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <h3 className="col-span-2 text-lg font-semibold text-gray-900 dark:text-gray-100">Datos de la Persona</h3>
            
            <Input
              label="CI *"
              placeholder="Ej: 12345678"
              error={errors.ci?.message}
              {...register('ci', { 
                required: 'El CI es obligatorio',
                maxLength: {
                  value: 20,
                  message: 'El CI no puede tener más de 20 caracteres'
                },
                validate: (value) => {
                  if (value && value.trim().length === 0) {
                    return 'El CI no puede estar vacío'
                  }
                  return true
                }
              })}
              onBlur={() => trigger('ci')}
            />

            <Input
              label="Nombre *"
              placeholder="Ej: Juan"
              error={errors.nombre?.message}
              {...register('nombre', { 
                required: 'El nombre es obligatorio',
                maxLength: {
                  value: 100,
                  message: 'El nombre no puede tener más de 100 caracteres'
                },
                validate: (value) => {
                  if (value && value.trim().length === 0) {
                    return 'El nombre no puede estar vacío'
                  }
                  return true
                }
              })}
              onBlur={() => trigger('nombre')}
            />

            <Input
              label="Apellido *"
              placeholder="Ej: Pérez"
              error={errors.apellido?.message}
              {...register('apellido', { 
                required: 'El apellido es obligatorio',
                maxLength: {
                  value: 100,
                  message: 'El apellido no puede tener más de 100 caracteres'
                },
                validate: (value) => {
                  if (value && value.trim().length === 0) {
                    return 'El apellido no puede estar vacío'
                  }
                  return true
                }
              })}
              onBlur={() => trigger('apellido')}
            />

            <Input
              label="Celular"
              placeholder="Ej: 70000000"
              error={errors.celular?.message}
              {...register('celular', {
                maxLength: {
                  value: 20,
                  message: 'El celular no puede tener más de 20 caracteres'
                },
                pattern: {
                  value: /^[0-9]*$/,
                  message: 'El celular solo puede contener números'
                }
              })}
              onBlur={() => trigger('celular')}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sexo
              </label>
              <select
                {...register('sexo')}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Seleccionar...</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
            </div>

            <Input
              label="Fecha de Nacimiento"
              type="date"
              error={errors.fecha_nacimiento?.message}
              {...register('fecha_nacimiento')}
            />

            <Input
              label="Dirección"
              placeholder="Ej: Av. Principal #123"
              error={errors.direccion?.message}
              {...register('direccion', {
                maxLength: {
                  value: 300,
                  message: 'La dirección no puede tener más de 300 caracteres'
                }
              })}
              className="col-span-2"
              onBlur={() => trigger('direccion')}
            />

            <h3 className="col-span-2 text-lg font-semibold text-gray-900 dark:text-gray-100 mt-4">Datos del Usuario</h3>

            <Input
              label="Email *"
              type="email"
              placeholder="Ej: juan@example.com"
              error={errors.email?.message}
              {...register('email', { 
                required: 'El email es obligatorio',
                maxLength: {
                  value: 100,
                  message: 'El email no puede tener más de 100 caracteres'
                },
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'El email no es válido'
                },
                validate: (value) => {
                  if (value && value.trim().length === 0) {
                    return 'El email no puede estar vacío'
                  }
                  return true
                }
              })}
              onBlur={() => trigger('email')}
              onChange={(e) => {
                const value = e.target.value.toLowerCase().trim()
                setValue('email', value, { shouldValidate: true })
              }}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rol *
              </label>
              <select
                {...register('rol_id', { 
                  required: 'El rol es obligatorio',
                  validate: (value) => {
                    if (!value) return 'El rol es obligatorio'
                    const rolSeleccionado = roles.find(r => r.rol_id === parseInt(value))
                    if (rolSeleccionado && (rolSeleccionado.nombre_rol === 'ESTUDIANTE' || rolSeleccionado.nombre_rol === 'estudiante')) {
                      return 'No se puede seleccionar el rol ESTUDIANTE. Los estudiantes se registran desde el portal de estudiantes.'
                    }
                    return true
                  }
                })}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
                onBlur={() => trigger('rol_id')}
              >
                <option value="">Seleccionar rol...</option>
                {roles
                  .filter(rol => rol.nombre_rol !== 'ESTUDIANTE' && rol.nombre_rol !== 'estudiante')
                  .map(rol => (
                    <option key={rol.rol_id} value={rol.rol_id}>
                      {rol.nombre_rol} - {rol.descripcion || ''}
                    </option>
                  ))}
              </select>
              {errors.rol_id && (
                <p className="mt-1 text-sm text-error-600">{errors.rol_id.message}</p>
              )}
            </div>

            {!editingUsuario && (
              <>
                <Input
                  label="Contraseña *"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  error={errors.password?.message}
                  {...register('password', { 
                    required: 'La contraseña es obligatoria',
                    minLength: { 
                      value: 6, 
                      message: 'La contraseña debe tener al menos 6 caracteres' 
                    },
                    validate: (value) => {
                      if (!value || value.length < 6) {
                        return 'La contraseña debe tener al menos 6 caracteres'
                      }
                      return true
                    }
                  })}
                  onBlur={() => trigger('password')}
                />

                <Input
                  label="Confirmar Contraseña *"
                  type="password"
                  placeholder="Repite la contraseña"
                  error={errors.password_confirmation?.message}
                  {...register('password_confirmation', { 
                    required: 'La confirmación de contraseña es obligatoria',
                    validate: value => {
                      if (!value) return 'La confirmación de contraseña es obligatoria'
                      if (value !== watch('password')) {
                        return 'Las contraseñas no coinciden'
                      }
                      return true
                    }
                  })}
                  onBlur={() => trigger('password_confirmation')}
                />
              </>
            )}

            {editingUsuario && (
              <>
                <Input
                  label="Nueva Contraseña (opcional)"
                  type="password"
                  placeholder="Dejar vacío para mantener la actual"
                  error={errors.password?.message}
                  {...register('password', { 
                    minLength: { 
                      value: 6, 
                      message: 'La contraseña debe tener al menos 6 caracteres' 
                    },
                    validate: (value) => {
                      if (value && value.length > 0 && value.length < 6) {
                        return 'La contraseña debe tener al menos 6 caracteres'
                      }
                      return true
                    }
                  })}
                  onBlur={() => trigger('password')}
                />

                <Input
                  label="Confirmar Nueva Contraseña (opcional)"
                  type="password"
                  placeholder="Solo si cambias la contraseña"
                  error={errors.password_confirmation?.message}
                  {...register('password_confirmation', { 
                    validate: value => {
                      const password = watch('password')
                      // Solo validar si se proporcionó una contraseña nueva
                      if (password && password.trim() !== '') {
                        // Si hay password, debe haber confirmación y deben coincidir
                        if (!value || value.trim() === '') {
                          return 'Debes confirmar la nueva contraseña'
                        }
                        if (value !== password) {
                          return 'Las contraseñas no coinciden'
                        }
                      }
                      // Si no hay password, password_confirmation puede estar vacío
                      return true
                    }
                  })}
                  onBlur={() => trigger('password_confirmation')}
                />
              </>
            )}
          </div>
          
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowModal(false)
                setEditingUsuario(null)
                reset()
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={<Plus className="h-5 w-5" />}
            >
              {editingUsuario ? 'Actualizar' : 'Crear'} Usuario
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Ver Usuario */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Detalles del Usuario"
        size="lg"
      >
        {viewingUsuario && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre Completo
                </label>
                <p className="text-gray-900 dark:text-gray-100">
                  {viewingUsuario.persona?.nombre || ''} {viewingUsuario.persona?.apellido || ''}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  CI
                </label>
                <p className="text-gray-900 dark:text-gray-100">{viewingUsuario.persona?.ci || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <p className="text-gray-900 dark:text-gray-100">{viewingUsuario.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rol
                </label>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-400 capitalize">
                  {viewingUsuario.rol?.nombre_rol || 'Sin rol'}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Celular
                </label>
                <p className="text-gray-900 dark:text-gray-100">{viewingUsuario.persona?.celular || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Dirección
                </label>
                <p className="text-gray-900 dark:text-gray-100">{viewingUsuario.persona?.direccion || '-'}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default SistemaUsuarios

