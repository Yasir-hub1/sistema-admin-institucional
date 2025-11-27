import React, { useState, useEffect } from 'react'
import { CreditCard, DollarSign, Calendar, CheckCircle, XCircle, Clock, QrCode, AlertTriangle } from 'lucide-react'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Modal from '../../components/common/Modal'
import QRModal from '../../components/estudiante/QRModal'
import toast from 'react-hot-toast'
import { estudiantePagoService } from '../../services/pagoService'

const MisPagos = () => {
  const [cuotas, setCuotas] = useState([])
  const [planes, setPlanes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showQRModal, setShowQRModal] = useState(false)
  const [showPagoExitosoModal, setShowPagoExitosoModal] = useState(false)
  const [selectedCuota, setSelectedCuota] = useState(null)
  const [pagoConfirmado, setPagoConfirmado] = useState(null)
  const [estadisticas, setEstadisticas] = useState({
    total_cuotas: 0,
    cuotas_pagadas: 0,
    cuotas_pendientes: 0,
    cuotas_vencidas: 0,
    planes_completos: 0,
    planes_pendientes: 0
  })

  useEffect(() => {
    fetchCuotas()
  }, [])

  const fetchCuotas = async () => {
    try {
      setLoading(true)
      const response = await estudiantePagoService.getMisCuotas()
      
      if (response.success) {
        setCuotas(response.data.cuotas || [])
        setPlanes(response.data.planes || [])
        setEstadisticas({
          total_cuotas: response.data.total_cuotas || 0,
          cuotas_pagadas: response.data.cuotas_pagadas || 0,
          cuotas_pendientes: response.data.cuotas_pendientes || 0,
          cuotas_vencidas: response.data.cuotas_vencidas || 0,
          planes_completos: response.data.planes_completos || 0,
          planes_pendientes: response.data.planes_pendientes || 0
        })
      } else {
        toast.error(response.message || 'Error al cargar cuotas')
        setCuotas([])
      }
    } catch (error) {
      toast.error('Error de conexión')
      setCuotas([])
    } finally {
      setLoading(false)
    }
  }

  const handlePagarCuota = (cuota) => {
    setSelectedCuota(cuota)
    setShowQRModal(true)
  }

  const handlePaymentSuccess = async (pagoData) => {
    // Cerrar modal de QR
    setShowQRModal(false)
    setSelectedCuota(null)
    
    // Mostrar modal de pago exitoso
    setPagoConfirmado(pagoData)
    setShowPagoExitosoModal(true)
    
    // Recargar datos
    await fetchCuotas()
    
    // Notificar al admin (el backend ya lo hace automáticamente, pero podemos mostrar confirmación)
    toast.success('Pago confirmado exitosamente. Se ha notificado al administrador.')
  }

  const getEstadoBadge = (cuota) => {
    if (cuota.esta_pagada) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-4 w-4" />
          Pagada
        </span>
      )
    } else if (cuota.esta_vencida) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
          <XCircle className="h-4 w-4" />
          Vencida
        </span>
      )
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
          <Clock className="h-4 w-4" />
          Pendiente
        </span>
      )
    }
  }

  if (loading && cuotas.length === 0) {
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
          <CreditCard className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold gradient-text">Mis Pagos</h1>
          <p className="text-gray-600 dark:text-gray-400">Gestiona tus cuotas y pagos académicos</p>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-6">
        <Card className="gradient" shadow="glow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Total Cuotas</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{estadisticas.total_cuotas}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-glow">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
          </div>
        </Card>
        <Card className="gradient" shadow="glow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Pagadas</p>
              <p className="text-3xl font-bold text-green-600">{estadisticas.cuotas_pagadas}</p>
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
              <p className="text-3xl font-bold text-yellow-600">{estadisticas.cuotas_pendientes}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-glow">
              <Clock className="h-6 w-6 text-white" />
            </div>
          </div>
        </Card>
        <Card className="gradient" shadow="glow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Vencidas</p>
              <p className="text-3xl font-bold text-red-600">{estadisticas.cuotas_vencidas}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-glow">
              <XCircle className="h-6 w-6 text-white" />
            </div>
          </div>
        </Card>
        <Card className="gradient" shadow="glow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Planes Completos</p>
              <p className="text-3xl font-bold text-green-600">{estadisticas.planes_completos}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-glow">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
          </div>
        </Card>
        <Card className="gradient" shadow="glow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Planes Pendientes</p>
              <p className="text-3xl font-bold text-yellow-600">{estadisticas.planes_pendientes}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-glow">
              <Clock className="h-6 w-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Planes de Pago */}
      {planes.length > 0 && (
        <div className="space-y-6">
          {planes.map((plan, planIdx) => (
            <Card key={planIdx} className="gradient" shadow="glow-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold gradient-text">
                    {typeof plan.programa === 'string' 
                      ? plan.programa 
                      : (plan.programa?.nombre || 'Programa sin nombre')}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Plan de Pago #{plan.plan_id}
                  </p>
                </div>
                {plan.esta_completo ? (
                  <span className="inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <CheckCircle className="h-4 w-4" />
                    Plan Completo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    <Clock className="h-4 w-4" />
                    En Proceso
                  </span>
                )}
              </div>

              {/* Resumen del Plan */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Monto Total</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {parseFloat(plan.monto_total || 0).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Monto Pagado</p>
                  <p className="text-lg font-semibold text-green-600">
                    {parseFloat(plan.monto_pagado || 0).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Saldo Pendiente</p>
                  <p className="text-lg font-semibold text-yellow-600">
                    {parseFloat(plan.monto_pendiente || 0).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Progreso</p>
                  <div className="mt-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${Math.min(plan.porcentaje_pagado || 0, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{plan.porcentaje_pagado?.toFixed(1) || 0}%</p>
                  </div>
                </div>
              </div>

              {/* Cuotas del Plan */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                  Cuotas ({plan.cuotas_pagadas}/{plan.total_cuotas} pagadas)
                </h4>
                {plan.cuotas && plan.cuotas.map((cuota, cuotaIdx) => (
                  <div
                    key={cuotaIdx}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h5 className="font-semibold text-gray-900 dark:text-gray-100">
                            Cuota {cuotaIdx + 1}
                          </h5>
                          {getEstadoBadge(cuota)}
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Monto</p>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {parseFloat(cuota.monto || 0).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Vencimiento</p>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {new Date(cuota.fecha_fin).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Saldo</p>
                            <p className="font-semibold text-yellow-600">
                              {parseFloat(cuota.saldo_pendiente || 0).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                            </p>
                          </div>
                        </div>

                        {cuota.pagos && cuota.pagos.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Pagos Registrados:
                            </p>
                            <div className="space-y-1">
                              {cuota.pagos.map((pago, pIdx) => (
                                <div key={pIdx} className="flex items-center justify-between text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                  <span className="font-medium">
                                    {parseFloat(pago.monto || 0).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                                  </span>
                                  <span className="text-gray-500">
                                    {new Date(pago.fecha).toLocaleDateString()} {pago.token && `- ${pago.token}`}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {!cuota.esta_pagada && (
                        <div className="ml-4">
                          <Button
                            variant="primary"
                            size="sm"
                            icon={<QrCode className="h-4 w-4" />}
                            onClick={() => handlePagarCuota(cuota)}
                          >
                            Pagar con QR
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Lista de Cuotas (vista alternativa) */}
      <Card className="gradient" shadow="glow-lg">
        <h3 className="text-xl font-bold gradient-text mb-6">Todas mis Cuotas</h3>
        <div className="space-y-4">
          {cuotas.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No tienes cuotas registradas
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Contacta con el administrador para más información
              </p>
            </div>
          ) : (
            cuotas.map((cuota, idx) => (
              <div
                key={idx}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {typeof cuota.programa === 'string' 
                          ? cuota.programa 
                          : (cuota.programa?.nombre || 'Programa sin nombre')}
                      </h4>
                      {getEstadoBadge(cuota)}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Monto</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {parseFloat(cuota.monto || 0).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Fecha Vencimiento</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {new Date(cuota.fecha_fin).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Saldo Pendiente</p>
                        <p className="text-lg font-semibold text-yellow-600">
                          {parseFloat(cuota.saldo_pendiente || 0).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                        </p>
                      </div>
                    </div>

                    {cuota.pagos && cuota.pagos.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Pagos Registrados:
                        </p>
                        <div className="space-y-2">
                          {cuota.pagos.map((pago, pIdx) => (
                            <div key={pIdx} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              <div>
                                <span className="text-sm font-medium">
                                  {parseFloat(pago.monto || 0).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                                </span>
                                <span className="ml-2 text-xs text-gray-500">
                                  - {new Date(pago.fecha).toLocaleDateString()}
                                </span>
                              </div>
                              {pago.token && (
                                <span className="text-xs text-gray-500">Token: {pago.token}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {!cuota.esta_pagada && (
                    <div className="ml-4">
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<QrCode className="h-4 w-4" />}
                        onClick={() => handlePagarCuota(cuota)}
                      >
                        Pagar con QR
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Modal de QR */}
      {selectedCuota && (
        <QRModal
          isOpen={showQRModal}
          onClose={() => {
            setShowQRModal(false)
            setSelectedCuota(null)
          }}
          cuotaId={selectedCuota.id}
          cuotaInfo={{
            saldo_pendiente: selectedCuota.saldo_pendiente || selectedCuota.monto,
            monto: selectedCuota.monto,
            concepto: `Cuota - ${typeof selectedCuota.programa === 'string' 
              ? selectedCuota.programa 
              : (selectedCuota.programa?.nombre || 'Programa')}`,
            fecha_ini: selectedCuota.fecha_ini,
            fecha_inscripcion: selectedCuota.fecha_inscripcion
          }}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Modal de Pago Exitoso */}
      <Modal
        isOpen={showPagoExitosoModal}
        onClose={() => {
          setShowPagoExitosoModal(false)
          setPagoConfirmado(null)
        }}
        title="Pago Confirmado"
        size="md"
      >
        {pagoConfirmado && (
          <div className="space-y-6">
            <div className="flex items-center justify-center">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                ¡Pago Confirmado Exitosamente!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Tu pago ha sido verificado y aplicado a tu cuenta
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Monto Pagado:</span>
                  <span className="font-bold text-lg text-gray-900 dark:text-gray-100">
                    {new Intl.NumberFormat('es-BO', {
                      style: 'currency',
                      currency: 'BOB'
                    }).format(pagoConfirmado.monto || 0)}
                  </span>
                </div>
                {pagoConfirmado.nro_pago && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Número de Pago:</span>
                    <span className="font-mono text-sm text-gray-900 dark:text-gray-100">
                      {pagoConfirmado.nro_pago}
                    </span>
                  </div>
                )}
                {pagoConfirmado.fecha_verificacion && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Fecha de Pago:</span>
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {new Date(pagoConfirmado.fecha_verificacion).toLocaleString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800 dark:text-blue-300">
                  <p className="font-semibold mb-1">Notificación Enviada</p>
                  <p>
                    Se ha notificado automáticamente al administrador sobre tu pago. 
                    Tu comprobante ha sido registrado en el sistema.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="primary"
                onClick={() => {
                  setShowPagoExitosoModal(false)
                  setPagoConfirmado(null)
                }}
                icon={<CheckCircle className="h-4 w-4" />}
              >
                Entendido
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default MisPagos

