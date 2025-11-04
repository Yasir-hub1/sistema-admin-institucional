// Servicio de autenticación

import { get, post, put } from './api'
import { MESSAGES } from '../utils/constants'

/**
 * Servicio de autenticación
 */
export const authService = {
  /**
   * Iniciar sesión
   * @param {object} credentials - Credenciales de login
   * @param {string} credentials.email - Email del usuario
   * @param {string} credentials.password - Contraseña
   * @returns {Promise<object>} Respuesta con token y usuario
   */
  async login(credentials) {
    try {
      const response = await post('/auth/login', credentials)
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: MESSAGES.SUCCESS.LOGIN
        }
      } else {
        return {
          success: false,
          message: response.data.message || MESSAGES.ERROR.LOGIN
        }
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || MESSAGES.ERROR.LOGIN
      }
    }
  },

  /**
   * Cerrar sesión
   * @returns {Promise<object>} Respuesta del logout
   */
  async logout() {
    try {
      // Intentar hacer logout en el backend, pero no bloquear si falla
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const response = await post('/auth/logout')
          return {
            success: true,
            message: MESSAGES.SUCCESS.LOGOUT
          }
        } catch (error) {
          // Incluso si hay error en el backend, consideramos el logout exitoso
          // El frontend limpiará todo localmente
          return {
            success: true,
            message: MESSAGES.SUCCESS.LOGOUT
          }
        }
      }
      
      return {
        success: true,
        message: MESSAGES.SUCCESS.LOGOUT
      }
    } catch (error) {
      // Incluso si hay error, consideramos el logout exitoso
      return {
        success: true,
        message: MESSAGES.SUCCESS.LOGOUT
      }
    }
  },

  /**
   * Obtener usuario actual
   * @returns {Promise<object>} Datos del usuario actual
   */
  async getCurrentUser() {
    try {
      const response = await get('/auth/me')
      
      if (response.data.success && response.data.data) {
        return {
          success: true,
          data: response.data.data
        }
      } else {
        // Si no hay datos válidos, lanzar error para que se limpie la sesión
        throw new Error(response.data.message || 'Error al obtener usuario')
      }
    } catch (error) {
      // Si es 401 o cualquier error, lanzar para que se limpie
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        sessionStorage.clear()
      }
      throw new Error(error.message || 'Error al obtener usuario')
    }
  },

  /**
   * Refrescar token
   * @returns {Promise<object>} Nuevo token
   */
  async refreshToken() {
    try {
      const response = await post('/auth/refresh')
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data
        }
      } else {
        throw new Error(response.data.message || 'Error al refrescar token')
      }
    } catch (error) {
      throw new Error(error.message || 'Error al refrescar token')
    }
  },

  /**
   * Actualizar perfil de usuario
   * @param {object} data - Datos del perfil
   * @returns {Promise<object>} Usuario actualizado
   */
  async updateProfile(data) {
    try {
      const response = await put('/auth/profile', data)
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: MESSAGES.SUCCESS.UPDATE
        }
      } else {
        return {
          success: false,
          message: response.data.message || MESSAGES.ERROR.UPDATE
        }
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || MESSAGES.ERROR.UPDATE
      }
    }
  },

  /**
   * Cambiar contraseña
   * @param {object} data - Datos del cambio de contraseña
   * @param {string} data.current_password - Contraseña actual
   * @param {string} data.new_password - Nueva contraseña
   * @param {string} data.new_password_confirmation - Confirmación de nueva contraseña
   * @returns {Promise<object>} Respuesta del cambio
   */
  async changePassword(data) {
    try {
      const response = await put('/auth/change-password', data)
      
      if (response.data.success) {
        return {
          success: true,
          message: 'Contraseña actualizada exitosamente'
        }
      } else {
        return {
          success: false,
          message: response.data.message || 'Error al cambiar contraseña'
        }
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Error al cambiar contraseña'
      }
    }
  },

  /**
   * Solicitar restablecimiento de contraseña
   * @param {string} email - Email del usuario
   * @returns {Promise<object>} Respuesta de la solicitud
   */
  async requestPasswordReset(email) {
    try {
      const response = await post('/auth/forgot-password', { email })
      
      if (response.data.success) {
        return {
          success: true,
          message: 'Se ha enviado un enlace de restablecimiento a tu email'
        }
      } else {
        return {
          success: false,
          message: response.data.message || 'Error al solicitar restablecimiento'
        }
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Error al solicitar restablecimiento'
      }
    }
  },

  /**
   * Restablecer contraseña
   * @param {object} data - Datos del restablecimiento
   * @param {string} data.token - Token de restablecimiento
   * @param {string} data.email - Email del usuario
   * @param {string} data.password - Nueva contraseña
   * @param {string} data.password_confirmation - Confirmación de nueva contraseña
   * @returns {Promise<object>} Respuesta del restablecimiento
   */
  async resetPassword(data) {
    try {
      const response = await post('/auth/reset-password', data)
      
      if (response.data.success) {
        return {
          success: true,
          message: 'Contraseña restablecida exitosamente'
        }
      } else {
        return {
          success: false,
          message: response.data.message || 'Error al restablecer contraseña'
        }
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Error al restablecer contraseña'
      }
    }
  },

  /**
   * Verificar token de restablecimiento
   * @param {string} token - Token a verificar
   * @returns {Promise<object>} Respuesta de la verificación
   */
  async verifyResetToken(token) {
    try {
      const response = await get(`/auth/verify-reset-token/${token}`)
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data
        }
      } else {
        return {
          success: false,
          message: response.data.message || 'Token inválido'
        }
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Token inválido'
      }
    }
  },

  /**
   * Verificar email
   * @param {string} token - Token de verificación
   * @returns {Promise<object>} Respuesta de la verificación
   */
  async verifyEmail(token) {
    try {
      const response = await post('/auth/verify-email', { token })
      
      if (response.data.success) {
        return {
          success: true,
          message: 'Email verificado exitosamente'
        }
      } else {
        return {
          success: false,
          message: response.data.message || 'Error al verificar email'
        }
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Error al verificar email'
      }
    }
  },

  /**
   * Reenviar email de verificación
   * @returns {Promise<object>} Respuesta del reenvío
   */
  async resendVerificationEmail() {
    try {
      const response = await post('/auth/resend-verification')
      
      if (response.data.success) {
        return {
          success: true,
          message: 'Email de verificación reenviado'
        }
      } else {
        return {
          success: false,
          message: response.data.message || 'Error al reenviar email'
        }
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Error al reenviar email'
      }
    }
  },

  /**
   * Obtener permisos del usuario
   * @returns {Promise<object>} Permisos del usuario
   */
  async getPermissions() {
    try {
      const response = await get('/auth/permissions')
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data
        }
      } else {
        throw new Error(response.data.message || 'Error al obtener permisos')
      }
    } catch (error) {
      throw new Error(error.message || 'Error al obtener permisos')
    }
  },

  /**
   * Verificar si el usuario tiene un permiso específico
   * @param {string} permission - Permiso a verificar
   * @returns {Promise<boolean>} True si tiene el permiso
   */
  async hasPermission(permission) {
    try {
      const response = await get(`/auth/has-permission/${permission}`)
      return response.data.success && response.data.data.has_permission
    } catch (error) {
      return false
    }
  },

  /**
   * Obtener roles del usuario
   * @returns {Promise<object>} Roles del usuario
   */
  async getRoles() {
    try {
      const response = await get('/auth/roles')
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data
        }
      } else {
        throw new Error(response.data.message || 'Error al obtener roles')
      }
    } catch (error) {
      throw new Error(error.message || 'Error al obtener roles')
    }
  },

  /**
   * Verificar si el usuario tiene un rol específico
   * @param {string} role - Rol a verificar
   * @returns {Promise<boolean>} True si tiene el rol
   */
  async hasRole(role) {
    try {
      const response = await get(`/auth/has-role/${role}`)
      return response.data.success && response.data.data.has_role
    } catch (error) {
      return false
    }
  }
}