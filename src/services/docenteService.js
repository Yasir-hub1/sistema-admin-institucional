// Servicio de gestión de docentes

import { get, post, put, del, upload } from './api'
import { MESSAGES, PAGINATION_CONFIG } from '../utils/constants'

/**
 * Servicio de gestión de docentes
 */
export const docenteService = {
  /**
   * Obtener lista de docentes con paginación
   * @param {object} params - Parámetros de consulta
   * @param {number} params.page - Página actual
   * @param {number} params.per_page - Elementos por página
   * @param {string} params.search - Término de búsqueda
   * @param {string} params.sort_by - Campo de ordenamiento
   * @param {string} params.sort_direction - Dirección de ordenamiento
   * @param {string} params.gestion_id - ID de gestión académica
   * @param {string} params.estado - Estado del docente
   * @returns {Promise<object>} Lista paginada de docentes
   */
  async getDocentes(params = {}) {
    try {
      const queryParams = {
        page: params.page || 1,
        per_page: params.per_page || PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
        search: params.search || '',
        sort_by: params.sort_by || 'apellidos',
        sort_direction: params.sort_direction || 'asc',
        gestion_id: params.gestion_id || '',
        estado: params.estado || ''
      }

      const response = await get('/docentes', queryParams)
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message
        }
      } else {
        return {
          success: false,
          message: response.data.message || 'Error al obtener docentes'
        }
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Error al obtener docentes'
      }
    }
  },

  /**
   * Obtener docente por ID
   * @param {number} id - ID del docente
   * @returns {Promise<object>} Datos del docente
   */
  async getDocente(id) {
    try {
      const response = await get(`/docentes/${id}`)
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data
        }
      } else {
        return {
          success: false,
          message: response.data.message || 'Docente no encontrado'
        }
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Error al obtener docente'
      }
    }
  },

  /**
   * Crear nuevo docente
   * @param {object} data - Datos del docente
   * @returns {Promise<object>} Docente creado
   */
  async createDocente(data) {
    try {
      const response = await post('/docentes', data)
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message || MESSAGES.SUCCESS.SAVE
        }
      } else {
        return {
          success: false,
          message: response.data.message || MESSAGES.ERROR.SAVE,
          errors: response.data.errors
        }
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || MESSAGES.ERROR.SAVE,
        errors: error.response?.data?.errors
      }
    }
  },

  /**
   * Actualizar docente
   * @param {number} id - ID del docente
   * @param {object} data - Datos actualizados
   * @returns {Promise<object>} Docente actualizado
   */
  async updateDocente(id, data) {
    try {
      const response = await put(`/docentes/${id}`, data)
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message || MESSAGES.SUCCESS.UPDATE
        }
      } else {
        return {
          success: false,
          message: response.data.message || MESSAGES.ERROR.UPDATE,
          errors: response.data.errors
        }
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || MESSAGES.ERROR.UPDATE,
        errors: error.response?.data?.errors
      }
    }
  },

  /**
   * Eliminar docente
   * @param {number} id - ID del docente
   * @returns {Promise<object>} Respuesta de eliminación
   */
  async deleteDocente(id) {
    try {
      const response = await del(`/docentes/${id}`)
      
      if (response.data.success) {
        return {
          success: true,
          message: response.data.message || MESSAGES.SUCCESS.DELETE
        }
      } else {
        return {
          success: false,
          message: response.data.message || MESSAGES.ERROR.DELETE
        }
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || MESSAGES.ERROR.DELETE
      }
    }
  },

  /**
   * Obtener carga horaria del docente
   * @param {number} id - ID del docente
   * @param {string} gestionId - ID de gestión académica
   * @returns {Promise<object>} Carga horaria del docente
   */
  async getCargaHoraria(id, gestionId) {
    try {
      const response = await get(`/docentes/${id}/carga-horaria`, {
        gestion_id: gestionId
      })
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data
        }
      } else {
        return {
          success: false,
          message: response.data.message || 'Error al obtener carga horaria'
        }
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Error al obtener carga horaria'
      }
    }
  },

  /**
   * Obtener horarios del docente
   * @param {number} id - ID del docente
   * @param {object} params - Parámetros de consulta
   * @returns {Promise<object>} Horarios del docente
   */
  async getHorarios(id, params = {}) {
    try {
      const response = await get(`/docentes/${id}/horarios`, params)
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data
        }
      } else {
        return {
          success: false,
          message: response.data.message || 'Error al obtener horarios'
        }
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Error al obtener horarios'
      }
    }
  },

  /**
   * Obtener estadísticas del docente
   * @param {number} id - ID del docente
   * @param {object} params - Parámetros de consulta
   * @returns {Promise<object>} Estadísticas del docente
   */
  async getEstadisticas(id, params = {}) {
    try {
      const response = await get(`/docentes/${id}/estadisticas`, params)
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data
        }
      } else {
        return {
          success: false,
          message: response.data.message || 'Error al obtener estadísticas'
        }
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Error al obtener estadísticas'
      }
    }
  },

  /**
   * Importar docentes desde archivo Excel/CSV
   * @param {File} file - Archivo a importar
   * @param {object} options - Opciones de importación
   * @returns {Promise<object>} Resultado de la importación
   */
  async importarDocentes(file, options = {}) {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('gestion_id', options.gestion_id || '')
      formData.append('sobrescribir', options.sobrescribir || false)

      const response = await upload('/docentes/import', formData)
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: MESSAGES.SUCCESS.IMPORT
        }
      } else {
        return {
          success: false,
          message: response.data.message || MESSAGES.ERROR.IMPORT
        }
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || MESSAGES.ERROR.IMPORT
      }
    }
  },

  /**
   * Exportar docentes a CSV/Excel
   * @param {object} params - Parámetros de exportación
   * @returns {Promise<object>} Resultado de la exportación
   */
  async exportarDocentes(params = {}) {
    try {
      // Obtener todos los docentes sin paginación para exportar
      const queryParams = {
        page: 1,
        per_page: 10000,
        search: params.search || '',
        especialidad: params.especialidad || '',
        grado_academico: params.grado_academico || '',
        activo: params.activo || ''
      }

      // Solo agregar filtros si tienen valor
      if (!queryParams.search) delete queryParams.search
      if (!queryParams.especialidad) delete queryParams.especialidad
      if (!queryParams.grado_academico) delete queryParams.grado_academico
      if (queryParams.activo === '') delete queryParams.activo

      const response = await get('/docentes', queryParams)
      
      if (response.data && response.data.success && response.data.data) {
        return {
          success: true,
          data: response.data.data.data || [],
          message: MESSAGES.SUCCESS.EXPORT
        }
      } else {
        return {
          success: false,
          message: response.data?.message || 'Error al exportar docentes'
        }
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || MESSAGES.ERROR.EXPORT
      }
    }
  },

  /**
   * Obtener docentes disponibles para asignar horario
   * @param {object} params - Parámetros de consulta
   * @returns {Promise<object>} Lista de docentes disponibles
   */
  async getDocentesDisponibles(params = {}) {
    try {
      const response = await get('/docentes/disponibles', params)
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data
        }
      } else {
        return {
          success: false,
          message: response.data.message || 'Error al obtener docentes disponibles'
        }
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Error al obtener docentes disponibles'
      }
    }
  },

  /**
   * Verificar disponibilidad del docente en un horario específico
   * @param {number} docenteId - ID del docente
   * @param {object} horario - Datos del horario
   * @returns {Promise<object>} Resultado de la verificación
   */
  async verificarDisponibilidad(docenteId, horario) {
    try {
      const response = await post(`/docentes/${docenteId}/verificar-disponibilidad`, horario)
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data
        }
      } else {
        return {
          success: false,
          message: response.data.message || 'Error al verificar disponibilidad'
        }
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Error al verificar disponibilidad'
      }
    }
  },

  /**
   * Obtener historial de cambios del docente
   * @param {number} id - ID del docente
   * @param {object} params - Parámetros de consulta
   * @returns {Promise<object>} Historial de cambios
   */
  async getHistorial(id, params = {}) {
    try {
      const response = await get(`/docentes/${id}/historial`, params)
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data
        }
      } else {
        return {
          success: false,
          message: response.data.message || 'Error al obtener historial'
        }
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Error al obtener historial'
      }
    }
  }
}
