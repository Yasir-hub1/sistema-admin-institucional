import React, { useState, useEffect } from 'react'
import { CreditCard, DollarSign, Calendar, CheckCircle, XCircle, Clock, Upload } from 'lucide-react'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Modal from '../../components/common/Modal'
import Input from '../../components/common/Input'
import toast from 'react-hot-toast'
import { estudiantePagoService } from '../../services/pagoService'
import { useForm } from 'react-hook-form'

const MisPagos = () => {
  const [cuotas, setCuotas] = useState([])
  const [planes, setPlanes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showPagoModal, setShowPagoModal] = useState(false)
  const [selectedCuota, setSelectedCuota] = useState(null)
  const [estadisticas, setEstadisticas] = useState({
    total_cuotas: 0,
    cuotas_pagadas: 0,
    cuotas_pendientes: 0,
    cuotas_vencidas: 0,
    planes_completos: 0,
    planes_pendientes: 0
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

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

  const handleRegistrarPago = (cuota) => {
    setSelectedCuota(cuota)
    reset({
      monto: cuota.saldo_pendiente || cuota.monto,
      token: ''
    })
    setShowPagoModal(true)
  }

  const onSubmitPago = async (data) => {
    try {
      setLoading(true)
      const response = await estudiantePagoService.registrarPago(
        selectedCuota.id,
        parseFloat(data.monto),
        data.token
      )
      
      if (response.success) {
        toast.success(response.message || 'Pago registrado exitosamente')
        setShowPagoModal(false)
        setSelectedCuota(null)
        reset()
        await fetchCuotas()
      } else {
        toast.error(response.message || 'Error al registrar pago')
        if (response.errors) {
          Object.keys(response.errors).forEach(key => {
            toast.error(`${key}: ${response.errors[key]}`)
          })
        }
      }
    } catch (error) {
      toast.error('Error al registrar pago')
    } finally {
      setLoading(false)
    }
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
                            icon={<Upload className="h-4 w-4" />}
                            onClick={() => handleRegistrarPago(cuota)}
                          >
                            Pagar
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
                        icon={<Upload className="h-4 w-4" />}
                        onClick={() => handleRegistrarPago(cuota)}
                      >
                        Registrar Pago
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Modal de Registrar Pago */}
      <Modal
        isOpen={showPagoModal}
        onClose={() => {
          setShowPagoModal(false)
          setSelectedCuota(null)
          reset()
        }}
        title="Registrar Pago"
        size="md"
      >
        {selectedCuota && (
          <form onSubmit={handleSubmit(onSubmitPago)} className="space-y-6">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Programa</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {typeof selectedCuota.programa === 'string' 
                  ? selectedCuota.programa 
                  : (selectedCuota.programa?.nombre || 'Programa sin nombre')}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 mb-1">Saldo Pendiente</p>
              <p className="text-lg font-bold text-yellow-600">
                {parseFloat(selectedCuota.saldo_pendiente || selectedCuota.monto || 0).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
              </p>
            </div>

            <Input
              label="Monto a Pagar *"
              type="number"
              step="0.01"
              placeholder="0.00"
              error={errors.monto?.message}
              {...register('monto', { 
                required: 'El monto es obligatorio',
                min: { value: 0.01, message: 'El monto debe ser mayor a 0' },
                max: { 
                  value: selectedCuota.saldo_pendiente || selectedCuota.monto || 0, 
                  message: 'El monto no puede exceder el saldo pendiente' 
                }
              })}
            />

            <Input
              label="Token/Número de Transacción *"
              placeholder="Ingresa el número de transacción o token del pago"
              error={errors.token?.message}
              {...register('token', { required: 'El token es obligatorio' })}
            />
            
            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowPagoModal(false)
                  setSelectedCuota(null)
                  reset()
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                icon={<Upload className="h-5 w-5" />}
              >
                Registrar Pago
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}

export default MisPagos

