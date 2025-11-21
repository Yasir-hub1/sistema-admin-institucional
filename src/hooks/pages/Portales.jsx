import React from 'react'
import { Link } from 'react-router-dom'
import { 
  GraduationCap, 
  User, 
  Shield,
  ArrowRight,
  BookOpen,
  Users,
  Award
} from 'lucide-react'

const Portales = () => {
  const portales = [
    {
      id: 'estudiante',
      titulo: 'Portal del Estudiante',
      descripcion: 'Accede a tus materias, calificaciones, documentos y pagos',
      icon: <GraduationCap className="h-12 w-12" />,
      color: 'from-green-500 to-green-600',
      hoverColor: 'hover:from-green-600 hover:to-green-700',
      link: '/estudiante/login',
      features: [
        'Consulta tus materias',
        'Revisa tus calificaciones',
        'Gestiona tus documentos',
        'Realiza pagos en línea'
      ]
    },
    {
      id: 'docente',
      titulo: 'Portal del Docente',
      descripcion: 'Administra tus grupos, estudiantes y calificaciones',
      icon: <User className="h-12 w-12" />,
      color: 'from-blue-500 to-blue-600',
      hoverColor: 'hover:from-blue-600 hover:to-blue-700',
      link: '/docente/login',
      features: [
        'Gestiona tus grupos',
        'Registra calificaciones',
        'Control de asistencias',
        'Reportes académicos'
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-2 rounded-lg">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">ICAP</h1>
              <p className="text-xs text-gray-600">UAGRM - Oficial SCZ</p>
            </div>
          </Link>
          <Link 
            to="/" 
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            Volver al inicio
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Acceso a Portales
            </h1>
            <p className="text-xl text-gray-600 mb-2">
              Selecciona el portal correspondiente a tu rol
            </p>
            <div className="w-24 h-1 bg-blue-600 mx-auto"></div>
          </div>

          {/* Cards de Portales */}
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
            {portales.map((portal) => (
              <div
                key={portal.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow"
              >
                <div className={`bg-gradient-to-br ${portal.color} ${portal.hoverColor} p-8 text-white`}>
                  <div className="mb-4">{portal.icon}</div>
                  <h2 className="text-2xl font-bold mb-2">{portal.titulo}</h2>
                  <p className="text-blue-100">{portal.descripcion}</p>
                </div>
                <div className="p-6">
                  <ul className="space-y-3 mb-6">
                    {portal.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-gray-700">
                        <Award className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    to={portal.link}
                    className={`block w-full bg-gradient-to-r ${portal.color} text-white text-center py-3 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2`}
                  >
                    Acceder
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Información adicional */}
          <div className="max-w-4xl mx-auto bg-blue-50 rounded-xl p-8 border-2 border-blue-100">
            <div className="flex items-start space-x-4">
              <Shield className="h-8 w-8 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Portal de Administración
                </h3>
                <p className="text-gray-700 mb-4">
                  El portal de administración es de acceso restringido y solo está disponible 
                  para personal autorizado. Si eres administrador, contacta con el equipo técnico 
                  para obtener acceso.
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Nota:</strong> El acceso al portal de administración se realiza 
                  únicamente mediante enlace directo proporcionado por el administrador del sistema.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">
            © {new Date().getFullYear()} ICAP - UAGRM. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Portales

