import React, { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { get } from '../../services/api'
import { FileText, Upload, CheckCircle, XCircle, Clock, Download, Eye } from 'lucide-react'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'

const Documentos = () => {
  const { user } = useAuth()
  const [documentos, setDocumentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
    switch (estado?.toLowerCase()) {
      case 'aprobado':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-4 w-4" />
            Aprobado
          </span>
        )
      case 'rechazado':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="h-4 w-4" />
            Rechazado
          </span>
        )
      case 'pendiente':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="h-4 w-4" />
            Pendiente
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Sin estado
          </span>
        )
    }
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
            onClick={() => {/* TODO: Implementar modal de subida */}}
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No tienes documentos subidos
            </h3>
            <p className="text-gray-600 mb-4">
              Sube tus documentos académicos para que sean validados
            </p>
            <Button
              variant="primary"
              onClick={() => {/* TODO: Implementar modal de subida */}}
            >
              <Upload className="h-5 w-5 mr-2" />
              Subir Primer Documento
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6">
          {Array.isArray(documentos) && documentos.map((doc, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {doc.tipo_documento?.nombre || doc.tipo || 'Documento'}
                    </h3>
                    {doc.descripcion && (
                      <p className="text-gray-600 text-sm mb-2">
                        {doc.descripcion}
                      </p>
                    )}
                    {doc.fecha_subida && (
                      <p className="text-gray-500 text-xs">
                        Subido el {new Date(doc.fecha_subida).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  {getEstadoBadge(doc.estado)}
                </div>

                {doc.observaciones && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      <strong>Observaciones:</strong> {doc.observaciones}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-200">
                  {doc.archivo_url && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(doc.archivo_url, '_blank')}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const link = document.createElement('a')
                          link.href = doc.archivo_url
                          link.download = doc.nombre_archivo || 'documento'
                          link.click()
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Descargar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default Documentos

