import React, { useState, useEffect } from 'react'
import { Users, BookOpen, Calendar, Clock, Eye, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
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
    return <LoadingSpinner />
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center shadow-glow">
          <Users className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold gradient-text">Mis Grupos</h1>
          <p className="text-gray-600 dark:text-gray-400">Grupos asignados para evaluación académica</p>
        </div>
      </div>

      {grupos.length === 0 ? (
        <Card className="gradient" shadow="glow-lg">
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No tienes grupos asignados
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Contacta con el administrador para más información
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {grupos.map((grupo) => (
            <Card key={grupo.grupo_id} className="gradient" shadow="glow-lg">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold gradient-text mb-2">
                      {grupo.programa?.nombre || 'Sin programa'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <BookOpen className="h-4 w-4 inline mr-1" />
                      {grupo.modulo?.nombre || 'Sin módulo'}
                    </p>
                  </div>
                  {grupo.esta_activo ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3" />
                      Activo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      <XCircle className="h-3 w-3" />
                      Finalizado
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>
                      {new Date(grupo.fecha_ini).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })} - {new Date(grupo.fecha_fin).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Users className="h-4 w-4 mr-2" />
                    <span>{grupo.numero_estudiantes} estudiantes</span>
                  </div>
                  {grupo.horarios && grupo.horarios.length > 0 && (
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Clock className="h-4 w-4 mr-2" />
                      <div className="flex flex-wrap gap-1">
                        {grupo.horarios.map((horario, idx) => (
                          <span key={idx} className="text-xs">
                            {horario.dias} {horario.hora_ini}-{horario.hora_fin}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  variant="primary"
                  fullWidth
                  icon={<Eye className="h-4 w-4" />}
                  onClick={() => handleVerDetalle(grupo.grupo_id)}
                >
                  Ver Detalle y Evaluar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default MisGrupos

