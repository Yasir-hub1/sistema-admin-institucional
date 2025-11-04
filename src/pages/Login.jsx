import React, { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../contexts/AuthContext'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Alert from '../components/common/Alert'
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  GraduationCap, 
  Sparkles,
  Shield,
  Users,
  BookOpen
} from 'lucide-react'

const Login = () => {
  const [showPassword, setShowPassword] = useState(false)
  const { login, isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError
  } = useForm()

  // Si ya está autenticado, redirigir al dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const onSubmit = async (data) => {
    try {
      const result = await login(data)
      
      if (result.success) {
        navigate('/dashboard')
      } else {
        setError('root', {
          type: 'manual',
          message: result.message || 'Error al iniciar sesión'
        })
      }
    } catch (error) {
      setError('root', {
        type: 'manual',
        message: 'Error de conexión. Intenta nuevamente.'
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary-200 dark:border-primary-800 rounded-full animate-spin"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-primary-600 rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary-400/20 to-accent-400/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-accent-400/20 to-primary-400/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-primary-300/10 to-accent-300/10 rounded-full blur-3xl animate-float"></div>
      </div>

      <div className="relative max-w-md w-full space-y-8">
        {/* Header con logo y título */}
        <div className="text-center animate-fade-in-up">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center shadow-glow-lg animate-bounce-in">
            <GraduationCap className="h-10 w-10 text-white" />
          </div>
          <h1 className="mt-6 text-4xl font-bold gradient-text animate-fade-in-up">
            FICCT Sistema
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400 animate-fade-in-up">
            Sistema Académico Inteligente
          </p>
          <div className="mt-4 flex justify-center space-x-2">
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-accent-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
          </div>
        </div>
        
        {/* Formulario de login */}
        <div className="glass-card rounded-3xl p-8 shadow-soft-lg animate-fade-in-up" style={{animationDelay: '0.2s'}}>
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {errors.root && (
              <Alert type="error" title="Error de autenticación">
                {errors.root.message}
              </Alert>
            )}
            
            <div className="space-y-5">
              <Input
                label="Correo electrónico"
                type="email"
                placeholder="tu@email.com"
                icon={<Mail className="h-5 w-5" />}
                error={errors.email?.message}
                {...register('email', {
                  required: 'El email es obligatorio',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'El email no es válido'
                  }
                })}
              />
              
              <Input
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                placeholder="Tu contraseña"
                icon={<Lock className="h-5 w-5" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
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
                icon={<Sparkles className="h-5 w-5" />}
              >
                {isSubmitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </div>
          </form>
          
          {/* Información adicional */}
          <div className="mt-8 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                ¿Problemas para acceder?
              </p>
              <div className="flex justify-center space-x-4">
                <a 
                  href="#" 
                  className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors duration-200 flex items-center gap-1"
                >
                  <Shield className="h-4 w-4" />
                  Soporte técnico
                </a>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <a 
                  href="#" 
                  className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors duration-200 flex items-center gap-1"
                >
                  <Users className="h-4 w-4" />
                  Contactar admin
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Características del sistema */}
        <div className="grid grid-cols-3 gap-4 animate-fade-in-up" style={{animationDelay: '0.4s'}}>
          <div className="text-center p-4 glass rounded-2xl">
            <Users className="h-6 w-6 text-primary-500 mx-auto mb-2" />
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Gestión de Usuarios</p>
          </div>
          <div className="text-center p-4 glass rounded-2xl">
            <BookOpen className="h-6 w-6 text-accent-500 mx-auto mb-2" />
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Control Académico</p>
          </div>
          <div className="text-center p-4 glass rounded-2xl">
            <Shield className="h-6 w-6 text-success-500 mx-auto mb-2" />
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Seguridad Avanzada</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
