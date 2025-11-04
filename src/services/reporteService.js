// Servicio de gestión de reportes

import { get, post } from './api'
import { MESSAGES } from '../utils/constants'

export const reporteService = {
  /**
   * Generar reporte de horarios
   * @param {object} filtros - Filtros del reporte
   * @param {string} formato - Formato de exportación
   * @returns {Promise<object>} Reporte generado
   */
  async generarReporteHorarios(filtros, formato = 'pdf') {
    try {
      const response = await post('/reportes/horarios', {
        ...filtros,
        formato
      })
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: MESSAGES.SUCCESS.EXPORT
        }
      } else {
        return {
          success: false,
          message: response.data.message || MESSAGES.ERROR.EXPORT
        }
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || MESSAGES.ERROR.EXPORT
      }
    }
  },

  /**
   * Generar reporte de asistencias
   * @param {object} filtros - Filtros del reporte
   * @param {string} formato - Formato de exportación
   * @returns {Promise<object>} Reporte generado
   */
  async generarReporteAsistencias(filtros, formato = 'pdf') {
    try {
      const response = await post('/reportes/asistencias', {
        ...filtros,
        formato
      })
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: MESSAGES.SUCCESS.EXPORT
        }
      } else {
        return {
          success: false,
          message: response.data.message || MESSAGES.ERROR.EXPORT
        }
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || MESSAGES.ERROR.EXPORT
      }
    }
  },

  /**
   * Generar reporte de carga horaria
   * @param {string} gestionId - ID de gestión académica
   * @param {string} formato - Formato de exportación
   * @returns {Promise<object>} Reporte generado
   */
  async generarReporteCargaHoraria(gestionId, formato = 'pdf') {
    try {
      const response = await post('/reportes/carga-horaria', {
        gestion_id: gestionId,
        formato
      })
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: MESSAGES.SUCCESS.EXPORT
        }
      } else {
        return {
          success: false,
          message: response.data.message || MESSAGES.ERROR.EXPORT
        }
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || MESSAGES.ERROR.EXPORT
      }
    }
  },

  /**
   * Obtener horarios semanal
   * @param {object} params - Parámetros de consulta
   * @returns {Promise<object>} Horarios semanales
   */
  async getHorariosSemanal(params = {}) {
    try {
      const response = await get('/reportes/horarios-semanal', params)
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data
        }
      } else {
        return {
          success: false,
          message: response.data.message || 'Error al obtener horarios semanal'
        }
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Error al obtener horarios semanal'
      }
    }
  },

  /**
   * Obtener reporte de asistencia por docente
   * @param {object} params - Parámetros de consulta
   * @returns {Promise<object>} Reporte de asistencia
   */
  async getAsistenciaDocente(params = {}) {
    try {
      const response = await get('/reportes/asistencia-docente', params)
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data
        }
      } else {
        return {
          success: false,
          message: response.data.message || 'Error al obtener reporte de asistencia'
        }
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Error al obtener reporte de asistencia'
      }
    }
  },

  /**
   * Obtener reporte de carga horaria
   * @param {object} params - Parámetros de consulta
   * @returns {Promise<object>} Reporte de carga horaria
   */
  async getCargaHoraria(params = {}) {
    try {
      const response = await get('/reportes/carga-horaria', params)
      
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
   * Obtener ocupación de aulas
   * @param {object} params - Parámetros de consulta
   * @returns {Promise<object>} Ocupación de aulas
   */
  async getAulasOcupacion(params = {}) {
    try {
      const response = await get('/reportes/aulas-ocupacion', params)
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data
        }
      } else {
        return {
          success: false,
          message: response.data.message || 'Error al obtener ocupación de aulas'
        }
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Error al obtener ocupación de aulas'
      }
    }
  },

  /**
   * Exportar datos a PDF
   * @param {string} tipo - Tipo de reporte (horarios, asistencias, carga_horaria, aulas)
   * @param {object} params - Parámetros del reporte
   * @returns {Promise<object>} Archivo PDF generado
   */
  async exportarPDF(tipo, params = {}) {
    try {
      const response = await post('/reportes/export-pdf', params, {
        responseType: 'blob'
      })
      
      // Verificar si es un error en formato JSON
      if (response.data.type === 'application/json') {
        const reader = new FileReader()
        const text = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result)
          reader.readAsText(response.data)
        })
        const errorData = JSON.parse(text)
        return {
          success: false,
          message: errorData.message || 'Error al exportar PDF'
        }
      }
      
      // Crear blob y descargar
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `reporte_${tipo}_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      return {
        success: true,
        message: 'PDF exportado exitosamente'
      }
    } catch (error) {
      console.error('Error al exportar PDF:', error)
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Error al exportar PDF'
      }
    }
  },

  /**
   * Exportar datos a Excel
   * @param {string} tipo - Tipo de reporte (horarios, asistencias, carga_horaria, aulas)
   * @param {object} params - Parámetros del reporte
   * @returns {Promise<object>} Archivo Excel generado
   */
  async exportarExcel(tipo, params = {}) {
    try {
      const response = await post('/reportes/export-excel', params, {
        responseType: 'blob'
      })
      
      // Verificar si es un error en formato JSON
      if (response.data.type === 'application/json') {
        const reader = new FileReader()
        const text = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result)
          reader.readAsText(response.data)
        })
        const errorData = JSON.parse(text)
        return {
          success: false,
          message: errorData.message || 'Error al exportar Excel'
        }
      }
      
      // Crear blob y descargar
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `reporte_${tipo}_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      return {
        success: true,
        message: 'Excel exportado exitosamente'
      }
    } catch (error) {
      console.error('Error al exportar Excel:', error)
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Error al exportar Excel'
      }
    }
  },

  /**
   * Obtener estadísticas generales
   * @param {object} params - Parámetros de consulta
   * @returns {Promise<object>} Estadísticas generales
   */
  async getEstadisticasGenerales(params = {}) {
    try {
      const response = await get('/reportes/estadisticas', params)
      
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
   * Obtener datos para gráficos
   * @param {object} params - Parámetros de consulta
   * @returns {Promise<object>} Datos para gráficos
   */
  async getDatosGraficos(params = {}) {
    try {
      const response = await get('/reportes/graficos', params)
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data
        }
      } else {
        return {
          success: false,
          message: response.data.message || 'Error al obtener datos para gráficos'
        }
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Error al obtener datos para gráficos'
      }
    }
  }
}
