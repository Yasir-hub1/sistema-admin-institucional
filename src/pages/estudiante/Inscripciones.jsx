import React, { useState, useEffect } from 'react'
import { GraduationCap, Calendar, Clock, Users, DollarSign, AlertCircle, CheckCircle, XCircle, BookOpen, User, MapPin, CalendarDays } from 'lucide-react'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import Modal from '../../components/common/Modal'
import Input from '../../components/common/Input'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'
import { inscripcionService } from '../../services/inscripcionService'
import { useForm } from 'react-hook-form'

const Inscripciones = () => {
  const [programas, setProgramas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedPrograma, setSelectedPrograma] = useState(null)
  const [selectedGrupo, setSelectedGrupo] = useState(null)
  const [conflictos, setConflictos] = useState([])
  const [verificando, setVerificando] = useState(false)

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: {
      numero_cuotas: 3
    }
  })

  const numeroCuotas = watch('numero_cuotas')

  useEffect(() => {
    fetchProgramas()
  }, [])

  const fetchProgramas = async () => {
    try {
      setLoading(true)
      const response = await inscripcionService.getProgramasDisponibles()
      
      if (response.success) {
        setProgramas(response.data || [])
      } else {
        // Si el error es por documentos no aprobados, mostrar mensaje específico
        if (response.message?.includes('documentos aprobados')) {
          toast.error('Debes tener tus documentos aprobados para poder inscribirte. Completa la verificación de documentos primero.')
        } else {
          toast.error(response.message || 'Error al cargar programas')
        }
        setProgramas([])
      }
    } catch (error) {
      // Verificar si el error es por documentos no aprobados
      if (error.response?.data?.message?.includes('documentos aprobados')) {
        toast.error('Debes tener tus documentos aprobados para poder inscribirte. Completa la verificación de documentos primero.')
      } else {
        toast.error('Error de conexión')
      }
      setProgramas([])
    } finally {
      setLoading(false)
    }
  }

  const handleInscribirse = async (programa, grupo) => {
    setSelectedPrograma(programa)
    setSelectedGrupo(grupo)
    setConflictos([])
    reset({
      programa_id: programa.id,
      grupo_id: grupo.id,
      numero_cuotas: 3
    })
    
    // Verificar conflictos de horario
    setVerificando(true)
    try {
      const verificacion = await inscripcionService.verificarHorarios(grupo.id)
      
      if (verificacion.success) {
        if (verificacion.tieneConflictos) {
          setConflictos(verificacion.conflictos || [])
          toast.error('Se encontraron conflictos de horario. Revisa los detalles en el modal.')
        }
        setShowModal(true)
      } else {
        toast.error(verificacion.message || 'Error al verificar horarios')
      }
    } catch (error) {
      console.error('Error verificando horarios:', error)
      toast.error('Error al verificar horarios. Intenta nuevamente.')
    } finally {
      setVerificando(false)
    }
  }

  const onSubmit = async (data) => {
    if (conflictos.length > 0) {
      toast.error('No puede inscribirse debido a conflictos de horario')
      return
    }

    try {
      setLoading(true)
      const response = await inscripcionService.crearInscripcion({
        programa_id: selectedPrograma.id,
        grupo_id: selectedGrupo.id,
        numero_cuotas: parseInt(data.numero_cuotas)
      })
      
      if (response.success) {
        toast.success(response.message || 'Inscripción realizada exitosamente')
        setShowModal(false)
        setSelectedPrograma(null)
        setSelectedGrupo(null)
        setConflictos([])
        reset()
        await fetchProgramas()
      } else {
        toast.error(response.message || 'Error al realizar inscripción')
        if (response.errors) {
          Object.keys(response.errors).forEach(key => {
            toast.error(`${key}: ${response.errors[key]}`)
          })
        }
      }
    } catch (error) {
      toast.error('Error al realizar inscripción')
    } finally {
      setLoading(false)
    }
  }

  const formatHorario = (horario) => {
    if (!horario) return '-'
    return `${horario.dias} ${horario.hora_ini} - ${horario.hora_fin}`
  }

  if (loading && programas.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center shadow-glow">
          <GraduationCap className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold gradient-text">Inscripciones</h1>
          <p className="text-gray-600 dark:text-gray-400">Inscríbete en los programas académicos disponibles</p>
        </div>
      </div>

      {programas.length === 0 ? (
        <Card className="gradient" shadow="glow-lg">
          <div className="text-center py-12">
            <GraduationCap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {loading ? 'Cargando programas...' : 'No hay programas disponibles'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {loading 
                ? 'Por favor espera...' 
                : 'Actualmente no hay programas con grupos disponibles para inscripción. Verifica que tus documentos estén aprobados.'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {programas.map((programa) => (
            <Card key={programa.id} className="gradient" shadow="glow-lg">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold gradient-text mb-2">{programa.nombre}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      <span>Costo: {parseFloat(programa.costo || 0).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Duración: {programa.duracion_meses || 0} meses</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{programa.total_grupos} grupo(s) disponible(s)</span>
                    </div>
                  </div>
                  {programa.institucion && (
                    <p className="text-sm text-gray-500 mt-2">Institución: {programa.institucion}</p>
                  )}
                </div>
              </div>

              {programa.grupos_disponibles && programa.grupos_disponibles.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Grupos Disponibles ({programa.grupos_disponibles.length})
                    </h4>
                  </div>
                  {programa.grupos_disponibles.map((grupo) => (
                    <div
                      key={grupo.id}
                      className="border-2 border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-lg transition-all duration-200 bg-white dark:bg-gray-800"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                        <div className="flex-1 space-y-4">
                          {/* Header del Grupo */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
                                  <BookOpen className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                  <h5 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                    {grupo.modulo || 'Grupo sin nombre'}
                                  </h5>
                                  {grupo.cupos_disponibles !== undefined && (
                                    <div className="flex items-center gap-2 mt-1">
                                      {grupo.cupos_disponibles > 0 ? (
                                        <span className="text-xs px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full font-medium flex items-center gap-1">
                                          <CheckCircle className="h-3 w-3" />
                                          {grupo.cupos_disponibles} cupo{grupo.cupos_disponibles !== 1 ? 's' : ''} disponible{grupo.cupos_disponibles !== 1 ? 's' : ''}
                                        </span>
                                      ) : (
                                        <span className="text-xs px-2.5 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full font-medium">
                                          Sin cupos disponibles
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Información del Docente */}
                          {grupo.docente && (
                            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                              <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Docente Responsable</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {grupo.docente}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Horarios con Aulas */}
                          {grupo.horarios && grupo.horarios.length > 0 ? (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                Horarios y Aulas
                              </p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                                        {horario.aula && (
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

                          {/* Fechas del Grupo */}
                          <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            <div className="flex-1">
                              <p className="text-xs text-gray-500 dark:text-gray-400">Período del Grupo</p>
                              <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <span className="font-medium">
                                  {grupo.fecha_ini 
                                    ? new Date(grupo.fecha_ini).toLocaleDateString('es-ES', { 
                                        day: 'numeric', 
                                        month: 'long', 
                                        year: 'numeric' 
                                      })
                                    : 'N/A'}
                                </span>
                                <span className="text-gray-400">→</span>
                                <span className="font-medium">
                                  {grupo.fecha_fin 
                                    ? new Date(grupo.fecha_fin).toLocaleDateString('es-ES', { 
                                        day: 'numeric', 
                                        month: 'long', 
                                        year: 'numeric' 
                                      })
                                    : 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Botón de Inscripción */}
                        <div className="flex lg:flex-col items-center lg:items-stretch gap-3 lg:min-w-[140px]">
                          <Button
                            variant="primary"
                            size="md"
                            onClick={() => handleInscribirse(programa, grupo)}
                            disabled={grupo.cupos_disponibles === 0}
                            className="w-full lg:w-auto"
                            icon={<CheckCircle className="h-4 w-4" />}
                          >
                            {grupo.cupos_disponibles === 0 ? 'Sin Cupos' : 'Inscribirse'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Inscripción */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setSelectedPrograma(null)
          setSelectedGrupo(null)
          setConflictos([])
          reset()
        }}
        title="Confirmar Inscripción"
        size="lg"
      >
        {selectedPrograma && selectedGrupo && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {selectedPrograma.nombre}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Grupo: {selectedGrupo.modulo || 'Grupo'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Costo: {parseFloat(selectedPrograma.costo || 0).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
              </p>
            </div>

            {conflictos.length > 0 && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-800 rounded-lg">
                <div className="flex items-start gap-2 mb-3">
                  <AlertCircle className="h-6 w-6 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h5 className="font-bold text-lg text-red-900 dark:text-red-100 mb-1">
                      ⚠️ Conflictos de Horario Detectados
                    </h5>
                    <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                      El horario del grupo seleccionado entra en conflicto con otros grupos en los que ya está inscrito. No puedes inscribirte en este grupo.
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-red-200">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Horario del grupo seleccionado:
                    </p>
                    {selectedGrupo?.horarios?.map((h, idx) => (
                      <p key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                        {h.dias} {h.hora_ini} - {h.hora_fin}
                      </p>
                    ))}
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-red-900 dark:text-red-100 mb-2">
                      Conflictos con tus grupos actuales:
                    </p>
                    <ul className="space-y-2">
                      {conflictos.map((conflicto, idx) => (
                        <li key={idx} className="bg-white dark:bg-gray-800 rounded p-2 border border-red-200">
                          <div className="flex items-start gap-2">
                            <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {conflicto.grupo_conflicto?.programa} - {conflicto.grupo_conflicto?.modulo}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {conflicto.horario_conflicto?.dias} {conflicto.horario_conflicto?.hora_ini} - {conflicto.horario_conflicto?.hora_fin}
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <p className="text-sm font-semibold text-red-900 dark:text-red-100">
                    💡 Solución: Selecciona otro grupo con un horario diferente o cancela una inscripción existente.
                  </p>
                </div>
              </div>
            )}

            {conflictos.length === 0 && (
              <>
                <Input
                  label="Número de Cuotas *"
                  type="number"
                  min="1"
                  max="12"
                  placeholder="3"
                  error={errors.numero_cuotas?.message}
                  {...register('numero_cuotas', { 
                    required: 'El número de cuotas es obligatorio',
                    min: { value: 1, message: 'Mínimo 1 cuota' },
                    max: { value: 12, message: 'Máximo 12 cuotas' }
                  })}
                />

                {numeroCuotas && selectedPrograma.costo && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Monto por cuota:</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {parseFloat((selectedPrograma.costo / numeroCuotas) || 0).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                    </p>
                  </div>
                )}

                <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowModal(false)
                      setSelectedPrograma(null)
                      setSelectedGrupo(null)
                      setConflictos([])
                      reset()
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    icon={<CheckCircle className="h-5 w-5" />}
                    disabled={loading || verificando}
                  >
                    {loading ? 'Procesando...' : 'Confirmar Inscripción'}
                  </Button>
                </div>
              </>
            )}
          </form>
        )}
      </Modal>
    </div>
  )
}

export default Inscripciones

