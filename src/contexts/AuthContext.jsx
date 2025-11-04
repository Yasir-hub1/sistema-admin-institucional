import { createContext, useContext, useReducer, useEffect } from 'react'
import { authService } from '../services/authService'
import toast from 'react-hot-toast'

export const AuthContext = createContext()

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,
  error: null
}

function authReducer(state, action) {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        loading: true,
        error: null
      }
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        error: null
      }
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload
      }
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null
      }
    case 'AUTH_CLEAR_ERROR':
      return {
        ...state,
        error: null
      }
    default:
      return state
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Verificar autenticación al cargar la app
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token')
      
      // Si no hay token, marcar como no autenticado
      if (!token) {
        dispatch({ type: 'AUTH_FAILURE', payload: null })
        return
      }

      const response = await authService.getCurrentUser()
      
      if (response.success && response.data) {
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: response.data.user || response.data, token }
        })
      } else {
        // Si el token no es válido, limpiar todo y marcar como no autenticado
        localStorage.removeItem('token')
        dispatch({ type: 'AUTH_FAILURE', payload: 'Sesión expirada' })
      }
    } catch (error) {
      console.error('Error checking auth:', error)
      // Si hay error (token inválido, servidor no responde, etc.), limpiar y marcar como no autenticado
      localStorage.removeItem('token')
      dispatch({ type: 'AUTH_FAILURE', payload: 'Error de autenticación' })
    }
  }

  const login = async (credentials) => {
    try {
      dispatch({ type: 'AUTH_START' })
      
      const response = await authService.login(credentials)
      
      if (response.success) {
        const { user, token } = response.data
        
        localStorage.setItem('token', token)
        
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user, token }
        })
        
        toast.success(`Bienvenido, ${user.nombre_completo}`)
        return { success: true }
      } else {
        throw new Error(response.message || 'Error en el login')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error en el login'
      
      dispatch({
        type: 'AUTH_FAILURE',
        payload: errorMessage
      })
      
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const logout = async () => {
    try {
      // Intentar hacer logout en el backend solo si hay token
      const token = localStorage.getItem('token')
      if (token) {
        try {
          await authService.logout()
        } catch (error) {
          // Si falla el logout del backend, continuar con la limpieza local
          console.error('Error during backend logout:', error)
        }
      }
    } catch (error) {
      console.error('Error during logout:', error)
    } finally {
      // Limpiar TODO lo relacionado con la sesión
      localStorage.removeItem('token')
      sessionStorage.clear()
      
      // Limpiar cualquier caché de React Query si está disponible
      if (window.queryClient) {
        window.queryClient.clear()
      }
      
      // Despachar acción de logout
      dispatch({ type: 'AUTH_LOGOUT' })
      
      toast.success('Sesión cerrada exitosamente')
      
      // Redirigir al login después de un pequeño delay para que el toast se muestre
      setTimeout(() => {
        window.location.href = '/login'
      }, 500)
    }
  }

  const refreshToken = async () => {
    try {
      const response = await authService.refreshToken()
      
      if (response.success) {
        const { token } = response.data
        localStorage.setItem('token', token)
        
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: state.user, token }
        })
        
        return { success: true }
      } else {
        throw new Error(response.message || 'Error al refrescar token')
      }
    } catch (error) {
      console.error('Error refreshing token:', error)
      logout()
      return { success: false }
    }
  }

  const updateProfile = async (data) => {
    try {
      const response = await authService.updateProfile(data)
      
      if (response.success) {
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { 
            user: response.data.user, 
            token: state.token 
          }
        })
        
        toast.success('Perfil actualizado exitosamente')
        return { success: true }
      } else {
        throw new Error(response.message || 'Error al actualizar perfil')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al actualizar perfil'
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const clearError = () => {
    dispatch({ type: 'AUTH_CLEAR_ERROR' })
  }

  const hasRole = (role) => {
    return state.user?.rol === role
  }

  const hasAnyRole = (roles) => {
    return roles.includes(state.user?.rol)
  }

  const hasPermission = (permisoNombre) => {
    if (!state.user?.permisos || !Array.isArray(state.user.permisos)) {
      return false
    }
    return state.user.permisos.some(p => p.nombre === permisoNombre)
  }

  const hasPermissionByModuleAction = (modulo, accion) => {
    if (!state.user?.permisos || !Array.isArray(state.user.permisos)) {
      return false
    }
    return state.user.permisos.some(p => p.modulo === modulo && p.accion === accion)
  }

  const hasAnyPermission = (permisos) => {
    if (!state.user?.permisos || !Array.isArray(state.user.permisos)) {
      return false
    }
    return permisos.some(permiso => 
      state.user.permisos.some(p => p.nombre === permiso)
    )
  }

  const isAdmin = () => hasRole('admin')
  const isCoordinador = () => hasRole('coordinador')
  const isDocente = () => hasRole('docente')
  const isAutoridad = () => hasRole('autoridad')

  const value = {
    ...state,
    login,
    logout,
    refreshToken,
    updateProfile,
    clearError,
    hasRole,
    hasAnyRole,
    hasPermission,
    hasPermissionByModuleAction,
    hasAnyPermission,
    isAdmin,
    isCoordinador,
    isDocente,
    isAutoridad
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

