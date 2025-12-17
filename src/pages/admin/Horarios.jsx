import React, { useState, useEffect } from 'react'
import {
  Clock,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  CheckCircle
} from 'lucide-react'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Modal from '../../components/common/Modal'
import Table from '../../components/common/Table'
import Card from '../../components/common/Card'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { horarioService } from '../../services/asignacionService'

const Horarios = () => {
  const [horarios, setHorarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [diasFilter, setDiasFilter] = useState('')
  const [turnoFilter, setTurnoFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [totalRegistros, setTotalRegistros] = useState(0)
  const [from, setFrom] = useState(0)
  const [to, setTo] = useState(0)
  const [sortBy, setSortBy] = useState('dias')
  const [sortDirection, setSortDirection] = useState('asc')
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingHorario, setEditingHorario] = useState(null)
  const [viewingHorario, setViewingHorario] = useState(null)
  const [stats, setStats] = useState({
    total: 0,
    conGrupos: 0
  })

  // Días de la semana disponibles
  const diasSemana = [
    { value: 'lunes', label: 'Lunes' },
    { value: 'martes', label: 'Martes' },
    { value: 'miércoles', label: 'Miércoles' },
    { value: 'jueves', label: 'Jueves' },
    { value: 'viernes', label: 'Viernes' },
    { value: 'sábado', label: 'Sábado' }
  ]

  const { register, handleSubmit, reset, formState: { errors }, trigger, watch, setValue } = useForm({
    mode: 'onChange',
    defaultValues: {
      dias: []
    }
  })

  const diasSeleccionados = watch('dias') || []

  useEffect(() => {
    fetchHorarios()
  }, [currentPage, perPage, searchTerm, diasFilter, turnoFilter, sortBy, sortDirection])

  const fetchHorarios = async () => {
    try {
      setLoading(true)
      const response = await horarioService.getHorarios({
        page: currentPage,
        per_page: perPage,
        search: searchTerm,
        dias: diasFilter,
        turno: turnoFilter,
        sort_by: sortBy,
        sort_direction: sortDirection
      })
      
      if (response.success && response.data) {
        const horariosData = response.data.data || []
        setHorarios(horariosData)
        setTotalPages(response.data.last_page || 1)
        setTotalRegistros(response.data.total || 0)
        setFrom(response.data.from || 0)
        setTo(response.data.to || 0)
        setStats({
          total: response.data.total || 0,
          conGrupos: horariosData.filter(h => h.grupos_count > 0).length || 0
        })
      } else {
        toast.error(response.message || 'Error al cargar horarios')
        setHorarios([])
        setTotalPages(1)
        setTotalRegistros(0)
        setFrom(0)
        setTo(0)
      }
    } catch (error) {
      toast.error('Error al cargar horarios')
      setHorarios([])
      setTotalPages(1)
      setTotalRegistros(0)
      setFrom(0)
      setTo(0)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data) => {
    // Validación adicional antes de enviar
    // Convertir array de días a string separado por comas
    let diasString = ''
    if (Array.isArray(data.dias) && data.dias.length > 0) {
      diasString = data.dias.join(', ')
    } else if (typeof data.dias === 'string' && data.dias.trim() !== '') {
      diasString = data.dias.trim()
    } else {
      toast.error('Debes seleccionar al menos un día')
      return
    }

    if (!diasString || diasString.trim() === '') {
      toast.error('Los días son obligatorios')
      return
    }

    if (!data.hora_ini) {
      toast.error('La hora de inicio es obligatoria')
      return
    }

    if (!data.hora_fin) {
      toast.error('La hora de fin es obligatoria')
      return
    }

    // Validar que hora_fin sea mayor que hora_ini
    if (data.hora_fin <= data.hora_ini) {
      toast.error('La hora de fin debe ser mayor a la hora de inicio')
      return
    }

      try {
      setLoading(true)
      const horarioData = {
        dias: diasString,
        hora_ini: data.hora_ini,
        hora_fin: data.hora_fin
      }

      let response
      if (editingHorario) {
        // Usar siempre el id para actualizar
        const horarioId = editingHorario.horario_id || editingHorario.id
        
        if (!horarioId) {
          toast.error('No se pudo identificar el horario. Por favor, recarga la página.')
          setLoading(false)
          return
        }
        
        response = await horarioService.updateHorario(horarioId, horarioData)
      } else {
        response = await horarioService.createHorario(horarioData)
      }

      if (response.success) {
        toast.success(response.message || (editingHorario ? 'Horario actualizado exitosamente' : 'Horario creado exitosamente'))
        setShowModal(false)
        reset()
        setEditingHorario(null)
        await fetchHorarios()
      } else {
        toast.error(response.message || 'Error al guardar horario')
        if (response.errors) {
          const errorMessages = Array.isArray(response.errors) 
            ? response.errors 
            : Object.values(response.errors).flat()
          
          errorMessages.forEach((errorMsg) => {
            if (typeof errorMsg === 'string' && errorMsg.trim()) {
              toast.error(errorMsg, { duration: 4000 })
            } else if (Array.isArray(errorMsg) && errorMsg.length > 0) {
              toast.error(errorMsg[0], { duration: 4000 })
            }
          })
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al guardar horario'
      toast.error(errorMessage)
      
      // Mostrar errores de validación del backend
      if (error.response?.data?.errors) {
        const backendErrors = error.response.data.errors
        const errorMessages = Array.isArray(backendErrors) 
          ? backendErrors 
          : Object.values(backendErrors).flat()
        
        errorMessages.forEach((errorMsg) => {
          if (typeof errorMsg === 'string' && errorMsg.trim()) {
            toast.error(errorMsg, { duration: 4000 })
          } else if (Array.isArray(errorMsg) && errorMsg.length > 0) {
            toast.error(errorMsg[0], { duration: 4000 })
          }
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (horario) => {
    // Usar siempre el id para editar
    const horarioId = horario.horario_id || horario.id
    
    if (!horarioId) {
      toast.error('No se pudo identificar el horario')
      return
    }

    setEditingHorario(horario)
    
    // Formatear las horas correctamente para el input type="time"
    // Usar el campo formateado del backend si está disponible
    let horaIni = horario.hora_ini_formatted || ''
    let horaFin = horario.hora_fin_formatted || ''
    
    // Fallback: formatear manualmente si no está formateado
    if (!horaIni && horario.hora_ini) {
      if (typeof horario.hora_ini === 'string') {
        if (horario.hora_ini.includes('T')) {
          const parts = horario.hora_ini.split('T')
          if (parts[1]) {
            horaIni = parts[1].substring(0, 5)
          }
        } else if (horario.hora_ini.match(/^\d{2}:\d{2}/)) {
          horaIni = horario.hora_ini.substring(0, 5)
        }
      }
    }
    
    if (!horaFin && horario.hora_fin) {
      if (typeof horario.hora_fin === 'string') {
        if (horario.hora_fin.includes('T')) {
          const parts = horario.hora_fin.split('T')
          if (parts[1]) {
            horaFin = parts[1].substring(0, 5)
          }
        } else if (horario.hora_fin.match(/^\d{2}:\d{2}/)) {
          horaFin = horario.hora_fin.substring(0, 5)
        }
      }
    }
    
    // Convertir string de días a array para el select múltiple
    let diasArray = []
    if (horario.dias) {
      // Si viene como string separado por comas, convertir a array
      if (typeof horario.dias === 'string') {
        // Dividir por comas y limpiar cada día
        const diasSplit = horario.dias.split(',').map(d => d.trim().toLowerCase())
        // Mapear a los valores del select (normalizar nombres)
        diasArray = diasSplit.map(dia => {
          // Normalizar nombres de días
          const diaNormalizado = dia.toLowerCase()
          // Mapear variaciones comunes
          if (diaNormalizado.includes('lunes')) return 'lunes'
          if (diaNormalizado.includes('martes')) return 'martes'
          if (diaNormalizado.includes('miércoles') || diaNormalizado.includes('miercoles')) return 'miércoles'
          if (diaNormalizado.includes('jueves')) return 'jueves'
          if (diaNormalizado.includes('viernes')) return 'viernes'
          if (diaNormalizado.includes('sábado') || diaNormalizado.includes('sabado')) return 'sábado'
          return diaNormalizado
        }).filter(d => d && diasSemana.some(ds => ds.value === d))
      } else if (Array.isArray(horario.dias)) {
        diasArray = horario.dias.map(d => {
          const diaStr = typeof d === 'string' ? d.trim().toLowerCase() : String(d).toLowerCase()
          // Normalizar nombres de días
          if (diaStr.includes('lunes')) return 'lunes'
          if (diaStr.includes('martes')) return 'martes'
          if (diaStr.includes('miércoles') || diaStr.includes('miercoles')) return 'miércoles'
          if (diaStr.includes('jueves')) return 'jueves'
          if (diaStr.includes('viernes')) return 'viernes'
          if (diaStr.includes('sábado') || diaStr.includes('sabado')) return 'sábado'
          return diaStr
        }).filter(d => d && diasSemana.some(ds => ds.value === d))
      }
    }
    
    reset({
      dias: diasArray,
      hora_ini: horaIni,
      hora_fin: horaFin
    })
    setShowModal(true)
  }

  const handleView = async (horario) => {
    // Usar siempre el id para ver
    const horarioId = horario.horario_id || horario.id
    
    if (!horarioId) {
      toast.error('No se pudo identificar el horario')
      return
    }
    
    const response = await horarioService.getHorarioById(horarioId)
    if (response.success) {
      setViewingHorario(response.data)
      setShowViewModal(true)
    } else {
      toast.error(response.message || 'Error al cargar detalles del horario')
    }
  }

  const handleDelete = async (horario) => {
    // Usar siempre el id para eliminar
    const horarioId = horario.horario_id || horario.id
    
    if (!horarioId) {
      toast.error('No se pudo identificar el horario')
      return
    }

    // Usar el campo formateado del backend si está disponible
    let horaIni = horario.hora_ini_formatted || 'N/A'
    let horaFin = horario.hora_fin_formatted || 'N/A'
    
    // Fallback: formatear manualmente
    if (horaIni === 'N/A' && horario.hora_ini) {
      if (typeof horario.hora_ini === 'string') {
        if (horario.hora_ini.includes('T')) {
          const parts = horario.hora_ini.split('T')
          if (parts[1]) {
            horaIni = parts[1].substring(0, 5)
          }
        } else if (horario.hora_ini.match(/^\d{2}:\d{2}/)) {
          horaIni = horario.hora_ini.substring(0, 5)
        }
      }
    }
    
    if (horaFin === 'N/A' && horario.hora_fin) {
      if (typeof horario.hora_fin === 'string') {
        if (horario.hora_fin.includes('T')) {
          const parts = horario.hora_fin.split('T')
          if (parts[1]) {
            horaFin = parts[1].substring(0, 5)
          }
        } else if (horario.hora_fin.match(/^\d{2}:\d{2}/)) {
          horaFin = horario.hora_fin.substring(0, 5)
        }
      }
    }

    if (!window.confirm(`¿Está seguro de eliminar el horario "${horario.dias || 'N/A'} ${horaIni}-${horaFin}"?`)) {
      return
    }

    try {
      const response = await horarioService.removeHorario(horarioId)
      if (response.success) {
        toast.success(response.message)
        fetchHorarios()
      } else {
        toast.error(response.message)
      }
    } catch (error) {
      toast.error('Error al eliminar horario')
    }
  }

  const handleNew = () => {
    setEditingHorario(null)
    reset({
      dias: [],
      hora_ini: '',
      hora_fin: ''
    })
    setShowModal(true)
  }

  const handleSort = (column, direction) => {
    setSortBy(column)
    setSortDirection(direction)
    setCurrentPage(1)
  }

  // Manejar cambio de selección de días
  const handleDiasChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value)
    setValue('dias', selectedOptions, { shouldValidate: true })
    trigger('dias')
  }

  const columns = [
    { 
      key: 'dias', 
      label: 'Días',
      render: (row) => row.dias || '-'
    },
    { 
      key: 'hora_ini', 
      label: 'Hora Inicio',
      render: (row) => {
        // Usar el campo formateado del backend si está disponible
        if (row.hora_ini_formatted) {
          return row.hora_ini_formatted
        }
        
        // Fallback: formatear manualmente si viene como timestamp
        const hora = row.hora_ini
        if (hora) {
          if (typeof hora === 'string') {
            // Si viene como timestamp ISO, extraer la hora
            if (hora.includes('T')) {
              const parts = hora.split('T')
              if (parts[1]) {
                return parts[1].substring(0, 5)
              }
            }
            // Si ya viene como H:i, devolverlo
            if (hora.match(/^\d{2}:\d{2}/)) {
              return hora.substring(0, 5)
            }
          }
        }
        return 'N/A'
      }
    },
    { 
      key: 'hora_fin', 
      label: 'Hora Fin',
      render: (row) => {
        // Usar el campo formateado del backend si está disponible
        if (row.hora_fin_formatted) {
          return row.hora_fin_formatted
        }
        
        // Fallback: formatear manualmente si viene como timestamp
        const hora = row.hora_fin
        if (hora) {
          if (typeof hora === 'string') {
            // Si viene como timestamp ISO, extraer la hora
            if (hora.includes('T')) {
              const parts = hora.split('T')
              if (parts[1]) {
                return parts[1].substring(0, 5)
              }
            }
            // Si ya viene como H:i, devolverlo
            if (hora.match(/^\d{2}:\d{2}/)) {
              return hora.substring(0, 5)
            }
          }
        }
        return 'N/A'
      }
    },
    { 
      key: 'duracion_horas', 
      label: 'Duración',
      render: (row) => {
        // Usar el campo calculado del backend si está disponible
        if (row.duracion_horas !== undefined && row.duracion_horas !== null) {
          return `${row.duracion_horas} horas`
        }
        
        // Fallback: calcular manualmente
        const horaIni = row.hora_ini_formatted || (row.hora_ini && typeof row.hora_ini === 'string' 
          ? (row.hora_ini.includes('T') ? row.hora_ini.split('T')[1]?.substring(0, 5) : row.hora_ini.substring(0, 5))
          : null)
        const horaFin = row.hora_fin_formatted || (row.hora_fin && typeof row.hora_fin === 'string' 
          ? (row.hora_fin.includes('T') ? row.hora_fin.split('T')[1]?.substring(0, 5) : row.hora_fin.substring(0, 5))
          : null)
        
        if (horaIni && horaFin) {
          try {
            const [hIni, mIni] = horaIni.split(':').map(Number)
            const [hFin, mFin] = horaFin.split(':').map(Number)
            const inicio = hIni * 60 + mIni
            const fin = hFin * 60 + mFin
            const diff = fin >= inicio ? fin - inicio : (24 * 60) - inicio + fin
            const horas = diff / 60
            return `${horas.toFixed(1)} horas`
          } catch (e) {
            return 'N/A'
          }
        }
        return 'N/A'
      }
    },
    { 
      key: 'grupos_count', 
      label: 'Grupos',
      render: (row) => row.grupos_count || 0
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleView(row)
            }}
            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="Ver detalles"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleEdit(row)
            }}
            className="p-2 text-accent-600 hover:bg-accent-50 rounded-lg transition-colors"
            title="Editar"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleDelete(row)
            }}
            className="p-2 text-error-600 hover:bg-error-50 rounded-lg transition-colors"
            title="Eliminar"
            disabled={row.grupos_count > 0}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
          <div>
          <h1 className="text-3xl font-bold gradient-text">Horarios</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestión de horarios disponibles para grupos
          </p>
        </div>
        <Button onClick={handleNew} icon={<Plus className="h-5 w-5" />}>
            Nuevo Horario
          </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-primary-500 to-primary-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-sm">Total Horarios</p>
              <p className="text-3xl font-bold mt-1">{stats.total}</p>
            </div>
            <Clock className="h-12 w-12 text-primary-200" />
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-accent-500 to-accent-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-accent-100 text-sm">Con Grupos</p>
              <p className="text-3xl font-bold mt-1">{stats.conGrupos}</p>
            </div>
            <CheckCircle className="h-12 w-12 text-accent-200" />
          </div>
        </Card>
      </div>

      {/* Búsqueda y filtros */}
      <Card>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
              <Input
              type="text"
              placeholder="Buscar por días..."
                value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              icon={Search}
              />
            </div>
          <div className="w-48">
            <Input
              type="text"
              placeholder="Filtrar por días..."
              value={diasFilter}
              onChange={(e) => {
                setDiasFilter(e.target.value)
                setCurrentPage(1)
              }}
            />
          </div>
          <div className="w-48">
                <select
              value={turnoFilter}
              onChange={(e) => {
                setTurnoFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-800"
            >
              <option value="">Todos los turnos</option>
              <option value="mañana">Mañana</option>
              <option value="tarde">Tarde</option>
              <option value="noche">Noche</option>
                </select>
              </div>
            </div>
      </Card>

      {/* Tabla */}
      <Card>
        <Table
          columns={columns}
          data={horarios}
          loading={loading}
          onSort={handleSort}
          sortBy={sortBy}
          sortDirection={sortDirection}
          pagination={{
            currentPage,
            totalPages,
            perPage,
            total: totalRegistros,
            from,
            to,
            onPageChange: setCurrentPage,
            onPerPageChange: setPerPage
          }}
        />
      </Card>

      {/* Modal Crear/Editar */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingHorario(null)
          reset()
        }}
        title={editingHorario ? 'Editar Horario' : 'Nuevo Horario'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Días * (Selecciona uno o más días)
              </label>
              <select
                multiple
                {...register('dias', { 
                  required: 'Debes seleccionar al menos un día',
                  validate: (value) => {
                    if (!Array.isArray(value) || value.length === 0) {
                      return 'Debes seleccionar al menos un día'
                    }
                    return true
                  }
                })}
                onChange={handleDiasChange}
                value={diasSeleccionados}
                className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 min-h-[120px] ${
                  errors.dias 
                    ? 'border-error-500 focus:border-error-500' 
                    : 'border-gray-300 dark:border-gray-700 focus:border-primary-500'
                }`}
              >
                {diasSemana.map((dia) => (
                  <option key={dia.value} value={dia.value}>
                    {dia.label}
                  </option>
                ))}
              </select>
              {errors.dias && (
                <p className="mt-1 text-sm text-error-600 dark:text-error-400">
                  {errors.dias.message}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Mantén presionada la tecla Ctrl (o Cmd en Mac) para seleccionar múltiples días
              </p>
            </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hora Inicio *
              </label>
              <Input
                type="time"
                {...register('hora_ini', { required: 'La hora de inicio es requerida' })}
                error={errors.hora_ini?.message}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hora Fin *
              </label>
              <Input
                type="time"
                {...register('hora_fin', { 
                  required: 'La hora de fin es requerida',
                  validate: (value) => {
                    const horaIni = watch('hora_ini')
                    if (horaIni && value && value <= horaIni) {
                      return 'La hora de fin debe ser mayor a la hora de inicio'
                    }
                    return true
                  }
                })}
                error={errors.hora_fin?.message}
                onBlur={() => trigger('hora_fin')}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowModal(false)
                setEditingHorario(null)
                reset()
              }}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {editingHorario ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Ver */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false)
          setViewingHorario(null)
        }}
        title="Detalles del Horario"
      >
        {viewingHorario && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Días
                </label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {viewingHorario.dias}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Duración
                </label>
                <p className="text-gray-700 dark:text-gray-300">
                  {(() => {
                    // Usar el campo calculado del backend si está disponible
                    if (viewingHorario.duracion_horas !== undefined && viewingHorario.duracion_horas !== null) {
                      return `${viewingHorario.duracion_horas} horas`
                    }
                    
                    // Fallback: calcular manualmente
                    const horaIni = viewingHorario.hora_ini_formatted || (viewingHorario.hora_ini && typeof viewingHorario.hora_ini === 'string' 
                      ? (viewingHorario.hora_ini.includes('T') ? viewingHorario.hora_ini.split('T')[1]?.substring(0, 5) : viewingHorario.hora_ini.substring(0, 5))
                      : null)
                    const horaFin = viewingHorario.hora_fin_formatted || (viewingHorario.hora_fin && typeof viewingHorario.hora_fin === 'string' 
                      ? (viewingHorario.hora_fin.includes('T') ? viewingHorario.hora_fin.split('T')[1]?.substring(0, 5) : viewingHorario.hora_fin.substring(0, 5))
                      : null)
                    
                    if (horaIni && horaFin) {
                      try {
                        const [hIni, mIni] = horaIni.split(':').map(Number)
                        const [hFin, mFin] = horaFin.split(':').map(Number)
                        const inicio = hIni * 60 + mIni
                        const fin = hFin * 60 + mFin
                        const diff = fin >= inicio ? fin - inicio : (24 * 60) - inicio + fin
                        const horas = diff / 60
                        return `${horas.toFixed(1)} horas`
                      } catch (e) {
                        return 'N/A'
                      }
                    }
                    return 'N/A'
                  })()}
                </p>
              </div>
              </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Hora Inicio
                </label>
                <p className="text-gray-700 dark:text-gray-300">
                  {(() => {
                    // Usar el campo formateado del backend si está disponible
                    if (viewingHorario.hora_ini_formatted) {
                      return viewingHorario.hora_ini_formatted
                    }
                    
                    // Fallback: formatear manualmente si viene como timestamp
                    const hora = viewingHorario.hora_ini
                    if (hora) {
                      if (typeof hora === 'string') {
                        // Si viene como timestamp ISO, extraer la hora
                        if (hora.includes('T')) {
                          const parts = hora.split('T')
                          if (parts[1]) {
                            return parts[1].substring(0, 5)
                          }
                        }
                        // Si ya viene como H:i, devolverlo
                        if (hora.match(/^\d{2}:\d{2}/)) {
                          return hora.substring(0, 5)
                        }
                      }
                    }
                    return 'N/A'
                  })()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Hora Fin
                </label>
                <p className="text-gray-700 dark:text-gray-300">
                  {(() => {
                    // Usar el campo formateado del backend si está disponible
                    if (viewingHorario.hora_fin_formatted) {
                      return viewingHorario.hora_fin_formatted
                    }
                    
                    // Fallback: formatear manualmente si viene como timestamp
                    const hora = viewingHorario.hora_fin
                    if (hora) {
                      if (typeof hora === 'string') {
                        // Si viene como timestamp ISO, extraer la hora
                        if (hora.includes('T')) {
                          const parts = hora.split('T')
                          if (parts[1]) {
                            return parts[1].substring(0, 5)
                          }
                        }
                        // Si ya viene como H:i, devolverlo
                        if (hora.match(/^\d{2}:\d{2}/)) {
                          return hora.substring(0, 5)
                        }
                      }
                    }
                    return 'N/A'
                  })()}
                </p>
              </div>
            </div>

            {viewingHorario.grupos && viewingHorario.grupos.length > 0 && (
          <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Grupos Asociados ({viewingHorario.grupos.length})
            </label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {viewingHorario.grupos.map((grupo) => (
                    <div key={grupo.grupo_id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {grupo.programa?.nombre || 'Sin programa'}
                      </p>
                      {grupo.modulo && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Módulo: {grupo.modulo.nombre}
                        </p>
                      )}
                      {grupo.pivot?.aula && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Aula: {grupo.pivot.aula}
                        </p>
                      )}
                    </div>
                  ))}
                  </div>
              </div>
            )}
            </div>
          )}
      </Modal>
    </div>
  )
}

export default Horarios
