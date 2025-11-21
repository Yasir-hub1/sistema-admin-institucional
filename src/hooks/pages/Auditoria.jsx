import React, { useState, useEffect } from 'react'
import { History, User, Edit, Trash, Plus, Eye, Filter, Download, Search } from 'lucide-react'
import { auditoriaService } from '../services/auditoriaService'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import LoadingSpinner from '../components/common/LoadingSpinner'
import toast from 'react-hot-toast'
import { formatDateTime } from '../utils/helpers'

const Auditoria = () => {
  const [registros, setRegistros] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState({
    modelo: '',
    accion: '',
    user_id: '',
    fecha_inicio: '',
    fecha_fin: ''
  })
  const [pagina, setPagina] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    fetchAuditoria()
  }, [filtros, pagina])

  const fetchAuditoria = async () => {
    setLoading(true)
    try {
      const params = {
        page: pagina,
        per_page: 20,
        ...filtros
      }

      // Limpiar filtros vacíos
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null) {
          delete params[key]
        }
      })

      const result = await auditoriaService.getAuditoria(params)
      if (result.success) {
        setRegistros(result.data?.data || [])
        setTotal(result.data?.total || 0)
        setTotalPaginas(result.data?.last_page || 1)
      } else {
        toast.error(result.message || 'Error al cargar auditoría')
      }
    } catch (error) {
      toast.error('Error al cargar registros de auditoría')
    } finally {
      setLoading(false)
    }
  }

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }))
    setPagina(1)
  }

  const limpiarFiltros = () => {
    setFiltros({
      modelo: '',
      accion: '',
      user_id: '',
      fecha_inicio: '',
      fecha_fin: ''
    })
    setBusqueda('')
    setPagina(1)
  }

  const getIconoAccion = (accion) => {
    switch (accion) {
      case 'create':
        return <Plus className="h-4 w-4 text-success-500" />
      case 'update':
        return <Edit className="h-4 w-4 text-primary-500" />
      case 'delete':
        return <Trash className="h-4 w-4 text-error-500" />
      case 'view':
        return <Eye className="h-4 w-4 text-info-500" />
      default:
        return <History className="h-4 w-4 text-gray-500" />
    }
  }

  const getColorAccion = (accion) => {
    switch (accion) {
      case 'create':
        return 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300'
      case 'update':
        return 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
      case 'delete':
        return 'bg-error-100 dark:bg-error-900/30 text-error-700 dark:text-error-300'
      case 'view':
        return 'bg-info-100 dark:bg-info-900/30 text-info-700 dark:text-info-300'
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
    }
  }

  const getLabelAccion = (accion) => {
    const labels = {
      create: 'Crear',
      update: 'Actualizar',
      delete: 'Eliminar',
      view: 'Ver',
      export: 'Exportar',
      import: 'Importar'
    }
    return labels[accion] || accion
  }

  const registrosFiltrados = busqueda
    ? registros.filter(r =>
        r.descripcion?.toLowerCase().includes(busqueda.toLowerCase()) ||
        r.modelo?.toLowerCase().includes(busqueda.toLowerCase()) ||
        r.user?.name?.toLowerCase().includes(busqueda.toLowerCase())
      )
    : registros

  if (loading && registros.length === 0) {
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
          <h1 className="text-3xl font-bold gradient-text mb-2">Auditoría del Sistema</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Registro de todas las acciones realizadas en el sistema
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar en descripción, modelo o usuario..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Modelo
              </label>
              <select
                value={filtros.modelo}
                onChange={(e) => handleFiltroChange('modelo', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Todos</option>
                <option value="Docente">Docente</option>
                <option value="Horario">Horario</option>
                <option value="Asistencia">Asistencia</option>
                <option value="Aula">Aula</option>
                <option value="Grupo">Grupo</option>
                <option value="Materia">Materia</option>
                <option value="User">Usuario</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Acción
              </label>
              <select
                value={filtros.accion}
                onChange={(e) => handleFiltroChange('accion', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Todas</option>
                <option value="create">Crear</option>
                <option value="update">Actualizar</option>
                <option value="delete">Eliminar</option>
                <option value="view">Ver</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha Inicio
              </label>
              <input
                type="date"
                value={filtros.fecha_inicio}
                onChange={(e) => handleFiltroChange('fecha_inicio', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha Fin
              </label>
              <input
                type="date"
                value={filtros.fecha_fin}
                onChange={(e) => handleFiltroChange('fecha_fin', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={limpiarFiltros}
                variant="outline"
                fullWidth
                icon={<Filter className="h-4 w-4" />}
              >
                Limpiar
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabla de registros */}
      <Card>
        {registrosFiltrados.length === 0 ? (
          <div className="text-center py-12">
            <History className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No hay registros
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              No se encontraron registros de auditoría con los filtros seleccionados
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Fecha/Hora
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Acción
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Modelo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      IP
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {registrosFiltrados.map((registro) => (
                    <tr key={registro.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        {formatDateTime(registro.created_at)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="text-gray-900 dark:text-gray-100">
                            {registro.user?.name || 'Sistema'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getColorAccion(registro.accion)}`}>
                          {getIconoAccion(registro.accion)}
                          <span className="ml-1">{getLabelAccion(registro.accion)}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        {registro.modelo}
                        {registro.modelo_id && (
                          <span className="text-gray-500 dark:text-gray-400 ml-1">
                            (#{registro.modelo_id})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {registro.descripcion}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {registro.ip_address || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Mostrando {registrosFiltrados.length} de {total} registros
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
          </>
        )}
      </Card>
    </div>
  )
}

export default Auditoria

