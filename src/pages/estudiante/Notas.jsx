import React, { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { get } from '../../services/api'
import { Award, BookOpen, User, Calendar, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Card from '../../components/common/Card'

const Notas = () => {
  const { user } = useAuth()
  const [notas, setNotas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchNotas = async () => {
      try {
        setLoading(true)
        const response = await get('/estudiante/notas')
        
        console.log('📚 Respuesta de notas:', response.data)
        
        if (response.data.success) {
          // El backend retorna: { success: true, data: { notas: [...], estadisticas: {...} } }
          let notasData = []
          
          if (response.data.data) {
            // Si tiene la propiedad notas dentro de data
            if (response.data.data.notas && Array.isArray(response.data.data.notas)) {
              notasData = response.data.data.notas
            } 
            // Si es un array directo
            else if (Array.isArray(response.data.data)) {
              notasData = response.data.data
            }
          } 
          // Fallback: buscar directamente en response.data
          else if (response.data.notas && Array.isArray(response.data.notas)) {
            notasData = response.data.notas
          }
          
          // Asegurar que siempre sea un array
          if (!Array.isArray(notasData)) {
            console.warn('⚠️ notasData no es un array:', notasData)
            notasData = []
          }
          
          setNotas(notasData)
        } else {
          setError('No se pudieron cargar las notas')
          setNotas([])
        }
      } catch (error) {
        console.error('Error cargando notas:', error)
        setError('Error al cargar las notas')
        setNotas([])
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchNotas()
    }
  }, [user])

  const getNotaColor = (nota) => {
    if (!nota) return 'text-gray-500'
    if (nota >= 70) return 'text-green-600'
    if (nota >= 51) return 'text-blue-600'
    return 'text-red-600'
  }

  const getEstadoBadge = (aprobado) => {
    if (aprobado === null) return null
    if (aprobado) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-4 w-4" />
          Aprobado
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <XCircle className="h-4 w-4" />
        Reprobado
      </span>
    )
  }

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
          <Award className="h-8 w-8" />
          Mis Calificaciones
        </h1>
        <p className="text-green-100">
          Consulta tus notas y promedios por materia
        </p>
      </div>

      {/* Lista de Notas */}
      {!Array.isArray(notas) || notas.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Award className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No tienes notas registradas
            </h3>
            <p className="text-gray-600">
              Las notas aparecerán aquí una vez que los docentes las registren
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6">
          {Array.isArray(notas) && notas.map((nota, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {nota.programa?.nombre || nota.materia || 'Materia'}
                    </h3>
                    {nota.docente && (
                      <p className="text-gray-600 text-sm flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {nota.docente}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    {nota.nota !== null ? (
                      <div className={`text-4xl font-bold ${getNotaColor(nota.nota)}`}>
                        {nota.nota}
                      </div>
                    ) : (
                      <div className="text-gray-400 text-sm">Sin calificar</div>
                    )}
                    {getEstadoBadge(nota.aprobado)}
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
                  {nota.fecha_ini && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <span className="text-sm">
                        <strong>Inicio:</strong> {new Date(nota.fecha_ini).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {nota.fecha_fin && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-5 w-5 text-red-600" />
                      <span className="text-sm">
                        <strong>Fin:</strong> {new Date(nota.fecha_fin).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {nota.estado && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <BookOpen className="h-5 w-5 text-green-600" />
                      <span className="text-sm">
                        <strong>Estado:</strong> {nota.estado}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default Notas

