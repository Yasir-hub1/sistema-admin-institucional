import React, { createContext, useContext, useReducer, useEffect, useState } from 'react'
import { authService } from '../services/authService'
import { normalizeRole, hasRole, hasAnyRole, ROLES } from '../utils/roleUtils'
import toast from 'react-hot-toast'

export const AuthContext = createContext()

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false, // Cambiar a false inicialmente, se pondrá en true solo cuando se verifique
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
      // Normalizar el rol del usuario para consistencia
      const user = action.payload.user
      if (user && user.rol) {
        user.rol = normalizeRole(user.rol)
      }
      return {
        ...state,
        user: user,
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
  const [isCheckingAuth, setIsCheckingAuth] = useState(false)

  // Verificar autenticación al cargar la app (solo si no hay usuario ya autenticado)
  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('token')
      
      // Si hay token pero no hay usuario en el estado, verificar
      if (token && !state.user && !state.isAuthenticated && !isCheckingAuth) {
        console.log('🔍 checkAuth: Verificando autenticación con token existente')
        dispatch({ type: 'AUTH_START' }) // Marcar como loading
        setIsCheckingAuth(true)
        try {
          await checkAuth()
        } finally {
          setIsCheckingAuth(false)
        }
      } else if (!token) {
        // Si no hay token, marcar como no autenticado inmediatamente
        console.log('🔍 checkAuth: No hay token, marcando como no autenticado')
        dispatch({ type: 'AUTH_FAILURE', payload: null })
      } else if (state.user && state.isAuthenticated) {
        // Si ya hay usuario, solo marcar como no loading
        console.log('🔍 checkAuth: Usuario ya autenticado, no verificar de nuevo')
        dispatch({ type: 'AUTH_CLEAR_ERROR' })
      }
    }
    
    verifyAuth()
  }, []) // Solo ejecutar una vez al montar

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token')
      
      console.log('🔍 checkAuth iniciado, token:', token ? 'Presente' : 'Ausente')
      
      // Si no hay token, marcar como no autenticado
      if (!token) {
        console.log('🔍 checkAuth: No hay token, marcando como no autenticado')
        dispatch({ type: 'AUTH_FAILURE', payload: null })
        return
      }

      // Si ya hay un usuario autenticado en el estado, no verificar de nuevo
      if (state.user && state.isAuthenticated) {
        console.log('🔍 checkAuth: Usuario ya autenticado, saltando verificación')
        dispatch({ type: 'AUTH_CLEAR_ERROR' })
        return
      }

      console.log('🔍 checkAuth: Llamando a getCurrentUser...')
      const response = await authService.getCurrentUser()
      
      console.log('🔍 checkAuth: Respuesta de getCurrentUser:', response)
      
      if (response.success && response.data) {
        // Normalizar el rol del usuario antes de guardarlo
        const userData = response.data.user || response.data
        if (userData && userData.rol) {
          userData.rol = normalizeRole(userData.rol)
        }
        console.log('🔍 checkAuth: Usuario obtenido, guardando en estado:', userData)
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: userData, token }
        })
      } else {
        // Si el token no es válido, limpiar todo y marcar como no autenticado
        console.log('🔍 checkAuth: Token no válido, limpiando sesión')
        localStorage.removeItem('token')
        dispatch({ type: 'AUTH_FAILURE', payload: 'Sesión expirada' })
      }
    } catch (error) {
      console.error('❌ Error checking auth:', error)
      console.error('❌ Error details:', {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data
      })
      
      // Solo limpiar si es un error 401 (no autorizado) o 404 (usuario no encontrado)
      // Si es otro error (red, servidor, etc.), mantener el token y no limpiar
      if (error.response?.status === 401 || error.response?.status === 404 || error.message?.includes('401') || error.message?.includes('404')) {
        console.log('🔍 checkAuth: Error 401/404, limpiando sesión')
        localStorage.removeItem('token')
        dispatch({ type: 'AUTH_FAILURE', payload: 'Sesión expirada' })
      } else {
        // Para otros errores (red, servidor, etc.), mantener el token
        // Solo marcar como no autenticado si no hay usuario en el estado
        if (!state.user) {
          console.log('🔍 checkAuth: Error de conexión, pero manteniendo token para reintentar')
          // No limpiar el token, solo marcar como error temporal
          dispatch({ type: 'AUTH_FAILURE', payload: 'Error de conexión. Reintentando...' })
          
          // Reintentar después de un delay si hay token
          const token = localStorage.getItem('token')
          if (token) {
            setTimeout(() => {
              // Solo reintentar si aún no hay usuario
              if (!state.user && !state.isAuthenticated) {
                console.log('🔍 checkAuth: Reintentando verificación...')
                checkAuth()
              }
            }, 2000)
          }
        } else {
          console.log('🔍 checkAuth: Error pero hay usuario en estado, manteniendo sesión')
        }
      }
    }
  }

  const login = async (credentials) => {
    try {
      dispatch({ type: 'AUTH_START' })
      
      // Prevenir que checkAuth se ejecute durante el login
      setIsCheckingAuth(true)
      
      const response = await authService.login(credentials)
      
      console.log('🔐 Login Response:', response)
      
      if (response.success) {
        // El response.data contiene { token, user, ... }
        const { user, token } = response.data || {}
        
        console.log('👤 User from response:', user)
        console.log('🎫 Token from response:', token ? 'Token presente' : 'Token ausente')
        
        if (!user || !token) {
          console.error('❌ Error: Usuario o token faltante en la respuesta')
          setIsCheckingAuth(false)
          throw new Error('Error: Datos de autenticación incompletos')
        }
        
        // Normalizar el rol antes de guardar
        if (user && user.rol) {
          user.rol = normalizeRole(user.rol)
          console.log('✅ Rol normalizado:', user.rol)
        }
        
        // Guardar token primero
        localStorage.setItem('token', token)
        console.log('✅ Token guardado en localStorage')
        
        // Guardar usuario en el estado
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user, token }
        })
        
        console.log('✅ Usuario autenticado y guardado en estado')
        console.log('✅ Estado después del dispatch:', { user, token, isAuthenticated: true })
        
        // Permitir que checkAuth se ejecute de nuevo después de un delay
        setTimeout(() => {
          setIsCheckingAuth(false)
        }, 1000)
        
        // Mensaje de bienvenida personalizado según el rol
        const nombreCompleto = user.nombre_completo || 
                              (user.nombre && user.apellido ? `${user.nombre} ${user.apellido}`.trim() : user.nombre) ||
                              user.name ||
                              'Usuario'
        toast.success(`Bienvenido, ${nombreCompleto}`)
        return { success: true }
      } else {
        console.error('❌ Login fallido:', response.message)
        setIsCheckingAuth(false)
        throw new Error(response.message || 'Error en el login')
      }
    } catch (error) {
      console.error('❌ Error en login:', error)
      setIsCheckingAuth(false)
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

  const registrar = async (data) => {
    try {
      dispatch({ type: 'AUTH_START' })
      
      const response = await authService.registrarEstudiante(data)
      
      if (response.success) {
        const { user, token } = response.data
        
        localStorage.setItem('token', token)
        
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user, token }
        })
        
        toast.success(response.message || 'Registro exitoso. Bienvenido al sistema')
        return { success: true }
      } else {
        // Manejar errores de validación
        if (response.errors) {
          Object.keys(response.errors).forEach(key => {
            toast.error(`${key}: ${Array.isArray(response.errors[key]) ? response.errors[key][0] : response.errors[key]}`)
          })
        } else {
          toast.error(response.message || 'Error en el registro')
        }
        
        dispatch({
          type: 'AUTH_FAILURE',
          payload: response.message || 'Error en el registro'
        })
        
        return { success: false, error: response.message, errors: response.errors }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al registrar'
      
      // Manejar errores de validación del backend
      if (error.response?.data?.errors) {
        Object.keys(error.response.data.errors).forEach(key => {
          toast.error(`${key}: ${Array.isArray(error.response.data.errors[key]) ? error.response.data.errors[key][0] : error.response.data.errors[key]}`)
        })
      } else {
        toast.error(errorMessage)
      }
      
      dispatch({
        type: 'AUTH_FAILURE',
        payload: errorMessage
      })
      
      return { success: false, error: errorMessage, errors: error.response?.data?.errors }
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

  /**
   * Verifica si el usuario tiene un rol específico
   * @param {string} role - Rol a verificar (puede ser en mayúsculas o minúsculas)
   * @returns {boolean}
   */
  const checkRole = (role) => {
    if (!state.user?.rol) return false
    return hasRole(state.user.rol, role)
  }

  /**
   * Verifica si el usuario tiene alguno de los roles especificados
   * @param {string[]} roles - Array de roles a verificar
   * @returns {boolean}
   */
  const checkAnyRole = (roles) => {
    if (!state.user?.rol || !Array.isArray(roles)) return false
    return hasAnyRole(state.user.rol, roles)
  }

  /**
   * Verifica si el usuario tiene un permiso específico
   * @param {string} permisoNombre - Nombre del permiso (ej: 'estudiantes_ver')
   * @returns {boolean}
   */
  const hasPermission = (permisoNombre) => {
    if (!state.user?.permisos || !Array.isArray(state.user.permisos)) {
      return false
    }
    // Los permisos vienen del backend con 'nombre_permiso'
    return state.user.permisos.some(p => 
      p.nombre_permiso === permisoNombre || p.nombre === permisoNombre
    )
  }

  /**
   * Verifica si el usuario tiene un permiso por módulo y acción
   * @param {string} modulo - Módulo (ej: 'estudiantes')
   * @param {string} accion - Acción (ej: 'ver', 'crear', 'editar', 'eliminar')
   * @returns {boolean}
   */
  const hasPermissionByModuleAction = (modulo, accion) => {
    if (!state.user?.permisos || !Array.isArray(state.user.permisos)) {
      return false
    }
    return state.user.permisos.some(p => 
      p.modulo === modulo && p.accion === accion
    )
  }

  /**
   * Verifica si el usuario tiene alguno de los permisos especificados
   * @param {string[]} permisos - Array de nombres de permisos
   * @returns {boolean}
   */
  const hasAnyPermission = (permisos) => {
    if (!state.user?.permisos || !Array.isArray(state.user.permisos) || !Array.isArray(permisos)) {
      return false
    }
    return permisos.some(permiso => 
      state.user.permisos.some(p => 
        p.nombre_permiso === permiso || p.nombre === permiso
      )
    )
  }

  /**
   * Helpers específicos por rol (usando los roles del backend)
   */
  const isAdmin = () => checkRole(ROLES.ADMIN)
  const isDocente = () => checkRole(ROLES.DOCENTE)
  const isEstudiante = () => checkRole(ROLES.ESTUDIANTE)

  /**
   * Obtiene el rol normalizado del usuario
   * @returns {string|null}
   */
  const getUserRole = () => {
    return normalizeRole(state.user?.rol)
  }

  const value = {
    ...state,
    login,
    logout,
    registrar,
    refreshToken,
    updateProfile,
    clearError,
    // Métodos de verificación de roles (renombrados para evitar conflictos)
    hasRole: checkRole,
    hasAnyRole: checkAnyRole,
    // Métodos de verificación de permisos
    hasPermission,
    hasPermissionByModuleAction,
    hasAnyPermission,
    // Helpers específicos por rol
    isAdmin,
    isDocente,
    isEstudiante,
    // Utilidad para obtener rol normalizado
    getUserRole,
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

