import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../../components/common/Card'
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
  LineChart,
  CreditCard,
  FileText
} from 'lucide-react'
import api from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/dashboard')
      
      if (response.data && response.data.success) {
        const data = response.data.data
        setStats(data)
      } else {
        const errorMsg = response.data?.message || 'Error al cargar el dashboard'
        toast.error(errorMsg)
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error de conexión'
      toast.error(errorMessage)
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
      title: 'Total Estudiantes',
      value: stats.totales?.estudiantes || stats.estudiantes?.total || 0,
      icon: GraduationCap,
      color: 'primary',
      gradient: 'from-primary-500 to-primary-600',
      bgGradient: 'from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20'
    },
    {
      title: 'Total Docentes',
      value: stats.totales?.docentes || stats.docentes?.total || 0,
      icon: UserCheck,
      color: 'success',
      gradient: 'from-success-500 to-success-600',
      bgGradient: 'from-success-50 to-success-100 dark:from-success-900/20 dark:to-success-800/20'
    },
    {
      title: 'Total Programas',
      value: stats.totales?.programas || stats.programas?.total || 0,
      icon: BookOpen,
      color: 'accent',
      gradient: 'from-accent-500 to-accent-600',
      bgGradient: 'from-accent-50 to-accent-100 dark:from-accent-900/20 dark:to-accent-800/20'
    },
    {
      title: 'Total Grupos',
      value: stats.totales?.grupos || stats.grupos?.total || 0,
      icon: Users,
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
                ¡Bienvenido, {user?.nombre || user?.name || 'Administrador'}!
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
                Resumen general del sistema académico
              </p>
            </div>
          </div>
          
          {/* Indicadores de estado */}
          <div className="flex flex-wrap justify-center lg:justify-start gap-4 mt-6">
            <div className="flex items-center space-x-2 px-4 py-2 glass rounded-xl">
              <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sistema Activo</span>
            </div>
            <div className="flex items-center space-x-2 px-4 py-2 glass rounded-xl">
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Rol: {user?.rol?.nombre || user?.rol || 'Administrador'}
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

        {/* Acciones Rápidas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
          <Card
            className="group hover:shadow-glow-lg transition-all duration-300 transform hover:-translate-y-2 cursor-pointer"
            onClick={() => navigate('/admin/estudiantes')}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow group-hover:scale-110 transition-transform duration-300">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Gestión de Estudiantes</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Administrar estudiantes</p>
            </div>
          </Card>

          <Card
            className="group hover:shadow-glow-lg transition-all duration-300 transform hover:-translate-y-2 cursor-pointer"
            onClick={() => navigate('/admin/validacion-documentos')}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-warning-500 to-warning-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow group-hover:scale-110 transition-transform duration-300">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Validar Documentos</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Revisar documentos</p>
            </div>
          </Card>

          <Card
            className="group hover:shadow-glow-lg transition-all duration-300 transform hover:-translate-y-2 cursor-pointer"
            onClick={() => navigate('/admin/gestion-pagos')}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-success-500 to-success-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow group-hover:scale-110 transition-transform duration-300">
                <CreditCard className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Verificar Pagos</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Confirmar pagos</p>
            </div>
          </Card>

          <Card
            className="group hover:shadow-glow-lg transition-all duration-300 transform hover:-translate-y-2 cursor-pointer"
            onClick={() => navigate('/admin/grupos')}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow group-hover:scale-110 transition-transform duration-300">
                <UserCheck className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Gestión de Grupos</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Administrar grupos</p>
            </div>
          </Card>
        </div>

        {/* Actividad Reciente */}
        {stats?.actividad_reciente && stats.actividad_reciente.length > 0 && (
          <Card className="gradient" shadow="glow-lg" style={{animationDelay: '0.3s'}}>
            <div className="flex items-center mb-6">
              <Activity className="h-6 w-6 mr-2" />
              <h3 className="text-xl font-bold gradient-text">Actividad Reciente</h3>
            </div>
            <div className="space-y-4">
              {stats.actividad_reciente.slice(0, 5).map((activity, index) => (
                <div
                  key={activity.id || index}
                  className="flex items-start space-x-4 p-4 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-2xl transition-all duration-200 group"
                >
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform duration-200">
                      <ClipboardList className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">
                      {activity.mensaje || activity.titulo || 'Actividad del sistema'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center space-x-2">
                      {activity.docente && <span>Por: {activity.docente}</span>}
                      {activity.fecha && (
                        <>
                          {activity.docente && <span>•</span>}
                          <span>{activity.fecha}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
    </div>
  )
}

export default Dashboard
