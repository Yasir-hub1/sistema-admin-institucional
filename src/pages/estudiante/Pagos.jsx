import React, { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { get } from '../../services/api'
import { 
  CreditCard, 
  CheckCircle, 
  Clock, 
  XCircle, 
  DollarSign, 
  Calendar, 
  QrCode, 
  AlertCircle,
  GraduationCap,
  TrendingUp,
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import toast from 'react-hot-toast'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import QRModal from '../../components/estudiante/QRModal'

const Pagos = () => {
  const { user } = useAuth()
  const [planes, setPlanes] = useState([])
  const [cuotas, setCuotas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showQRModal, setShowQRModal] = useState(false)
  const [selectedCuotaId, setSelectedCuotaId] = useState(null)
  const [selectedCuotaInfo, setSelectedCuotaInfo] = useState(null)
  const [planesExpandidos, setPlanesExpandidos] = useState({})
  const [resumen, setResumen] = useState({
    total_cuotas: 0,
    cuotas_pagadas: 0,
    cuotas_pendientes: 0,
    cuotas_vencidas: 0
  })

  useEffect(() => {
    const fetchPagos = async () => {
      try {
        setLoading(true)
        const response = await get('/estudiante/pagos')
        
        console.log('💳 Respuesta de pagos:', response.data)
        
        if (response.data.success) {
          // El backend retorna: { success: true, data: { planes: [...], cuotas: [...], ... } }
          const data = response.data.data || {}
          
          // Obtener planes agrupados por inscripción
          const planesData = Array.isArray(data.planes) ? data.planes : []
          setPlanes(planesData)
          
          // Obtener cuotas aplanadas para compatibilidad
          const cuotasData = Array.isArray(data.cuotas) ? data.cuotas : []
          setCuotas(cuotasData)
          
          // Obtener resumen
          if (data.total_cuotas !== undefined) {
            setResumen({
              total_cuotas: data.total_cuotas || 0,
              cuotas_pagadas: data.cuotas_pagadas || 0,
              cuotas_pendientes: data.cuotas_pendientes || 0,
              cuotas_vencidas: data.cuotas_vencidas || 0
            })
          }
        } else {
          setError('No se pudieron cargar los pagos')
          setPlanes([])
          setCuotas([])
        }
      } catch (error) {
        console.error('Error cargando pagos:', error)
        setError('Error al cargar los pagos')
        setPlanes([])
        setCuotas([])
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchPagos()
    }
  }, [user])

  const getEstadoBadge = (estado) => {
    const estadoLower = estado?.toLowerCase() || ''
    
    if (estadoLower === 'pagada' || estadoLower === 'pagado' || estadoLower === 'verificado') {
        return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
          <CheckCircle className="h-3.5 w-3.5" />
          Pagada
          </span>
        )
    }
    
    if (estadoLower === 'vencida' || estadoLower === 'vencido') {
        return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
          <XCircle className="h-3.5 w-3.5" />
          Vencida
          </span>
        )
    }
    
    if (estadoLower === 'pendiente') {
        return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
          <Clock className="h-3.5 w-3.5" />
          Pendiente
          </span>
        )
    }
    
        return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
            {estado || 'Sin estado'}
          </span>
        )
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB'
    }).format(amount || 0)
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

  const togglePlan = (planId) => {
    setPlanesExpandidos(prev => ({
      ...prev,
      [planId]: !prev[planId]
    }))
  }

  const cuotasPendientes = cuotas.filter(c => c.estado === 'PENDIENTE' || c.esta_pendiente)
  const totalPendiente = cuotasPendientes.reduce((sum, c) => sum + (parseFloat(c.saldo_pendiente || c.monto) || 0), 0)
  const totalPagado = planes.reduce((sum, p) => sum + (parseFloat(p.monto_pagado || 0) || 0), 0)
  const totalAPagar = planes.reduce((sum, p) => sum + (parseFloat(p.monto_total || 0) || 0), 0)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-glow">
          <CreditCard className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold gradient-text">Mis Pagos</h1>
          <p className="text-gray-600 dark:text-gray-400">
          Consulta y gestiona tus pagos y cuotas académicas
        </p>
        </div>
      </div>

      {/* Estadísticas */}
      {planes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total a Pagar</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(totalAPagar)}</p>
              </div>
              <DollarSign className="h-10 w-10 text-blue-200" />
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Pagado</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(totalPagado)}</p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-200" />
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm">Pendiente</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(totalPendiente)}</p>
              </div>
              <Clock className="h-10 w-10 text-yellow-200" />
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Cuotas Pendientes</p>
                <p className="text-2xl font-bold mt-1">{resumen.cuotas_pendientes || cuotasPendientes.length}</p>
              </div>
              <FileText className="h-10 w-10 text-purple-200" />
          </div>
        </Card>
        </div>
      )}

      {/* Alerta de Pagos Pendientes con 14 horas */}
      {cuotasPendientes.length > 0 && (() => {
        // Calcular horas restantes desde la inscripción más reciente
        const calcularHorasRestantes = () => {
          if (planes.length === 0) return null
          
          // Buscar la fecha de inscripción más reciente
          let fechaInscripcionMasReciente = null
          planes.forEach(plan => {
            if (plan.fecha_inscripcion) {
              const fechaInsc = new Date(plan.fecha_inscripcion)
              if (!fechaInscripcionMasReciente || fechaInsc > fechaInscripcionMasReciente) {
                fechaInscripcionMasReciente = fechaInsc
              }
            }
          })
          
          if (!fechaInscripcionMasReciente) return null
          
          const ahora = new Date()
          const diffMs = ahora - fechaInscripcionMasReciente
          const diffHours = diffMs / (1000 * 60 * 60)
          const horasRestantes = 14 - diffHours
          
          return horasRestantes > 0 ? horasRestantes : 0
        }
        
        const horasRestantes = calcularHorasRestantes()
        const mostrarAlerta = horasRestantes !== null && horasRestantes <= 14 && horasRestantes > 0
        
        return mostrarAlerta ? (
          <Card className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-2 border-red-300 dark:border-red-700 animate-pulse">
            <div className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0 animate-bounce" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    ⚠️ Alerta Crítica: Pago Pendiente
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-2">
                    Tienes <span className="font-bold text-red-700 dark:text-red-300">{cuotasPendientes.length} {cuotasPendientes.length === 1 ? 'cuota pendiente' : 'cuotas pendientes'}</span> por un total de <span className="font-bold text-red-700 dark:text-red-300">{formatCurrency(totalPendiente)}</span>
                  </p>
                  <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg p-3 mt-3">
                    <p className="text-sm font-semibold text-red-900 dark:text-red-100 mb-1">
                      ⏰ Tiempo Restante: {Math.floor(horasRestantes)} {Math.floor(horasRestantes) === 1 ? 'hora' : 'horas'} {Math.floor((horasRestantes % 1) * 60)} minutos
                    </p>
                    <p className="text-sm text-red-800 dark:text-red-200">
                      Si no realizas el pago dentro de <span className="font-bold">14 horas</span> desde la inscripción, tu inscripción será <span className="font-bold">cancelada automáticamente</span>. Realiza el pago ahora para mantener tu lugar en el programa.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ) : cuotasPendientes.length > 0 ? (
          <Card className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-2 border-yellow-300 dark:border-yellow-700">
            <div className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    Tienes {cuotasPendientes.length} {cuotasPendientes.length === 1 ? 'cuota pendiente' : 'cuotas pendientes'}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-2">
                    Total pendiente: <span className="font-bold text-yellow-700 dark:text-yellow-300">{formatCurrency(totalPendiente)}</span>
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Realiza tus pagos a tiempo para mantener tu inscripción activa
                  </p>
                </div>
              </div>
            </div>
          </Card>
        ) : null
      })()}

      {/* Lista de Planes de Pago por Inscripción */}
      {planes.length === 0 ? (
        <Card className="gradient" shadow="glow-lg">
          <div className="text-center py-12">
            <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No tienes pagos registrados
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Los pagos aparecerán aquí cuando te inscribas en un programa
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {planes.map((plan) => {
            const isExpanded = planesExpandidos[plan.plan_id]
            const cuotasPlan = plan.cuotas || []
            const cuotasPendientesPlan = cuotasPlan.filter(c => c.estado === 'PENDIENTE' || c.esta_pendiente)
            
            return (
              <Card 
                key={plan.plan_id} 
                className="gradient hover:shadow-glow-lg transition-all duration-200 border-2 border-gray-200 dark:border-gray-700"
              >
              <div className="p-6">
                  {/* Header del Plan */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                          <GraduationCap className="h-6 w-6 text-white" />
                        </div>
                  <div className="flex-1">
                          <h3 className="text-2xl font-bold gradient-text mb-1">
                            {(() => {
                              if (!plan.programa) return 'Programa sin nombre'
                              if (typeof plan.programa === 'string') return plan.programa
                              if (typeof plan.programa === 'object' && plan.programa.nombre) return plan.programa.nombre
                              return 'Programa sin nombre'
                            })()}
                    </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Plan de Pago - {plan.total_cuotas || 0} {plan.total_cuotas === 1 ? 'cuota' : 'cuotas'}
                          </p>
                        </div>
                      </div>

                      {/* Información de Descuento si existe */}
                      {plan.descuento && (
                        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                              Descuento Aplicado: {plan.descuento.nombre} ({plan.descuento.descuento}%)
                            </p>
                          </div>
                          {plan.costo_base && plan.costo_final && plan.costo_base !== plan.costo_final && (
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              <span>Costo Base: {formatCurrency(plan.costo_base)}</span>
                              <span className="mx-2">→</span>
                              <span className="font-semibold text-green-600 dark:text-green-400">
                                Costo Final: {formatCurrency(plan.costo_final)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Resumen del Plan */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Monto Total</p>
                          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            {formatCurrency(plan.monto_total || 0)}
                          </p>
                          {plan.costo_base && plan.costo_base !== plan.monto_total && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-through">
                              {formatCurrency(plan.costo_base)}
                      </p>
                    )}
                  </div>
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Pagado</p>
                          <p className="text-lg font-bold text-green-600 dark:text-green-400">
                            {formatCurrency(plan.monto_pagado || 0)}
                          </p>
                        </div>
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Pendiente</p>
                          <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                            {formatCurrency(plan.monto_pendiente || 0)}
                          </p>
                        </div>
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Progreso</p>
                          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {plan.porcentaje_pagado?.toFixed(0) || 0}%
                          </p>
                        </div>
                      </div>

                      {/* Barra de Progreso */}
                      <div className="mb-4">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${plan.porcentaje_pagado || 0}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-2 text-sm text-gray-600 dark:text-gray-400">
                          <span>{plan.cuotas_pagadas || 0} / {plan.total_cuotas || 0} cuotas pagadas</span>
                          {plan.esta_completo && (
                            <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">
                              <CheckCircle className="h-4 w-4" />
                              Completado
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Botón para expandir/colapsar */}
                    <button
                      onClick={() => togglePlan(plan.plan_id)}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      )}
                    </button>
                  </div>

                  {/* Cuotas Expandidas */}
                  {isExpanded && cuotasPlan.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        Cuotas del Plan
                      </h4>
                      <div className="space-y-3">
                        {cuotasPlan.map((cuota, idx) => {
                          const estaPendiente = cuota.estado === 'PENDIENTE' || cuota.esta_pendiente
                          const estaPagada = cuota.estado === 'PAGADA' || cuota.esta_pagada
                          const estaVencida = cuota.estado === 'VENCIDA' || cuota.esta_vencida
                          
                          return (
                            <div
                              key={cuota.id || idx}
                              className={`p-4 rounded-lg border-2 transition-all ${
                                estaPagada
                                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                  : estaVencida
                                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                  : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                      estaPagada
                                        ? 'bg-green-500'
                                        : estaVencida
                                        ? 'bg-red-500'
                                        : 'bg-yellow-500'
                                    }`}>
                                      <FileText className="h-4 w-4 text-white" />
                                    </div>
                                    <div>
                                      <h5 className="font-semibold text-gray-900 dark:text-gray-100">
                                        Cuota {idx + 1} de {plan.total_cuotas}
                                      </h5>
                                      <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {cuota.fecha_ini && cuota.fecha_fin && (
                                          <>
                                            {new Date(cuota.fecha_ini).toLocaleDateString('es-ES', {
                                              day: 'numeric',
                                              month: 'short'
                                            })} - {new Date(cuota.fecha_fin).toLocaleDateString('es-ES', {
                                              day: 'numeric',
                                              month: 'short',
                                              year: 'numeric'
                                            })}
                                          </>
                                        )}
                                      </p>
                  </div>
                </div>

                                  <div className="flex items-center gap-4 mt-3 text-sm">
                                    <div>
                                      <span className="text-gray-500 dark:text-gray-400">Monto: </span>
                                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                                        {formatCurrency(cuota.monto || 0)}
                                      </span>
                                    </div>
                                    {!estaPagada && cuota.saldo_pendiente !== undefined && (
                                      <div>
                                        <span className="text-gray-500 dark:text-gray-400">Pendiente: </span>
                                        <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                                          {formatCurrency(cuota.saldo_pendiente || cuota.monto || 0)}
                                        </span>
                                      </div>
                                    )}
                                    {estaPagada && cuota.monto_pagado !== undefined && (
                                      <div>
                                        <span className="text-gray-500 dark:text-gray-400">Pagado: </span>
                                        <span className="font-semibold text-green-600 dark:text-green-400">
                                          {formatCurrency(cuota.monto_pagado || 0)}
                                        </span>
                  </div>
                )}
                                  </div>
                                </div>
                                
                                <div className="flex flex-col items-end gap-2">
                                  {getEstadoBadge(cuota.estado)}

                                  {estaPendiente && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                                        if (cuota.id) {
                                          setSelectedCuotaId(cuota.id)
                                          setSelectedCuotaInfo({
                                            saldo_pendiente: cuota.saldo_pendiente || cuota.monto,
                                            monto: cuota.monto,
                                            concepto: `Cuota ${idx + 1} - ${(() => {
                                              if (!plan.programa) return 'Programa'
                                              if (typeof plan.programa === 'string') return plan.programa
                                              if (typeof plan.programa === 'object' && plan.programa.nombre) return plan.programa.nombre
                                              return 'Programa'
                                            })()}`,
                                            fecha_ini: cuota.fecha_ini,
                                            fecha_inscripcion: plan.fecha_inscripcion || cuota.fecha_inscripcion
                                          })
                                          setShowQRModal(true)
                                        } else {
                                          toast.error('No se pudo obtener la información de la cuota')
                                        }
                                      }}
                                      icon={<QrCode className="h-4 w-4" />}
                                    >
                                      Pagar con QR
                    </Button>
                                  )}
                                </div>
                              </div>
                              
                              {/* Pagos realizados */}
                              {cuota.pagos && cuota.pagos.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                                    Pagos Realizados:
                                  </p>
                                  <div className="space-y-1">
                                    {cuota.pagos.map((pago, pIdx) => (
                                      <div key={pago.id || pIdx} className="flex items-center justify-between text-sm bg-white dark:bg-gray-800 rounded p-2">
                                        <div className="flex items-center gap-2">
                                          <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                                          <span className="text-gray-700 dark:text-gray-300">
                                            {pago.fecha && new Date(pago.fecha).toLocaleDateString('es-ES', {
                                              day: 'numeric',
                                              month: 'short',
                                              year: 'numeric'
                                            })}
                                          </span>
                                        </div>
                                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                                          {formatCurrency(pago.monto || 0)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Botón de acción rápida si hay cuotas pendientes */}
                  {cuotasPendientesPlan.length > 0 && !isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {cuotasPendientesPlan.length} {cuotasPendientesPlan.length === 1 ? 'cuota pendiente' : 'cuotas pendientes'}
                          </p>
                          <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                            {formatCurrency(cuotasPendientesPlan.reduce((sum, c) => sum + (parseFloat(c.saldo_pendiente || c.monto) || 0), 0))}
                          </p>
                        </div>
                      <Button
                          variant="primary"
                        onClick={() => {
                            if (cuotasPendientesPlan.length > 0 && cuotasPendientesPlan[0].id) {
                              const primeraCuota = cuotasPendientesPlan[0]
                              setSelectedCuotaId(primeraCuota.id)
                              setSelectedCuotaInfo({
                                saldo_pendiente: primeraCuota.saldo_pendiente || primeraCuota.monto,
                                monto: primeraCuota.monto,
                                concepto: `Cuota - ${(() => {
                                  if (!plan.programa) return 'Programa'
                                  if (typeof plan.programa === 'string') return plan.programa
                                  if (typeof plan.programa === 'object' && plan.programa.nombre) return plan.programa.nombre
                                  return 'Programa'
                                })()}`,
                                fecha_ini: primeraCuota.fecha_ini,
                                fecha_inscripcion: plan.fecha_inscripcion || primeraCuota.fecha_inscripcion
                              })
                              setShowQRModal(true)
                            }
                          }}
                          icon={<QrCode className="h-4 w-4" />}
                        >
                          Pagar Cuota Pendiente
                      </Button>
                      </div>
                  </div>
                )}
              </div>
            </Card>
            )
          })}
        </div>
      )}

      {/* Modal de QR */}
      <QRModal
        isOpen={showQRModal}
        onClose={() => {
          setShowQRModal(false)
          setSelectedCuotaId(null)
          setSelectedCuotaInfo(null)
        }}
        cuotaId={selectedCuotaId}
        cuotaInfo={selectedCuotaInfo}
        onPaymentSuccess={() => {
          // Recargar datos después del pago exitoso
          const fetchPagos = async () => {
            try {
              setLoading(true)
              const response = await get('/estudiante/pagos')
              if (response.data.success) {
                const data = response.data.data || {}
                setPlanes(Array.isArray(data.planes) ? data.planes : [])
                setCuotas(Array.isArray(data.cuotas) ? data.cuotas : [])
                if (data.total_cuotas !== undefined) {
                  setResumen({
                    total_cuotas: data.total_cuotas || 0,
                    cuotas_pagadas: data.cuotas_pagadas || 0,
                    cuotas_pendientes: data.cuotas_pendientes || 0,
                    cuotas_vencidas: data.cuotas_vencidas || 0
                  })
                }
              }
            } catch (error) {
              console.error('Error recargando pagos:', error)
            } finally {
              setLoading(false)
            }
          }
          fetchPagos()
        }}
      />
    </div>
  )
}

export default Pagos

