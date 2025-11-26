import React, { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { get } from '../../services/api'
import { 
  BookOpen, 
  Calendar, 
  User, 
  Clock, 
  Loader2, 
  GraduationCap, 
  MapPin, 
  CalendarDays,
  CheckCircle,
  AlertCircle,
  Clock3,
  Users,
  Building2,
  DollarSign
} from 'lucide-react'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Card from '../../components/common/Card'

const Materias = () => {
  const { user } = useAuth()
  const [materias, setMaterias] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchMaterias = async () => {
      try {
        setLoading(true)
        // Obtener grupos del estudiante (materias inscritas)
        const response = await get('/estudiante/inscripciones')
        
        console.log('📚 Respuesta de inscripciones:', response.data)
        
        if (response.data.success) {
          // El backend retorna datos paginados: response.data.data contiene el objeto de paginación
          // La estructura es: { success: true, data: { data: [...], current_page: 1, ... } }
          let inscripcionesData = []
          
          if (response.data.data) {
            // Si es paginado (Laravel paginate), los datos están en data.data
            if (response.data.data.data && Array.isArray(response.data.data.data)) {
              inscripcionesData = response.data.data.data
            } 
            // Si es un array directo
            else if (Array.isArray(response.data.data)) {
              inscripcionesData = response.data.data
            }
            // Si tiene una propiedad inscripciones
            else if (response.data.data.inscripciones && Array.isArray(response.data.data.inscripciones)) {
              inscripcionesData = response.data.data.inscripciones
            }
          } 
          // Fallback: buscar directamente en response.data
          else if (response.data.inscripciones && Array.isArray(response.data.inscripciones)) {
            inscripcionesData = response.data.inscripciones
          }
          
          // Asegurar que siempre sea un array
          if (!Array.isArray(inscripcionesData)) {
            console.warn('⚠️ inscripcionesData no es un array:', inscripcionesData)
            inscripcionesData = []
          }
          
          setMaterias(inscripcionesData)
        } else {
          setError('No se pudieron cargar las materias')
          setMaterias([])
        }
      } catch (error) {
        console.error('Error cargando materias:', error)
        setError('Error al cargar las materias')
        setMaterias([])
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchMaterias()
    }
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center shadow-glow">
          <BookOpen className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold gradient-text">Mis Materias</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Consulta todas tus materias y grupos inscritos
          </p>
        </div>
      </div>

      {/* Estadísticas */}
      {Array.isArray(materias) && materias.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-primary-500 to-primary-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-100 text-sm">Total Materias</p>
                <p className="text-3xl font-bold mt-1">{materias.length}</p>
              </div>
              <BookOpen className="h-12 w-12 text-primary-200" />
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Aprobadas</p>
                <p className="text-3xl font-bold mt-1">
                  {materias.filter(m => m.estado === 'aprobada' || m.estado === 'aprobado').length}
                </p>
              </div>
              <CheckCircle className="h-12 w-12 text-green-200" />
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm">En Curso</p>
                <p className="text-3xl font-bold mt-1">
                  {materias.filter(m => m.estado === 'pendiente' || m.estado === 'en_curso' || !m.estado).length}
                </p>
              </div>
              <Clock3 className="h-12 w-12 text-yellow-200" />
            </div>
          </Card>
        </div>
      )}

      {/* Lista de Materias */}
      {!Array.isArray(materias) || materias.length === 0 ? (
        <Card className="gradient" shadow="glow-lg">
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No tienes materias inscritas
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Inscríbete en programas disponibles desde la sección de Inscripciones
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {Array.isArray(materias) && materias.map((materia, index) => {
            const programaNombre = materia.programa?.nombre || materia.nombre || 'Programa sin nombre'
            const moduloNombre = materia.grupo?.modulo?.nombre || materia.grupo?.modulo || materia.grupo?.nombre || 'Sin módulo'
            const estado = materia.estado || 'pendiente'
            
            return (
              <Card 
                key={index} 
                className="gradient hover:shadow-glow-lg transition-all duration-200 border-2 border-gray-200 dark:border-gray-700"
              >
                <div className="p-6">
                  {/* Header del Card */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                          <GraduationCap className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold gradient-text mb-1">
                            {programaNombre}
                          </h3>
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {moduloNombre}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {estado && (
                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                          estado === 'aprobada' || estado === 'aprobado'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                            : estado === 'pendiente' || estado === 'en_curso'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                            : estado === 'rechazada' || estado === 'rechazado'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                        }`}>
                          {estado === 'aprobada' || estado === 'aprobado' ? (
                            <>
                              <CheckCircle className="h-3.5 w-3.5" />
                              Aprobada
                            </>
                          ) : estado === 'pendiente' || estado === 'en_curso' ? (
                            <>
                              <Clock3 className="h-3.5 w-3.5" />
                              En Curso
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-3.5 w-3.5" />
                              {estado}
                            </>
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Información del Programa */}
                  {materia.programa && (
                    <div className="mb-6 p-4 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 rounded-xl border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 mb-4">
                        <GraduationCap className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          Información del Programa
                        </h4>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {materia.programa.duracion_meses && (
                          <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg">
                            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                              <Calendar className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Duración</p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                {materia.programa.duracion_meses} {materia.programa.duracion_meses === 1 ? 'mes' : 'meses'}
                              </p>
                            </div>
                          </div>
                        )}
                        {materia.programa.costo && (
                          <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                              <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-gray-500 dark:text-gray-400">Costo del Programa</p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                {parseFloat(materia.programa.costo || 0).toLocaleString('es-BO', { 
                                  style: 'currency', 
                                  currency: 'BOB' 
                                })}
                              </p>
                              {materia.descuento && (
                                <div className="mt-1 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                                  <p className="text-xs text-green-700 dark:text-green-300">
                                    <span className="font-semibold">Descuento aplicado:</span> {materia.descuento.nombre} ({materia.descuento.descuento}%)
                                  </p>
                                  {materia.costo_base && materia.costo_final && (
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                      Base: {parseFloat(materia.costo_base || 0).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })} → 
                                      Final: <span className="font-semibold text-green-600 dark:text-green-400">
                                        {parseFloat(materia.costo_final || 0).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                                      </span>
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        {(materia.programa.institucion || materia.programa.rama_academica || materia.programa.tipo_programa) && (
                          <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {materia.programa.institucion ? 'Institución' : materia.programa.rama_academica ? 'Rama Académica' : 'Tipo'}
                              </p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                {materia.programa.institucion?.nombre || materia.programa.institucion || 
                                 materia.programa.rama_academica?.nombre || materia.programa.rama_academica ||
                                 materia.programa.tipo_programa?.nombre || materia.programa.tipo_programa || 'N/A'}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Estado de Pagos */}
                  {materia.estado_pagos && (
                    <div className="mb-6 p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2 mb-4">
                        <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          Estado de Pagos
                        </h4>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total a Pagar</p>
                          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            {parseFloat(materia.estado_pagos.monto_total || 0).toLocaleString('es-BO', { 
                              style: 'currency', 
                              currency: 'BOB' 
                            })}
                          </p>
                        </div>
                        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Pagado</p>
                          <p className="text-lg font-bold text-green-600 dark:text-green-400">
                            {parseFloat(materia.estado_pagos.monto_pagado || 0).toLocaleString('es-BO', { 
                              style: 'currency', 
                              currency: 'BOB' 
                            })}
                          </p>
                        </div>
                        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Pendiente</p>
                          <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                            {parseFloat(materia.estado_pagos.monto_pendiente || 0).toLocaleString('es-BO', { 
                              style: 'currency', 
                              currency: 'BOB' 
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Barra de Progreso */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Progreso de Pago
                          </span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {materia.estado_pagos.cuotas_pagadas || 0} / {materia.estado_pagos.total_cuotas || 0} cuotas
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${materia.estado_pagos.total_cuotas > 0 
                                ? ((materia.estado_pagos.cuotas_pagadas || 0) / materia.estado_pagos.total_cuotas) * 100 
                                : 0}%` 
                            }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <span className="text-gray-600 dark:text-gray-400">
                            {materia.estado_pagos.cuotas_pagadas || 0} pagadas
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                          <span className="text-gray-600 dark:text-gray-400">
                            {materia.estado_pagos.cuotas_pendientes || 0} pendientes
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Información del Grupo */}
                  {materia.grupo && (
                    <div className="mb-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 mb-4">
                        <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          Información del Grupo
                        </h4>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Docente */}
                        {materia.grupo.docente && (
                          <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                              <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Docente Responsable</p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                {typeof materia.grupo.docente === 'string' 
                                  ? materia.grupo.docente 
                                  : `${materia.grupo.docente?.nombre || ''} ${materia.grupo.docente?.apellido || ''}`.trim() || 'Sin asignar'}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Fecha de Inscripción */}
                        {(materia.fecha_inscripcion || materia.fecha) && (
                          <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                              <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Fecha de Inscripción</p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                {new Date(materia.fecha_inscripcion || materia.fecha).toLocaleDateString('es-ES', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Período del Grupo */}
                        {materia.grupo.fecha_ini && materia.grupo.fecha_fin && (
                          <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg md:col-span-2">
                            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                              <CalendarDays className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-gray-500 dark:text-gray-400">Período del Grupo</p>
                              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                                <span>
                                  {new Date(materia.grupo.fecha_ini).toLocaleDateString('es-ES', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                  })}
                                </span>
                                <span className="text-gray-400">→</span>
                                <span>
                                  {new Date(materia.grupo.fecha_fin).toLocaleDateString('es-ES', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Horarios con Aulas */}
                  {materia.grupo?.horarios && materia.grupo.horarios.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          Horarios y Aulas
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {materia.grupo.horarios.map((horario, idx) => (
                          <div 
                            key={idx} 
                            className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 bg-blue-500 dark:bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Clock className="h-4 w-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <CalendarDays className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    {horario.dias || 'Sin días asignados'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                  <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                  <span className="text-sm text-gray-700 dark:text-gray-300">
                                    {horario.hora_ini || 'N/A'} - {horario.hora_fin || 'N/A'}
                                  </span>
                                </div>
                                {horario.aula && (
                                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-blue-200 dark:border-blue-800">
                                    <MapPin className="h-4 w-4 text-primary-600 dark:text-primary-400" />
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
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Materias

