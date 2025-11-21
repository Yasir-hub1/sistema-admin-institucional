import React from 'react'
import { Link } from 'react-router-dom'
import { 
  GraduationCap, 
  BookOpen, 
  Users, 
  Award, 
  Building2, 
  Target,
  ArrowRight,
  CheckCircle,
  Facebook,
  Mail,
  Phone,
  MapPin
} from 'lucide-react'

const Home = () => {
  const programas = [
    {
      id: 1,
      nombre: 'Programa de Capacitación',
      descripcion: 'Programas especializados para el desarrollo profesional',
      icon: <GraduationCap className="h-8 w-8" />
    },
    {
      id: 2,
      nombre: 'Cursos Técnicos',
      descripcion: 'Formación técnica de alta calidad',
      icon: <BookOpen className="h-8 w-8" />
    },
    {
      id: 3,
      nombre: 'Diplomados',
      descripcion: 'Programas de diplomado especializados',
      icon: <Award className="h-8 w-8" />
    }
  ]

  const beneficios = [
    'Certificación reconocida',
    'Docentes altamente calificados',
    'Instalaciones modernas',
    'Flexibilidad horaria',
    'Bolsa de trabajo',
    'Seguimiento personalizado'
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header/Navbar */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-2 rounded-lg">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">ICAP</h1>
              <p className="text-xs text-gray-600">UAGRM - Oficial SCZ</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <a 
              href="https://www.facebook.com/p/ICAP-UAGRM-Oficial-SCZ-100083936572455/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Facebook className="h-6 w-6" />
            </a>
            <Link 
              to="/portales" 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Acceder a Portales
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-6">
              <Building2 className="h-16 w-16 mx-auto mb-4" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Instituto de Capacitación
            </h1>
            <h2 className="text-3xl md:text-4xl font-semibold mb-4">
              ICAP - UAGRM
            </h2>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Formación profesional de excelencia para tu futuro
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/portales"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
              >
                Ver Programas
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/portales"
                className="bg-blue-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-400 transition-colors border-2 border-white"
              >
                Iniciar Sesión
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Sobre ICAP */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Sobre Nosotros
              </h2>
              <div className="w-24 h-1 bg-blue-600 mx-auto"></div>
            </div>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  Nuestra Misión
                </h3>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  El Instituto de Capacitación (ICAP) de la Universidad Autónoma Gabriel René Moreno 
                  tiene como misión proporcionar formación profesional de alta calidad, desarrollando 
                  competencias técnicas y profesionales que contribuyan al crecimiento personal y 
                  profesional de nuestros estudiantes.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Nos comprometemos a ofrecer programas educativos innovadores, con docentes 
                  altamente calificados y un enfoque práctico que prepare a nuestros estudiantes 
                  para los desafíos del mercado laboral actual.
                </p>
              </div>
              <div className="bg-white p-8 rounded-lg shadow-lg">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Target className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Visión</h4>
                      <p className="text-gray-700 text-sm">
                        Ser el instituto de referencia en formación profesional en Bolivia
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Award className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Valores</h4>
                      <p className="text-gray-700 text-sm">
                        Excelencia, compromiso, innovación y responsabilidad social
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Programas */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Nuestros Programas
            </h2>
            <p className="text-xl text-gray-600">
              Ofertas académicas diseñadas para tu crecimiento profesional
            </p>
            <div className="w-24 h-1 bg-blue-600 mx-auto mt-4"></div>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {programas.map((programa) => (
              <div
                key={programa.id}
                className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:shadow-xl transition-shadow hover:border-blue-500"
              >
                <div className="text-blue-600 mb-4">{programa.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {programa.nombre}
                </h3>
                <p className="text-gray-600 mb-4">{programa.descripcion}</p>
                <Link
                  to="/portales"
                  className="text-blue-600 font-medium hover:text-blue-700 flex items-center gap-2"
                >
                  Más información
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                ¿Por qué elegir ICAP?
              </h2>
              <div className="w-24 h-1 bg-blue-600 mx-auto"></div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {beneficios.map((beneficio, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-4 bg-white p-4 rounded-lg shadow-sm"
                >
                  <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                  <p className="text-gray-700 font-medium">{beneficio}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contacto */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Contáctanos</h2>
              <div className="w-24 h-1 bg-blue-500 mx-auto"></div>
            </div>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <MapPin className="h-8 w-8 mx-auto mb-4 text-blue-400" />
                <h3 className="font-semibold mb-2">Ubicación</h3>
                <p className="text-gray-400">
                  Universidad Autónoma Gabriel René Moreno<br />
                  Santa Cruz, Bolivia
                </p>
              </div>
              <div>
                <Phone className="h-8 w-8 mx-auto mb-4 text-blue-400" />
                <h3 className="font-semibold mb-2">Teléfono</h3>
                <p className="text-gray-400">Consultar en oficinas</p>
              </div>
              <div>
                <Mail className="h-8 w-8 mx-auto mb-4 text-blue-400" />
                <h3 className="font-semibold mb-2">Email</h3>
                <p className="text-gray-400">icap@uagrm.edu.bo</p>
              </div>
            </div>
            <div className="mt-12 text-center">
              <a
                href="https://www.facebook.com/p/ICAP-UAGRM-Oficial-SCZ-100083936572455/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-600 px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Facebook className="h-5 w-5" />
                Síguenos en Facebook
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-2">
            © {new Date().getFullYear()} ICAP - UAGRM. Todos los derechos reservados.
          </p>
          <p className="text-sm">
            Instituto de Capacitación - Universidad Autónoma Gabriel René Moreno
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Home

