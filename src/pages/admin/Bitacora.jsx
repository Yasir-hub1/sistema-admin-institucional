import React, { useState, useEffect } from 'react'
import {
  History,
  Search,
  Filter,
  Calendar,
  User,
  Database,
  FileText,
  Eye,
  RefreshCw,
  TrendingUp,
  BarChart3
} from 'lucide-react'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Card from '../../components/common/Card'
import Table from '../../components/common/Table'
import Modal from '../../components/common/Modal'
import { bitacoraService } from '../../services/bitacoraService'
import { useAuth } from '../../contexts/AuthContext'
import { usePermissions } from '../../hooks/usePermissions'
import toast from 'react-hot-toast'

const Bitacora = () => {
  const { isAdmin } = useAuth()
  const { canView } = usePermissions()
  const [registros, setRegistros] = useState([])
  const [estadisticas, setEstadisticas] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingStats, setLoadingStats] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [perPage, setPerPage] = useState(50)
  const [showFilters, setShowFilters] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewingRegistro, setViewingRegistro] = useState(null)
  const [filtros, setFiltros] = useState({
    usuario_id: '',
    tabla: '',
    transaccion: '',
    fecha_desde: '',
    fecha_hasta: '',
    recientes: false
  })

  useEffect(() => {
    fetchBitacora()
    fetchEstadisticas()
  }, [currentPage, perPage, filtros])

  const fetchBitacora = async () => {
    try {
      setLoading(true)
      const params = {
        page: currentPage,
        per_page: perPage,
        ...filtros
      }

      // Agregar búsqueda si existe
      if (searchTerm) {
        params.transaccion = searchTerm
      }

      const response = await bitacoraService.getBitacora(params)
      
      if (response.success && response.data) {
        const paginationData = response.data
        
        if (paginationData.data && Array.isArray(paginationData.data)) {
          setRegistros(paginationData.data)
          setTotalPages(paginationData.last_page || 1)
        } else {
          setRegistros([])
          setTotalPages(1)
        }
      } else {
        toast.error(response.message || 'Error al cargar bitácora')
        setRegistros([])
        setTotalPages(1)
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error de conexión'
      toast.error(errorMessage)
      setRegistros([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  const fetchEstadisticas = async () => {
    try {
      setLoadingStats(true)
      const response = await bitacoraService.getEstadisticas({
        fecha_desde: filtros.fecha_desde,
        fecha_hasta: filtros.fecha_hasta
      })
      
      if (response.success && response.data) {
        setEstadisticas(response.data)
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error)
    } finally {
      setLoadingStats(false)
    }
  }

  const handleView = async (registro) => {
    try {
      const response = await bitacoraService.getRegistro(registro.id || registro.bitacora_id)
      if (response.success) {
        setViewingRegistro(response.data)
        setShowViewModal(true)
      }
    } catch (error) {
      toast.error('Error al cargar el registro')
    }
  }

  const handleFilterChange = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }))
    setCurrentPage(1)
  }

  const limpiarFiltros = () => {
    setFiltros({
      usuario_id: '',
      tabla: '',
      transaccion: '',
      fecha_desde: '',
      fecha_hasta: '',
      recientes: false
    })
    setSearchTerm('')
    setCurrentPage(1)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'N/A'
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return 'N/A'
    }
  }

  const getTransaccionColor = (transaccion) => {
    if (transaccion?.includes('CREAR')) return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
    if (transaccion?.includes('EDITAR')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
    if (transaccion?.includes('ELIMINAR')) return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    if (transaccion?.includes('APROBAR')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
    if (transaccion?.includes('RECHAZAR')) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
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
            {formatDate(row.fecha)}
          </span>
        </div>
      )
    },
    {
      key: 'usuario',
      label: 'Usuario',
      render: (row) => (
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4 text-gray-400" />
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {row.usuario?.persona?.nombre_completo || row.usuario?.email || 'N/A'}
            </div>
            {row.usuario?.persona?.ci && (
              <div className="text-xs text-gray-500">CI: {row.usuario.persona.ci}</div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'tabla',
      label: 'Tabla',
      render: (row) => (
        <div className="flex items-center space-x-2">
          <Database className="h-4 w-4 text-gray-400" />
          <span className="text-gray-900 dark:text-gray-100 capitalize">
            {row.tabla?.replace(/_/g, ' ') || 'N/A'}
          </span>
        </div>
      )
    },
    {
      key: 'transaccion',
      label: 'Acción',
      render: (row) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTransaccionColor(row.transaccion)}`}>
          {row.transaccion || 'N/A'}
        </span>
      )
    },
    {
      key: 'codTabla',
      label: 'ID Registro',
      render: (row) => (
        <span className="text-gray-900 dark:text-gray-100 font-mono text-sm">
          {row.codTabla || 'N/A'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (row) => (
        <div className="flex items-center space-x-2">
          {(canView('bitacora') || isAdmin()) && (
            <Button
              variant="ghost"
              size="sm"
              icon={<Eye className="h-4 w-4" />}
              onClick={() => handleView(row)}
              title="Ver detalles"
            />
          )}
        </div>
      )
    }
  ]

  // Obtener tablas únicas para el filtro
  const tablasUnicas = [...new Set(registros.map(r => r.tabla).filter(Boolean))].sort()

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-4 mb-4 sm:mb-0">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center shadow-glow">
            <History className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text">Bitácora del Sistema</h1>
            <p className="text-gray-600 dark:text-gray-400">Registro de todas las acciones realizadas en el sistema</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            icon={<Filter className="h-5 w-5" />}
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Ocultar Filtros' : 'Filtros'}
          </Button>
          <Button
            variant="outline"
            icon={<RefreshCw className="h-5 w-5" />}
            onClick={() => {
              fetchBitacora()
              fetchEstadisticas()
            }}
          >
            Actualizar
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="gradient" shadow="glow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Total Registros</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {estadisticas.total_registros || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-glow">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>
          
          <Card className="gradient" shadow="glow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Tablas Diferentes</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {estadisticas.por_tabla?.length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center shadow-glow">
                <Database className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>
          
          <Card className="gradient" shadow="glow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Usuarios Activos</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {estadisticas.por_usuario?.length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-success-500 to-success-600 rounded-xl flex items-center justify-center shadow-glow">
                <User className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>
          
          <Card className="gradient" shadow="glow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Tipos de Acción</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {estadisticas.por_transaccion?.length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-warning-500 to-warning-600 rounded-xl flex items-center justify-center shadow-glow">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filtros */}
      {showFilters && (
        <Card className="gradient" shadow="glow-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Buscar en transacción
              </label>
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    fetchBitacora()
                  }
                }}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tabla
              </label>
              <select
                value={filtros.tabla}
                onChange={(e) => handleFilterChange('tabla', e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Todas las tablas</option>
                {tablasUnicas.map(tabla => (
                  <option key={tabla} value={tabla}>{tabla.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha Desde
              </label>
              <Input
                type="date"
                value={filtros.fecha_desde}
                onChange={(e) => handleFilterChange('fecha_desde', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha Hasta
              </label>
              <Input
                type="date"
                value={filtros.fecha_hasta}
                onChange={(e) => handleFilterChange('fecha_hasta', e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filtros.recientes}
                  onChange={(e) => handleFilterChange('recientes', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Solo registros recientes (30 días)</span>
              </label>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={limpiarFiltros}
                className="w-full"
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Tabla de Registros */}
      <Card className="gradient" shadow="glow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h3 className="text-xl font-bold gradient-text mb-4 sm:mb-0">Registros de Actividad</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar en transacciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  fetchBitacora()
                }
              }}
              className="pl-10 w-full sm:w-64"
            />
          </div>
        </div>
        
        <Table
          columns={columns}
          data={registros}
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

      {/* Modal de Ver Detalles */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Detalles del Registro"
        size="lg"
      >
        {viewingRegistro && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha
                </label>
                <p className="text-gray-900 dark:text-gray-100 font-semibold">
                  {formatDate(viewingRegistro.fecha)}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Usuario
                </label>
                <p className="text-gray-900 dark:text-gray-100">
                  {viewingRegistro.usuario?.persona?.nombre_completo || 
                   viewingRegistro.usuario?.email || 
                   'N/A'}
                </p>
                {viewingRegistro.usuario?.persona?.ci && (
                  <p className="text-sm text-gray-500">CI: {viewingRegistro.usuario.persona.ci}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tabla
                </label>
                <p className="text-gray-900 dark:text-gray-100 capitalize">
                  {viewingRegistro.tabla?.replace(/_/g, ' ') || 'N/A'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ID Registro
                </label>
                <p className="text-gray-900 dark:text-gray-100 font-mono">
                  {viewingRegistro.codTabla || 'N/A'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Transacción / Acción
              </label>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                  {viewingRegistro.transaccion || 'N/A'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Creado
                </label>
                <p className="text-gray-900 dark:text-gray-100 text-sm">
                  {formatDate(viewingRegistro.created_at)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Actualizado
                </label>
                <p className="text-gray-900 dark:text-gray-100 text-sm">
                  {formatDate(viewingRegistro.updated_at)}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Bitacora

