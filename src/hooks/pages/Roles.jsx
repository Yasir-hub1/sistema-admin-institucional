import React, { useState, useEffect } from 'react'
import {
  Shield,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Lock,
  Users
} from 'lucide-react'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Modal from '../components/common/Modal'
import Table from '../components/common/Table'
import Card from '../components/common/Card'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { roleService } from '../services/roleService'
import { permisoService } from '../services/permisoService'
import { useAuth } from '../contexts/AuthContext'
import { usePermissions } from '../hooks/usePermissions'

const Roles = () => {
  const { user, isAdmin } = useAuth()
  const { canCreate, canEdit, canDelete, canView, canDo } = usePermissions()
  const [roles, setRoles] = useState([])
  const [permisos, setPermisos] = useState([])
  const [permisosAgrupados, setPermisosAgrupados] = useState({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [showModal, setShowModal] = useState(false)
  const [showPermisosModal, setShowPermisosModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingRole, setEditingRole] = useState(null)
  const [viewingRole, setViewingRole] = useState(null)
  const [selectedPermisos, setSelectedPermisos] = useState([])

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    fetchRoles()
    fetchPermisos()
  }, [currentPage, perPage, searchTerm])

  const fetchRoles = async () => {
    try {
      setLoading(true)
      const response = await roleService.getRoles({
        page: currentPage,
        per_page: perPage,
        search: searchTerm
      })
      
      if (response.success && response.data) {
        setRoles(response.data.data || [])
        setTotalPages(response.data.last_page || 1)
      } else {
        toast.error(response.message || 'Error al cargar roles')
        setRoles([])
        setTotalPages(1)
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error de conexión'
      toast.error(errorMessage)
      setRoles([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  const fetchPermisos = async () => {
    try {
      const response = await roleService.getPermisos()
      if (response.success && response.data) {
        const permisosData = Array.isArray(response.data) ? response.data : []
        setPermisos(permisosData)
        // Agrupar por módulo
        const agrupados = permisosData.reduce((acc, permiso) => {
          if (!acc[permiso.modulo]) {
            acc[permiso.modulo] = []
          }
          acc[permiso.modulo].push(permiso)
          return acc
        }, {})
        setPermisosAgrupados(agrupados)
      }
    } catch (error) {
      console.error('Error al cargar permisos:', error)
      // Fallback: intentar con permisoService
      try {
        const fallbackResponse = await permisoService.getPermisosPorModulo()
        if (fallbackResponse.success && fallbackResponse.data) {
          setPermisosAgrupados(fallbackResponse.data)
        }
      } catch (fallbackError) {
        console.error('Error al cargar permisos (fallback):', fallbackError)
      }
    }
  }

  const handleCreate = () => {
    setEditingRole(null)
    setSelectedPermisos([])
    reset({
      nombre: '',
      descripcion: ''
    })
    setShowModal(true)
  }

  const handleEdit = async (role) => {
    try {
      const response = await roleService.getRole(role.id)
      if (response.success) {
        setEditingRole(response.data)
        const permisosIds = response.data.permisos?.map(p => p.id) || []
        setSelectedPermisos(permisosIds)
        reset({
          nombre: response.data.nombre,
          descripcion: response.data.descripcion || ''
        })
        setShowModal(true)
      }
    } catch (error) {
      toast.error('Error al cargar el rol')
    }
  }

  const handleView = async (role) => {
    try {
      const response = await roleService.getRole(role.id)
      if (response.success) {
        setViewingRole(response.data)
        setShowViewModal(true)
      }
    } catch (error) {
      toast.error('Error al cargar el rol')
    }
  }

  const handleManagePermisos = async (role) => {
    try {
      const response = await roleService.getRole(role.id)
      if (response.success) {
        setEditingRole(response.data)
        setSelectedPermisos(response.data.permisos?.map(p => p.id) || [])
        setShowPermisosModal(true)
      }
    } catch (error) {
      toast.error('Error al cargar permisos del rol')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este rol?')) return
    
    try {
      setLoading(true)
      const response = await roleService.deleteRole(id)
      
      if (response.success) {
        toast.success(response.message || 'Rol eliminado exitosamente')
        await fetchRoles()
      } else {
        toast.error(response.message || 'Error al eliminar el rol')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al eliminar el rol'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      
      const datosBackend = {
        ...data,
        permisos: selectedPermisos
      }

      let response
      
      if (editingRole) {
        response = await roleService.updateRole(editingRole.id, datosBackend)
      } else {
        response = await roleService.createRole(datosBackend)
      }
      
      if (response.success) {
        toast.success(response.message || (editingRole ? 'Rol actualizado exitosamente' : 'Rol creado exitosamente'))
        setShowModal(false)
        setEditingRole(null)
        setSelectedPermisos([])
        reset()
        await fetchRoles()
      } else {
        toast.error(response.message || 'Error al guardar el rol')
        if (response.errors) {
          Object.keys(response.errors).forEach(key => {
            toast.error(`${key}: ${response.errors[key]}`)
          })
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al guardar el rol'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const onSubmitPermisos = async () => {
    try {
      setLoading(true)
      const response = await roleService.asignarPermisos(editingRole.id, selectedPermisos)
      
      if (response.success) {
        toast.success(response.message || 'Permisos asignados exitosamente')
        setShowPermisosModal(false)
        setEditingRole(null)
        setSelectedPermisos([])
        await fetchRoles()
      } else {
        toast.error(response.message || 'Error al asignar permisos')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al asignar permisos'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const togglePermiso = (permisoId) => {
    setSelectedPermisos(prev => 
      prev.includes(permisoId)
        ? prev.filter(id => id !== permisoId)
        : [...prev, permisoId]
    )
  }

  const toggleAllModulo = (moduloPermisos) => {
    const moduloIds = moduloPermisos.map(p => p.id)
    const allSelected = moduloIds.every(id => selectedPermisos.includes(id))
    
    if (allSelected) {
      setSelectedPermisos(prev => prev.filter(id => !moduloIds.includes(id)))
    } else {
      setSelectedPermisos(prev => [...new Set([...prev, ...moduloIds])])
    }
  }

  const columns = [
    {
      key: 'nombre',
      label: 'Rol',
      sortable: true,
      render: (row) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-semibold">
              <Shield className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">{row.nombre}</div>
            <div className="text-sm text-gray-500">{row.descripcion || 'Sin descripción'}</div>
          </div>
        </div>
      )
    },
    {
      key: 'users_count',
      label: 'Usuarios',
      sortable: true,
      render: (row) => (
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4 text-gray-400" />
          <span className="text-gray-900 dark:text-gray-100">{row.users_count || 0}</span>
        </div>
      )
    },
    {
      key: 'permisos_count',
      label: 'Permisos',
      sortable: true,
      render: (row) => (
        <div className="flex items-center space-x-2">
          <Lock className="h-4 w-4 text-gray-400" />
          <span className="text-gray-900 dark:text-gray-100">{row.permisos_count || 0}</span>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (row) => (
        <div className="flex items-center space-x-2">
          {(canView('roles') || isAdmin()) && (
            <Button
              variant="ghost"
              size="sm"
              icon={<Eye className="h-4 w-4" />}
              onClick={() => handleView(row)}
            />
          )}
          {(isAdmin() || canDo('roles', 'asignar_permisos')) && (
            <Button
              variant="info"
              size="sm"
              icon={<Lock className="h-4 w-4" />}
              onClick={() => handleManagePermisos(row)}
              title="Gestionar permisos"
            />
          )}
          {(canEdit('roles') || isAdmin()) && (
            <Button
              variant="ghost"
              size="sm"
              icon={<Edit2 className="h-4 w-4" />}
              onClick={() => handleEdit(row)}
            />
          )}
          {(canDelete('roles') || isAdmin()) && (
            <Button
              variant="ghost"
              size="sm"
              icon={<Trash2 className="h-4 w-4" />}
              onClick={() => handleDelete(row.id)}
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
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text">Roles y Permisos</h1>
            <p className="text-gray-600 dark:text-gray-400">Gestiona los roles y sus permisos del sistema</p>
          </div>
        </div>
        {(isAdmin() || canCreate('roles')) && (
          <Button
            variant="primary"
            icon={<Plus className="h-5 w-5" />}
            onClick={handleCreate}
          >
            Nuevo Rol
          </Button>
        )}
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="gradient" shadow="glow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Total Roles</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{roles.length}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-glow">
              <Shield className="h-6 w-6 text-white" />
            </div>
          </div>
        </Card>
        
        <Card className="gradient" shadow="glow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Total Permisos</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{permisos.length}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center shadow-glow">
              <Lock className="h-6 w-6 text-white" />
            </div>
          </div>
        </Card>
        
        <Card className="gradient" shadow="glow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Total Usuarios</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {roles.reduce((sum, r) => sum + (r.users_count || 0), 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-success-500 to-success-600 rounded-xl flex items-center justify-center shadow-glow">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabla de Roles */}
      <Card className="gradient" shadow="glow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h3 className="text-xl font-bold gradient-text mb-4 sm:mb-0">Lista de Roles</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
        </div>
        
        <Table
          columns={columns}
          data={roles}
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

      {/* Modal de Crear/Editar Rol */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingRole(null)
          setSelectedPermisos([])
          reset()
        }}
        title={editingRole ? 'Editar Rol' : 'Nuevo Rol'}
        size="lg"
        bodyClassName="max-h-[calc(90vh-180px)] overflow-y-auto"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
          <div className="flex-1 space-y-6 min-h-0">
            <Input
              label="Nombre del Rol *"
              placeholder="Ej: coordinador_academico"
              error={errors.nombre?.message}
              {...register('nombre', { required: 'El nombre es obligatorio' })}
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descripción
              </label>
              <textarea
                {...register('descripcion')}
                rows={3}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
                placeholder="Descripción del rol..."
              />
            </div>

            {/* Selección de permisos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Permisos
              </label>
              <div className="max-h-[400px] overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-4">
                {Object.keys(permisosAgrupados).length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    No hay permisos disponibles
                  </p>
                ) : (
                  Object.keys(permisosAgrupados).map(modulo => (
                    <div key={modulo} className="border-b border-gray-200 dark:border-gray-700 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 capitalize">
                          {modulo.replace('_', ' ')}
                        </h4>
                        <button
                          type="button"
                          onClick={() => toggleAllModulo(permisosAgrupados[modulo])}
                          className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                        >
                          {permisosAgrupados[modulo].every(p => selectedPermisos.includes(p.id))
                            ? 'Desmarcar todos' : 'Marcar todos'}
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {permisosAgrupados[modulo].map(permiso => (
                          <label
                            key={permiso.id}
                            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedPermisos.includes(permiso.id)}
                              onChange={() => togglePermiso(permiso.id)}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {permiso.descripcion || permiso.accion}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-4 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-900">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowModal(false)
                setEditingRole(null)
                setSelectedPermisos([])
                reset()
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={<Plus className="h-5 w-5" />}
              disabled={loading}
            >
              {editingRole ? 'Actualizar' : 'Crear'} Rol
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Gestionar Permisos */}
      <Modal
        isOpen={showPermisosModal}
        onClose={() => {
          setShowPermisosModal(false)
          setEditingRole(null)
          setSelectedPermisos([])
        }}
        title={`Gestionar Permisos - ${editingRole?.nombre || ''}`}
        size="xl"
      >
        <div className="space-y-6">
          <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-4">
            {Object.keys(permisosAgrupados).map(modulo => (
              <div key={modulo} className="border-b border-gray-200 dark:border-gray-700 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 capitalize">
                    {modulo.replace('_', ' ')}
                  </h4>
                  <button
                    type="button"
                    onClick={() => toggleAllModulo(permisosAgrupados[modulo])}
                    className="text-xs text-primary-600 hover:text-primary-700"
                  >
                    {permisosAgrupados[modulo].every(p => selectedPermisos.includes(p.id))
                      ? 'Desmarcar todos' : 'Marcar todos'}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {permisosAgrupados[modulo].map(permiso => (
                    <label
                      key={permiso.id}
                      className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPermisos.includes(permiso.id)}
                        onChange={() => togglePermiso(permiso.id)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {permiso.descripcion || permiso.accion}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowPermisosModal(false)
                setEditingRole(null)
                setSelectedPermisos([])
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={onSubmitPermisos}
              icon={<Lock className="h-5 w-5" />}
            >
              Guardar Permisos
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Ver Rol */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Detalles del Rol"
        size="lg"
      >
        {viewingRole && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre
                </label>
                <p className="text-gray-900 dark:text-gray-100">{viewingRole.nombre}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descripción
                </label>
                <p className="text-gray-900 dark:text-gray-100">{viewingRole.descripcion || 'Sin descripción'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Usuarios Asignados
                </label>
                <p className="text-gray-900 dark:text-gray-100">{viewingRole.users_count || 0}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Permisos Asignados
                </label>
                <p className="text-gray-900 dark:text-gray-100">{viewingRole.permisos_count || 0}</p>
              </div>
            </div>

            {viewingRole.permisos && viewingRole.permisos.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Permisos
                </label>
                <div className="space-y-2">
                  {Object.keys(permisosAgrupados).map(modulo => {
                    const permisosModulo = viewingRole.permisos.filter(p => 
                      permisosAgrupados[modulo].some(perm => perm.id === p.id)
                    )
                    if (permisosModulo.length === 0) return null
                    
                    return (
                      <div key={modulo} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                        <h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 capitalize">
                          {modulo.replace('_', ' ')}
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {permisosModulo.map(permiso => (
                            <span
                              key={permiso.id}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-400"
                            >
                              {permiso.descripcion || permiso.accion}
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Roles

