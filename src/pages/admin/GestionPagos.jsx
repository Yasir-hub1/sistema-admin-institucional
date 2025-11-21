import React, { useState, useEffect } from 'react'
import { DollarSign, Search, Eye, Edit2, Trash2, AlertTriangle, Plus, CheckCircle, XCircle, Clock } from 'lucide-react'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Modal from '../../components/common/Modal'
import Table from '../../components/common/Table'
import Card from '../../components/common/Card'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { gestionPagoService } from '../../services/gestionPagoService'

const GestionPagos = () => {
  const [planes, setPlanes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [estadoFilter, setEstadoFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showPagoModal, setShowPagoModal] = useState(false)
  const [showPenalidadModal, setShowPenalidadModal] = useState(false)
  const [viewingPlan, setViewingPlan] = useState(null)
  const [selectedCuota, setSelectedCuota] = useState(null)

  const { register: registerPago, handleSubmit: handleSubmitPago, reset: resetPago, formState: { errors: errorsPago } } = useForm()
  const { register: registerPenalidad, handleSubmit: handleSubmitPenalidad, reset: resetPenalidad, formState: { errors: errorsPenalidad } } = useForm()

  useEffect(() => {
    fetchPlanes()
  }, [currentPage, perPage, searchTerm, estadoFilter])

  const fetchPlanes = async () => {
    try {
      setLoading(true)
      const response = await gestionPagoService.get({
        page: currentPage,
        per_page: perPage,
        search: searchTerm,
        estado: estadoFilter
      })
      
      if (response.success && response.data) {
        setPlanes(response.data.data || [])
        setTotalPages(response.data.last_page || 1)
      } else {
        toast.error(response.message || 'Error al cargar planes de pago')
        setPlanes([])
        setTotalPages(1)
      }
    } catch (error) {
      toast.error('Error de conexión')
      setPlanes([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  const handleView = async (plan) => {
    try {
      const response = await gestionPagoService.getById(plan.id)
      if (response.success) {
        setViewingPlan(response.data)
        setShowViewModal(true)
      }
    } catch (error) {
      toast.error('Error al cargar el plan de pago')
    }
  }

  const handleRegistrarPago = (cuota) => {
    setSelectedCuota(cuota)
    resetPago({
      cuota_id: cuota.id,
      monto: cuota.saldo_pendiente || cuota.monto,
      token: '',
      fecha: new Date().toISOString().split('T')[0],
      observaciones: ''
    })
    setShowPagoModal(true)
  }

  const handleAplicarPenalidad = (cuota) => {
    setSelectedCuota(cuota)
    resetPenalidad({
      cuota_id: cuota.id,
      monto_penalidad: '',
      motivo: ''
    })
    setShowPenalidadModal(true)
  }

  const onSubmitPago = async (data) => {
    try {
      setLoading(true)
      const response = await gestionPagoService.registrarPago(data)
      
      if (response.success) {
        toast.success(response.message || 'Pago registrado exitosamente')
        setShowPagoModal(false)
        setSelectedCuota(null)
        resetPago()
        await fetchPlanes()
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

  const onSubmitPenalidad = async (data) => {
    try {
      setLoading(true)
      const response = await gestionPagoService.aplicarPenalidad(data)
      
      if (response.success) {
        toast.success(response.message || 'Penalidad aplicada exitosamente')
        setShowPenalidadModal(false)
        setSelectedCuota(null)
        resetPenalidad()
        await fetchPlanes()
      } else {
        toast.error(response.message || 'Error al aplicar penalidad')
        if (response.errors) {
          Object.keys(response.errors).forEach(key => {
            toast.error(`${key}: ${response.errors[key]}`)
          })
        }
      }
    } catch (error) {
      toast.error('Error al aplicar penalidad')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      key: 'estudiante',
      label: 'Estudiante',
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {row.inscripcion?.estudiante?.nombre} {row.inscripcion?.estudiante?.apellido}
          </div>
          <div className="text-sm text-gray-500">
            CI: {row.inscripcion?.estudiante?.ci}
          </div>
        </div>
      )
    },
    {
      key: 'programa',
      label: 'Programa',
      render: (row) => (
        <span className="text-gray-900 dark:text-gray-100">
          {row.inscripcion?.programa?.nombre || '-'}
        </span>
      )
    },
    {
      key: 'monto',
      label: 'Monto Total',
      render: (row) => (
        <span className="font-semibold text-gray-900 dark:text-gray-100">
          {parseFloat(row.monto_total || 0).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
        </span>
      )
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (row) => {
        const estado = row.estado_plan || {}
        const porcentaje = estado.porcentaje_pagado || 0
        
        return (
          <div>
            <div className="flex items-center gap-2 mb-1">
              {estado.esta_completo ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3" />
                  Completo
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  <Clock className="h-3 w-3" />
                  Pendiente
                </span>
              )}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
              <div 
                className="bg-green-600 h-1.5 rounded-full" 
                style={{ width: `${Math.min(porcentaje, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{porcentaje.toFixed(1)}% pagado</p>
          </div>
        )
      }
    },
    {
      key: 'cuotas',
      label: 'Cuotas',
      render: (row) => {
        const estado = row.estado_plan || {}
        return (
          <span className="text-gray-900 dark:text-gray-100">
            {estado.cuotas_pagadas || 0}/{estado.total_cuotas || 0}
          </span>
        )
      }
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
          />
        </div>
      )
    }
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-4 mb-4 sm:mb-0">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center shadow-glow">
            <DollarSign className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text">Gestión de Pagos</h1>
            <p className="text-gray-600 dark:text-gray-400">Administra y controla los pagos de los estudiantes</p>
          </div>
        </div>
      </div>

      <Card className="gradient" shadow="glow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h3 className="text-xl font-bold gradient-text mb-4 sm:mb-0">Planes de Pago</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar estudiantes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
            <select
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="completo">Completos</option>
              <option value="pendiente">Pendientes</option>
            </select>
          </div>
        </div>
        
        <Table
          columns={columns}
          data={planes}
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

      {/* Modal de Ver Plan */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Detalles del Plan de Pago"
        size="xl"
      >
        {viewingPlan && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estudiante
                </label>
                <p className="text-gray-900 dark:text-gray-100">
                  {viewingPlan.inscripcion?.estudiante?.nombre} {viewingPlan.inscripcion?.estudiante?.apellido}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Programa
                </label>
                <p className="text-gray-900 dark:text-gray-100">
                  {viewingPlan.inscripcion?.programa?.nombre || '-'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Monto Total
                </label>
                <p className="text-gray-900 dark:text-gray-100 font-semibold">
                  {parseFloat(viewingPlan.monto_total || 0).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estado
                </label>
                {viewingPlan.estado_plan?.esta_completo ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <CheckCircle className="h-4 w-4" />
                    Completo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    <Clock className="h-4 w-4" />
                    Pendiente
                  </span>
                )}
              </div>
            </div>

            {viewingPlan.cuotas && viewingPlan.cuotas.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Cuotas
                </label>
                <div className="space-y-3">
                  {viewingPlan.cuotas.map((cuota, idx) => (
                    <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="font-medium">Cuota {idx + 1}</span>
                          {cuota.monto_pagado >= cuota.monto ? (
                            <span className="ml-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3" />
                              Pagada
                            </span>
                          ) : cuota.esta_vencida ? (
                            <span className="ml-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <XCircle className="h-3 w-3" />
                              Vencida
                            </span>
                          ) : (
                            <span className="ml-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <Clock className="h-3 w-3" />
                              Pendiente
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            {parseFloat(cuota.monto || 0).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                          </span>
                          {cuota.monto_pagado < cuota.monto && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={<Plus className="h-4 w-4" />}
                                onClick={() => handleRegistrarPago(cuota)}
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={<AlertTriangle className="h-4 w-4" />}
                                onClick={() => handleAplicarPenalidad(cuota)}
                              />
                            </>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Vencimiento</p>
                          <p className="font-medium">{new Date(cuota.fecha_fin).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Pagado</p>
                          <p className="font-medium text-green-600">
                            {parseFloat(cuota.monto_pagado || 0).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Pendiente</p>
                          <p className="font-medium text-yellow-600">
                            {parseFloat(cuota.saldo_pendiente || 0).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                          </p>
                        </div>
                      </div>
                      {cuota.pagos && cuota.pagos.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Pagos:</p>
                          <div className="space-y-1">
                            {cuota.pagos.map((pago, pIdx) => (
                              <div key={pIdx} className="flex items-center justify-between text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                <span>{parseFloat(pago.monto || 0).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}</span>
                                <span className="text-gray-500">{new Date(pago.fecha).toLocaleDateString()} {pago.token && `- ${pago.token}`}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal de Registrar Pago */}
      <Modal
        isOpen={showPagoModal}
        onClose={() => {
          setShowPagoModal(false)
          setSelectedCuota(null)
          resetPago()
        }}
        title="Registrar Pago Manual"
        size="md"
      >
        {selectedCuota && (
          <form onSubmit={handleSubmitPago(onSubmitPago)} className="space-y-6">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Saldo Pendiente</p>
              <p className="text-lg font-bold text-yellow-600">
                {parseFloat(selectedCuota.saldo_pendiente || selectedCuota.monto || 0).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
              </p>
            </div>

            <Input
              label="Monto a Pagar *"
              type="number"
              step="0.01"
              placeholder="0.00"
              error={errorsPago.monto?.message}
              {...registerPago('monto', { 
                required: 'El monto es obligatorio',
                min: { value: 0.01, message: 'El monto debe ser mayor a 0' },
                max: { 
                  value: selectedCuota.saldo_pendiente || selectedCuota.monto || 0, 
                  message: 'El monto no puede exceder el saldo pendiente' 
                }
              })}
            />

            <Input
              label="Fecha del Pago *"
              type="date"
              error={errorsPago.fecha?.message}
              {...registerPago('fecha', { required: 'La fecha es obligatoria' })}
            />

            <Input
              label="Token/Número de Transacción"
              placeholder="Opcional"
              error={errorsPago.token?.message}
              {...registerPago('token')}
            />

            <Input
              label="Observaciones"
              placeholder="Opcional"
              error={errorsPago.observaciones?.message}
              {...registerPago('observaciones')}
            />
            
            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowPagoModal(false)
                  setSelectedCuota(null)
                  resetPago()
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                icon={<Plus className="h-5 w-5" />}
              >
                Registrar Pago
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal de Aplicar Penalidad */}
      <Modal
        isOpen={showPenalidadModal}
        onClose={() => {
          setShowPenalidadModal(false)
          setSelectedCuota(null)
          resetPenalidad()
        }}
        title="Aplicar Penalidad"
        size="md"
      >
        {selectedCuota && (
          <form onSubmit={handleSubmitPenalidad(onSubmitPenalidad)} className="space-y-6">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <p className="font-semibold text-red-900 dark:text-red-100">Atención</p>
              </div>
              <p className="text-sm text-red-700 dark:text-red-300">
                La penalidad aumentará el monto de la cuota. Esta acción quedará registrada en la bitácora.
              </p>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Monto Actual de la Cuota</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {parseFloat(selectedCuota.monto || 0).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
              </p>
            </div>

            <Input
              label="Monto de Penalidad *"
              type="number"
              step="0.01"
              placeholder="0.00"
              error={errorsPenalidad.monto_penalidad?.message}
              {...registerPenalidad('monto_penalidad', { 
                required: 'El monto de penalidad es obligatorio',
                min: { value: 0.01, message: 'El monto debe ser mayor a 0' }
              })}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Motivo de la Penalidad *
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
                rows="4"
                placeholder="Describe el motivo de la penalidad..."
                error={errorsPenalidad.motivo?.message}
                {...registerPenalidad('motivo', { 
                  required: 'El motivo es obligatorio',
                  minLength: { value: 10, message: 'El motivo debe tener al menos 10 caracteres' }
                })}
              />
              {errorsPenalidad.motivo && (
                <p className="text-red-500 text-xs mt-1">{errorsPenalidad.motivo.message}</p>
              )}
            </div>
            
            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowPenalidadModal(false)
                  setSelectedCuota(null)
                  resetPenalidad()
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                icon={<AlertTriangle className="h-5 w-5" />}
              >
                Aplicar Penalidad
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}

export default GestionPagos

