import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle, Shield, XCircle } from 'lucide-react'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Card from '../../components/common/Card'
import Modal from '../../components/common/Modal'
import { docentePerfilService } from '../../services/docenteService'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

const CambiarPassword = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordNuevo, setShowPasswordNuevo] = useState(false)
  const [showPasswordConfirmacion, setShowPasswordConfirmacion] = useState(false)
  const [requiereCambio, setRequiereCambio] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm()

  const passwordNuevo = watch('password_nuevo')
  
  // Validación en tiempo real
  const validaciones = {
    longitud: passwordNuevo?.length >= 8,
    mayuscula: /[A-Z]/.test(passwordNuevo),
    minuscula: /[a-z]/.test(passwordNuevo),
    numero: /\d/.test(passwordNuevo)
  }
  
  const passwordValida = validaciones.longitud && validaciones.mayuscula && validaciones.minuscula && validaciones.numero

  useEffect(() => {
    console.log('🔐 CambiarPassword - Verificando estado:')
    console.log('   - location.state:', location.state)
    console.log('   - fromLogin:', location.state?.fromLogin)
    console.log('   - requiereCambio desde state:', location.state?.requiereCambio)
    
    // Si viene del login con el flag fromLogin, mostrar inmediatamente sin verificar
    if (location.state?.fromLogin && location.state?.requiereCambio) {
      console.log('   ✅ Requiere cambio (desde login) - MOSTRANDO INMEDIATAMENTE')
      setRequiereCambio(true)
      setIsCheckingAuth(false)
      return
    }
    
    // Verificar si viene con requerimiento de cambio (pero no desde login)
    if (location.state?.requiereCambio) {
      console.log('   ✅ Requiere cambio (desde state)')
      setRequiereCambio(true)
      setIsCheckingAuth(false)
    } else {
      console.log('   → Verificando en perfil...')
      // Verificar en el perfil del usuario
      verificarEstadoPassword()
    }
  }, [])

  const verificarEstadoPassword = async () => {
    try {
      setIsCheckingAuth(true)
      const response = await docentePerfilService.getPerfil()
      console.log('   - Respuesta del perfil:', response)
      console.log('   - debe_cambiar_password:', response.data?.debe_cambiar_password)
      
      if (response.success && response.data?.debe_cambiar_password) {
        console.log('   ✅ Requiere cambio (desde perfil)')
        setRequiereCambio(true)
      } else if (!response.success) {
        console.log('   ❌ Error obteniendo perfil - redirigiendo a login')
        // Si no puede obtener el perfil, probablemente no está autenticado
        navigate('/docente/login')
      } else {
        console.log('   → No requiere cambio - redirigiendo a dashboard')
        navigate('/docente/dashboard')
      }
    } catch (error) {
      console.error('Error verificando estado de contraseña:', error)
      navigate('/docente/login')
    } finally {
      setIsCheckingAuth(false)
    }
  }

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      console.log('🔐 [CAMBIAR PASSWORD] Iniciando...')
      console.log('   - Datos a enviar:', {
        password_actual: '***',
        password_nuevo: '*** (longitud: ' + data.password_nuevo?.length + ')',
        password_nuevo_confirmacion: '*** (longitud: ' + data.password_nuevo_confirmacion?.length + ')',
        coinciden: data.password_nuevo === data.password_nuevo_confirmacion
      })
      
      const response = await docentePerfilService.cambiarPassword({
        password_actual: data.password_actual,
        password_nuevo: data.password_nuevo,
        password_nuevo_confirmacion: data.password_nuevo_confirmacion
      })

      console.log('   → Respuesta del backend:', {
        success: response.success,
        message: response.message,
        hasErrors: !!response.errors
      })

      if (response.success) {
        console.log('   ✅ Contraseña cambiada exitosamente')
        console.log('   → El backend actualizó debe_cambiar_password a false')
        
        // Actualizar estados
        setRequiereCambio(false)
        
        // Mostrar toast de éxito
        toast.success('¡Contraseña cambiada exitosamente!', { 
          duration: 3000,
          icon: '✅'
        })
        
        // Redirigir INMEDIATAMENTE al dashboard
        console.log('   → Redirigiendo al dashboard AHORA...')
        
        // Usar window.location para forzar recarga completa y evitar que se quede en la página
        setTimeout(() => {
          window.location.href = '/docente/dashboard'
        }, 800)
      } else {
        console.error('   ❌ Error del backend:', {
          message: response.message,
          errors: response.errors
        })
        
        // Mostrar mensaje principal
        toast.error(response.message || 'Error al cambiar contraseña')
        
        // Mostrar errores específicos de validación
        if (response.errors) {
          Object.keys(response.errors).forEach(key => {
            const errorMessages = Array.isArray(response.errors[key]) 
              ? response.errors[key] 
              : [response.errors[key]]
            
            errorMessages.forEach(msg => {
              console.error(`   ❌ Error en ${key}:`, msg)
              toast.error(msg, { duration: 5000 })
            })
          })
        }
      }
    } catch (error) {
      console.error('❌ [CAMBIAR PASSWORD] Error en la petición:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
      
      const errorMessage = error.response?.data?.message || error.message || 'Error al cambiar contraseña'
      toast.error(errorMessage, { duration: 6000 })
      
      // Si hay errores de validación del backend, mostrarlos
      if (error.response?.data?.errors) {
        Object.keys(error.response.data.errors).forEach(key => {
          const errors = error.response.data.errors[key]
          const errorMessages = Array.isArray(errors) ? errors : [errors]
          errorMessages.forEach(msg => {
            console.error(`   ❌ Error en ${key}:`, msg)
            toast.error(msg, { duration: 5000 })
          })
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleContinuar = () => {
    console.log('   → Click en Continuar - Redirigiendo inmediatamente...')
    setShowSuccessModal(false)
    
    // Forzar recarga completa para asegurar que el estado se actualice
    window.location.href = '/docente/dashboard'
  }

  // Mostrar spinner solo si está verificando Y NO viene del login
  if (isCheckingAuth && !location.state?.fromLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Verificando...</p>
        </div>
      </div>
    )
  }

  if (!requiereCambio) {
    // Si no requiere cambio, redirigir al dashboard
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card className="gradient" shadow="glow-lg">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg mb-4">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold gradient-text mb-2">
              Cambio de Contraseña Requerido
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {location.state?.mensaje || 'Por seguridad, debes cambiar tu contraseña temporal antes de continuar.'}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-1">
                    Importante
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-400">
                    Tu nueva contraseña debe tener al menos 8 caracteres, incluyendo una mayúscula, una minúscula y un número.
                  </p>
                </div>
              </div>
            </div>

            <Input
              label="Contraseña Actual *"
              type={showPassword ? 'text' : 'password'}
              placeholder="Ingresa tu contraseña temporal"
              icon={<Lock className="h-5 w-5" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              }
              error={errors.password_actual?.message}
              {...register('password_actual', {
                required: 'La contraseña actual es obligatoria'
              })}
            />

            <div className="space-y-2">
              <Input
                label="Nueva Contraseña *"
                type={showPasswordNuevo ? 'text' : 'password'}
                placeholder="Mínimo 8 caracteres (mayúscula, minúscula, número)"
                icon={<Lock className="h-5 w-5" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPasswordNuevo(!showPasswordNuevo)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPasswordNuevo ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                }
                error={errors.password_nuevo?.message}
                {...register('password_nuevo', {
                  required: 'La nueva contraseña es obligatoria',
                  minLength: {
                    value: 8,
                    message: 'La contraseña debe tener al menos 8 caracteres'
                  },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
                    message: 'Debe contener al menos una mayúscula, una minúscula y un número'
                  }
                })}
              />
              
              {/* Indicadores de validación en tiempo real */}
              {passwordNuevo && passwordNuevo.length > 0 && (
                <div className="px-1 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs">
                    {validaciones.longitud ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className={validaciones.longitud ? 'text-green-600' : 'text-gray-500'}>
                      Mínimo 8 caracteres
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {validaciones.mayuscula ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className={validaciones.mayuscula ? 'text-green-600' : 'text-gray-500'}>
                      Al menos una letra MAYÚSCULA
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {validaciones.minuscula ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className={validaciones.minuscula ? 'text-green-600' : 'text-gray-500'}>
                      Al menos una letra minúscula
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {validaciones.numero ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className={validaciones.numero ? 'text-green-600' : 'text-gray-500'}>
                      Al menos un número
                    </span>
                  </div>
                </div>
              )}
            </div>

            <Input
              label="Confirmar Nueva Contraseña *"
              type={showPasswordConfirmacion ? 'text' : 'password'}
              placeholder="Repite tu nueva contraseña"
              icon={<Lock className="h-5 w-5" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirmacion(!showPasswordConfirmacion)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPasswordConfirmacion ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              }
              error={errors.password_nuevo_confirmacion?.message}
              {...register('password_nuevo_confirmacion', {
                required: 'La confirmación de contraseña es obligatoria',
                validate: (value) => 
                  value === passwordNuevo || 'Las contraseñas no coinciden'
              })}
            />

            <div className="pt-4">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                icon={<Shield className="h-5 w-5" />}
                loading={loading}
                disabled={loading}
              >
                {loading ? 'Cambiando contraseña...' : 'Cambiar Contraseña'}
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Modal de éxito */}
      <Modal
        isOpen={showSuccessModal}
        onClose={handleContinuar}
        title="Contraseña Cambiada Exitosamente"
        size="md"
      >
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              ¡Contraseña actualizada!
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Tu contraseña ha sido cambiada exitosamente. Ahora puedes acceder a tu portal.
            </p>
          </div>
          <Button
            variant="primary"
            fullWidth
            onClick={handleContinuar}
            icon={<CheckCircle className="h-5 w-5" />}
          >
            Continuar al Portal
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default CambiarPassword

