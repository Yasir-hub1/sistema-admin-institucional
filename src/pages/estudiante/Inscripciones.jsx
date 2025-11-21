import React, { useState, useEffect } from 'react'
import { GraduationCap, Calendar, Clock, Users, DollarSign, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
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
        toast.error(response.message || 'Error al cargar programas')
        setProgramas([])
      }
    } catch (error) {
      toast.error('Error de conexión')
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
    const verificacion = await inscripcionService.verificarHorarios(grupo.id)
    setVerificando(false)
    
    if (verificacion.success) {
      if (verificacion.tieneConflictos) {
        setConflictos(verificacion.conflictos)
        toast.error('Se encontraron conflictos de horario')
      }
      setShowModal(true)
    } else {
      toast.error(verificacion.message || 'Error al verificar horarios')
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
              No hay programas disponibles
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Actualmente no hay programas con grupos disponibles para inscripción
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
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">Grupos Disponibles:</h4>
                  {programa.grupos_disponibles.map((grupo) => (
                    <div
                      key={grupo.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h5 className="font-semibold text-gray-900 dark:text-gray-100">
                              {grupo.modulo || 'Grupo'}
                            </h5>
                            {grupo.cupos_disponibles > 0 && (
                              <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                                {grupo.cupos_disponibles} cupos disponibles
                              </span>
                            )}
                          </div>
                          {grupo.docente && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              Docente: {grupo.docente}
                            </p>
                          )}
                          <div className="space-y-1">
                            {grupo.horarios && grupo.horarios.length > 0 ? (
                              grupo.horarios.map((horario, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                  <Clock className="h-4 w-4" />
                                  <span>{formatHorario(horario)}</span>
                                  {horario.aula && <span className="text-xs">({horario.aula})</span>}
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-gray-500">Sin horarios asignados</p>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(grupo.fecha_ini).toLocaleDateString()} - {new Date(grupo.fecha_fin).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleInscribirse(programa, grupo)}
                        >
                          Inscribirse
                        </Button>
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
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <h5 className="font-semibold text-red-900 dark:text-red-100">
                    Conflictos de Horario Detectados
                  </h5>
                </div>
                <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                  El horario del grupo seleccionado entra en conflicto con otros grupos en los que ya está inscrito:
                </p>
                <ul className="space-y-2">
                  {conflictos.map((conflicto, idx) => (
                    <li key={idx} className="text-sm text-red-700 dark:text-red-300">
                      • {conflicto.grupo_conflicto?.programa} - {conflicto.grupo_conflicto?.modulo} 
                      {' '}({conflicto.horario_conflicto?.dias} {conflicto.horario_conflicto?.hora_ini} - {conflicto.horario_conflicto?.hora_fin})
                    </li>
                  ))}
                </ul>
                <p className="text-sm font-semibold text-red-900 dark:text-red-100 mt-3">
                  No puede inscribirse debido a estos conflictos.
                </p>
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

