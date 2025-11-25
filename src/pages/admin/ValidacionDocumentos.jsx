import React, { useState, useEffect } from 'react'
import { FileCheck, Search, CheckCircle, XCircle, Eye, Download, FileText } from 'lucide-react'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Modal from '../../components/common/Modal'
import Table from '../../components/common/Table'
import Card from '../../components/common/Card'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import DocumentPreviewModal from '../../components/admin/DocumentPreviewModal'
import toast from 'react-hot-toast'
import { validacionDocumentoService } from '../../services/documentoService'

const ValidacionDocumentos = () => {
  const [estudiantes, setEstudiantes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [showDocumentosModal, setShowDocumentosModal] = useState(false)
  const [selectedEstudiante, setSelectedEstudiante] = useState(null)
  const [documentos, setDocumentos] = useState([])
  const [loadingDocumentos, setLoadingDocumentos] = useState(false)
  const [showRechazarModal, setShowRechazarModal] = useState(false)
  const [documentoRechazar, setDocumentoRechazar] = useState(null)
  const [motivoRechazo, setMotivoRechazo] = useState('')
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [documentoPreview, setDocumentoPreview] = useState(null)

  useEffect(() => {
    fetchEstudiantes()
  }, [currentPage, perPage, searchTerm])

  const fetchEstudiantes = async () => {
    try {
      setLoading(true)
      const response = await validacionDocumentoService.getEstudiantesPendientes({
        page: currentPage,
        per_page: perPage,
        search: searchTerm
      })
      
      if (response.success && response.data) {
        setEstudiantes(response.data.data || [])
        setTotalPages(response.data.last_page || 1)
      } else {
        toast.error(response.message || 'Error al cargar estudiantes')
        setEstudiantes([])
        setTotalPages(1)
      }
    } catch (error) {
      toast.error('Error de conexión')
      setEstudiantes([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  const handleVerDocumentos = async (estudiante) => {
    try {
      setLoadingDocumentos(true)
      setSelectedEstudiante(estudiante)
      const response = await validacionDocumentoService.getDocumentosEstudiante(estudiante.id)
      
      if (response.success) {
        setDocumentos(response.data.documentos || [])
        setShowDocumentosModal(true)
      } else {
        toast.error(response.message || 'Error al cargar documentos')
      }
    } catch (error) {
      toast.error('Error al cargar documentos')
    } finally {
      setLoadingDocumentos(false)
    }
  }

  const handleAprobar = async (documentoId, observaciones = '') => {
    try {
      setLoadingDocumentos(true)
      const response = await validacionDocumentoService.aprobarDocumento(documentoId, observaciones)
      
      if (response.success) {
        toast.success(response.message || 'Documento aprobado exitosamente')
        setShowPreviewModal(false)
        setDocumentoPreview(null)
        if (selectedEstudiante) {
          await handleVerDocumentos(selectedEstudiante)
        }
        await fetchEstudiantes()
      } else {
        toast.error(response.message || 'Error al aprobar documento')
      }
    } catch (error) {
      toast.error('Error al aprobar documento')
    } finally {
      setLoadingDocumentos(false)
    }
  }

  const handleRechazarDesdePreview = async (documentoId, motivo) => {
    try {
      setLoadingDocumentos(true)
      const response = await validacionDocumentoService.rechazarDocumento(documentoId, motivo)
      
      if (response.success) {
        toast.success(response.message || 'Documento rechazado exitosamente')
        setShowPreviewModal(false)
        setDocumentoPreview(null)
        if (selectedEstudiante) {
          await handleVerDocumentos(selectedEstudiante)
        }
        await fetchEstudiantes()
      } else {
        toast.error(response.message || 'Error al rechazar documento')
      }
    } catch (error) {
      toast.error('Error al rechazar documento')
    } finally {
      setLoadingDocumentos(false)
    }
  }

  const handleVerPreview = (doc) => {
    setDocumentoPreview(doc)
    setShowPreviewModal(true)
  }

  const handleRechazar = async () => {
    if (!motivoRechazo || motivoRechazo.length < 10) {
      toast.error('El motivo del rechazo debe tener al menos 10 caracteres')
      return
    }

    try {
      setLoadingDocumentos(true)
      const response = await validacionDocumentoService.rechazarDocumento(documentoRechazar.id, motivoRechazo)
      
      if (response.success) {
        toast.success(response.message || 'Documento rechazado exitosamente')
        setShowRechazarModal(false)
        setMotivoRechazo('')
        setDocumentoRechazar(null)
        if (selectedEstudiante) {
          await handleVerDocumentos(selectedEstudiante)
        }
        await fetchEstudiantes()
      } else {
        toast.error(response.message || 'Error al rechazar documento')
      }
    } catch (error) {
      toast.error('Error al rechazar documento')
    } finally {
      setLoadingDocumentos(false)
    }
  }

  const handleAprobarTodos = async (estudianteId) => {
    if (!window.confirm('¿Estás seguro de aprobar todos los documentos de este estudiante?')) return

    try {
      setLoading(true)
      const response = await validacionDocumentoService.aprobarTodos(estudianteId)
      
      if (response.success) {
        toast.success(response.message || 'Todos los documentos aprobados exitosamente')
        await fetchEstudiantes()
        if (selectedEstudiante && selectedEstudiante.id === estudianteId) {
          setShowDocumentosModal(false)
        }
      } else {
        toast.error(response.message || 'Error al aprobar documentos')
      }
    } catch (error) {
      toast.error('Error al aprobar documentos')
    } finally {
      setLoading(false)
    }
  }

  const getEstadoBadge = (estado) => {
    const estados = {
      '0': { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: FileText },
      '1': { label: 'Aprobado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      '2': { label: 'Rechazado', color: 'bg-red-100 text-red-800', icon: XCircle }
    }
    const estadoInfo = estados[estado] || estados['0']
    const Icon = estadoInfo.icon
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${estadoInfo.color}`}>
        <Icon className="h-3 w-3" />
        {estadoInfo.label}
      </span>
    )
  }

  const columns = [
    {
      key: 'nombre',
      label: 'Estudiante',
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {row.nombre} {row.apellido}
          </div>
          <div className="text-sm text-gray-500">CI: {row.ci}</div>
          <div className="text-sm text-gray-500">Registro: {row.registro_estudiante}</div>
        </div>
      )
    },
    {
      key: 'documentos_pendientes',
      label: 'Documentos Pendientes',
      render: (row) => (
        <span className="font-medium text-yellow-600 dark:text-yellow-400">
          {row.documentos_pendientes || 0}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (row) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            icon={<Eye className="h-4 w-4" />}
            onClick={() => handleVerDocumentos(row)}
          >
            Ver Documentos
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<CheckCircle className="h-4 w-4" />}
            onClick={() => handleAprobarTodos(row.id)}
          >
            Aprobar Todos
          </Button>
        </div>
      )
    }
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center shadow-glow">
          <FileCheck className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold gradient-text">Validación de Documentos</h1>
          <p className="text-gray-600 dark:text-gray-400">Revisa y aprueba documentos de estudiantes</p>
        </div>
      </div>

      <Card className="gradient" shadow="glow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h3 className="text-xl font-bold gradient-text mb-4 sm:mb-0">Estudiantes con Documentos Pendientes</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar estudiantes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
        </div>
        
        <Table
          columns={columns}
          data={estudiantes}
          loading={loading}
          pagination={{
            currentPage,
            totalPages,
            perPage,
            onPageChange: setCurrentPage,
            onPerPageChange: setPerPage
          }}
        />
      </Card>

      {/* Modal de Documentos */}
      <Modal
        isOpen={showDocumentosModal}
        onClose={() => {
          setShowDocumentosModal(false)
          setSelectedEstudiante(null)
          setDocumentos([])
        }}
        title={selectedEstudiante ? `Documentos de ${selectedEstudiante.nombre} ${selectedEstudiante.apellido}` : 'Documentos'}
        size="xl"
      >
        {loadingDocumentos ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="space-y-6">
            {documentos.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  No hay documentos para este estudiante
                </p>
              </div>
            ) : (
              documentos.map((grupo, idx) => (
                <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-lg mb-4">{grupo.tipo_documento?.nombre_entidad || 'Documento'}</h4>
                  <div className="space-y-3">
                    {grupo.versiones?.map((doc, docIdx) => (
                      <div key={docIdx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {getEstadoBadge(doc.estado)}
                            <span className="text-sm text-gray-600 dark:text-gray-400">Versión {doc.version}</span>
                          </div>
                          {doc.observaciones && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">{doc.observaciones}</p>
                          )}
                          {doc.fecha_subida && (
                            <p className="text-xs text-gray-500">Subido: {new Date(doc.fecha_subida).toLocaleDateString()}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {doc.url_descarga && (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Eye className="h-4 w-4" />}
                              onClick={() => handleVerPreview(doc)}
                              title="Ver documento en vista previa"
                            >
                              Ver
                            </Button>
                          )}
                          {doc.estado === '0' && (
                            <>
                              <Button
                                variant="primary"
                                size="sm"
                                icon={<CheckCircle className="h-4 w-4" />}
                                onClick={() => handleAprobar(doc.id)}
                                title="Aprobar documento"
                              >
                                Aprobar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                icon={<XCircle className="h-4 w-4" />}
                                onClick={() => {
                                  setDocumentoRechazar(doc)
                                  setShowRechazarModal(true)
                                }}
                                title="Rechazar documento"
                              >
                                Rechazar
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </Modal>

      {/* Modal de Rechazar */}
      <Modal
        isOpen={showRechazarModal}
        onClose={() => {
          setShowRechazarModal(false)
          setDocumentoRechazar(null)
          setMotivoRechazo('')
        }}
        title="Rechazar Documento"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Motivo del Rechazo *
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
              rows="4"
              value={motivoRechazo}
              onChange={(e) => setMotivoRechazo(e.target.value)}
              placeholder="Describe el motivo del rechazo (mínimo 10 caracteres)..."
            />
            <p className="text-xs text-gray-500 mt-1">{motivoRechazo.length}/500 caracteres</p>
          </div>
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={() => {
                setShowRechazarModal(false)
                setDocumentoRechazar(null)
                setMotivoRechazo('')
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              icon={<XCircle className="h-5 w-5" />}
              onClick={handleRechazar}
            >
              Rechazar Documento
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Vista Previa de Documento */}
      <DocumentPreviewModal
        isOpen={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false)
          setDocumentoPreview(null)
        }}
        documento={documentoPreview}
        estudiante={selectedEstudiante}
        onAprobar={handleAprobar}
        onRechazar={handleRechazarDesdePreview}
        loading={loadingDocumentos}
      />
    </div>
  )
}

export default ValidacionDocumentos

