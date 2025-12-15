import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../contexts/AuthContext'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Alert from '../../components/common/Alert'
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User,
  ArrowLeft
} from 'lucide-react'
import { authService } from '../../services/authService'
import toast from 'react-hot-toast'

const LoginDocente = () => {
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError
  } = useForm()

  const onSubmit = async (data) => {
    try {
      console.log('🔐 [DOCENTE] Iniciando login...', { input: data.email })
      
      // Detectar si es email o CI
      const inputValue = data.email?.trim()
      if (!inputValue || !data.password) {
        throw new Error('Email/CI y contraseña son requeridos')
      }
      
      const isEmail = inputValue.includes('@')
      
      // Preparar credenciales según el tipo detectado
      const credentials = {
        password: data.password
      }
      
      if (isEmail) {
        credentials.email = inputValue
        console.log('   → Tipo: EMAIL -', inputValue)
      } else {
        credentials.ci = inputValue
        console.log('   → Tipo: CI -', inputValue)
      }
      
      console.log('   → Enviando petición a /auth/docente/login...')
      
      // Llamar al endpoint de login de docentes
      const result = await authService.loginDocente(credentials)
      
      console.log('   → Respuesta:', {
        success: result.success,
        hasToken: !!result.data?.token,
        hasUser: !!result.data?.user,
        debeCambiar: result.data?.debe_cambiar_password
      })
      
      // Verificar que la respuesta sea exitosa
      if (!result.success) {
        console.error('   ❌ Login fallido:', result.message)
        throw new Error(result.message || 'Error al iniciar sesión')
      }
      
      // Verificar que tengamos los datos necesarios
      if (!result.data?.token || !result.data?.user) {
        console.error('   ❌ Respuesta incompleta:', result.data)
        throw new Error('Respuesta del servidor incompleta')
      }
      
      console.log('   ✅ Login exitoso')
      
      // Verificar si debe cambiar contraseña
      const debeCambiar = result.data.debe_cambiar_password || result.data.user.debe_cambiar_password
      console.log('   → Debe cambiar contraseña:', debeCambiar)
      
      // Guardar token SIEMPRE (necesario para la API)
      localStorage.setItem('token', result.data.token)
      console.log('   → Token guardado en localStorage')
      
      if (debeCambiar) {
        // Caso 1: Requiere cambio de contraseña
        console.log('   → Redirigiendo a cambiar contraseña...')
        
        // toast.warning NO existe en react-hot-toast
        // Usar toast con icon personalizado para simular warning
        toast('Debes cambiar tu contraseña antes de continuar', { 
          duration: 5000,
          icon: '⚠️',
          style: {
            background: '#FEF3C7',
            color: '#92400E',
            border: '1px solid #FCD34D'
          }
        })
        
        // Pequeño delay para asegurar que el token se guardó
        setTimeout(() => {
          navigate('/docente/cambiar-password', { 
            state: { 
              requiereCambio: true,
              mensaje: 'Por seguridad, debes cambiar tu contraseña temporal antes de continuar.',
              fromLogin: true
            },
            replace: true  // Reemplazar en history para evitar volver atrás
          })
        }, 100)
      } else {
        // Caso 2: Login normal, ir al dashboard
        console.log('   → Redirigiendo al dashboard...')
        toast.success(`Bienvenido, ${result.data.user.nombre} ${result.data.user.apellido}`.trim())
        
        // Pequeño delay para asegurar que el token se guardó
        setTimeout(() => {
          navigate('/docente/dashboard', { replace: true })
        }, 100)
      }
      
    } catch (error) {
      console.error('❌ [DOCENTE] Error en login:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
      
      // Mostrar error específico
      const errorMessage = error.response?.data?.message || error.message || 'Error de conexión. Verifica tu conexión e intenta nuevamente.'
      
      setError('root', {
        type: 'manual',
        message: errorMessage
      })
      
      toast.error(errorMessage)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Elementos decorativos */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link 
            to="/portales" 
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Volver a portales
          </Link>
          
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
            <User className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Portal del Docente
          </h1>
          <p className="mt-2 text-gray-600">
            Inicia sesión para acceder a tu portal
          </p>
        </div>
        
        {/* Formulario */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {errors.root && (
              <Alert type="error" title="Error de autenticación">
                {errors.root.message}
              </Alert>
            )}
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email o CI
                </label>
                <Input
                  type="text"
                  placeholder="tu@email.com o tu CI"
                  icon={<Mail className="h-5 w-5" />}
                  error={errors.email?.message || errors.ci?.message}
                  {...register('email', {
                    required: 'El email o CI es obligatorio'
                  })}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Puedes usar tu email o número de CI
                </p>
              </div>
              
              <Input
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                placeholder="Tu contraseña"
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
                error={errors.password?.message}
                {...register('password', {
                  required: 'La contraseña es obligatoria',
                  minLength: {
                    value: 6,
                    message: 'La contraseña debe tener al menos 6 caracteres'
                  }
                })}
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </div>
          </form>
          
          {/* Información adicional */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-center text-gray-600">
              ¿Problemas para acceder?{' '}
              <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                Contactar soporte
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginDocente

