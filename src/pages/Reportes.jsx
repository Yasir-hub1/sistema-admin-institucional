import React, { useState, useEffect } from 'react'
import { FileText, Download, FileSpreadsheet, BarChart3, Users, Clock, Building, TrendingUp, Filter } from 'lucide-react'
import { reporteService } from '../services/reporteService'
import { gestionAcademicaService } from '../services/gestionAcademicaService'
import { docenteService } from '../services/docenteService'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import LoadingSpinner from '../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

const Reportes = () => {
  const [gestiones, setGestiones] = useState([])
  const [docentes, setDocentes] = useState([])
  const [gestionActiva, setGestionActiva] = useState(null)
  const [loading, setLoading] = useState(false)
  const [reporteActivo, setReporteActivo] = useState(null)
  const [filtros, setFiltros] = useState({
    gestion_id: '',
    docente_id: '',
    fecha_inicio: '',
    fecha_fin: ''
  })

  useEffect(() => {
    fetchGestiones()
    fetchDocentes()
  }, [])

  const fetchGestiones = async () => {
    try {
      const result = await gestionAcademicaService.getGestiones({ per_page: 100 })
      if (result.success && result.data) {
        const gestionesData = result.data.data || []
        setGestiones(gestionesData)
        const activa = gestionesData.find(g => g.activa) || null
        setGestionActiva(activa)
        if (activa) {
          setFiltros(prev => ({ ...prev, gestion_id: activa.id.toString() }))
        }
      }
    } catch (error) {
      console.error('Error al cargar gestiones:', error)
      toast.error('Error al cargar gestiones académicas')
    }
  }

  const fetchDocentes = async () => {
    try {
      const result = await docenteService.getDocentes({ per_page: 100 })
      if (result.success && result.data) {
        setDocentes(result.data.data || [])
      }
    } catch (error) {
      console.error('Error al cargar docentes:', error)
    }
  }

  const handleExportarPDF = async (tipo, params = {}) => {
    // Validar filtros antes de exportar
    const reporte = reportes.find(r => r.id === tipo)
    if (!validarFiltros(reporte)) {
      toast.error('Por favor completa todos los filtros requeridos para este reporte')
      return
    }

    setLoading(true)
    try {
      // Preparar parámetros limpios
      const paramsExport = {
        tipo,
        ...filtros,
        ...params
      }
      
      // Remover campos vacíos
      Object.keys(paramsExport).forEach(key => {
        if (paramsExport[key] === '' || paramsExport[key] === null) {
          delete paramsExport[key]
        }
      })

      const result = await reporteService.exportarPDF(tipo, paramsExport)
      if (result.success) {
        toast.success('PDF exportado exitosamente')
      } else {
        toast.error(result.message || 'Error al exportar PDF')
      }
    } catch (error) {
      console.error('Error al exportar PDF:', error)
      toast.error(error.response?.data?.message || 'Error al exportar PDF')
    } finally {
      setLoading(false)
    }
  }

  const handleExportarExcel = async (tipo, params = {}) => {
    // Validar filtros antes de exportar
    const reporte = reportes.find(r => r.id === tipo)
    if (!validarFiltros(reporte)) {
      toast.error('Por favor completa todos los filtros requeridos para este reporte')
      return
    }

    setLoading(true)
    try {
      // Preparar parámetros limpios
      const paramsExport = {
        tipo,
        ...filtros,
        ...params
      }
      
      // Remover campos vacíos
      Object.keys(paramsExport).forEach(key => {
        if (paramsExport[key] === '' || paramsExport[key] === null) {
          delete paramsExport[key]
        }
      })

      const result = await reporteService.exportarExcel(tipo, paramsExport)
      if (result.success) {
        toast.success('Excel exportado exitosamente')
      } else {
        toast.error(result.message || 'Error al exportar Excel')
      }
    } catch (error) {
      console.error('Error al exportar Excel:', error)
      toast.error(error.response?.data?.message || 'Error al exportar Excel')
    } finally {
      setLoading(false)
    }
  }

  const reportes = [
    {
      id: 'horarios',
      titulo: 'Reporte de Horarios',
      descripcion: 'Horarios semanales por materia, docente y aula',
      icon: Clock,
      color: 'primary',
      requiere: ['gestion_id']
    },
    {
      id: 'asistencias',
      titulo: 'Reporte de Asistencias por Docente',
      descripcion: 'Estadísticas de asistencia de un docente en un período',
      icon: Users,
      color: 'success',
      requiere: ['docente_id', 'fecha_inicio', 'fecha_fin']
    },
    {
      id: 'carga_horaria',
      titulo: 'Reporte de Carga Horaria',
      descripcion: 'Carga horaria de todos los docentes',
      icon: TrendingUp,
      color: 'info',
      requiere: ['gestion_id']
    },
    {
      id: 'aulas',
      titulo: 'Ocupación de Aulas',
      descripcion: 'Ocupación y disponibilidad de aulas',
      icon: Building,
      color: 'warning',
      requiere: ['gestion_id']
    }
  ]

  const validarFiltros = (reporte) => {
    return reporte.requiere.every(f => {
      const valor = filtros[f]
      return valor !== '' && valor !== null && valor !== undefined
    })
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold gradient-text mb-2">Reportes del Sistema</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Genera y exporta reportes en formato PDF o Excel
        </p>
      </div>

      {/* Filtros generales */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <Filter className="h-5 w-5 mr-2" />
          Filtros Generales
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Gestión Académica
            </label>
            <select
              value={filtros.gestion_id}
              onChange={(e) => setFiltros(prev => ({ ...prev, gestion_id: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Seleccionar...</option>
              {gestiones.map(g => (
                <option key={g.id} value={g.id}>
                  {g.nombre} {g.activa && '(Activa)'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Docente (para reporte de asistencias)
            </label>
            <select
              value={filtros.docente_id}
              onChange={(e) => setFiltros(prev => ({ ...prev, docente_id: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Seleccionar docente...</option>
              {docentes.map(d => (
                <option key={d.id} value={d.id}>
                  {d.user?.name || d.codigo_docente} {d.codigo_docente && `(${d.codigo_docente})`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={filtros.fecha_inicio}
              onChange={(e) => setFiltros(prev => ({ ...prev, fecha_inicio: e.target.value }))}
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
              onChange={(e) => setFiltros(prev => ({ ...prev, fecha_fin: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </Card>

      {/* Grid de reportes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportes.map((reporte) => {
          const Icon = reporte.icon
          const valido = validarFiltros(reporte)
          
          return (
            <Card key={reporte.id} className="hover:shadow-glow-lg transition-all">
              <div className="flex items-start space-x-4">
                <div className={`flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center bg-${reporte.color}-100 dark:bg-${reporte.color}-900/30`}>
                  <Icon className={`h-7 w-7 text-${reporte.color}-600 dark:text-${reporte.color}-400`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {reporte.titulo}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {reporte.descripcion}
                  </p>
                  
                  {!valido && (
                    <div className="mb-4 p-2 bg-warning-50 dark:bg-warning-900/20 rounded-lg text-xs text-warning-700 dark:text-warning-300">
                      Faltan filtros requeridos para este reporte
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleExportarPDF(reporte.id)}
                      disabled={!valido || loading}
                      variant="primary"
                      size="sm"
                      icon={<FileText className="h-4 w-4" />}
                    >
                      PDF
                    </Button>
                    <Button
                      onClick={() => handleExportarExcel(reporte.id)}
                      disabled={!valido || loading}
                      variant="success"
                      size="sm"
                      icon={<FileSpreadsheet className="h-4 w-4" />}
                    >
                      Excel
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-8">
            <LoadingSpinner />
            <p className="mt-4 text-center text-gray-600 dark:text-gray-400">
              Generando reporte...
            </p>
          </Card>
        </div>
      )}
    </div>
  )
}

export default Reportes
