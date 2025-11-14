import { get } from './api'

export const auditoriaService = {
  /**
   * Obtener registros de auditoría
   * @param {object} params - Parámetros de consulta
   * @param {number} params.page - Página actual
   * @param {number} params.per_page - Elementos por página
   * @param {string} params.modelo - Filtrar por modelo
   * @param {string} params.accion - Filtrar por acción
   * @param {number} params.user_id - Filtrar por usuario
   * @param {string} params.fecha_inicio - Fecha inicio
   * @param {string} params.fecha_fin - Fecha fin
   * @returns {Promise<object>} Lista de registros de auditoría
   */
  async getAuditoria(params = {}) {
    try {
      // Construir queryParams solo con valores no vacíos
      const queryParams = {
        page: params.page || 1,
        per_page: params.per_page || 20
      }

      // Solo agregar parámetros con valores
      if (params.modelo) queryParams.modelo = params.modelo
      if (params.accion) queryParams.accion = params.accion
      if (params.user_id) queryParams.user_id = params.user_id
      if (params.fecha_inicio) queryParams.fecha_inicio = params.fecha_inicio
      if (params.fecha_fin) queryParams.fecha_fin = params.fecha_fin
      if (params.search) queryParams.search = params.search

      console.log('📤 getAuditoria - Enviando params:', queryParams)

      const response = await get('/auditoria', queryParams)
      
      console.log('📥 getAuditoria - Respuesta:', response)
      console.log('📥 getAuditoria - response.data:', response.data)
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message
        }
      } else {
        return {
          success: false,
          message: response.data.message || 'Error al obtener auditoría'
        }
      }
    } catch (error) {
      console.error('❌ getAuditoria - Error:', error)
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Error al obtener auditoría'
      }
    }
  },

  /**
   * Obtener auditoría por modelo
   * @param {string} modelo - Nombre del modelo
   * @param {object} params - Parámetros adicionales
   * @returns {Promise<object>} Lista de registros de auditoría del modelo
   */
  async getAuditoriaPorModelo(modelo, params = {}) {
    try {
      // Construir queryParams solo con valores no vacíos
      const queryParams = {
        page: params.page || 1,
        per_page: params.per_page || 15
      }

      if (params.modelo_id) queryParams.modelo_id = params.modelo_id
      if (params.accion) queryParams.accion = params.accion

      console.log('📤 getAuditoriaPorModelo - Modelo:', modelo, 'Params:', queryParams)

      const response = await get(`/auditoria/modelo/${modelo}`, queryParams)
      
      console.log('📥 getAuditoriaPorModelo - Respuesta:', response)
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message
        }
      } else {
        return {
          success: false,
          message: response.data.message || 'Error al obtener auditoría'
        }
      }
    } catch (error) {
      console.error('❌ getAuditoriaPorModelo - Error:', error)
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Error al obtener auditoría'
      }
    }
  }
}

