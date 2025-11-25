import React, { useState, useEffect } from 'react'
import Modal from '../common/Modal'
import { QrCode, Copy, CheckCircle, Loader2 } from 'lucide-react'
import { get } from '../../services/api'
import toast from 'react-hot-toast'

const QRModal = ({ isOpen, onClose, cuotaId }) => {
  const [qrInfo, setQrInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (isOpen && cuotaId) {
      fetchQRInfo()
    } else {
      setQrInfo(null)
      setCopied(false)
    }
  }, [isOpen, cuotaId])

  const fetchQRInfo = async () => {
    try {
      setLoading(true)
      const response = await get(`/estudiante/pagos/${cuotaId}/info-qr`)
      
      if (response.data.success) {
        setQrInfo(response.data.data)
      } else {
        toast.error(response.data.message || 'Error al obtener información del QR')
      }
    } catch (error) {
      console.error('Error fetching QR info:', error)
      toast.error('Error al obtener información del QR')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Copiado al portapapeles')
    setTimeout(() => setCopied(false), 2000)
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB'
    }).format(amount || 0)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pago por QR"
      size="md"
    >
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      ) : qrInfo ? (
        <div className="space-y-6">
          {/* Información del pago */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Monto:</span>
              <span className="font-bold text-lg text-gray-900">
                {formatCurrency(qrInfo.monto)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Concepto:</span>
              <span className="text-gray-900">{qrInfo.concepto}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Referencia:</span>
              <span className="text-gray-900 font-mono text-sm">{qrInfo.referencia}</span>
            </div>
          </div>

          {/* QR Code Placeholder (estático por ahora) */}
          <div className="flex flex-col items-center space-y-4">
            <div className="bg-white p-6 rounded-lg border-2 border-gray-200 shadow-lg">
              <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <QrCode className="h-32 w-32 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">QR Code</p>
                  <p className="text-xs text-gray-400 mt-1">(Próximamente)</p>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 text-center max-w-sm">
              Escanea este código QR con tu aplicación bancaria para realizar el pago
            </p>
          </div>

          {/* Información de referencia */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Instrucciones:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
              <li>Abre tu aplicación bancaria</li>
              <li>Selecciona la opción de pago por QR</li>
              <li>Escanea el código QR mostrado arriba</li>
              <li>Verifica el monto y confirma el pago</li>
              <li>Guarda el comprobante y súbelo en el sistema</li>
            </ol>
          </div>

          {/* Referencia para copiar */}
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Referencia de pago:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={qrInfo.referencia}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
              />
              <button
                onClick={() => copyToClipboard(qrInfo.referencia)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copiar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600">No se pudo cargar la información del QR</p>
        </div>
      )}
    </Modal>
  )
}

export default QRModal

