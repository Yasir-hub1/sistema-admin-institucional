import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

/**
 * Componente para proteger rutas basadas en roles
 * @param {Object} props - Propiedades del componente
 * @param {Array} props.allowedRoles - Roles permitidos para acceder a la ruta
 * @param {React.ReactNode} props.children - Componentes hijos
 * @returns {React.ReactNode} Componente protegido o redirección
 */
const RoleBasedRoute = ({ allowedRoles = [], children }) => {
  const { user, isAuthenticated } = useAuth()

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Si no hay roles especificados, permitir acceso
  if (!allowedRoles || allowedRoles.length === 0) {
    return children
  }

  // Verificar si el usuario tiene alguno de los roles permitidos
  const hasPermission = user?.rol && allowedRoles.includes(user.rol)

  if (!hasPermission) {
    // Redirigir al dashboard si no tiene permisos
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default RoleBasedRoute
