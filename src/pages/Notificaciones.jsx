import React, { useState, useEffect } from 'react'
import { Bell, Check, X, Clock, AlertCircle, Calendar, Filter, CheckCheck, Search } from 'lucide-react'
import { notificacionService } from '../services/notificacionService'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import LoadingSpinner from '../components/common/LoadingSpinner'
import toast from 'react-hot-toast'
import { formatRelativeTime } from '../utils/helpers'

const Notificaciones = () => {
  const [notificaciones, setNotificaciones] = useState([])
  const [noLeidas, setNoLeidas] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('todas') // todas, leidas, no_leidas
  const [filtroTipo, setFiltroTipo] = useState('todas') // todas, horario_cambio, asistencia, alerta, info
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPaginas, setTotalPaginas] = useState(1)

  useEffect(() => {
    fetchNotificaciones()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroEstado, filtroTipo, busqueda, pagina])

  const fetchNotificaciones = async () => {
    setLoading(true)
    try {
      // Construir parámetros de filtrado
      const params = {
        page: pagina,
        per_page: 15
      }

      // Filtro por estado (leída/no leída)
      if (filtroEstado === 'leidas') {
        params.leida = 'true'
      } else if (filtroEstado === 'no_leidas') {
        params.leida = 'false'
      }

      // Filtro por tipo
      if (filtroTipo !== 'todas') {
        params.tipo = filtroTipo
      }

      // Búsqueda
      if (busqueda.trim()) {
        params.search = busqueda.trim()
      }

      const result = await notificacionService.getNotificaciones(params)
      
      if (result.success && result.data) {
        // El backend devuelve estructura paginada: { data: { data: [...], total: X, last_page: Y } }
        const notificacionesArray = result.data.data || []
        const noLeidasCount = result.noLeidas || result.data?.no_leidas || 0
        
        setNotificaciones(notificacionesArray)
        setTotal(result.data.total || 0)
        setTotalPaginas(result.data.last_page || 1)
        setNoLeidas(noLeidasCount)
      } else {
        toast.error(result.message || 'Error al cargar notificaciones')
        setNotificaciones([])
        setNoLeidas(0)
      }
    } catch (error) {
      console.error('Error al cargar notificaciones:', error)
      toast.error('Error al cargar notificaciones')
      setNotificaciones([])
      setNoLeidas(0)
    } finally {
      setLoading(false)
    }
  }

  const handleMarcarLeida = async (id) => {
    try {
      const result = await notificacionService.marcarLeida(id)
      
      if (result.success) {
        setNotificaciones(prev =>
          prev.map(n => n.id === id ? { ...n, leida: true, leida_at: new Date().toISOString() } : n)
        )
        setNoLeidas(prev => Math.max(0, prev - 1))
        toast.success('Notificación marcada como leída')
      } else {
        toast.error(result.message || 'Error al marcar notificación')
      }
    } catch (error) {
      toast.error('Error al marcar notificación')
    }
  }

  const handleMarcarTodasLeidas = async () => {
    try {
      const result = await notificacionService.marcarTodasLeidas()
      
      if (result.success) {
        setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })))
        setNoLeidas(0)
        toast.success('Todas las notificaciones marcadas como leídas')
        fetchNotificaciones()
      } else {
        toast.error(result.message || 'Error al marcar notificaciones')
      }
    } catch (error) {
      toast.error('Error al marcar notificaciones')
    }
  }

  const handleEliminar = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta notificación?')) {
      try {
        const result = await notificacionService.eliminarNotificacion(id)
        
        if (result.success) {
          setNotificaciones(prev => prev.filter(n => n.id !== id))
          setTotal(prev => Math.max(0, prev - 1))
          toast.success('Notificación eliminada')
          fetchNotificaciones()
        } else {
          toast.error(result.message || 'Error al eliminar notificación')
        }
      } catch (error) {
        toast.error('Error al eliminar notificación')
      }
    }
  }

  const limpiarFiltros = () => {
    setFiltroEstado('todas')
    setFiltroTipo('todas')
    setBusqueda('')
    setPagina(1)
  }

  const getIconoTipo = (tipo) => {
    switch (tipo) {
      case 'horario_cambio':
        return <Calendar className="h-5 w-5" />
      case 'asistencia':
        return <Check className="h-5 w-5" />
      case 'alerta':
        return <AlertCircle className="h-5 w-5" />
      case 'info':
        return <Bell className="h-5 w-5" />
      default:
        return <Bell className="h-5 w-5" />
    }
  }

  const getColorTipo = (tipo) => {
    switch (tipo) {
      case 'horario_cambio':
        return 'text-primary-500 bg-primary-100 dark:bg-primary-900/30'
      case 'asistencia':
        return 'text-success-500 bg-success-100 dark:bg-success-900/30'
      case 'alerta':
        return 'text-warning-500 bg-warning-100 dark:bg-warning-900/30'
      case 'info':
        return 'text-info-500 bg-info-100 dark:bg-info-900/30'
      default:
        return 'text-gray-500 bg-gray-100 dark:bg-gray-800'
    }
  }

  const getTipoLabel = (tipo) => {
    switch (tipo) {
      case 'horario_cambio':
        return 'Cambio de Horario'
      case 'asistencia':
        return 'Asistencia'
      case 'alerta':
        return 'Alerta'
      case 'info':
        return 'Información'
      default:
        return tipo
    }
  }

  if (loading && notificaciones.length === 0) {
    return (
      <div className="p-8">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text mb-2">Notificaciones</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {noLeidas > 0 ? `${noLeidas} no leídas` : 'Todas las notificaciones leídas'}
          </p>
        </div>
        {noLeidas > 0 && (
          <Button
            onClick={handleMarcarTodasLeidas}
            variant="primary"
            icon={<CheckCheck className="h-4 w-4" />}
          >
            Marcar todas como leídas
          </Button>
        )}
      </div>

      {/* Filtros */}
      <Card>
        <div className="space-y-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Buscar en título o mensaje..."
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value)
                setPagina(1)
              }}
              className="pl-10"
            />
          </div>

          {/* Filtros de estado y tipo */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Estado:</span>
              <select
                value={filtroEstado}
                onChange={(e) => {
                  setFiltroEstado(e.target.value)
                  setPagina(1)
                }}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary-500"
              >
                <option value="todas">Todas</option>
                <option value="no_leidas">No leídas</option>
                <option value="leidas">Leídas</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tipo:</span>
              <select
                value={filtroTipo}
                onChange={(e) => {
                  setFiltroTipo(e.target.value)
                  setPagina(1)
                }}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary-500"
              >
                <option value="todas">Todos</option>
                <option value="horario_cambio">Cambios de Horario</option>
                <option value="asistencia">Asistencias</option>
                <option value="alerta">Alertas</option>
                <option value="info">Información</option>
              </select>
            </div>

            {(filtroEstado !== 'todas' || filtroTipo !== 'todas' || busqueda.trim()) && (
              <Button
                onClick={limpiarFiltros}
                variant="outline"
                size="sm"
                icon={<X className="h-4 w-4" />}
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Lista de notificaciones */}
      {notificaciones.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No hay notificaciones
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              No tienes notificaciones que coincidan con los filtros seleccionados
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {notificaciones.map((notificacion) => (
            <Card
              key={notificacion.id}
              className={!notificacion.leida ? 'border-l-4 border-l-primary-500' : ''}
            >
              <div className="flex items-start space-x-4">
                <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${getColorTipo(notificacion.tipo)}`}>
                  {getIconoTipo(notificacion.tipo)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className={`text-lg font-semibold ${!notificacion.leida ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>
                          {notificacion.titulo}
                        </h3>
                        <span className="px-2 py-0.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                          {getTipoLabel(notificacion.tipo)}
                        </span>
                        {!notificacion.leida && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                            Nueva
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        {notificacion.mensaje}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {formatRelativeTime(notificacion.created_at)}
                        </div>
                        {notificacion.leida_at && (
                          <div className="flex items-center">
                            <Check className="h-4 w-4 mr-1" />
                            Leída {formatRelativeTime(notificacion.leida_at)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {!notificacion.leida && (
                        <Button
                          onClick={() => handleMarcarLeida(notificacion.id)}
                          variant="ghost"
                          size="sm"
                          icon={<Check className="h-4 w-4" />}
                          title="Marcar como leída"
                        />
                      )}
                      <Button
                        onClick={() => handleEliminar(notificacion.id)}
                        variant="ghost"
                        size="sm"
                        icon={<X className="h-4 w-4" />}
                        title="Eliminar"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Mostrando {notificaciones.length} de {total} notificaciones
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setPagina(p => Math.max(1, p - 1))}
              disabled={pagina === 1}
              variant="outline"
              size="sm"
            >
              Anterior
            </Button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Página {pagina} de {totalPaginas}
            </span>
            <Button
              onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
              disabled={pagina === totalPaginas}
              variant="outline"
              size="sm"
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Notificaciones

