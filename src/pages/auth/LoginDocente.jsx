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
  const { login } = useAuth()
  const navigate = useNavigate()
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError
  } = useForm()

  const onSubmit = async (data) => {
    try {
      // Usar loginAdmin para docentes (comparten el mismo endpoint)
      const result = await authService.loginAdmin({
        ...data,
        userType: 'admin' // Indica que es admin/docente
      })
      
      if (result.success) {
        // Guardar token
        localStorage.setItem('token', result.data.token)
        
        // Actualizar contexto de autenticación
        // El método login del contexto espera las credenciales y maneja el token internamente
        const loginResult = await login({
          email: data.email || data.ci,
          password: data.password,
          userType: 'admin'
        })
        
        if (loginResult.success) {
          toast.success('Bienvenido al portal docente')
          navigate('/docente/dashboard')
        }
      } else {
        setError('root', {
          type: 'manual',
          message: result.message || 'Error al iniciar sesión'
        })
        toast.error(result.message || 'Error al iniciar sesión')
      }
    } catch (error) {
      setError('root', {
        type: 'manual',
        message: 'Error de conexión. Intenta nuevamente.'
      })
      toast.error('Error de conexión')
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

