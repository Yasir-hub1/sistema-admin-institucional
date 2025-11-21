import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Alert from '../components/common/Alert'
import { 
  Lock, 
  Eye, 
  EyeOff, 
  GraduationCap,
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar
} from 'lucide-react'
import { post } from '../services/api'
import toast from 'react-hot-toast'

const RegistroEstudiante = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm()

  const password = watch('password')

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const response = await post('/auth/estudiante/registrar', data)
      
      if (response.data.success) {
        // Guardar token
        localStorage.setItem('token', response.data.token)
        
        toast.success('Registro exitoso. Bienvenido al sistema')
        navigate('/estudiante/dashboard')
      } else {
        toast.error(response.data.message || 'Error en el registro')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al registrar'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Elementos decorativos */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-200/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-200/30 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link 
            to="/estudiante/login" 
            className="inline-flex items-center text-green-600 hover:text-green-700 mb-6 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Volver al login
          </Link>
          
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
            <GraduationCap className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Registro de Estudiante
          </h1>
          <p className="mt-2 text-gray-600">
            Completa el formulario para crear tu cuenta
          </p>
        </div>
        
        {/* Formulario */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Información Personal */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-green-600" />
                Información Personal
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
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
                  label="Nombre"
                  type="text"
                  placeholder="Tu nombre"
                  icon={<User className="h-5 w-5" />}
                  error={errors.nombre?.message}
                  {...register('nombre', {
                    required: 'El nombre es obligatorio'
                  })}
                />
                
                <Input
                  label="Apellido"
                  type="text"
                  placeholder="Tu apellido"
                  icon={<User className="h-5 w-5" />}
                  error={errors.apellido?.message}
                  {...register('apellido', {
                    required: 'El apellido es obligatorio'
                  })}
                />
                
                <Input
                  label="Fecha de Nacimiento"
                  type="date"
                  icon={<Calendar className="h-5 w-5" />}
                  error={errors.fecha_nacimiento?.message}
                  {...register('fecha_nacimiento', {
                    required: 'La fecha de nacimiento es obligatoria'
                  })}
                />
              </div>
            </div>

            {/* Información de Contacto */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Phone className="h-5 w-5 text-green-600" />
                Información de Contacto
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Celular"
                  type="text"
                  placeholder="70000000"
                  icon={<Phone className="h-5 w-5" />}
                  error={errors.celular?.message}
                  {...register('celular', {
                    required: 'El celular es obligatorio'
                  })}
                />
                
                <Input
                  label="Provincia"
                  type="text"
                  placeholder="Santa Cruz"
                  icon={<MapPin className="h-5 w-5" />}
                  error={errors.provincia?.message}
                  {...register('provincia', {
                    required: 'La provincia es obligatoria'
                  })}
                />
              </div>
              
              <div className="mt-4">
                <Input
                  label="Dirección"
                  type="text"
                  placeholder="Tu dirección completa"
                  icon={<MapPin className="h-5 w-5" />}
                  error={errors.direccion?.message}
                  {...register('direccion', {
                    required: 'La dirección es obligatoria'
                  })}
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Lock className="h-5 w-5 text-green-600" />
                Contraseña
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Contraseña"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
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
                      value: 8,
                      message: 'La contraseña debe tener al menos 8 caracteres'
                    },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                      message: 'Debe contener al menos una mayúscula, una minúscula y un número'
                    }
                  })}
                />
                
                <Input
                  label="Confirmar Contraseña"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Repite tu contraseña"
                  icon={<Lock className="h-5 w-5" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  }
                  error={errors.password_confirmation?.message}
                  {...register('password_confirmation', {
                    required: 'Confirma tu contraseña',
                    validate: value => value === password || 'Las contraseñas no coinciden'
                  })}
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                La contraseña debe contener al menos 8 caracteres, una mayúscula, una minúscula y un número
              </p>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                disabled={loading}
              >
                {loading ? 'Registrando...' : 'Crear Cuenta'}
              </Button>
            </div>
          </form>
          
          {/* Link a login */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-center text-gray-600">
              ¿Ya tienes una cuenta?{' '}
              <Link
                to="/estudiante/login"
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegistroEstudiante

