// Servicio de gestión de inscripciones para administradores

import { get } from './api'
import { MESSAGES, PAGINATION_CONFIG } from '../utils/constants'

/**
 * Servicio para gestión de inscripciones (Admin)
 */
export const adminInscripcionService = {
  async getInscripciones(params = {}) {
    try {
      const queryParams = {
        page: params.page || 1,
        per_page: params.per_page || PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
        search: params.search || '',
        programa_id: params.programa_id || '',
        estudiante_id: params.estudiante_id || '',
        fecha_inicio: params.fecha_inicio || '',
        fecha_fin: params.fecha_fin || '',
        sort_by: params.sort_by || 'fecha',
        sort_direction: params.sort_direction || 'desc'
      }

      // Eliminar parámetros vacíos
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === '' || queryParams[key] === null || queryParams[key] === undefined) {
          delete queryParams[key]
        }
      })

      const response = await get('/admin/inscripciones', queryParams)
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message
        }
      } else {
        return {
          success: false,
          message: response.data.message || MESSAGES.ERROR_FETCH
        }
      }
    } catch (error) {
      console.error('Error fetching inscripciones:', error)
      return {
        success: false,
        message: error.response?.data?.message || MESSAGES.ERROR_FETCH
      }
    }
  },

  async getInscripcionById(id) {
    try {
      const response = await get(`/admin/inscripciones/${id}`)
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message
        }
      } else {
        return {
          success: false,
          message: response.data.message || MESSAGES.ERROR_FETCH
        }
      }
    } catch (error) {
      console.error('Error fetching inscripcion:', error)
      return {
        success: false,
        message: error.response?.data?.message || MESSAGES.ERROR_FETCH
      }
    }
  },

  async getEstadisticas() {
    try {
      const response = await get('/admin/inscripciones/estadisticas')
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message
        }
      } else {
        return {
          success: false,
          message: response.data.message || MESSAGES.ERROR_FETCH
        }
      }
    } catch (error) {
      console.error('Error fetching estadisticas:', error)
      return {
        success: false,
        message: error.response?.data?.message || MESSAGES.ERROR_FETCH
      }
    }
  }
}

