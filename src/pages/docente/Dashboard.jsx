import React from 'react'
import Layout from '../../components/layout/Layout'
import { useAuth } from '../../contexts/AuthContext'
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  Clock,
  TrendingUp,
  Award
} from 'lucide-react'

const Dashboard = () => {
  const { user } = useAuth()

  const stats = [
    {
      title: 'Mis Grupos',
      value: '5',
      icon: <Users className="h-8 w-8" />,
      color: 'bg-blue-500',
      link: '/docente/grupos'
    },
    {
      title: 'Estudiantes',
      value: '120',
      icon: <GraduationCap className="h-8 w-8" />,
      color: 'bg-green-500',
      link: '/docente/estudiantes'
    },
    {
      title: 'Calificaciones Pendientes',
      value: '15',
      icon: <BookOpen className="h-8 w-8" />,
      color: 'bg-yellow-500',
      link: '/docente/notas'
    },
    {
      title: 'Asistencias',
      value: 'Hoy',
      icon: <Clock className="h-8 w-8" />,
      color: 'bg-purple-500',
      link: '/docente/asistencias'
    }
  ]

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">
            Bienvenido, {user?.nombre || 'Docente'}
          </h1>
          <p className="text-blue-100">
            Portal del Docente - ICAP UAGRM
          </p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => window.location.href = stat.link}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-lg text-white`}>
                  {stat.icon}
                </div>
                <TrendingUp className="h-5 w-5 text-gray-400" />
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">
                {stat.title}
              </h3>
              <p className="text-2xl font-bold text-gray-900">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Accesos Rápidos */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-blue-600" />
              Accesos Rápidos
            </h2>
            <div className="space-y-3">
              <a
                href="/docente/grupos"
                className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="font-medium text-gray-900">Mis Grupos</span>
                <p className="text-sm text-gray-600">Gestiona tus grupos asignados</p>
              </a>
              <a
                href="/docente/notas"
                className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="font-medium text-gray-900">Registrar Calificaciones</span>
                <p className="text-sm text-gray-600">Ingresa las notas de tus estudiantes</p>
              </a>
              <a
                href="/docente/asistencias"
                className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="font-medium text-gray-900">Control de Asistencias</span>
                <p className="text-sm text-gray-600">Registra y consulta asistencias</p>
              </a>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="h-6 w-6 text-yellow-600" />
              Información
            </h2>
            <div className="space-y-3 text-gray-700">
              <p className="text-sm">
                <strong>Rol:</strong> Docente
              </p>
              <p className="text-sm">
                <strong>Email:</strong> {user?.email || 'No disponible'}
              </p>
              <p className="text-sm">
                Desde este portal puedes gestionar todos los aspectos relacionados 
                con tus grupos y estudiantes asignados.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Dashboard

