import React, { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { get } from '../../services/api'
import { CreditCard, CheckCircle, Clock, XCircle, DollarSign, Calendar, QrCode, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import QRModal from '../../components/estudiante/QRModal'

const Pagos = () => {
  const { user } = useAuth()
  const [pagos, setPagos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showQRModal, setShowQRModal] = useState(false)
  const [selectedCuotaId, setSelectedCuotaId] = useState(null)

  useEffect(() => {
    const fetchPagos = async () => {
      try {
        setLoading(true)
        const response = await get('/estudiante/pagos')
        
        console.log('💳 Respuesta de pagos:', response.data)
        
        if (response.data.success) {
          // El backend retorna: { success: true, data: { cuotas: [...], total_cuotas: ..., ... } }
          let pagosData = []
          
          if (response.data.data) {
            // Si tiene la propiedad cuotas dentro de data
            if (response.data.data.cuotas && Array.isArray(response.data.data.cuotas)) {
              pagosData = response.data.data.cuotas
            } 
            // Si tiene la propiedad pagos dentro de data
            else if (response.data.data.pagos && Array.isArray(response.data.data.pagos)) {
              pagosData = response.data.data.pagos
            }
            // Si es un array directo
            else if (Array.isArray(response.data.data)) {
              pagosData = response.data.data
            }
          } 
          // Fallback: buscar directamente en response.data
          else if (response.data.cuotas && Array.isArray(response.data.cuotas)) {
            pagosData = response.data.cuotas
          } else if (response.data.pagos && Array.isArray(response.data.pagos)) {
            pagosData = response.data.pagos
          }
          
          // Asegurar que siempre sea un array
          if (!Array.isArray(pagosData)) {
            console.warn('⚠️ pagosData no es un array:', pagosData)
            pagosData = []
          }
          
          setPagos(pagosData)
        } else {
          setError('No se pudieron cargar los pagos')
          setPagos([])
        }
      } catch (error) {
        console.error('Error cargando pagos:', error)
        setError('Error al cargar los pagos')
        setPagos([])
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchPagos()
    }
  }, [user])

  const getEstadoBadge = (estado) => {
    switch (estado?.toLowerCase()) {
      case 'pagado':
      case 'verificado':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-4 w-4" />
            Pagado
          </span>
        )
      case 'pendiente':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="h-4 w-4" />
            Pendiente
          </span>
        )
      case 'rechazado':
      case 'cancelado':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="h-4 w-4" />
            Rechazado
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {estado || 'Sin estado'}
          </span>
        )
    }
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

  const pagosPendientes = Array.isArray(pagos) ? pagos.filter(p => p.estado?.toLowerCase() === 'pendiente') : []
  const totalPendiente = pagosPendientes.reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <CreditCard className="h-8 w-8" />
          Mis Pagos
        </h1>
        <p className="text-green-100">
          Consulta y gestiona tus pagos y cuotas académicas
        </p>
      </div>

      {/* Resumen */}
      {pagosPendientes.length > 0 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Pagos Pendientes
                </h3>
                <p className="text-gray-600">
                  Tienes {pagosPendientes.length} {pagosPendientes.length === 1 ? 'pago' : 'pagos'} pendiente{pagosPendientes.length > 1 ? 's' : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-yellow-700">
                  {formatCurrency(totalPendiente)}
                </p>
                <p className="text-sm text-gray-600">Total pendiente</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Lista de Pagos */}
      {!Array.isArray(pagos) || pagos.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No tienes pagos registrados
            </h3>
            <p className="text-gray-600">
              Los pagos aparecerán aquí cuando se generen cuotas académicas
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6">
          {Array.isArray(pagos) && pagos.map((pago, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {pago.concepto || pago.descripcion || 'Pago académico'}
                    </h3>
                    {pago.programa && (
                      <p className="text-gray-600 text-sm mb-2">
                        Programa: {pago.programa.nombre || pago.programa}
                      </p>
                    )}
                    {pago.fecha_vencimiento && (
                      <p className="text-gray-500 text-xs flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Vence: {new Date(pago.fecha_vencimiento).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900 mb-2">
                      {formatCurrency(pago.monto)}
                    </div>
                    {getEstadoBadge(pago.estado)}
                  </div>
                </div>

                {pago.fecha_pago && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      <strong>Fecha de pago:</strong> {new Date(pago.fecha_pago).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {pago.estado?.toLowerCase() === 'pendiente' && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          if (pago.cuota_id || pago.id) {
                            setSelectedCuotaId(pago.cuota_id || pago.id)
                            setShowQRModal(true)
                          } else {
                            toast.error('No se pudo obtener la información de la cuota')
                          }
                        }}
                      >
                        <QrCode className="h-4 w-4 mr-2" />
                        Pagar con QR
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // TODO: Implementar modal de pago con comprobante
                          toast.info('Próximamente: Subir comprobante de pago')
                        }}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Subir Comprobante
                      </Button>
                    </div>
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-yellow-800">
                          <p className="font-medium mb-1">Importante:</p>
                          <p>Después de realizar el pago, sube el comprobante para que sea verificado. Tu inscripción se validará una vez que el pago sea confirmado.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de QR */}
      <QRModal
        isOpen={showQRModal}
        onClose={() => {
          setShowQRModal(false)
          setSelectedCuotaId(null)
        }}
        cuotaId={selectedCuotaId}
      />
    </div>
  )
}

export default Pagos

