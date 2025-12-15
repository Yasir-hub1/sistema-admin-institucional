import React, { useState, useEffect } from 'react'
import { Users, BookOpen, Calendar, Clock, Eye, CheckCircle, XCircle, AlertCircle, Bell, GraduationCap, MapPin, CalendarDays, Info } from 'lucide-react'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { docenteGrupoService } from '../../services/docenteService'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const MisGrupos = () => {
  const [grupos, setGrupos] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchGrupos()
  }, [])

  const fetchGrupos = async () => {
    try {
      setLoading(true)
      const response = await docenteGrupoService.getMisGrupos()
      
      if (response.success) {
        setGrupos(response.data || [])
      } else {
        toast.error(response.message || 'Error al cargar grupos')
        setGrupos([])
      }
    } catch (error) {
      toast.error('Error de conexión')
      setGrupos([])
    } finally {
      setLoading(false)
    }
  }

  const handleVerDetalle = (grupoId) => {
    navigate(`/docente/grupos/${grupoId}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center shadow-glow">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text">Mis Grupos Asignados</h1>
            <p className="text-gray-600 dark:text-gray-400">Visualiza los grupos y horarios que te han sido asignados</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total de grupos</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{grupos.length}</p>
        </div>
      </div>

      {/* Información */}
      <Card className="gradient border-l-4 border-l-blue-500" shadow="glow-lg">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
              Información sobre tus grupos
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Aquí puedes ver todos los grupos que te han sido asignados por el administrador, junto con sus horarios, aulas y fechas. 
              Para gestionar módulos o crear nuevos grupos, contacta con el administrador del sistema.
            </p>
          </div>
        </div>
      </Card>

      {grupos.length === 0 ? (
        <Card className="gradient" shadow="glow-lg">
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No tienes grupos asignados
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Contacta con el administrador para que te asignen grupos
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {grupos.map((grupo) => (
            <Card key={grupo.grupo_id} className="gradient hover:shadow-glow-lg transition-all duration-200" shadow="glow-lg">
              <div className="space-y-5">
                {/* Header del Grupo */}
                <div className="flex items-start justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold gradient-text">
                          {grupo.programa?.nombre || 'Sin programa'}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-1">
                          <BookOpen className="h-3.5 w-3.5" />
                          Módulo: {grupo.modulo?.nombre || 'Sin módulo'}
                        </p>
                      </div>
                    </div>
                  </div>
                  {grupo.esta_activo ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                      <CheckCircle className="h-3 w-3" />
                      Activo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300">
                      <XCircle className="h-3 w-3" />
                      Finalizado
                    </span>
                  )}
                </div>

                {/* Información del Grupo */}
                <div className="space-y-3">
                  {/* Fechas */}
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Calendar className="h-5 w-5 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Período del Grupo</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {new Date(grupo.fecha_ini).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })} - {new Date(grupo.fecha_fin).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Estudiantes */}
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <GraduationCap className="h-5 w-5 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Estudiantes Inscritos</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {grupo.numero_estudiantes || 0} estudiante{grupo.numero_estudiantes !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  {/* Horarios */}
                  {grupo.horarios && grupo.horarios.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                        Horarios y Aulas
                      </p>
                      <div className="space-y-2">
                        {grupo.horarios.map((horario, idx) => (
                          <div 
                            key={idx} 
                            className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 bg-blue-500 dark:bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Clock className="h-4 w-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <CalendarDays className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    {horario.dias || 'Sin días asignados'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Clock className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                                  <span className="text-sm text-gray-700 dark:text-gray-300">
                                    {horario.hora_ini || 'N/A'} - {horario.hora_fin || 'N/A'}
                                  </span>
                                </div>
                                {horario.aula && horario.aula !== 'N/A' && (
                                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-blue-200 dark:border-blue-800">
                                    <MapPin className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />
                                    <span className="text-xs font-medium text-primary-700 dark:text-primary-300">
                                      Aula: {horario.aula}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Sin horarios asignados
                      </p>
                    </div>
                  )}
                </div>

                {/* Botón de Acción */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="primary"
                    fullWidth
                    icon={<Eye className="h-4 w-4" />}
                    onClick={() => handleVerDetalle(grupo.grupo_id)}
                  >
                    Ver Detalle y Evaluar Estudiantes
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default MisGrupos
