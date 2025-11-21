import React, { useState, useEffect, useCallback } from 'react'
import { CreditCard, Search, Filter, Eye, CheckCircle, XCircle, X, Check, AlertCircle, User, GraduationCap, Calendar, DollarSign, FileText } from 'lucide-react'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Modal from '../../components/common/Modal'
import Table from '../../components/common/Table'
import Card from '../../components/common/Card'
import toast from 'react-hot-toast'
import { verificacionPagoService } from '../../services/verificacionPagoService'
import { useDebounce } from '../../hooks/useDebounce'

const Pagos = () => {
  const [pagos, setPagos] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [perPage, setPerPage] = useState(15)
  const [resumen, setResumen] = useState(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showAprobarModal, setShowAprobarModal] = useState(false)
  const [showRechazarModal, setShowRechazarModal] = useState(false)
  const [selectedPago, setSelectedPago] = useState(null)
  const [motivoRechazo, setMotivoRechazo] = useState('')
  const [observacionesAprobar, setObservacionesAprobar] = useState('')
  const [metodoFiltro, setMetodoFiltro] = useState('')
  const [showFiltersModal, setShowFiltersModal] = useState(false)

  useEffect(() => {
    fetchPagos()
  }, [currentPage, perPage, debouncedSearchTerm, metodoFiltro])

  const fetchPagos = async () => {
    try {
      setLoading(true)
      const response = await verificacionPagoService.listar({
        page: currentPage,
        per_page: perPage,
        search: (debouncedSearchTerm && typeof debouncedSearchTerm === 'string' && debouncedSearchTerm.trim()) ? debouncedSearchTerm.trim() : undefined,
        metodo: metodoFiltro || undefined
      })
      
      if (response.success) {
        const paginatedData = response.data
        if (paginatedData && paginatedData.data) {
          setPagos(paginatedData.data)
          setTotalPages(paginatedData.last_page || 1)
        } else {
          setPagos([])
          setTotalPages(1)
        }
        if (response.resumen) {
          setResumen(response.resumen)
        }
      } else {
        toast.error(response.message || 'Error al cargar los pagos')
        setPagos([])
      }
    } catch (error) {
      console.error('Error cargando pagos:', error)
      toast.error('Error de conexión')
      setPagos([])
    } finally {
      setLoading(false)
    }
  }

  const handleView = async (pago) => {
    try {
      setLoading(true)
      const response = await verificacionPagoService.obtener(pago.id)
      if (response.success) {
        setSelectedPago(response.data)
        setShowViewModal(true)
      } else {
        toast.error(response.message || 'Error al cargar el pago')
      }
    } catch (error) {
      toast.error('Error al cargar el pago')
    } finally {
      setLoading(false)
    }
  }

  const handleAprobarClick = (pago) => {
    setSelectedPago(pago)
    setObservacionesAprobar('')
    setShowAprobarModal(true)
  }

  const handleAprobar = async () => {
    if (!selectedPago) return

    try {
      setLoading(true)
      const response = await verificacionPagoService.aprobar(selectedPago.id, observacionesAprobar)
      
      if (response.success) {
        toast.success(response.message || 'Pago aprobado exitosamente')
        setShowAprobarModal(false)
        setSelectedPago(null)
        setObservacionesAprobar('')
        await fetchPagos()
      } else {
        toast.error(response.message || 'Error al aprobar el pago')
      }
    } catch (error) {
      toast.error('Error al aprobar el pago')
    } finally {
      setLoading(false)
    }
  }

  const handleRechazarClick = (pago) => {
    setSelectedPago(pago)
    setMotivoRechazo('')
    setShowRechazarModal(true)
  }

  const handleRechazar = async () => {
    if (!selectedPago || !motivoRechazo.trim()) {
      toast.error('Debe proporcionar un motivo para rechazar el pago')
      return
    }

    if (motivoRechazo.trim().length < 10) {
      toast.error('El motivo debe tener al menos 10 caracteres')
      return
    }

    try {
      setLoading(true)
      const response = await verificacionPagoService.rechazar(selectedPago.id, motivoRechazo.trim())
      
      if (response.success) {
        toast.success(response.message || 'Pago rechazado exitosamente')
        setShowRechazarModal(false)
        setSelectedPago(null)
        setMotivoRechazo('')
        await fetchPagos()
      } else {
        toast.error(response.message || 'Error al rechazar el pago')
        if (response.errors) {
          Object.keys(response.errors).forEach(key => {
            const errors = Array.isArray(response.errors[key]) 
              ? response.errors[key] 
              : [response.errors[key]]
            errors.forEach(error => toast.error(error))
          })
        }
      }
    } catch (error) {
      toast.error('Error al rechazar el pago')
    } finally {
      setLoading(false)
    }
  }

  const getEstadoBadge = (verificado) => {
    if (verificado) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
          <CheckCircle className="h-4 w-4" />
          Verificado
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
        <XCircle className="h-4 w-4" />
        Pendiente
      </span>
    )
  }

  const getMetodoBadge = (metodo) => {
    const colores = {
      'QR': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      'TRANSFERENCIA': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      'EFECTIVO': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
    }
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colores[metodo] || 'bg-gray-100 text-gray-800'}`}>
        {metodo || 'N/A'}
      </span>
    )
  }

  const tieneFiltrosActivos = () => {
    return metodoFiltro !== ''
  }

  const handleLimpiarFiltros = () => {
    setMetodoFiltro('')
    setCurrentPage(1)
  }

  const columns = [
    {
      key: 'fecha',
      label: 'Fecha',
      render: (row) => (
        <span className="text-gray-900 dark:text-gray-100">
          {row.fecha ? new Date(row.fecha).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }) : 'N/A'}
        </span>
      )
    },
    {
      key: 'estudiante',
      label: 'Estudiante',
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {row.estudiante?.nombre_completo || 'N/A'}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            CI: {row.estudiante?.ci || 'N/A'}
          </div>
        </div>
      )
    },
    {
      key: 'programa',
      label: 'Programa',
      render: (row) => (
        <span className="text-gray-900 dark:text-gray-100">
          {row.programa?.nombre || row.programa || 'N/A'}
        </span>
      )
    },
    {
      key: 'monto',
      label: 'Monto',
      render: (row) => (
        <span className="font-semibold text-gray-900 dark:text-gray-100">
          {parseFloat(row.monto || 0).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
        </span>
      )
    },
    {
      key: 'metodo',
      label: 'Método',
      render: (row) => getMetodoBadge(row.metodo)
    },
    {
      key: 'verificado',
      label: 'Estado',
      render: (row) => getEstadoBadge(row.verificado)
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
            onClick={() => handleView(row)}
            title="Ver detalles"
          />
          {!row.verificado && (
            <>
              <Button
                variant="ghost"
                size="sm"
                icon={<Check className="h-4 w-4 text-green-600" />}
                onClick={() => handleAprobarClick(row)}
                title="Aprobar pago"
              />
              <Button
                variant="ghost"
                size="sm"
                icon={<X className="h-4 w-4 text-red-600" />}
                onClick={() => handleRechazarClick(row)}
                title="Rechazar pago"
              />
            </>
          )}
        </div>
      )
    }
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-4 mb-4 sm:mb-0">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center shadow-glow">
            <CreditCard className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text">Gestión de Pagos</h1>
            <p className="text-gray-600 dark:text-gray-400">Verifica y gestiona los pagos de estudiantes</p>
          </div>
        </div>
      </div>

      {/* Resumen */}
      {resumen && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="gradient" shadow="glow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pendientes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {resumen.total_pendientes || 0}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-yellow-500" />
            </div>
          </Card>
          <Card className="gradient" shadow="glow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Verificados</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {resumen.total_verificados || 0}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </Card>
          <Card className="gradient" shadow="glow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Monto Pendiente</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {parseFloat(resumen.total_monto_pendiente || 0).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-500" />
            </div>
          </Card>
          <Card className="gradient" shadow="glow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Monto Verificado</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {parseFloat(resumen.total_monto_verificado || 0).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </Card>
        </div>
      )}

      <Card className="gradient" shadow="glow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h3 className="text-xl font-bold gradient-text mb-4 sm:mb-0">Lista de Pagos</h3>
          <div className="flex gap-2">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar pagos..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-10 w-full sm:w-64"
              />
            </div>
            <Button
              variant="outline"
              icon={<Filter className="h-4 w-4" />}
              onClick={() => setShowFiltersModal(true)}
              className={tieneFiltrosActivos() ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : ''}
            >
              Filtros
              {tieneFiltrosActivos() && (
                <span className="ml-2 px-2 py-0.5 bg-primary-500 text-white rounded-full text-xs">
                  1
                </span>
              )}
            </Button>
          </div>
        </div>
        
        <Table
          columns={columns}
          data={pagos}
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

      {/* Modal de Ver Detalles */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false)
          setSelectedPago(null)
        }}
        title="Detalles del Pago"
        size="xl"
      >
        {selectedPago && (
          <div className="space-y-6">
            {/* Información del Estudiante */}
            {selectedPago.estudiante && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2 text-primary-500" />
                  Información del Estudiante
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Nombre Completo
                    </label>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {selectedPago.estudiante.nombre_completo || selectedPago.estudiante.nombre} {selectedPago.estudiante.apellido}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      CI
                    </label>
                    <p className="text-gray-700 dark:text-gray-300">
                      {selectedPago.estudiante.ci}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Registro Estudiante
                    </label>
                    <p className="text-gray-700 dark:text-gray-300">
                      {selectedPago.estudiante.registro_estudiante || selectedPago.estudiante.registro || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Email
                    </label>
                    <p className="text-gray-700 dark:text-gray-300">
                      {selectedPago.estudiante.email || 'N/A'}
                    </p>
                  </div>
                  {selectedPago.estudiante.celular && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Celular
                      </label>
                      <p className="text-gray-700 dark:text-gray-300">
                        {selectedPago.estudiante.celular}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Información del Programa */}
            {selectedPago.programa && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <GraduationCap className="h-5 w-5 mr-2 text-primary-500" />
                  Información del Programa
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Nombre del Programa
                    </label>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {typeof selectedPago.programa === 'string' ? selectedPago.programa : selectedPago.programa.nombre}
                    </p>
                  </div>
                  {selectedPago.programa.institucion && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Institución
                      </label>
                      <p className="text-gray-700 dark:text-gray-300">
                        {typeof selectedPago.programa.institucion === 'string' ? selectedPago.programa.institucion : selectedPago.programa.institucion.nombre}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Información del Pago */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-primary-500" />
                Información del Pago
              </h3>
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Monto
                    </label>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {parseFloat(selectedPago.monto || 0).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Método
                    </label>
                    <div className="mt-1">
                      {getMetodoBadge(selectedPago.metodo)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Fecha
                    </label>
                    <p className="text-gray-700 dark:text-gray-300">
                      {selectedPago.fecha ? new Date(selectedPago.fecha).toLocaleDateString('es-ES') : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Estado
                    </label>
                    <div className="mt-1">
                      {getEstadoBadge(selectedPago.verificado)}
                    </div>
                  </div>
                </div>

                {selectedPago.verificado && selectedPago.fecha_verificacion && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Fecha de Verificación
                    </label>
                    <p className="text-gray-700 dark:text-gray-300">
                      {new Date(selectedPago.fecha_verificacion).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}

                {selectedPago.verificado_por && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Verificado por
                    </label>
                    <p className="text-gray-700 dark:text-gray-300">
                      {typeof selectedPago.verificado_por === 'string' 
                        ? selectedPago.verificado_por 
                        : `${selectedPago.verificado_por.nombre || ''} ${selectedPago.verificado_por.apellido || ''}`.trim() || 'N/A'}
                    </p>
                  </div>
                )}

                {selectedPago.comprobante_url && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Comprobante
                    </label>
                    <a
                      href={selectedPago.comprobante_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 dark:text-primary-400"
                    >
                      <FileText className="h-4 w-4" />
                      Ver comprobante
                    </a>
                  </div>
                )}

                {selectedPago.observaciones && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Observaciones
                    </label>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {selectedPago.observaciones}
                    </p>
                  </div>
                )}

                {selectedPago.cuota && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Información de la Cuota
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Fecha Inicio</p>
                        <p className="text-gray-900 dark:text-white">
                          {selectedPago.cuota.fecha_ini ? new Date(selectedPago.cuota.fecha_ini).toLocaleDateString('es-ES') : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Fecha Fin</p>
                        <p className="text-gray-900 dark:text-white">
                          {selectedPago.cuota.fecha_fin ? new Date(selectedPago.cuota.fecha_fin).toLocaleDateString('es-ES') : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Aprobar Pago */}
      <Modal
        isOpen={showAprobarModal}
        onClose={() => {
          setShowAprobarModal(false)
          setSelectedPago(null)
          setObservacionesAprobar('')
        }}
        title="Aprobar Pago"
        size="md"
      >
        {selectedPago && (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    ¿Está seguro de aprobar este pago?
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Estudiante: {selectedPago.estudiante?.nombre_completo || 'N/A'}
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Monto: {parseFloat(selectedPago.monto || 0).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Observaciones (opcional)
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
                rows="4"
                value={observacionesAprobar}
                onChange={(e) => setObservacionesAprobar(e.target.value)}
                placeholder="Agregar observaciones sobre la aprobación..."
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAprobarModal(false)
                  setSelectedPago(null)
                  setObservacionesAprobar('')
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                icon={<Check className="h-4 w-4" />}
                onClick={handleAprobar}
              >
                Aprobar Pago
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Rechazar Pago */}
      <Modal
        isOpen={showRechazarModal}
        onClose={() => {
          setShowRechazarModal(false)
          setSelectedPago(null)
          setMotivoRechazo('')
        }}
        title="Rechazar Pago"
        size="md"
      >
        {selectedPago && (
          <div className="space-y-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                <div>
                  <p className="font-medium text-red-900 dark:text-red-100">
                    ¿Está seguro de rechazar este pago?
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    El pago será eliminado y el estudiante deberá registrar un nuevo pago.
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    Estudiante: {selectedPago.estudiante?.nombre_completo || 'N/A'}
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Monto: {parseFloat(selectedPago.monto || 0).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Motivo del rechazo *
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
                rows="4"
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
                placeholder="Explique el motivo del rechazo (mínimo 10 caracteres)..."
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {motivoRechazo.length}/10 caracteres mínimos
              </p>
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRechazarModal(false)
                  setSelectedPago(null)
                  setMotivoRechazo('')
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                icon={<X className="h-4 w-4" />}
                onClick={handleRechazar}
                disabled={motivoRechazo.trim().length < 10}
              >
                Rechazar Pago
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Filtros */}
      <Modal
        isOpen={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        title="Filtros"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Método de Pago
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
              value={metodoFiltro}
              onChange={(e) => {
                setMetodoFiltro(e.target.value)
                setCurrentPage(1)
              }}
            >
              <option value="">Todos los métodos</option>
              <option value="QR">QR</option>
              <option value="TRANSFERENCIA">Transferencia</option>
              <option value="EFECTIVO">Efectivo</option>
            </select>
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={handleLimpiarFiltros}
            >
              Limpiar Filtros
            </Button>
            <Button
              variant="primary"
              onClick={() => setShowFiltersModal(false)}
            >
              Aplicar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Pagos
