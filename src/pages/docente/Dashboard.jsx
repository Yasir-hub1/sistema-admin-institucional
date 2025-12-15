import React, { useState, useEffect } from 'react'
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  Clock,
  TrendingUp,
  Award,
  CheckCircle,
  XCircle,
  AlertCircle,
  Bell,
  FileText
} from 'lucide-react'
import Card from '../../components/common/Card'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { docenteDashboardService } from '../../services/docenteService'
import { notificacionService } from '../../services/notificacionService'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [estadisticas, setEstadisticas] = useState(null)
  const [notificaciones, setNotificaciones] = useState([])
  const [noLeidas, setNoLeidas] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [statsResponse, notifResponse] = await Promise.all([
        docenteDashboardService.getEstadisticas(),
        notificacionService.getNotificaciones({ per_page: 5, leida: false })
      ])

      if (statsResponse.success) {
        setEstadisticas(statsResponse.data)
      }

      if (notifResponse.success) {
        setNotificaciones(notifResponse.data?.data || [])
        setNoLeidas(notifResponse.noLeidas || 0)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Error al cargar datos del dashboard')
    } finally {
      setLoading(false)
    }
  }

  const stats = estadisticas ? [
    {
      title: 'Mis Grupos',
      value: estadisticas.total_grupos || 0,
      subtitle: `${estadisticas.grupos_activos || 0} activos`,
      icon: <Users className="h-8 w-8" />,
      color: 'bg-blue-500',
      link: '/docente/grupos'
    },
    {
      title: 'Total Estudiantes',
      value: estadisticas.total_estudiantes || 0,
      subtitle: `${estadisticas.estudiantes_en_curso || 0} en curso`,
      icon: <GraduationCap className="h-8 w-8" />,
      color: 'bg-green-500',
      link: '/docente/grupos'
    },
    {
      title: 'Calificaciones Pendientes',
      value: estadisticas.calificaciones_pendientes || 0,
      subtitle: 'Sin nota registrada',
      icon: <BookOpen className="h-8 w-8" />,
      color: 'bg-yellow-500',
      link: '/docente/grupos'
    },
    {
      title: 'Estudiantes Aprobados',
      value: estadisticas.estudiantes_aprobados || 0,
      subtitle: `${estadisticas.estudiantes_reprobados || 0} reprobados`,
      icon: <CheckCircle className="h-8 w-8" />,
      color: 'bg-emerald-500',
      link: '/docente/grupos'
    }
  ] : []

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-glow">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              ¡Bienvenido, {user?.nombre || 'Docente'}!
            </h1>
            <p className="text-blue-100">
              Portal del Docente - Gestiona tus grupos y evaluaciones
            </p>
          </div>
          {noLeidas > 0 && (
            <button 
              onClick={() => navigate('/docente/notificaciones')}
              className="relative hover:scale-110 transition-transform"
            >
              <Bell className="h-8 w-8 text-white" />
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
                {noLeidas}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card
            key={index}
            className="gradient cursor-pointer hover:shadow-glow-lg transition-all duration-200"
            onClick={() => navigate(stat.link)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.color} p-3 rounded-lg text-white shadow-lg`}>
                {stat.icon}
              </div>
              <TrendingUp className="h-5 w-5 text-gray-400" />
            </div>
            <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">
              {stat.title}
            </h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              {stat.value}
            </p>
            {stat.subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {stat.subtitle}
              </p>
            )}
          </Card>
        ))}
      </div>

      {/* Notificaciones Recientes */}
      {notificaciones.length > 0 && (
        <Card className="gradient" shadow="glow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Bell className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              Notificaciones Recientes
            </h2>
            <button
              onClick={() => navigate('/docente/notificaciones')}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Ver todas
            </button>
          </div>
          <div className="space-y-3">
            {notificaciones.slice(0, 5).map((notif, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border-l-4 ${
                  notif.tipo === 'success' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' :
                  notif.tipo === 'error' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                  notif.tipo === 'warning' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' :
                  'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      {notif.titulo}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {notif.mensaje}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      {new Date(notif.fecha_envio || notif.created_at).toLocaleString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  {!notif.leida && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Accesos Rápidos */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="gradient" shadow="glow-lg">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            Accesos Rápidos
          </h2>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/docente/grupos')}
              className="w-full text-left p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl hover:shadow-lg transition-all duration-200 border border-blue-200 dark:border-blue-800"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <span className="font-semibold text-gray-900 dark:text-gray-100 block">Mis Grupos</span>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Ver grupos, horarios y estudiantes</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => navigate('/docente/grupos')}
              className="w-full text-left p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl hover:shadow-lg transition-all duration-200 border border-green-200 dark:border-green-800"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <span className="font-semibold text-gray-900 dark:text-gray-100 block">Registrar Calificaciones</span>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Subir notas y actualizar estados</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => navigate('/docente/notificaciones')}
              className="w-full text-left p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl hover:shadow-lg transition-all duration-200 border border-yellow-200 dark:border-yellow-800"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <Bell className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <span className="font-semibold text-gray-900 dark:text-gray-100 block">Mis Notificaciones</span>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Revisa avisos y mensajes del sistema</p>
                </div>
              </div>
            </button>
          </div>
        </Card>

        <Card className="gradient" shadow="glow-lg">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Award className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            Tu Información
          </h2>
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Rol</p>
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Docente</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Email</p>
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-all">{user?.email || 'No disponible'}</p>
            </div>
            <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-200 leading-relaxed">
                <strong>💡 Flujo de trabajo:</strong><br/>
                1. Revisa tus grupos asignados<br/>
                2. Accede a cada grupo para ver estudiantes<br/>
                3. Registra notas y actualiza estados<br/>
                4. Mantente al día con las notificaciones
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard
