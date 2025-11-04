import React, { useState, useEffect } from 'react'
import Card from '../components/common/Card'
import {
  Users,
  BookOpen,
  Building,
  UserCheck,
  Clock,
  ClipboardList,
  TrendingUp,
  Calendar,
  ArrowUp,
  ArrowDown,
  Activity,
  GraduationCap,
  Award,
  Target,
  Zap,
  Star,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

const Dashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await api.get('/dashboard/estadisticas')
      
      if (response.data && response.data.success) {
        const data = response.data.data
        console.log('Dashboard data recibida:', data)
        setStats(data)
      } else {
        const errorMsg = response.data?.message || 'Error al cargar el dashboard'
        console.error('Error en respuesta del dashboard:', response.data)
        toast.error(errorMsg)
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error de conexión: No se pudo conectar con el servidor'
      toast.error(errorMessage)
      console.error('Error al cargar dashboard:', error)
      console.error('Error response:', error.response?.data)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary-200 dark:border-primary-800 rounded-full animate-spin"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-primary-600 rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  const statsCards = stats ? [
    {
      title: 'Total Docentes',
      value: stats.totales?.docentes || 0,
      icon: Users,
      color: 'primary',
      gradient: 'from-primary-500 to-primary-600',
      bgGradient: 'from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20'
    },
    {
      title: 'Total Materias',
      value: stats.totales?.materias || 0,
      icon: BookOpen,
      color: 'success',
      gradient: 'from-success-500 to-success-600',
      bgGradient: 'from-success-50 to-success-100 dark:from-success-900/20 dark:to-success-800/20'
    },
    {
      title: 'Total Aulas',
      value: stats.totales?.aulas || 0,
      icon: Building,
      color: 'accent',
      gradient: 'from-accent-500 to-accent-600',
      bgGradient: 'from-accent-50 to-accent-100 dark:from-accent-900/20 dark:to-accent-800/20'
    },
    {
      title: 'Total Grupos',
      value: stats.totales?.grupos || 0,
      icon: UserCheck,
      color: 'warning',
      gradient: 'from-warning-500 to-warning-600',
      bgGradient: 'from-warning-50 to-warning-100 dark:from-warning-900/20 dark:to-warning-800/20'
    }
  ] : []

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header con saludo personalizado */}
      <div className="text-center lg:text-left animate-fade-in-up">
        <div className="flex items-center justify-center lg:justify-start space-x-4 mb-4">
          <div className="relative group">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center shadow-glow-lg animate-bounce-in group-hover:scale-110 transition-transform duration-300">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-success-500 rounded-full flex items-center justify-center shadow-glow animate-pulse">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-bold gradient-text group-hover:scale-105 transition-transform duration-300">
              ¡Bienvenido, {user?.name || 'Usuario'}!
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
              Resumen general del sistema académico FICCT
            </p>
          </div>
        </div>
        
        {/* Indicadores de estado */}
        <div className="flex flex-wrap justify-center lg:justify-start gap-4 mt-6">
          <div className="flex items-center space-x-2 px-4 py-2 glass rounded-xl">
            <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sistema Activo</span>
          </div>
          {stats?.gestion_activa && (
            <div className="flex items-center space-x-2 px-4 py-2 glass rounded-xl">
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Gestión {stats.gestion_activa.anio || stats.gestion_activa.año || stats.gestion_activa.nombre || 'N/A'}
              </span>
            </div>
          )}
          <div className="flex items-center space-x-2 px-4 py-2 glass rounded-xl">
            <div className="w-2 h-2 bg-accent-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Rol: {user?.rol?.nombre || user?.rol || 'Usuario'}
            </span>
          </div>
        </div>
      </div>

      {/* Estadísticas Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
        {statsCards.map((stat, index) => {
          const IconComponent = stat.icon
          return (
            <Card 
              key={index} 
              className={`group hover:shadow-glow-lg transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 bg-gradient-to-br ${stat.bgGradient} border-0 cursor-pointer`}
              style={{animationDelay: `${index * 0.1}s`}}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">{stat.title}</p>
                  <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
                </div>
                <div className={`p-4 rounded-2xl bg-gradient-to-br ${stat.gradient} shadow-glow animate-float`}>
                  <IconComponent className="h-8 w-8 text-white" />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Estadísticas de Asistencias */}
      {stats?.asistencias && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
          <Card className="lg:col-span-2 gradient" shadow="glow-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold gradient-text flex items-center">
                <ClipboardList className="h-6 w-6 mr-2" />
                Asistencias (Últimos 30 días)
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-6 bg-gradient-to-br from-success-50 to-success-100 dark:from-success-900/20 dark:to-success-800/20 rounded-2xl border border-success-200/50 dark:border-success-700/50">
                <div className="w-12 h-12 bg-gradient-to-br from-success-500 to-success-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-glow">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <p className="text-3xl font-bold text-success-600 mb-1">{stats.asistencias.presente}</p>
                <p className="text-sm text-success-700 dark:text-success-400 font-medium">Presentes</p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-warning-50 to-warning-100 dark:from-warning-900/20 dark:to-warning-800/20 rounded-2xl border border-warning-200/50 dark:border-warning-700/50">
                <div className="w-12 h-12 bg-gradient-to-br from-warning-500 to-warning-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-glow">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <p className="text-3xl font-bold text-warning-600 mb-1">{stats.asistencias.tardanza}</p>
                <p className="text-sm text-warning-700 dark:text-warning-400 font-medium">Tardanzas</p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-error-50 to-error-100 dark:from-error-900/20 dark:to-error-800/20 rounded-2xl border border-error-200/50 dark:border-error-700/50">
                <div className="w-12 h-12 bg-gradient-to-br from-error-500 to-error-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-glow">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <p className="text-3xl font-bold text-error-600 mb-1">{stats.asistencias.ausente}</p>
                <p className="text-sm text-error-700 dark:text-error-400 font-medium">Ausentes</p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-2xl border border-primary-200/50 dark:border-primary-700/50">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-glow">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <p className="text-3xl font-bold text-primary-600 mb-1">{stats.asistencias.justificado}</p>
                <p className="text-sm text-primary-700 dark:text-primary-400 font-medium">Justificados</p>
              </div>
            </div>
          </Card>

          <Card className="gradient" shadow="glow-lg">
            <h3 className="text-xl font-bold gradient-text mb-6 flex items-center">
              <PieChart className="h-6 w-6 mr-2" />
              Porcentaje de Asistencia
            </h3>
            <div className="flex items-center justify-center h-48">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-glow-lg animate-pulse-slow">
                  <div className="w-24 h-24 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-3xl font-bold gradient-text">
                        {stats.asistencias.porcentaje_asistencia}%
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Asistencia promedio</p>
                    </div>
                  </div>
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-success-500 rounded-full flex items-center justify-center shadow-glow">
                  <Star className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up" style={{animationDelay: '0.3s'}}>
        {/* Actividad Reciente */}
        <Card className="gradient" shadow="glow-lg">
          <h3 className="text-xl font-bold gradient-text mb-6 flex items-center">
            <Activity className="h-6 w-6 mr-2" />
            Actividad Reciente
          </h3>
          <div className="space-y-4">
            {stats?.actividad_reciente && stats.actividad_reciente.length > 0 ? (
              stats.actividad_reciente.map((activity, index) => (
                <div key={activity.id} className="flex items-start space-x-4 p-4 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-2xl transition-all duration-200 group">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform duration-200">
                      <ClipboardList className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">
                      {activity.mensaje}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center space-x-2">
                      <span>Por: {activity.docente}</span>
                      <span>•</span>
                      <span>{activity.fecha}</span>
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Activity className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">No hay actividad reciente</p>
              </div>
            )}
          </div>
        </Card>

        {/* Próximas Clases */}
        <Card className="gradient" shadow="glow-lg">
          <h3 className="text-xl font-bold gradient-text mb-6 flex items-center">
            <Calendar className="h-6 w-6 mr-2" />
            Próximas Clases del Día
          </h3>
          <div className="space-y-4">
            {stats?.proximas_clases && stats.proximas_clases.length > 0 ? (
              stats.proximas_clases.map((clase, index) => (
                <div key={clase.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 hover:shadow-glow ${
                  index % 3 === 0 ? 'bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 border-primary-200/50 dark:border-primary-700/50' :
                  index % 3 === 1 ? 'bg-gradient-to-r from-success-50 to-success-100 dark:from-success-900/20 dark:to-success-800/20 border-success-200/50 dark:border-success-700/50' : 
                  'bg-gradient-to-r from-accent-50 to-accent-100 dark:from-accent-900/20 dark:to-accent-800/20 border-accent-200/50 dark:border-accent-700/50'
                }`}>
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-glow ${
                      index % 3 === 0 ? 'bg-gradient-to-br from-primary-500 to-primary-600' :
                      index % 3 === 1 ? 'bg-gradient-to-br from-success-500 to-success-600' : 
                      'bg-gradient-to-br from-accent-500 to-accent-600'
                    }`}>
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{clase.materia || 'N/A'}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Grupo {clase.grupo || 'N/A'} • {clase.aula || 'N/A'} • {clase.docente || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {clase.hora_inicio}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">hasta {clase.hora_fin}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">No hay clases programadas para hoy</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Gestión Activa */}
      {stats?.gestion_activa && (
        <Card className="gradient" shadow="glow-lg" style={{animationDelay: '0.4s'}}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-success-500 to-success-600 rounded-2xl flex items-center justify-center shadow-glow-lg">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold gradient-text">
                  Gestión Académica Activa
                </h3>
                <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
                  {stats.gestion_activa.nombre || `Gestión ${stats.gestion_activa.anio || stats.gestion_activa.año || 'N/A'}`} - {stats.gestion_activa.anio || stats.gestion_activa.año || 'N/A'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {new Date(stats.gestion_activa.fecha_inicio).toLocaleDateString()} - {new Date(stats.gestion_activa.fecha_fin).toLocaleDateString()}
              </p>
              <span className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-success-500 to-success-600 text-white shadow-glow">
                <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                Activa
              </span>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

export default Dashboard
