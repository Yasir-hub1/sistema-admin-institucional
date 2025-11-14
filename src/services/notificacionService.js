import { get, put, del } from './api'

export const notificacionService = {
  /**
   * Obtener notificaciones del usuario
   * @param {object} params - Parámetros de consulta
   * @param {number} params.page - Página actual
   * @param {number} params.per_page - Elementos por página
   * @param {boolean} params.leida - Filtrar por leída/no leída
   * @param {string} params.tipo - Tipo de notificación
   * @returns {Promise<object>} Lista de notificaciones
   */
  async getNotificaciones(params = {}) {
    try {
      // Construir queryParams solo con valores no vacíos
      const queryParams = {
        page: params.page || 1,
        per_page: params.per_page || 15
      }

      // Solo agregar parámetros con valores
      if (params.leida !== undefined && params.leida !== null && params.leida !== '') {
        queryParams.leida = params.leida
      }
      if (params.tipo) queryParams.tipo = params.tipo
      if (params.search) queryParams.search = params.search

      console.log('📤 getNotificaciones - Enviando params:', queryParams)

      const response = await get('/notificaciones', queryParams)
      
      console.log('📥 getNotificaciones - Respuesta:', response)
      console.log('📥 getNotificaciones - response.data:', response.data)
      
      if (response.data && response.data.success) {
        // El backend devuelve: { success: true, data: { data: [...], last_page: 1, ... }, no_leidas: X }
        return {
          success: true,
          data: response.data.data, // Objeto paginado completo
          noLeidas: response.data.no_leidas || 0,
          message: response.data.message
        }
      } else {
        return {
          success: false,
          message: response.data?.message || 'Error al obtener notificaciones',
          data: null
        }
      }
    } catch (error) {
      console.error('❌ getNotificaciones - Error:', error)
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Error al obtener notificaciones',
        data: null
      }
    }
  },

  /**
   * Contar notificaciones no leídas
   * @returns {Promise<object>} Contador de no leídas
   */
  async contarNoLeidas() {
    try {
      console.log('📤 contarNoLeidas - Enviando request')
      const response = await get('/notificaciones/no-leidas')
      
      console.log('📥 contarNoLeidas - Response:', response)
      
      if (response.data.success) {
        return {
          success: true,
          count: response.data.data.count || response.data.data || 0
        }
      } else {
        return {
          success: false,
          count: 0
        }
      }
    } catch (error) {
      console.error('❌ contarNoLeidas - Error:', error)
      return {
        success: false,
        count: 0,
        message: error.response?.data?.message || error.message
      }
    }
  },

  /**
   * Marcar notificación como leída
   * @param {number} id - ID de la notificación
   * @returns {Promise<object>} Resultado de la operación
   */
  async marcarLeida(id) {
    try {
      console.log('📤 marcarLeida - ID:', id)
      const response = await put(`/notificaciones/${id}/marcar-leida`)
      
      console.log('📥 marcarLeida - Response:', response)
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message || 'Notificación marcada como leída'
        }
      } else {
        return {
          success: false,
          message: response.data.message || 'Error al marcar notificación'
        }
      }
    } catch (error) {
      console.error('❌ marcarLeida - Error:', error)
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Error al marcar notificación'
      }
    }
  },

  /**
   * Marcar todas las notificaciones como leídas
   * @returns {Promise<object>} Resultado de la operación
   */
  async marcarTodasLeidas() {
    try {
      console.log('📤 marcarTodasLeidas - Enviando request')
      const response = await put('/notificaciones/marcar-todas-leidas')
      
      console.log('📥 marcarTodasLeidas - Response:', response)
      
      if (response.data.success) {
        return {
          success: true,
          message: response.data.message || 'Todas las notificaciones marcadas como leídas'
        }
      } else {
        return {
          success: false,
          message: response.data.message || 'Error al marcar notificaciones'
        }
      }
    } catch (error) {
      console.error('❌ marcarTodasLeidas - Error:', error)
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Error al marcar notificaciones'
      }
    }
  },

  /**
   * Eliminar notificación
   * @param {number} id - ID de la notificación
   * @returns {Promise<object>} Resultado de la operación
   */
  async eliminarNotificacion(id) {
    try {
      console.log('📤 eliminarNotificacion - ID:', id)
      const response = await del(`/notificaciones/${id}`)
      
      console.log('📥 eliminarNotificacion - Response:', response)
      
      if (response.data.success) {
        return {
          success: true,
          message: response.data.message || 'Notificación eliminada exitosamente'
        }
      } else {
        return {
          success: false,
          message: response.data.message || 'Error al eliminar notificación'
        }
      }
    } catch (error) {
      console.error('❌ eliminarNotificacion - Error:', error)
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Error al eliminar notificación'
      }
    }
  }
}

