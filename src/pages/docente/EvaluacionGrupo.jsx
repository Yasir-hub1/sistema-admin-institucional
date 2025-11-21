import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Users, BookOpen, Save, CheckCircle, XCircle, AlertCircle, ArrowLeft, Clock } from 'lucide-react'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Modal from '../../components/common/Modal'
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
  const [selectedEstudiante, setSelectedEstudiante] = useState(null)
  const [notasMasivas, setNotasMasivas] = useState({})

  const { register: registerNota, handleSubmit: handleSubmitNota, reset: resetNota, formState: { errors: errorsNota } } = useForm()
  const { register: registerEstado, handleSubmit: handleSubmitEstado, reset: resetEstado, formState: { errors: errorsEstado } } = useForm()

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
      setLoading(true)
      const response = await docenteEvaluacionService.registrarNota(data)
      
      if (response.success) {
        toast.success(response.message || 'Nota registrada exitosamente')
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
      setLoading(false)
    }
  }

  const onSubmitEstado = async (data) => {
    try {
      setLoading(true)
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
      setLoading(false)
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
      setLoading(true)
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
        toast.success(response.message || 'Notas registradas exitosamente')
        setNotasMasivas({})
        await fetchGrupo()
      } else {
        toast.error(response.message || 'Error al registrar notas')
      }
    } catch (error) {
      toast.error('Error al registrar notas')
    } finally {
      setLoading(false)
    }
  }

  const getEstadoBadge = (estado) => {
    const estados = {
      'APROBADO': { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Aprobado' },
      'REPROBADO': { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Reprobado' },
      'RETIRADO': { color: 'bg-gray-100 text-gray-800', icon: AlertCircle, label: 'Retirado' },
      'EN_CURSO': { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'En Curso' }
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

  if (loading && !grupo) {
    return <LoadingSpinner />
  }

  if (!grupo) {
    return null
  }

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
              {grupo.programa?.nombre} - {grupo.modulo?.nombre}
            </p>
          </div>
        </div>
      </div>

      <Card className="gradient" shadow="glow-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Programa</p>
            <p className="font-semibold text-gray-900 dark:text-gray-100">{grupo.programa?.nombre || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Módulo</p>
            <p className="font-semibold text-gray-900 dark:text-gray-100">{grupo.modulo?.nombre || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Período</p>
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              {new Date(grupo.fecha_ini).toLocaleDateString()} - {new Date(grupo.fecha_fin).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold gradient-text">
            Estudiantes ({estudiantes.length})
          </h3>
          {Object.keys(notasMasivas).length > 0 && (
            <Button
              variant="primary"
              icon={<Save className="h-4 w-4" />}
              onClick={handleGuardarNotasMasivas}
            >
              Guardar Notas Masivas
            </Button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">Estudiante</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">CI</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">Nota</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">Estado</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {estudiantes.map((estudiante, idx) => (
                <tr key={idx} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {estudiante.nombre} {estudiante.apellido}
                      </p>
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
                        className="w-20"
                        defaultValue={estudiante.nota || ''}
                        onChange={(e) => handleNotaMasivaChange(estudiante.registro_estudiante, 'nota', e.target.value)}
                        placeholder="0-100"
                      />
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center">
                      {getEstadoBadge(estudiante.estado)}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRegistrarNota(estudiante)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleActualizarEstado(estudiante)}
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
              >
                Guardar Nota
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
              {selectedEstudiante.nota && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Nota actual: {selectedEstudiante.nota}
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
              >
                Actualizar Estado
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}

export default EvaluacionGrupo

