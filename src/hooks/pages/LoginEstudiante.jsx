import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../contexts/AuthContext'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Alert from '../components/common/Alert'
import { 
  Lock, 
  Eye, 
  EyeOff, 
  GraduationCap,
  ArrowLeft,
  UserPlus
} from 'lucide-react'
import { authService } from '../services/authService'
import toast from 'react-hot-toast'

const LoginEstudiante = () => {
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
      const result = await authService.loginEstudiante({
        ci: data.ci,
        password: data.password
      })
      
      if (result.success) {
        // Guardar token
        localStorage.setItem('token', result.data.token)
        
        // Actualizar contexto de autenticación
        const loginResult = await login({
          ci: data.ci,
          password: data.password,
          userType: 'estudiante'
        })
        
        if (loginResult.success) {
          toast.success('Bienvenido al portal estudiantil')
          navigate('/estudiante/dashboard')
        }
      } else {
        setError('root', {
          type: 'manual',
          message: result.message || 'CI o contraseña incorrectos'
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Elementos decorativos */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-200/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-200/30 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link 
            to="/portales" 
            className="inline-flex items-center text-green-600 hover:text-green-700 mb-6 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Volver a portales
          </Link>
          
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
            <GraduationCap className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Portal del Estudiante
          </h1>
          <p className="mt-2 text-gray-600">
            Inicia sesión o regístrate para acceder
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
              <Input
                label="Número de CI"
                type="text"
                placeholder="12345678"
                icon={<GraduationCap className="h-5 w-5" />}
                error={errors.ci?.message}
                {...register('ci', {
                  required: 'El CI es obligatorio',
                  pattern: {
                    value: /^\d+$/,
                    message: 'El CI debe contener solo números'
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
          
          {/* Link a registro */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-center text-gray-600 mb-4">
              ¿No tienes una cuenta?
            </p>
            <Link
              to="/estudiante/registro"
              className="block w-full text-center bg-green-50 text-green-600 py-3 rounded-lg font-semibold hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
            >
              <UserPlus className="h-5 w-5" />
              Crear cuenta de estudiante
            </Link>
          </div>
          
          {/* Información adicional */}
          <div className="mt-4">
            <p className="text-xs text-center text-gray-500">
              ¿Problemas para acceder?{' '}
              <a href="#" className="text-green-600 hover:text-green-700 font-medium">
                Contactar soporte
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginEstudiante

