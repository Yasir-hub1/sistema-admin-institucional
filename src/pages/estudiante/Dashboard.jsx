import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { 
  GraduationCap, 
  BookOpen, 
  FileText,
  CreditCard,
  Award,
  TrendingUp,
  ArrowRight
} from 'lucide-react'
import { get } from '../../services/api'

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    materias: 0,
    notas: 0,
    documentos: 0,
    pagos: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await get('/estudiante/dashboard')
        if (response.data.success) {
          const data = response.data.data || response.data
          setStats({
            materias: data.grupos_activos || 0,
            notas: data.grupos_con_notas || 0,
            documentos: data.documentos_subidos || 0,
            pagos: data.pagos_pendientes || 0
          })
        }
      } catch (error) {
        console.error('Error cargando dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const statCards = [
    {
      title: 'Mis Materias',
      value: stats.materias || '0',
      icon: <BookOpen className="h-8 w-8" />,
      color: 'bg-blue-500',
      link: '/estudiante/materias'
    },
    {
      title: 'Calificaciones',
      value: stats.notas > 0 ? `${stats.notas} disponibles` : 'Sin notas',
      icon: <Award className="h-8 w-8" />,
      color: 'bg-green-500',
      link: '/estudiante/notas'
    },
    {
      title: 'Documentos',
      value: stats.documentos || '0',
      icon: <FileText className="h-8 w-8" />,
      color: 'bg-yellow-500',
      link: '/estudiante/documentos'
    },
    {
      title: 'Pagos',
      value: stats.pagos > 0 ? `${stats.pagos} pendientes` : 'Al día',
      icon: <CreditCard className="h-8 w-8" />,
      color: 'bg-purple-500',
      link: '/estudiante/pagos'
    }
  ]

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">
            Bienvenido, {user?.nombre || user?.nombre_completo || `${user?.nombre || ''} ${user?.apellido || ''}`.trim() || 'Estudiante'}
          </h1>
          <p className="text-green-100">
            Portal del Estudiante - ICAP UAGRM
          </p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all cursor-pointer border border-gray-100"
              onClick={() => navigate(stat.link)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-lg text-white shadow-sm`}>
                  {stat.icon}
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">
                {stat.title}
              </h3>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '...' : stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Accesos Rápidos */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-green-600" />
              Accesos Rápidos
            </h2>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/estudiante/materias')}
                className="w-full text-left block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="font-medium text-gray-900">Mis Materias</span>
                <p className="text-sm text-gray-600">Consulta tus materias inscritas</p>
              </button>
              <button
                onClick={() => navigate('/estudiante/notas')}
                className="w-full text-left block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="font-medium text-gray-900">Mis Calificaciones</span>
                <p className="text-sm text-gray-600">Revisa tus notas y promedios</p>
              </button>
              <button
                onClick={() => navigate('/estudiante/documentos')}
                className="w-full text-left block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="font-medium text-gray-900">Mis Documentos</span>
                <p className="text-sm text-gray-600">Gestiona tus documentos</p>
              </button>
              <button
                onClick={() => navigate('/estudiante/pagos')}
                className="w-full text-left block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="font-medium text-gray-900">Mis Pagos</span>
                <p className="text-sm text-gray-600">Consulta y realiza pagos</p>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-blue-600" />
              Información
            </h2>
            <div className="space-y-3 text-gray-700">
              <p className="text-sm">
                <strong>CI:</strong> {user?.ci || 'No disponible'}
              </p>
              <p className="text-sm">
                <strong>Email:</strong> {user?.email || 'No disponible'}
              </p>
              <p className="text-sm">
                Desde este portal puedes consultar toda la información relacionada 
                con tu proceso académico en ICAP.
              </p>
            </div>
          </div>
        </div>
    </div>
  )
}

export default Dashboard

