import React, { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { get } from '../../services/api'
import { FileText, Upload, CheckCircle, XCircle, Clock, Printer, Eye, AlertCircle, RefreshCw } from 'lucide-react'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import UploadDocumentModal from '../../components/estudiante/UploadDocumentModal'
import DocumentPreviewModal from '../../components/estudiante/DocumentPreviewModal'
import toast from 'react-hot-toast'

const Documentos = () => {
  const { user } = useAuth()
  const [documentos, setDocumentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [documentoSeleccionado, setDocumentoSeleccionado] = useState(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [documentoPreview, setDocumentoPreview] = useState(null)

  useEffect(() => {
    const fetchDocumentos = async () => {
      try {
        setLoading(true)
        const response = await get('/estudiante/documentos')
        
        console.log('📄 Respuesta de documentos:', response.data)
        
        if (response.data.success) {
          // El backend retorna: { success: true, data: [...] }
          let documentosData = []
          
          if (response.data.data) {
            // Si es un array directo
            if (Array.isArray(response.data.data)) {
              documentosData = response.data.data
            }
            // Si tiene la propiedad documentos dentro de data
            else if (response.data.data.documentos && Array.isArray(response.data.data.documentos)) {
              documentosData = response.data.data.documentos
            }
          } 
          // Fallback: buscar directamente en response.data
          else if (response.data.documentos && Array.isArray(response.data.documentos)) {
            documentosData = response.data.documentos
          }
          
          // Asegurar que siempre sea un array
          if (!Array.isArray(documentosData)) {
            console.warn('⚠️ documentosData no es un array:', documentosData)
            documentosData = []
          }
          
          setDocumentos(documentosData)
        } else {
          setError('No se pudieron cargar los documentos')
          setDocumentos([])
        }
      } catch (error) {
        console.error('Error cargando documentos:', error)
        setError('Error al cargar los documentos')
        setDocumentos([])
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchDocumentos()
    }
  }, [user])

  const getEstadoBadge = (estado) => {
    // El backend devuelve estado como string: "0" = pendiente, "1" = aprobado, "2" = rechazado
    switch (estado) {
      case '1':
      case 1:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircle className="h-4 w-4" />
            Aprobado
          </span>
        )
      case '2':
      case 2:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
            <XCircle className="h-4 w-4" />
            Rechazado
          </span>
        )
      case '0':
      case 0:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
            <Clock className="h-4 w-4" />
            Pendiente
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
            <AlertCircle className="h-4 w-4" />
            No subido
          </span>
        )
    }
  }

  const handleUploadSuccess = async () => {
    // Recargar documentos después de subir
    try {
      const response = await get('/estudiante/documentos')
      if (response.data.success && Array.isArray(response.data.data)) {
        setDocumentos(response.data.data)
        toast.success('Documento subido exitosamente')
      }
    } catch (error) {
      console.error('Error recargando documentos:', error)
    }
    setShowUploadModal(false)
    setDocumentoSeleccionado(null)
  }

  const handleSubirDocumento = (doc) => {
    setDocumentoSeleccionado(doc)
    setShowUploadModal(true)
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

    // Para imágenes, crear una ventana de impresión
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
                  body { margin: 0; padding: 0; }
                  img { max-width: 100%; height: auto; page-break-inside: avoid; }
                }
                body { margin: 20px; text-align: center; }
                img { max-width: 100%; height: auto; }
              </style>
            </head>
            <body>
              <img src="${url}" alt="${nombreArchivo}" onload="setTimeout(() => { window.print(); }, 500);" />
            </body>
          </html>
        `)
        printWindow.document.close()
      }
    } else if (esPDF) {
      // Para PDFs, abrir en nueva ventana y luego imprimir
      const printWindow = window.open(url, '_blank')
      if (printWindow) {
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print()
          }, 500)
        }
      }
    } else {
      // Para otros tipos, intentar abrir y imprimir
      const printWindow = window.open(url, '_blank')
      if (printWindow) {
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print()
          }, 500)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <FileText className="h-8 w-8" />
              Mis Documentos
            </h1>
            <p className="text-green-100">
              Gestiona y consulta tus documentos académicos
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => setShowUploadModal(true)}
            className="bg-white text-green-700 hover:bg-green-50"
          >
            <Upload className="h-5 w-5 mr-2" />
            Subir Documento
          </Button>
        </div>
      </div>

      {/* Lista de Documentos */}
      {!Array.isArray(documentos) || documentos.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No tienes documentos subidos
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Sube tus documentos académicos para que sean validados
            </p>
            <Button
              variant="primary"
              onClick={() => setShowUploadModal(true)}
            >
              <Upload className="h-5 w-5 mr-2" />
              Subir Primer Documento
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6">
          {Array.isArray(documentos) && documentos.map((doc, index) => {
            const tieneDocumento = doc.documento_id !== null && doc.documento_id !== undefined
            const esOpcional = doc.nombre_entidad?.toLowerCase().includes('título') || 
                             doc.nombre_entidad?.toLowerCase().includes('bachiller')
            const urlCompleta = getDocumentoUrl(doc.url_descarga)
            
            return (
              <Card key={doc.tipo_documento_id || index} className="hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                          {doc.nombre_entidad || doc.nombre || 'Documento'}
                        </h3>
                        {esOpcional && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded-full">
                            Opcional
                          </span>
                        )}
                      </div>
                      
                      {doc.version && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Versión: {doc.version}
                        </p>
                      )}
                      
                      {doc.fecha_subida && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Subido el {new Date(doc.fecha_subida).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      )}
                      
                      {!tieneDocumento && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                          Este documento aún no ha sido subido
                        </p>
                      )}
                    </div>
                    <div className="ml-4">
                      {getEstadoBadge(doc.estado)}
                    </div>
                  </div>

                  {doc.observaciones && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Observaciones:
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {doc.observaciones}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    {tieneDocumento && urlCompleta ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleVerDocumento(doc)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleImprimir(doc)}
                        >
                          <Printer className="h-4 w-4 mr-2" />
                          Imprimir
                        </Button>
                        {(doc.estado === '2' || doc.estado === '0' || doc.estado === 2 || doc.estado === 0) && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleSubirDocumento(doc)}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Re-subir
                          </Button>
                        )}
                      </>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleSubirDocumento(doc)}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Subir Documento
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal de Subida de Documentos */}
      <UploadDocumentModal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false)
          setDocumentoSeleccionado(null)
        }}
        tiposDocumento={documentos.map(doc => ({
          tipo_documento_id: doc.tipo_documento_id,
          nombre: doc.nombre_entidad || doc.nombre,
          nombre_entidad: doc.nombre_entidad || doc.nombre,
          requerido: !(doc.nombre_entidad?.toLowerCase().includes('título') || 
                      doc.nombre_entidad?.toLowerCase().includes('bachiller'))
        }))}
        tipoDocumentoSeleccionado={documentoSeleccionado?.tipo_documento_id}
        onSuccess={handleUploadSuccess}
      />

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

export default Documentos

