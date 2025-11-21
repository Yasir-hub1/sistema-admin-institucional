// Servicio de gestión docente y evaluación académica

import { get, post } from './api'
import { MESSAGES } from '../utils/constants'

/**
 * Servicio para gestión de grupos del docente
 */
export const docenteGrupoService = {
  async getMisGrupos() {
    try {
      const response = await get('/docente/grupos')
      if (response.data.success) {
        return { success: true, data: response.data.data, message: response.data.message }
      } else {
        return { success: false, message: response.data.message || MESSAGES.ERROR_FETCH }
      }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message || MESSAGES.ERROR_FETCH }
    }
  },

  async getGrupoById(grupoId) {
    try {
      const response = await get(`/docente/grupos/${grupoId}`)
      if (response.data.success) {
        return { success: true, data: response.data.data, message: response.data.message }
      } else {
        return { success: false, message: response.data.message || MESSAGES.ERROR_FETCH }
      }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message || MESSAGES.ERROR_FETCH }
    }
  }
}

/**
 * Servicio para evaluación académica
 */
export const docenteEvaluacionService = {
  async registrarNota(data) {
    try {
      const response = await post('/docente/evaluaciones/nota', data)
      if (response.data.success) {
        return { success: true, data: response.data.data, message: response.data.message }
      } else {
        return { success: false, message: response.data.message || MESSAGES.ERROR_CREATE, errors: response.data.errors }
      }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message || MESSAGES.ERROR_CREATE, errors: error.response?.data?.errors }
    }
  },

  async actualizarEstado(data) {
    try {
      const response = await post('/docente/evaluaciones/estado', data)
      if (response.data.success) {
        return { success: true, data: response.data.data, message: response.data.message }
      } else {
        return { success: false, message: response.data.message || MESSAGES.ERROR_UPDATE, errors: response.data.errors }
      }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message || MESSAGES.ERROR_UPDATE, errors: error.response?.data?.errors }
    }
  },

  async registrarNotasMasivas(data) {
    try {
      const response = await post('/docente/evaluaciones/notas-masivas', data)
      if (response.data.success) {
        return { success: true, data: response.data.data, message: response.data.message }
      } else {
        return { success: false, message: response.data.message || MESSAGES.ERROR_CREATE, errors: response.data.errors }
      }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message || MESSAGES.ERROR_CREATE, errors: error.response?.data?.errors }
    }
  }
}
