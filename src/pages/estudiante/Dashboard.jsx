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
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Upload
} from 'lucide-react'
import { get } from '../../services/api'
import Alert from '../../components/common/Alert'
import UploadDocumentModal from '../../components/estudiante/UploadDocumentModal'
import DocumentCard from '../../components/estudiante/DocumentCard'
import toast from 'react-hot-toast'

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    materias: 0,
    notas: 0,
    documentos: 0,
    pagos: 0
  })
  const [alert, setAlert] = useState(null)
  const [documentosFaltantes, setDocumentosFaltantes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [tiposDocumento, setTiposDocumento] = useState([])
  const [documentosRequeridos, setDocumentosRequeridos] = useState([])
  const [estadoEstudiante, setEstadoEstudiante] = useState(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await get('/estudiante/dashboard')
        if (response.data.success) {
          const data = response.data.data || response.data
          setStats({
            materias: data.estadisticas?.grupos_activos || 0,
            notas: data.estadisticas?.grupos_con_notas || 0,
            documentos: data.estadisticas?.documentos_subidos || 0,
            pagos: data.estadisticas?.pagos_pendientes || 0
          })
          
          // Guardar estado del estudiante
          if (data.estudiante) {
            setEstadoEstudiante({
              estado_id: data.estudiante.estado_id,
              estado_nombre: data.estudiante.estado_nombre
            })
          }
          
          // Configurar alerta si existe
          if (data.alert) {
            setAlert(data.alert)
            if (data.alert.documentos_faltantes) {
              setDocumentosFaltantes(data.alert.documentos_faltantes)
            } else if (data.documentos?.faltantes) {
              setDocumentosFaltantes(data.documentos.faltantes.map(doc => doc.nombre))
            }
          }

          // Obtener documentos requeridos con su estado
          if (data.documentos?.requeridos) {
            const docs = data.documentos.requeridos.map(doc => {
              // Determinar si es opcional (solo Título de Bachiller)
              const esOpcional = doc.nombre?.toLowerCase().includes('título') || 
                               doc.nombre?.toLowerCase().includes('bachiller')
              return {
                tipo_documento_id: doc.tipo_documento_id,
                nombre: doc.nombre || 'Documento',
                nombre_entidad: doc.nombre,
                requerido: !esOpcional, // Título de Bachiller es opcional
                subido: doc.subido || false,
                estado: doc.estado || null,
                observaciones: doc.observaciones || null,
                fecha_subida: doc.fecha_subida || null
              }
            })
            setDocumentosRequeridos(docs)
            setTiposDocumento(docs)
          }
        }
      } catch (error) {
        console.error('Error cargando dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    const fetchTiposDocumento = async () => {
      try {
        const response = await get('/estudiante/documentos')
        if (response.data.success && response.data.data) {
          const documentos = Array.isArray(response.data.data) ? response.data.data : []
          setTiposDocumento(documentos.map(doc => ({
            tipo_documento_id: doc.tipo_documento_id,
            nombre: doc.nombre_entidad || doc.nombre || 'Documento',
            nombre_entidad: doc.nombre_entidad || doc.nombre,
            requerido: true
          })))
        }
      } catch (error) {
        console.error('Error cargando tipos de documento:', error)
      }
    }

    if (user) {
      fetchDashboardData()
      fetchTiposDocumento()
    }
  }, [user])

  const handleUploadSuccess = async () => {
    // Recargar datos del dashboard sin recargar toda la página
    setLoading(true)
    try {
      console.log('Recargando datos del dashboard después de subir documento...')
      const response = await get('/estudiante/dashboard')
      if (response.data.success) {
          const data = response.data.data || response.data
          console.log('Datos del dashboard recargados:', data)
          
          setStats({
            materias: data.estadisticas?.grupos_activos || 0,
            notas: data.estadisticas?.grupos_con_notas || 0,
            documentos: data.estadisticas?.documentos_subidos || 0,
            pagos: data.estadisticas?.pagos_pendientes || 0
          })
          
          // Guardar estado del estudiante
          if (data.estudiante) {
            setEstadoEstudiante({
              estado_id: data.estudiante.estado_id,
              estado_nombre: data.estudiante.estado_nombre
            })
          }
          
          if (data.alert) {
            setAlert(data.alert)
            if (data.alert.documentos_faltantes) {
              setDocumentosFaltantes(data.alert.documentos_faltantes)
            } else if (data.documentos?.faltantes) {
              setDocumentosFaltantes(data.documentos.faltantes.map(doc => doc.nombre))
            }
          }

        if (data.documentos?.requeridos) {
          const docs = data.documentos.requeridos.map(doc => {
            // Determinar si es opcional (solo Título de Bachiller)
            const esOpcional = doc.nombre?.toLowerCase().includes('título') || 
                             doc.nombre?.toLowerCase().includes('bachiller')
            return {
              tipo_documento_id: doc.tipo_documento_id,
              nombre: doc.nombre || 'Documento',
              nombre_entidad: doc.nombre,
              requerido: !esOpcional, // Título de Bachiller es opcional
              subido: doc.subido || false,
              estado: doc.estado || null,
              observaciones: doc.observaciones || null,
              fecha_subida: doc.fecha_subida || null
            }
          })
          console.log('Documentos actualizados:', docs)
          setDocumentosRequeridos(docs)
          setTiposDocumento(docs)
        }
      } else {
        console.error('Error en respuesta del dashboard:', response.data)
      }
    } catch (error) {
      console.error('Error recargando dashboard:', error)
      toast.error('Error al recargar los datos. Por favor, recarga la página.')
    } finally {
      setLoading(false)
    }
  }
  
  const getAlertIcon = (type) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-6 w-6" />
      case 'warning':
        return <AlertCircle className="h-6 w-6" />
      case 'success':
        return <CheckCircle className="h-6 w-6" />
      case 'info':
        return <Clock className="h-6 w-6" />
      default:
        return <AlertCircle className="h-6 w-6" />
    }
  }
  
  const getAlertColor = (type) => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

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

  // Verificar si el estudiante está activo (estado_id === 4)
  const estaActivo = estadoEstudiante?.estado_id === 4

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Bienvenido, {user?.nombre || user?.nombre_completo || `${user?.nombre || ''} ${user?.apellido || ''}`.trim() || 'Estudiante'}
              </h1>
              <p className="text-green-100">
                Portal del Estudiante - ICAP UAGRM
              </p>
            </div>
            {estaActivo && (
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/30">
                <CheckCircle className="h-6 w-6 text-white" />
                <div>
                  <p className="font-semibold text-sm">Cuenta Verificada</p>
                  <p className="text-xs text-green-100">Documentos Aprobados</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Banner de documentos aprobados - Muy visible */}
        {estaActivo && (
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg border-2 border-green-400">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
                  ¡Felicidades! Tu cuenta está activa
                </h3>
                <p className="text-lg mb-4 text-green-50">
                  Todos tus documentos han sido verificados y aprobados por el área administrativa. 
                  Ya puedes inscribirte a los programas disponibles.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate('/estudiante/inscripciones')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-green-600 rounded-lg font-semibold hover:bg-green-50 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Ver Programas Disponibles
                    <ArrowRight className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => navigate('/estudiante/documentos')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-white/30 transition-all border border-white/30"
                  >
                    Ver Mis Documentos
                    <FileText className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Alerta de documentos faltantes */}
        {alert && alert.type !== 'success' && (
          <div className={`rounded-lg border-2 p-6 ${getAlertColor(alert.type)}`}>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                {getAlertIcon(alert.type)}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-2">{alert.title}</h3>
                <p className="mb-4">{alert.message}</p>
                
                {/* Flujo de estados visual */}
                <div className="mb-4 p-4 bg-white/50 rounded-lg border border-gray-200">
                  <p className="text-sm font-semibold mb-3 text-gray-700">Tu progreso:</p>
                  <div className="flex items-center gap-2 text-xs">
                    <div className={`flex-1 p-2 rounded ${alert.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      <div className="font-medium">1. Subir Documentos</div>
                      <div className="text-xs opacity-75">Completa la documentación</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                    <div className="flex-1 p-2 rounded bg-gray-100 text-gray-600">
                      <div className="font-medium">2. Verificación</div>
                      <div className="text-xs opacity-75">Espera aprobación</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                    <div className="flex-1 p-2 rounded bg-gray-100 text-gray-600">
                      <div className="font-medium">3. Inscripción</div>
                      <div className="text-xs opacity-75">Elige tu programa</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                    <div className="flex-1 p-2 rounded bg-gray-100 text-gray-600">
                      <div className="font-medium">4. Pago</div>
                      <div className="text-xs opacity-75">Realiza el pago</div>
                    </div>
                  </div>
                </div>
                
                {documentosFaltantes && documentosFaltantes.length > 0 && (
                  <div className="mt-4">
                    <p className="font-semibold mb-2">Documentos que debes subir:</p>
                    <ul className="list-disc list-inside space-y-1 mb-4">
                      {documentosFaltantes.map((doc, index) => (
                        <li key={index} className="text-sm">{doc}</li>
                      ))}
                    </ul>
                    {alert.edad_minima && (
                      <p className="text-sm font-medium mb-3">{alert.edad_minima}</p>
                    )}
                  </div>
                )}
                
                {alert.progress !== undefined && (
                  <div className="mb-4">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${
                          alert.type === 'error' ? 'bg-red-600' : 'bg-yellow-600'
                        }`}
                        style={{ width: `${alert.progress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs mt-1">Progreso: {Math.round(alert.progress)}%</p>
                  </div>
                )}
                
                {alert.actions && alert.actions.includes('upload_documents') && (
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    <Upload className="h-5 w-5" />
                    Subir Documentos
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Alerta de éxito */}
        {alert && alert.type === 'success' && (
          <div className={`rounded-lg border-2 p-6 ${getAlertColor(alert.type)}`}>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                {getAlertIcon(alert.type)}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-2">{alert.title}</h3>
                <p className="mb-3">{alert.message}</p>
                {alert.actions && alert.actions.includes('view_programs') && (
                  <button
                    onClick={() => navigate('/estudiante/inscripciones')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors shadow-sm"
                  >
                    Ver Programas Disponibles
                    <ArrowRight className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

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

        {/* Sección de Subida de Documentos Individuales */}
        {(alert && alert.type !== 'success') && documentosRequeridos.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="h-6 w-6 text-green-600" />
                  Documentos Requeridos
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  Sube cada documento individualmente. Las imágenes se comprimirán automáticamente.
                </p>
              </div>
              {/* Contador de progreso */}
              <div className="text-right">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-sm font-semibold text-gray-700">
                    {documentosRequeridos.filter(d => d.subido && d.requerido).length} / {documentosRequeridos.filter(d => d.requerido).length} requeridos
                  </p>
                  <span className="text-xs text-gray-500">
                    ({Math.round((documentosRequeridos.filter(d => d.subido && d.requerido).length / documentosRequeridos.filter(d => d.requerido).length) * 100) || 0}%)
                  </span>
                </div>
                <div className="w-40 h-3 bg-gray-200 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500 flex items-center justify-center"
                    style={{ 
                      width: `${Math.min((documentosRequeridos.filter(d => d.subido && d.requerido).length / documentosRequeridos.filter(d => d.requerido).length) * 100, 100)}%` 
                    }}
                  >
                    {documentosRequeridos.filter(d => d.subido && d.requerido).length > 0 && (
                      <span className="text-xs font-bold text-white">
                        {Math.round((documentosRequeridos.filter(d => d.subido && d.requerido).length / documentosRequeridos.filter(d => d.requerido).length) * 100)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Grid de documentos individuales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {documentosRequeridos.map((doc) => (
                <DocumentCard
                  key={doc.tipo_documento_id}
                  documento={doc}
                  onUploadSuccess={handleUploadSuccess}
                />
              ))}
            </div>

            {/* Mensaje cuando todos los requeridos están subidos */}
            {documentosRequeridos.filter(d => d.requerido).length > 0 && 
             documentosRequeridos.filter(d => d.subido && d.requerido).length === documentosRequeridos.filter(d => d.requerido).length && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-5 w-5" />
                  <p className="font-medium">
                    ¡Todos los documentos requeridos han sido subidos! Tus documentos están siendo revisados por el área administrativa.
                  </p>
                </div>
                <p className="text-sm text-green-700 mt-2">
                  Serás notificado cuando tus documentos sean validados. Mientras tanto, puedes subir el Título de Bachiller si lo deseas (opcional).
                </p>
              </div>
            )}
          </div>
        )}

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

        {/* Modal de subida de documentos */}
        <UploadDocumentModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          tiposDocumento={tiposDocumento}
          onSuccess={handleUploadSuccess}
        />
    </div>
  )
}

export default Dashboard

