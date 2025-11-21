import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { 
  GraduationCap, 
  BookOpen, 
  FileText,
  CreditCard,
  Award,
  TrendingUp
} from 'lucide-react'
import Layout from '../components/layout/Layout'

const DashboardEstudiante = () => {
  const { user } = useAuth()

  const stats = [
    {
      title: 'Mis Materias',
      value: '8',
      icon: <BookOpen className="h-8 w-8" />,
      color: 'bg-blue-500',
      link: '/estudiante/materias'
    },
    {
      title: 'Calificaciones',
      value: 'Ver',
      icon: <Award className="h-8 w-8" />,
      color: 'bg-green-500',
      link: '/estudiante/notas'
    },
    {
      title: 'Documentos',
      value: '3',
      icon: <FileText className="h-8 w-8" />,
      color: 'bg-yellow-500',
      link: '/estudiante/documentos'
    },
    {
      title: 'Pagos',
      value: 'Pendiente',
      icon: <CreditCard className="h-8 w-8" />,
      color: 'bg-purple-500',
      link: '/estudiante/pagos'
    }
  ]

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">
            Bienvenido, {user?.nombre || 'Estudiante'}
          </h1>
          <p className="text-green-100">
            Portal del Estudiante - ICAP UAGRM
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
              <BookOpen className="h-6 w-6 text-green-600" />
              Accesos Rápidos
            </h2>
            <div className="space-y-3">
              <a
                href="/estudiante/materias"
                className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="font-medium text-gray-900">Mis Materias</span>
                <p className="text-sm text-gray-600">Consulta tus materias inscritas</p>
              </a>
              <a
                href="/estudiante/notas"
                className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="font-medium text-gray-900">Mis Calificaciones</span>
                <p className="text-sm text-gray-600">Revisa tus notas y promedios</p>
              </a>
              <a
                href="/estudiante/documentos"
                className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="font-medium text-gray-900">Mis Documentos</span>
                <p className="text-sm text-gray-600">Gestiona tus documentos</p>
              </a>
              <a
                href="/estudiante/pagos"
                className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="font-medium text-gray-900">Mis Pagos</span>
                <p className="text-sm text-gray-600">Consulta y realiza pagos</p>
              </a>
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
    </Layout>
  )
}

export default DashboardEstudiante

