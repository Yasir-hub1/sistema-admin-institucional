import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Users, BookOpen, Save, CheckCircle, XCircle, AlertCircle, ArrowLeft, Clock, Send, Bell, GraduationCap, Calendar, MapPin, CalendarDays } from 'lucide-react'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Modal from '../../components/common/Modal'
import Textarea from '../../components/common/Textarea'
import { docenteGrupoService, docenteEvaluacionService } from '../../services/docenteService'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'

const EvaluacionGrupo = () => {
  const { grupoId } = useParams()
  const navigate = useNavigate()
  const [grupo, setGrupo] = useState(null)
  const [estudiantes, setEstudiantes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNotaModal, setShowNotaModal] = useState(false)
  const [showEstadoModal, setShowEstadoModal] = useState(false)
  const [showNotificacionModal, setShowNotificacionModal] = useState(false)
  const [selectedEstudiante, setSelectedEstudiante] = useState(null)
  const [notasMasivas, setNotasMasivas] = useState({})
  const [saving, setSaving] = useState(false)

  const { register: registerNota, handleSubmit: handleSubmitNota, reset: resetNota, formState: { errors: errorsNota } } = useForm()
  const { register: registerEstado, handleSubmit: handleSubmitEstado, reset: resetEstado, formState: { errors: errorsEstado } } = useForm()
  const { register: registerNotif, handleSubmit: handleSubmitNotif, reset: resetNotif, formState: { errors: errorsNotif } } = useForm()

  useEffect(() => {
    if (grupoId) {
      fetchGrupo()
    }
  }, [grupoId])

  const fetchGrupo = async () => {
    try {
      setLoading(true)
      const response = await docenteGrupoService.getGrupoById(grupoId)
      
      if (response.success) {
        setGrupo(response.data.grupo)
        setEstudiantes(response.data.estudiantes || [])
      } else {
        toast.error(response.message || 'Error al cargar el grupo')
        navigate('/docente/grupos')
      }
    } catch (error) {
      toast.error('Error de conexión')
      navigate('/docente/grupos')
    } finally {
      setLoading(false)
    }
  }

  const handleRegistrarNota = (estudiante) => {
    setSelectedEstudiante(estudiante)
    resetNota({
      grupo_id: grupoId,
      estudiante_registro: estudiante.registro_estudiante,
      nota: estudiante.nota || '',
      estado: estudiante.estado || ''
    })
    setShowNotaModal(true)
  }

  const handleActualizarEstado = (estudiante) => {
    setSelectedEstudiante(estudiante)
    resetEstado({
      grupo_id: grupoId,
      estudiante_registro: estudiante.registro_estudiante,
      estado: estudiante.estado || 'EN_CURSO'
    })
    setShowEstadoModal(true)
  }

  const onSubmitNota = async (data) => {
    try {
      setSaving(true)
      const response = await docenteEvaluacionService.registrarNota(data)
      
      if (response.success) {
        toast.success(response.message || 'Nota registrada exitosamente. El estudiante ha sido notificado.')
        setShowNotaModal(false)
        setSelectedEstudiante(null)
        resetNota()
        await fetchGrupo()
      } else {
        toast.error(response.message || 'Error al registrar nota')
        if (response.errors) {
          Object.keys(response.errors).forEach(key => {
            toast.error(`${key}: ${response.errors[key]}`)
          })
        }
      }
    } catch (error) {
      toast.error('Error al registrar nota')
    } finally {
      setSaving(false)
    }
  }

  const onSubmitEstado = async (data) => {
    try {
      setSaving(true)
      const response = await docenteEvaluacionService.actualizarEstado(data)
      
      if (response.success) {
        toast.success(response.message || 'Estado actualizado exitosamente')
        setShowEstadoModal(false)
        setSelectedEstudiante(null)
        resetEstado()
        await fetchGrupo()
      } else {
        toast.error(response.message || 'Error al actualizar estado')
        if (response.errors) {
          Object.keys(response.errors).forEach(key => {
            toast.error(`${key}: ${response.errors[key]}`)
          })
        }
      }
    } catch (error) {
      toast.error('Error al actualizar estado')
    } finally {
      setSaving(false)
    }
  }

  const onSubmitNotificacion = async (data) => {
    try {
      setSaving(true)
      const response = await docenteEvaluacionService.enviarNotificacionEstudiantes({
        grupo_id: grupoId,
        titulo: data.titulo,
        mensaje: data.mensaje,
        tipo: data.tipo || 'info',
        estudiante_registro: data.estudiante_registro || null
      })
      
      if (response.success) {
        toast.success(response.message || 'Notificación enviada exitosamente')
        setShowNotificacionModal(false)
        resetNotif()
      } else {
        toast.error(response.message || 'Error al enviar notificación')
      }
    } catch (error) {
      toast.error('Error al enviar notificación')
    } finally {
      setSaving(false)
    }
  }

  const handleNotaMasivaChange = (estudianteRegistro, field, value) => {
    setNotasMasivas(prev => ({
      ...prev,
      [estudianteRegistro]: {
        ...prev[estudianteRegistro],
        [field]: value
      }
    }))
  }

  const handleGuardarNotasMasivas = async () => {
    try {
      setSaving(true)
      const notas = Object.keys(notasMasivas).map(estudianteRegistro => ({
        estudiante_registro: estudianteRegistro,
        nota: parseFloat(notasMasivas[estudianteRegistro].nota) || null,
        estado: notasMasivas[estudianteRegistro].estado || null
      })).filter(n => n.nota !== null)

      if (notas.length === 0) {
        toast.error('Debe ingresar al menos una nota')
        return
      }

      const response = await docenteEvaluacionService.registrarNotasMasivas({
        grupo_id: grupoId,
        notas: notas
      })

      if (response.success) {
        toast.success(response.message || 'Notas registradas exitosamente. Los estudiantes han sido notificados.')
        setNotasMasivas({})
        await fetchGrupo()
      } else {
        toast.error(response.message || 'Error al registrar notas')
      }
    } catch (error) {
      toast.error('Error al registrar notas')
    } finally {
      setSaving(false)
    }
  }

  const getEstadoBadge = (estado) => {
    const estados = {
      'APROBADO': { color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300', icon: CheckCircle, label: 'Aprobado' },
      'REPROBADO': { color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300', icon: XCircle, label: 'Reprobado' },
      'RETIRADO': { color: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300', icon: AlertCircle, label: 'Retirado' },
      'EN_CURSO': { color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300', icon: Clock, label: 'En Curso' }
    }
    const estadoInfo = estados[estado] || estados['EN_CURSO']
    const Icon = estadoInfo.icon
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${estadoInfo.color}`}>
        <Icon className="h-3 w-3" />
        {estadoInfo.label}
      </span>
    )
  }

  const getNotaColor = (nota) => {
    if (!nota && nota !== 0) return 'text-gray-500'
    if (nota >= 51) return 'text-green-600 dark:text-green-400 font-semibold'
    return 'text-red-600 dark:text-red-400 font-semibold'
  }

  if (loading && !grupo) {
    return <LoadingSpinner />
  }

  if (!grupo) {
    return null
  }

  const estudiantesConNota = estudiantes.filter(e => e.nota !== null && e.nota !== undefined).length
  const estudiantesSinNota = estudiantes.length - estudiantesConNota

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            icon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => navigate('/docente/grupos')}
          >
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold gradient-text">Evaluación de Grupo</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {grupo.programa?.nombre || 'Programa'} - {grupo.modulo?.nombre || 'Módulo'}
            </p>
          </div>
        </div>
        <Button
          variant="primary"
          icon={<Bell className="h-4 w-4" />}
          onClick={() => {
            resetNotif({
              grupo_id: grupoId,
              titulo: '',
              mensaje: '',
              tipo: 'info'
            })
            setShowNotificacionModal(true)
          }}
        >
          Enviar Aviso
        </Button>
      </div>

      {/* Información del Grupo */}
      <Card className="gradient" shadow="glow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Programa</p>
            <p className="font-semibold text-gray-900 dark:text-gray-100">{grupo.programa?.nombre || '-'}</p>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Módulo</p>
            <p className="font-semibold text-gray-900 dark:text-gray-100">{grupo.modulo?.nombre || '-'}</p>
          </div>
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Período</p>
            <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
              {new Date(grupo.fecha_ini).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - {new Date(grupo.fecha_fin).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Estudiantes</p>
            <p className="font-semibold text-gray-900 dark:text-gray-100">{estudiantes.length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {estudiantesConNota} con nota, {estudiantesSinNota} pendientes
            </p>
          </div>
        </div>

        {/* Horarios */}
        {grupo.horarios && grupo.horarios.length > 0 && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Horarios y Aulas
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {grupo.horarios.map((horario, idx) => (
                <div key={idx} className="p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-2 mb-1">
                    <CalendarDays className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{horario.dias || 'Sin días'}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{horario.hora_ini} - {horario.hora_fin}</span>
                  </div>
                  {horario.aula && horario.aula !== 'N/A' && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                      <MapPin className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />
                      <span className="text-xs font-medium text-primary-700 dark:text-primary-300">Aula: {horario.aula}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold gradient-text">
            Estudiantes ({estudiantes.length})
          </h3>
          {Object.keys(notasMasivas).length > 0 && (
            <Button
              variant="primary"
              icon={<Save className="h-4 w-4" />}
              onClick={handleGuardarNotasMasivas}
              disabled={saving}
            >
              Guardar Notas Masivas ({Object.keys(notasMasivas).length})
            </Button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">Estudiante</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">CI</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">Nota</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">Estado</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {estudiantes.map((estudiante, idx) => (
                <tr key={idx} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {estudiante.nombre?.charAt(0) || 'E'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {estudiante.nombre} {estudiante.apellido}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                    {estudiante.ci}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        className="w-24 text-center"
                        defaultValue={estudiante.nota || ''}
                        onChange={(e) => handleNotaMasivaChange(estudiante.registro_estudiante, 'nota', e.target.value)}
                        placeholder="0-100"
                      />
                      {estudiante.nota !== null && estudiante.nota !== undefined && (
                        <span className={`text-sm font-semibold ${getNotaColor(estudiante.nota)}`}>
                          {parseFloat(estudiante.nota).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center">
                      {getEstadoBadge(estudiante.estado || 'EN_CURSO')}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRegistrarNota(estudiante)}
                        icon={<BookOpen className="h-4 w-4" />}
                      >
                        Nota
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleActualizarEstado(estudiante)}
                        icon={<AlertCircle className="h-4 w-4" />}
                      >
                        Estado
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal de Registrar Nota */}
      <Modal
        isOpen={showNotaModal}
        onClose={() => {
          setShowNotaModal(false)
          setSelectedEstudiante(null)
          resetNota()
        }}
        title="Registrar Nota"
        size="md"
      >
        {selectedEstudiante && (
          <form onSubmit={handleSubmitNota(onSubmitNota)} className="space-y-6">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Estudiante</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {selectedEstudiante.nombre} {selectedEstudiante.apellido}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">CI: {selectedEstudiante.ci}</p>
            </div>

            <Input
              label="Nota (0-100) *"
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="0-100"
              error={errorsNota.nota?.message}
              {...registerNota('nota', { 
                required: 'La nota es obligatoria',
                min: { value: 0, message: 'La nota debe ser mayor o igual a 0' },
                max: { value: 100, message: 'La nota debe ser menor o igual a 100' }
              })}
            />

            <Select
              label="Estado Académico"
              name="estado"
              options={[
                { value: '', label: 'Automático (según nota)' },
                { value: 'APROBADO', label: 'Aprobado' },
                { value: 'REPROBADO', label: 'Reprobado' },
                { value: 'RETIRADO', label: 'Retirado' },
                { value: 'EN_CURSO', label: 'En Curso' }
              ]}
              {...registerNota('estado')}
              error={errorsNota.estado?.message}
            />

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-xs text-blue-800 dark:text-blue-300">
                ℹ️ El estudiante será notificado automáticamente cuando se registre la nota.
              </p>
            </div>

            <input type="hidden" {...registerNota('grupo_id')} />
            <input type="hidden" {...registerNota('estudiante_registro')} />
            
            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowNotaModal(false)
                  setSelectedEstudiante(null)
                  resetNota()
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                icon={<Save className="h-5 w-5" />}
                disabled={saving}
              >
                {saving ? 'Guardando...' : 'Guardar Nota'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal de Actualizar Estado */}
      <Modal
        isOpen={showEstadoModal}
        onClose={() => {
          setShowEstadoModal(false)
          setSelectedEstudiante(null)
          resetEstado()
        }}
        title="Actualizar Estado Académico"
        size="md"
      >
        {selectedEstudiante && (
          <form onSubmit={handleSubmitEstado(onSubmitEstado)} className="space-y-6">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Estudiante</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {selectedEstudiante.nombre} {selectedEstudiante.apellido}
              </p>
              {selectedEstudiante.nota !== null && selectedEstudiante.nota !== undefined && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Nota actual: <span className="font-semibold">{selectedEstudiante.nota}</span>
                </p>
              )}
            </div>

            <Select
              label="Estado Académico *"
              name="estado"
              options={[
                { value: 'APROBADO', label: 'Aprobado' },
                { value: 'REPROBADO', label: 'Reprobado' },
                { value: 'RETIRADO', label: 'Retirado' },
                { value: 'EN_CURSO', label: 'En Curso' }
              ]}
              {...registerEstado('estado', { required: 'El estado es obligatorio' })}
              error={errorsEstado.estado?.message}
            />

            <input type="hidden" {...registerEstado('grupo_id')} />
            <input type="hidden" {...registerEstado('estudiante_registro')} />
            
            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEstadoModal(false)
                  setSelectedEstudiante(null)
                  resetEstado()
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                icon={<Save className="h-5 w-5" />}
                disabled={saving}
              >
                {saving ? 'Actualizando...' : 'Actualizar Estado'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal de Enviar Notificación */}
      <Modal
        isOpen={showNotificacionModal}
        onClose={() => {
          setShowNotificacionModal(false)
          resetNotif()
        }}
        title="Enviar Aviso a Estudiantes"
        size="md"
      >
        <form onSubmit={handleSubmitNotif(onSubmitNotificacion)} className="space-y-6">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Grupo</p>
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              {grupo.programa?.nombre || 'Programa'} - {grupo.modulo?.nombre || 'Módulo'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {estudiantes.length} estudiante{estudiantes.length !== 1 ? 's' : ''} en el grupo
            </p>
          </div>

          <Select
            label="Enviar a"
            name="estudiante_registro"
            options={[
              { value: '', label: 'Todos los estudiantes del grupo' },
              ...estudiantes.map(e => ({
                value: e.registro_estudiante,
                label: `${e.nombre} ${e.apellido} (CI: ${e.ci})`
              }))
            ]}
            {...registerNotif('estudiante_registro')}
          />

          <Input
            label="Título *"
            placeholder="Ej: Recordatorio de entrega de tarea"
            error={errorsNotif.titulo?.message}
            {...registerNotif('titulo', { required: 'El título es obligatorio' })}
          />

          <Textarea
            label="Mensaje *"
            placeholder="Escribe el mensaje que recibirán los estudiantes..."
            rows={4}
            error={errorsNotif.mensaje?.message}
            {...registerNotif('mensaje', { required: 'El mensaje es obligatorio' })}
          />

          <Select
            label="Tipo de Notificación"
            name="tipo"
            options={[
              { value: 'info', label: 'Informativa' },
              { value: 'success', label: 'Éxito' },
              { value: 'warning', label: 'Advertencia' },
              { value: 'error', label: 'Error' },
              { value: 'academico', label: 'Académica' }
            ]}
            {...registerNotif('tipo')}
          />

          <input type="hidden" {...registerNotif('grupo_id')} />
            
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowNotificacionModal(false)
                resetNotif()
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={<Send className="h-5 w-5" />}
              disabled={saving}
            >
              {saving ? 'Enviando...' : 'Enviar Aviso'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default EvaluacionGrupo
