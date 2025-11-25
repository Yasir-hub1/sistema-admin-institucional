import React, { useState, useEffect } from 'react'
import { Upload, FileText, CheckCircle, XCircle, Clock, Printer, Eye, RefreshCw } from 'lucide-react'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import DocumentPreviewModal from '../../components/estudiante/DocumentPreviewModal'
import toast from 'react-hot-toast'
import { estudianteDocumentoService } from '../../services/documentoService'

const MisDocumentos = () => {
  const [documentos, setDocumentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState({})
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [documentoPreview, setDocumentoPreview] = useState(null)

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
    const file = event.target.files?.[0]
    if (!file) {
      console.log('No se seleccionó ningún archivo')
      return
    }

    console.log('Archivo seleccionado:', {
      nombre: file.name,
      tipo: file.type,
      tamaño: file.size,
      tipoDocumentoId
    })

    // Validar tipo de archivo
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Solo se permiten archivos PDF, JPG, JPEG o PNG')
      event.target.value = ''
      return
    }

    // Validar tamaño (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo no debe exceder 10MB')
      event.target.value = ''
      return
    }

    try {
      setUploading(prev => ({ ...prev, [tipoDocumentoId]: true }))
      console.log('Iniciando subida de documento...', { tipoDocumentoId, fileName: file.name })
      
      const response = await estudianteDocumentoService.subirDocumento(tipoDocumentoId, file)
      
      console.log('Respuesta del servicio:', response)
      
      if (response.success) {
        toast.success(response.message || 'Documento subido exitosamente')
        await fetchDocumentos()
      } else {
        toast.error(response.message || 'Error al subir documento')
        if (response.errors) {
          Object.keys(response.errors).forEach(key => {
            const errorMsg = Array.isArray(response.errors[key]) 
              ? response.errors[key].join(', ') 
              : response.errors[key]
            toast.error(`${key}: ${errorMsg}`)
          })
        }
      }
    } catch (error) {
      console.error('Error al subir documento:', error)
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.errors?.archivo?.[0] ||
                          error.response?.data?.errors?.tipo_documento_id?.[0] ||
                          'Error al subir documento'
      toast.error(errorMessage)
    } finally {
      setUploading(prev => ({ ...prev, [tipoDocumentoId]: false }))
      // Limpiar el input para permitir subir el mismo archivo de nuevo
      if (event.target) {
        event.target.value = ''
      }
    }
  }

  const handleVerDocumento = (doc) => {
    setDocumentoPreview(doc)
    setShowPreviewModal(true)
  }

  const handleImprimir = (doc) => {
    const url = getDocumentoUrl(doc.url_descarga)
    if (!url) {
      toast.error('No hay archivo disponible para imprimir')
      return
    }

    const esImagen = /\.(jpg|jpeg|png|gif|webp)$/i.test(url)
    const esPDF = /\.pdf$/i.test(url)
    const nombreArchivo = doc.nombre_documento || doc.nombre_entidad || 'Documento'

    // Para imágenes, crear una ventana de impresión optimizada
    if (esImagen) {
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${nombreArchivo}</title>
              <style>
                @media print {
                  @page {
                    margin: 0.5cm;
                    size: auto;
                  }
                  body {
                    margin: 0;
                    padding: 0;
                  }
                  img {
                    max-width: 100%;
                    height: auto;
                    page-break-inside: avoid;
                    display: block;
                    margin: 0 auto;
                  }
                }
                @media screen {
                  body {
                    margin: 20px;
                    text-align: center;
                    background: #f5f5f5;
                  }
                  img {
                    max-width: 90%;
                    height: auto;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    border-radius: 8px;
                  }
                }
              </style>
            </head>
            <body>
              <img src="${url}" alt="${nombreArchivo}" onload="setTimeout(() => { window.print(); }, 500); window.onafterprint = function() { setTimeout(() => { window.close(); }, 100); }" />
            </body>
          </html>
        `)
        printWindow.document.close()
      }
    } else if (esPDF) {
      // Para PDFs, abrir en nueva ventana y luego imprimir
      const printWindow = window.open(url, '_blank')
      if (printWindow) {
        const checkLoaded = setInterval(() => {
          try {
            if (printWindow.document && printWindow.document.readyState === 'complete') {
              clearInterval(checkLoaded)
              setTimeout(() => {
                printWindow.print()
              }, 1000)
            }
          } catch (e) {
            clearInterval(checkLoaded)
            setTimeout(() => {
              printWindow.print()
            }, 2000)
          }
        }, 100)
        
        setTimeout(() => {
          clearInterval(checkLoaded)
          try {
            printWindow.print()
          } catch (e) {
            console.error('Error al imprimir PDF:', e)
          }
        }, 5000)
      }
    } else {
      const printWindow = window.open(url, '_blank')
      if (printWindow) {
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print()
          }, 1000)
        }
      }
    }
  }

  const getDocumentoUrl = (urlDescarga) => {
    if (!urlDescarga) return null
    // Si ya es una URL completa, usarla directamente
    if (urlDescarga.startsWith('http://') || urlDescarga.startsWith('https://')) {
      return urlDescarga
    }
    // Si es relativa, construir la URL completa
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    return `${apiUrl}${urlDescarga.startsWith('/') ? '' : '/'}${urlDescarga}`
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
                    {doc.url_descarga && doc.documento_id ? (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Eye className="h-4 w-4" />}
                          onClick={() => handleVerDocumento(doc)}
                        >
                          Ver
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Printer className="h-4 w-4" />}
                          onClick={() => handleImprimir(doc)}
                        >
                          Imprimir
                        </Button>
                      </div>
                    ) : null}
                    
                    <div className="relative">
                      <input
                        type="file"
                        id={`file-${doc.tipo_documento_id}`}
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange(doc.tipo_documento_id, e)}
                        className="hidden"
                        disabled={uploading[doc.tipo_documento_id]}
                      />
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={uploading[doc.tipo_documento_id]}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          const input = document.getElementById(`file-${doc.tipo_documento_id}`)
                          if (input && !uploading[doc.tipo_documento_id]) {
                            console.log('Haciendo click en input file:', `file-${doc.tipo_documento_id}`)
                            input.click()
                          } else {
                            console.warn('Input no encontrado o está deshabilitado:', {
                              input: !!input,
                              uploading: uploading[doc.tipo_documento_id],
                              tipoDocumentoId: doc.tipo_documento_id
                            })
                          }
                        }}
                        className="cursor-pointer"
                        type="button"
                      >
                        {uploading[doc.tipo_documento_id] ? (
                          <>
                            <span className="animate-spin mr-2 inline-block">⏳</span>
                            Subiendo...
                          </>
                        ) : doc.documento_id ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 inline-block" />
                            Reemplazar
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2 inline-block" />
                            Subir Documento
                          </>
                        )}
                      </Button>
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

      {/* Modal de Vista Previa de Documento */}
      <DocumentPreviewModal
        isOpen={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false)
          setDocumentoPreview(null)
        }}
        documento={documentoPreview}
      />
    </div>
  )
}

export default MisDocumentos

