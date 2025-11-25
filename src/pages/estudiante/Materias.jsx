import React, { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { get } from '../../services/api'
import { BookOpen, Calendar, User, Clock, Loader2 } from 'lucide-react'
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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <BookOpen className="h-8 w-8" />
          Mis Materias
        </h1>
        <p className="text-green-100">
          Consulta todas tus materias inscritas
        </p>
      </div>

      {/* Lista de Materias */}
      {!Array.isArray(materias) || materias.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No tienes materias inscritas
            </h3>
            <p className="text-gray-600">
              Contacta con la administración para inscribirte en materias
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6">
          {Array.isArray(materias) && materias.map((materia, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {materia.programa?.nombre || materia.nombre || 'Materia sin nombre'}
                    </h3>
                    {materia.programa?.descripcion && (
                      <p className="text-gray-600 text-sm">
                        {materia.programa.descripcion}
                      </p>
                    )}
                  </div>
                  {materia.estado && (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      materia.estado === 'aprobada' 
                        ? 'bg-green-100 text-green-800' 
                        : materia.estado === 'pendiente'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {materia.estado}
                    </span>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
                  {materia.fecha_inscripcion && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-5 w-5 text-green-600" />
                      <span className="text-sm">
                        <strong>Inscrito:</strong> {new Date(materia.fecha_inscripcion).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {materia.grupo && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <User className="h-5 w-5 text-blue-600" />
                      <span className="text-sm">
                        <strong>Grupo:</strong> {materia.grupo.nombre || materia.grupo.modulo || materia.grupo.id}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Mostrar horarios si están disponibles */}
                {materia.grupo?.horarios && materia.grupo.horarios.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Horarios:
                    </p>
                    <div className="space-y-1">
                      {materia.grupo.horarios.map((horario, idx) => (
                        <p key={idx} className="text-sm text-gray-600">
                          {horario.dias} {horario.hora_ini} - {horario.hora_fin}
                          {horario.aula && <span className="text-gray-500"> ({horario.aula})</span>}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default Materias

