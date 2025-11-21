import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { normalizeRole, hasAnyRole, ROLES } from '../../utils/roleUtils'
import LoadingSpinner from '../common/LoadingSpinner'

function ProtectedRoute({ children, requiredRoles = [] }) {
  const { isAuthenticated, loading, user } = useAuth()
  const location = useLocation()
  const [isInitialCheck, setIsInitialCheck] = React.useState(true)

  // Debug logging
  React.useEffect(() => {
    console.log('🛡️ ProtectedRoute:', {
      path: location.pathname,
      isAuthenticated,
      loading,
      user: user ? { id: user.id, rol: user.rol } : null,
      requiredRoles,
      isInitialCheck
    })
  }, [location.pathname, isAuthenticated, loading, user, requiredRoles, isInitialCheck])

  // Verificar si hay token en localStorage para determinar si debemos esperar
  React.useEffect(() => {
    const token = localStorage.getItem('token')
    if (token && !user && !isAuthenticated) {
      // Hay token pero no hay usuario, esperar a que checkAuth termine
      setIsInitialCheck(true)
    } else {
      // No hay token o ya hay usuario, no esperar más
      setIsInitialCheck(false)
    }
  }, [user, isAuthenticated])

  // Mostrar loading mientras se verifica la autenticación o si hay token pero no usuario
  if (loading || (isInitialCheck && localStorage.getItem('token') && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  // Si no está autenticado, redirigir al login según la ruta o rol requerido
  if (!isAuthenticated) {
    // Determinar a qué login redirigir según la ruta actual o rol requerido
    let loginPath = '/login'
    
    if (requiredRoles.length > 0) {
      const normalizedRequiredRole = normalizeRole(requiredRoles[0])
      if (normalizedRequiredRole === ROLES.ESTUDIANTE) {
        loginPath = '/estudiante/login'
      } else if (normalizedRequiredRole === ROLES.DOCENTE) {
        loginPath = '/docente/login'
      }
    } else if (location.pathname.startsWith('/estudiante')) {
      loginPath = '/estudiante/login'
    } else if (location.pathname.startsWith('/docente')) {
      loginPath = '/docente/login'
    }
    
    return <Navigate to={loginPath} state={{ from: location }} replace />
  }

  // Si se requieren roles específicos, verificar que el usuario tenga al menos uno
  if (requiredRoles.length > 0) {
    const userRole = normalizeRole(user?.rol)
    const hasRequiredRole = hasAnyRole(userRole, requiredRoles)
    
    if (!hasRequiredRole) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-error-100">
              <svg
                className="h-6 w-6 text-error-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="mt-4 text-lg font-medium text-gray-900">
              Acceso denegado
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              No tienes permisos para acceder a esta página.
            </p>
            <div className="mt-6">
              <button
                onClick={() => window.history.back()}
                className="btn btn-primary"
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      )
    }
  }

  return children
}

export default ProtectedRoute
