import React, { useState, useEffect } from 'react'
import { Upload, FileText, CheckCircle, XCircle, Clock, Download } from 'lucide-react'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'
import { estudianteDocumentoService } from '../../services/documentoService'

const MisDocumentos = () => {
  const [documentos, setDocumentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState({})

  useEffect(() => {
    fetchDocumentos()
  }, [])

  const fetchDocumentos = async () => {
    try {
      setLoading(true)
      const response = await estudianteDocumentoService.getMisDocumentos()
      
      if (response.success) {
        setDocumentos(response.data || [])
      } else {
        toast.error(response.message || 'Error al cargar documentos')
        setDocumentos([])
      }
    } catch (error) {
      toast.error('Error de conexión')
      setDocumentos([])
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = async (tipoDocumentoId, event) => {
    const file = event.target.files[0]
    if (!file) return

    // Validar tipo de archivo
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Solo se permiten archivos PDF, JPG, JPEG o PNG')
      return
    }

    // Validar tamaño (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo no debe exceder 10MB')
      return
    }

    try {
      setUploading({ ...uploading, [tipoDocumentoId]: true })
      const response = await estudianteDocumentoService.subirDocumento(tipoDocumentoId, file)
      
      if (response.success) {
        toast.success(response.message || 'Documento subido exitosamente')
        await fetchDocumentos()
      } else {
        toast.error(response.message || 'Error al subir documento')
        if (response.errors) {
          Object.keys(response.errors).forEach(key => {
            toast.error(`${key}: ${response.errors[key]}`)
          })
        }
      }
    } catch (error) {
      toast.error('Error al subir documento')
    } finally {
      setUploading({ ...uploading, [tipoDocumentoId]: false })
      // Limpiar el input
      event.target.value = ''
    }
  }

  const getEstadoBadge = (estado) => {
    const estados = {
      '0': { label: 'Pendiente de Revisión', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      '1': { label: 'Aprobado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      '2': { label: 'Rechazado', color: 'bg-red-100 text-red-800', icon: XCircle },
      null: { label: 'No Subido', color: 'bg-gray-100 text-gray-800', icon: FileText }
    }
    const estadoInfo = estados[estado] || estados[null]
    const Icon = estadoInfo.icon
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${estadoInfo.color}`}>
        <Icon className="h-4 w-4" />
        {estadoInfo.label}
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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center shadow-glow">
          <FileText className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold gradient-text">Mis Documentos</h1>
          <p className="text-gray-600 dark:text-gray-400">Sube y gestiona tus documentos académicos</p>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="gradient" shadow="glow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Total Documentos</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{documentos.length}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-glow">
              <FileText className="h-6 w-6 text-white" />
            </div>
          </div>
        </Card>
        <Card className="gradient" shadow="glow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Aprobados</p>
              <p className="text-3xl font-bold text-green-600">
                {documentos.filter(d => d.estado === '1').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-glow">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
          </div>
        </Card>
        <Card className="gradient" shadow="glow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Pendientes</p>
              <p className="text-3xl font-bold text-yellow-600">
                {documentos.filter(d => d.estado === '0' || d.estado === null).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-glow">
              <Clock className="h-6 w-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Lista de Documentos */}
      <Card className="gradient" shadow="glow-lg">
        <h3 className="text-xl font-bold gradient-text mb-6">Documentos Requeridos</h3>
        <div className="space-y-4">
          {documentos.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No hay documentos requeridos
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Contacta con el administrador para más información
              </p>
            </div>
          ) : (
            documentos.map((doc, idx) => (
              <div
                key={idx}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {doc.nombre_entidad}
                      </h4>
                      {getEstadoBadge(doc.estado)}
                    </div>
                    
                    {doc.version && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Versión: {doc.version}
                      </p>
                    )}
                    
                    {doc.observaciones && (
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Observaciones:
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {doc.observaciones}
                        </p>
                      </div>
                    )}
                    
                    {doc.fecha_subida && (
                      <p className="text-xs text-gray-500 mt-2">
                        Subido: {new Date(doc.fecha_subida).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end gap-3 ml-4">
                    {doc.url_descarga && (
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Download className="h-4 w-4" />}
                        onClick={() => window.open(doc.url_descarga, '_blank')}
                      >
                        Ver Documento
                      </Button>
                    )}
                    
                    <div className="relative">
                      <input
                        type="file"
                        id={`file-${doc.tipo_documento_id}`}
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange(doc.tipo_documento_id, e)}
                        className="hidden"
                        disabled={uploading[doc.tipo_documento_id]}
                      />
                      <label htmlFor={`file-${doc.tipo_documento_id}`}>
                        <Button
                          variant="primary"
                          size="sm"
                          icon={<Upload className="h-4 w-4" />}
                          disabled={uploading[doc.tipo_documento_id]}
                          as="span"
                        >
                          {uploading[doc.tipo_documento_id] ? 'Subiendo...' : doc.documento_id ? 'Reemplazar' : 'Subir Documento'}
                        </Button>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Información */}
      <Card className="gradient" shadow="glow-lg">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Información Importante
        </h3>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li>• Los documentos deben estar en formato PDF, JPG, JPEG o PNG</li>
          <li>• El tamaño máximo por archivo es de 10MB</li>
          <li>• Una vez subido, el documento será revisado por el administrador</li>
          <li>• Si un documento es rechazado, podrás subir una nueva versión</li>
          <li>• Solo los estudiantes con todos los documentos aprobados podrán inscribirse</li>
        </ul>
      </Card>
    </div>
  )
}

export default MisDocumentos

