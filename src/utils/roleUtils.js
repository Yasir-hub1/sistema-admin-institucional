/**
 * Utilidades para normalizar y trabajar con roles
 * 
 * El backend usa roles en MAYÚSCULAS (ADMIN, DOCENTE, ESTUDIANTE)
 * El frontend puede usar minúsculas o mayúsculas, pero siempre normalizamos a mayúsculas
 */

/**
 * Roles válidos del sistema (en mayúsculas como en el backend)
 */
export const ROLES = {
  ADMIN: 'ADMIN',
  DOCENTE: 'DOCENTE',
  ESTUDIANTE: 'ESTUDIANTE',
}

/**
 * Mapeo de roles en minúsculas a mayúsculas (para compatibilidad)
 */
const ROLE_MAP = {
  'admin': ROLES.ADMIN,
  'docente': ROLES.DOCENTE,
  'estudiante': ROLES.ESTUDIANTE,
  // También aceptar mayúsculas
  'ADMIN': ROLES.ADMIN,
  'DOCENTE': ROLES.DOCENTE,
  'ESTUDIANTE': ROLES.ESTUDIANTE,
}

/**
 * Normaliza un rol a mayúsculas (formato del backend)
 * @param {string|null|undefined} role - Rol a normalizar
 * @returns {string|null} Rol normalizado o null
 */
export const normalizeRole = (role) => {
  if (!role) return null
  
  const roleStr = String(role).trim()
  return ROLE_MAP[roleStr] || roleStr.toUpperCase()
}

/**
 * Verifica si un rol es válido
 * @param {string} role - Rol a verificar
 * @returns {boolean}
 */
export const isValidRole = (role) => {
  const normalized = normalizeRole(role)
  return Object.values(ROLES).includes(normalized)
}

/**
 * Verifica si el usuario tiene un rol específico
 * @param {string} userRole - Rol del usuario
 * @param {string} requiredRole - Rol requerido
 * @returns {boolean}
 */
export const hasRole = (userRole, requiredRole) => {
  return normalizeRole(userRole) === normalizeRole(requiredRole)
}

/**
 * Verifica si el usuario tiene alguno de los roles especificados
 * @param {string} userRole - Rol del usuario
 * @param {string[]} requiredRoles - Roles requeridos
 * @returns {boolean}
 */
export const hasAnyRole = (userRole, requiredRoles) => {
  if (!Array.isArray(requiredRoles)) return false
  const normalizedUserRole = normalizeRole(userRole)
  return requiredRoles.some(role => normalizeRole(role) === normalizedUserRole)
}

/**
 * Obtiene el nombre legible de un rol
 * @param {string} role - Rol
 * @returns {string}
 */
export const getRoleLabel = (role) => {
  const normalized = normalizeRole(role)
  const labels = {
    [ROLES.ADMIN]: 'Administrador',
    [ROLES.DOCENTE]: 'Docente',
    [ROLES.ESTUDIANTE]: 'Estudiante',
  }
  return labels[normalized] || normalized
}

/**
 * Obtiene el color asociado a un rol (para UI)
 * @param {string} role - Rol
 * @returns {string} Clase de color de Tailwind
 */
export const getRoleColor = (role) => {
  const normalized = normalizeRole(role)
  const colors = {
    [ROLES.ADMIN]: 'bg-red-100 text-red-800',
    [ROLES.DOCENTE]: 'bg-blue-100 text-blue-800',
    [ROLES.ESTUDIANTE]: 'bg-green-100 text-green-800',
  }
  return colors[normalized] || 'bg-gray-100 text-gray-800'
}

/**
 * Obtiene el icono asociado a un rol (para UI)
 * @param {string} role - Rol
 * @returns {string} Nombre del icono
 */
export const getRoleIcon = (role) => {
  const normalized = normalizeRole(role)
  const icons = {
    [ROLES.ADMIN]: 'shield-check',
    [ROLES.DOCENTE]: 'academic-cap',
    [ROLES.ESTUDIANTE]: 'user',
  }
  return icons[normalized] || 'user'
}

/**
 * Filtra roles válidos de un array
 * @param {string[]} roles - Array de roles
 * @returns {string[]} Array de roles válidos normalizados
 */
export const filterValidRoles = (roles) => {
  if (!Array.isArray(roles)) return []
  return roles
    .map(role => normalizeRole(role))
    .filter(role => isValidRole(role))
}

/**
 * Compara dos roles (case-insensitive)
 * @param {string} role1 - Primer rol
 * @param {string} role2 - Segundo rol
 * @returns {boolean}
 */
export const compareRoles = (role1, role2) => {
  return normalizeRole(role1) === normalizeRole(role2)
}

export default {
  ROLES,
  normalizeRole,
  isValidRole,
  hasRole,
  hasAnyRole,
  getRoleLabel,
  getRoleColor,
  getRoleIcon,
  filterValidRoles,
  compareRoles,
}

