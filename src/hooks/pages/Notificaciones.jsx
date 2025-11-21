import React, { useState, useEffect } from 'react'
import { Bell, Check, X, Clock, AlertCircle, Calendar, Filter, CheckCheck } from 'lucide-react'
import { notificacionService } from '../services/notificacionService'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import LoadingSpinner from '../components/common/LoadingSpinner'
import toast from 'react-hot-toast'
import { formatRelativeTime, formatDateTime } from '../utils/helpers'

const Notificaciones = () => {
  const [notificaciones, setNotificaciones] = useState([])
  const [noLeidas, setNoLeidas] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('todas') // todas, leidas, no_leidas
  const [tipoFiltro, setTipoFiltro] = useState('todas') // todas, horario_cambio, asistencia, alerta
  const [pagina, setPagina] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPaginas, setTotalPaginas] = useState(1)

  useEffect(() => {
    fetchNotificaciones()
    fetchNoLeidas()
  }, [filtro, tipoFiltro, pagina])

  const fetchNotificaciones = async () => {
    setLoading(true)
    try {
      const params = {
        page: pagina,
        per_page: 15
      }

      if (filtro === 'leidas') {
        params.leida = 'true'
      } else if (filtro === 'no_leidas') {
        params.leida = 'false'
      }

      if (tipoFiltro !== 'todas') {
        params.tipo = tipoFiltro
      }

      const result = await notificacionService.getNotificaciones(params)
      if (result.success) {
        // El backend devuelve un objeto paginado con estructura: { data: [...], last_page: X, total: Y }
        const paginatedData = result.data?.data || result.data
        setNotificaciones(paginatedData?.data || paginatedData || [])
        setTotal(paginatedData?.total || result.data?.total || 0)
        setTotalPaginas(paginatedData?.last_page || result.data?.last_page || 1)
        setNoLeidas(result.data?.no_leidas || result.noLeidas || 0)
      }
    } catch (error) {
      toast.error('Error al cargar notificaciones')
    } finally {
      setLoading(false)
    }
  }

  const fetchNoLeidas = async () => {
    const result = await notificacionService.contarNoLeidas()
    if (result.success) {
      setNoLeidas(result.count)
    }
  }

  const handleMarcarLeida = async (id) => {
    const result = await notificacionService.marcarLeida(id)
    if (result.success) {
      setNotificaciones(prev =>
        prev.map(n => n.id === id ? { ...n, leida: true, leida_at: new Date().toISOString() } : n)
      )
      setNoLeidas(prev => Math.max(0, prev - 1))
      toast.success('Notificación marcada como leída')
    }
  }

  const handleMarcarTodasLeidas = async () => {
    const result = await notificacionService.marcarTodasLeidas()
    if (result.success) {
      setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })))
      setNoLeidas(0)
      toast.success('Todas las notificaciones marcadas como leídas')
      fetchNotificaciones()
    }
  }

  const handleEliminar = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta notificación?')) {
      const result = await notificacionService.eliminarNotificacion(id)
      if (result.success) {
        setNotificaciones(prev => prev.filter(n => n.id !== id))
        toast.success('Notificación eliminada')
        fetchNotificaciones()
      }
    }
  }

  const getIconoTipo = (tipo) => {
    switch (tipo) {
      case 'horario_cambio':
        return <Calendar className="h-5 w-5" />
      case 'asistencia':
        return <Check className="h-5 w-5" />
      case 'alerta':
        return <AlertCircle className="h-5 w-5" />
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
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Estado:</span>
            <select
              value={filtro}
              onChange={(e) => { setFiltro(e.target.value); setPagina(1) }}
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
              value={tipoFiltro}
              onChange={(e) => { setTipoFiltro(e.target.value); setPagina(1) }}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary-500"
            >
              <option value="todas">Todos</option>
              <option value="horario_cambio">Cambios de Horario</option>
              <option value="asistencia">Asistencias</option>
              <option value="alerta">Alertas</option>
            </select>
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
        <div className="flex items-center justify-center space-x-2">
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
      )}
    </div>
  )
}

export default Notificaciones

