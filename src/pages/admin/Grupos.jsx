import React, { useState, useEffect } from 'react'
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  X,
  CheckCircle,
  Calendar,
  BookOpen,
  UserCheck,
  Clock
} from 'lucide-react'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Modal from '../../components/common/Modal'
import Table from '../../components/common/Table'
import Card from '../../components/common/Card'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { grupoService } from '../../services/grupoService'

const Grupos = () => {
  const [grupos, setGrupos] = useState([])
  const [datosFormulario, setDatosFormulario] = useState({
    programas: [],
    modulos: [], // Se cargarán dinámicamente por programa
    docentes: [],
    horarios: []
  })
  const [modulosPorPrograma, setModulosPorPrograma] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPrograma, setSelectedPrograma] = useState('')
  const [selectedModulo, setSelectedModulo] = useState('')
  const [selectedDocente, setSelectedDocente] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [totalRegistros, setTotalRegistros] = useState(0)
  const [from, setFrom] = useState(0)
  const [to, setTo] = useState(0)
  const [sortBy, setSortBy] = useState('fecha_ini')
  const [sortDirection, setSortDirection] = useState('desc')
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingGrupo, setEditingGrupo] = useState(null)
  const [viewingGrupo, setViewingGrupo] = useState(null)
  const [horariosSeleccionados, setHorariosSeleccionados] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    activos: 0
  })

  const { register, handleSubmit, reset, formState: { errors }, watch, trigger } = useForm({
    mode: 'onChange'
  })

  const programaId = watch('programa_id')

  // Cargar datos del formulario solo una vez al montar el componente
  useEffect(() => {
    fetchDatosFormulario()
  }, [])

  // Cargar grupos cuando cambien los filtros o paginación
  useEffect(() => {
    fetchGrupos()
  }, [currentPage, perPage, searchTerm, selectedPrograma, selectedModulo, selectedDocente, sortBy, sortDirection])

  // Cargar módulos cuando se selecciona un programa
  useEffect(() => {
    const cargarModulosPorPrograma = async () => {
      if (programaId && programaId !== '') {
        try {
          const response = await grupoService.getModulosPorPrograma(programaId)
          if (response.success && response.data) {
            setModulosPorPrograma(response.data)
            // Limpiar módulo seleccionado si no está en la nueva lista
            const moduloActual = watch('modulo_id')
            if (moduloActual && !response.data.some(m => {
              const modId = m.id || m.modulo_id
              return modId === parseInt(moduloActual)
            })) {
              const currentValues = watch()
              reset({ ...currentValues, modulo_id: '' })
            }
          } else {
            setModulosPorPrograma([])
            if (response.message) {
              toast.error(response.message)
            }
          }
        } catch (error) {
          console.error('Error al cargar módulos:', error)
          setModulosPorPrograma([])
        }
      } else {
        setModulosPorPrograma([])
        // Limpiar módulo seleccionado si no hay programa
        const currentValues = watch()
        if (currentValues.modulo_id) {
          reset({ ...currentValues, modulo_id: '' })
        }
      }
    }

    cargarModulosPorPrograma()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programaId])

  const fetchDatosFormulario = async () => {
    try {
      console.log('🔄 Iniciando carga de datos del formulario...')
      const response = await grupoService.getDatosFormulario()
      
      console.log('📦 Respuesta completa del servicio:', response)
      
      if (response.success && response.data) {
        console.log('✅ Datos del formulario cargados:', response.data)
        console.log('📊 Programas:', response.data.programas?.length || 0)
        console.log('📊 Módulos:', response.data.modulos?.length || 0)
        console.log('📊 Docentes:', response.data.docentes?.length || 0)
        console.log('📊 Horarios:', response.data.horarios?.length || 0)
        
        // Asegurar que siempre sea un objeto con arrays
        setDatosFormulario({
          programas: Array.isArray(response.data.programas) ? response.data.programas : [],
          modulos: Array.isArray(response.data.modulos) ? response.data.modulos : [],
          docentes: Array.isArray(response.data.docentes) ? response.data.docentes : [],
          horarios: Array.isArray(response.data.horarios) ? response.data.horarios : []
        })
      } else {
        console.error('❌ Error en respuesta:', response)
        toast.error(response.message || 'Error al cargar datos del formulario')
      }
    } catch (error) {
      console.error('❌ Error al cargar datos del formulario:', error)
      console.error('❌ Detalles del error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
      const errorMessage = error.response?.data?.message || error.message || 'Error al cargar datos del formulario'
      toast.error(errorMessage)
    }
  }

  const fetchGrupos = async () => {
    try {
      setLoading(true)
      const response = await grupoService.getGrupos({
        page: currentPage,
        per_page: perPage,
        search: searchTerm,
        programa_id: selectedPrograma || undefined,
        modulo_id: selectedModulo || undefined,
        docente_id: selectedDocente || undefined,
        sort_by: sortBy,
        sort_direction: sortDirection
      })
      
      if (response.success && response.data) {
        const gruposData = response.data.data || []
        setGrupos(gruposData)
        setTotalPages(response.data.last_page || 1)
        setTotalRegistros(response.data.total || 0)
        setFrom(response.data.from || 0)
        setTo(response.data.to || 0)
        setStats({
          total: response.data.total || 0,
          activos: gruposData.filter(g => {
            if (!g.fecha_fin) return false
            return new Date(g.fecha_fin) >= new Date()
          }).length || 0
        })
      } else {
        toast.error(response.message || 'Error al cargar grupos')
        setGrupos([])
        setTotalPages(1)
        setTotalRegistros(0)
        setFrom(0)
        setTo(0)
      }
    } catch (error) {
      toast.error('Error al cargar grupos')
      setGrupos([])
      setTotalPages(1)
      setTotalRegistros(0)
      setFrom(0)
      setTo(0)
    } finally {
      setLoading(false)
    }
  }

  const agregarHorario = () => {
    setHorariosSeleccionados([
      ...horariosSeleccionados,
      { horario_id: '', aula: '' }
    ])
  }

  const removerHorario = (index) => {
    setHorariosSeleccionados(horariosSeleccionados.filter((_, i) => i !== index))
  }

  const actualizarHorario = (index, field, value) => {
    const nuevas = [...horariosSeleccionados]
    nuevas[index][field] = value
    setHorariosSeleccionados(nuevas)
  }

  const onSubmit = async (data) => {
    // Validación adicional antes de enviar
    if (!data.fecha_ini) {
      toast.error('La fecha de inicio es obligatoria')
      return
    }

    if (!data.fecha_fin) {
      toast.error('La fecha de fin es obligatoria')
      return
    }

    // Validar que fecha_fin sea mayor que fecha_ini
    if (data.fecha_fin <= data.fecha_ini) {
      toast.error('La fecha de fin debe ser mayor a la fecha de inicio')
      return
    }

    if (!data.programa_id) {
      toast.error('El programa es obligatorio')
      return
    }

    if (!data.modulo_id) {
      toast.error('El módulo es obligatorio')
      return
    }

    if (!data.docente_id) {
      toast.error('El docente es obligatorio')
      return
    }

    try {
      setLoading(true)
      
      // Función auxiliar para normalizar fechas y evitar desfase por zona horaria
      const normalizarFecha = (fechaString) => {
        if (!fechaString) return null
        // Asegurar que la fecha se maneje como string sin conversión de zona horaria
        // Si viene en formato YYYY-MM-DD, mantenerlo así
        const fecha = fechaString.trim()
        // Validar formato YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
          return fecha
        }
        // Si es un objeto Date, extraer solo la parte de fecha
        if (fechaString instanceof Date) {
          const year = fechaString.getFullYear()
          const month = String(fechaString.getMonth() + 1).padStart(2, '0')
          const day = String(fechaString.getDate()).padStart(2, '0')
          return `${year}-${month}-${day}`
        }
        return fecha
      }
      
      // Preparar datos según el modelo
      const grupoData = {
        fecha_ini: normalizarFecha(data.fecha_ini),
        fecha_fin: normalizarFecha(data.fecha_fin),
        programa_id: parseInt(data.programa_id),
        modulo_id: parseInt(data.modulo_id),
        docente_id: parseInt(data.docente_id),
        horarios: horariosSeleccionados
          .filter(hor => hor.horario_id)
          .map(hor => ({
            horario_id: parseInt(hor.horario_id),
            aula: hor.aula && hor.aula.trim() !== '' ? hor.aula.trim() : null
          }))
      }

      let response
      if (editingGrupo) {
        // Usar siempre el id para actualizar
        const grupoId = editingGrupo.grupo_id || editingGrupo.id

        if (!grupoId) {
          toast.error('No se pudo identificar el grupo. Por favor, recarga la página.')
          setLoading(false)
          return
        }

        response = await grupoService.updateGrupo(grupoId, grupoData)
      } else {
        response = await grupoService.createGrupo(grupoData)
      }

      if (response.success) {
        toast.success(response.message || (editingGrupo ? 'Grupo actualizado exitosamente' : 'Grupo creado exitosamente'))
        setShowModal(false)
        reset()
        setEditingGrupo(null)
        setHorariosSeleccionados([])
        await fetchGrupos()
      } else {
        toast.error(response.message || 'Error al guardar grupo')
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
      const errorMessage = error.response?.data?.message || error.message || 'Error al guardar grupo'
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

  const handleEdit = async (grupo) => {
    // Usar siempre el id para editar
    const grupoId = grupo.grupo_id || grupo.id

    if (!grupoId) {
      toast.error('No se pudo identificar el grupo')
      return
    }

    try {
      setLoading(true)
      const response = await grupoService.getGrupo(grupoId)
      
      if (response.success) {
        const grupoData = response.data
        setEditingGrupo(grupoData)
        
        // Formatear fechas para inputs type="date"
        const fechaIni = grupoData.fecha_ini 
          ? (typeof grupoData.fecha_ini === 'string' ? grupoData.fecha_ini.split('T')[0] : grupoData.fecha_ini)
          : ''
        const fechaFin = grupoData.fecha_fin 
          ? (typeof grupoData.fecha_fin === 'string' ? grupoData.fecha_fin.split('T')[0] : grupoData.fecha_fin)
          : ''
        
        reset({
          fecha_ini: fechaIni,
          fecha_fin: fechaFin,
          programa_id: grupoData.programa_id?.toString() || '',
          modulo_id: grupoData.modulo_id?.toString() || '',
          docente_id: grupoData.docente_id?.toString() || ''
        })

        // Cargar módulos del programa cuando se edita
        if (grupoData.programa_id) {
          grupoService.getModulosPorPrograma(grupoData.programa_id)
            .then(response => {
              if (response.success && response.data) {
                setModulosPorPrograma(response.data)
              }
            })
            .catch(error => {
              console.error('Error al cargar módulos:', error)
            })
        }

        // Cargar horarios asociados
        if (grupoData.horarios && grupoData.horarios.length > 0) {
          setHorariosSeleccionados(
            grupoData.horarios.map(hor => ({
              horario_id: (hor.horario_id || hor.id)?.toString() || '',
              aula: hor.pivot?.aula || ''
            }))
          )
        } else {
          setHorariosSeleccionados([])
        }

        setShowModal(true)
      } else {
        toast.error(response.message || 'Error al cargar datos del grupo')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al cargar datos del grupo'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleView = async (grupo) => {
    // Usar siempre el id para ver
    const grupoId = grupo.grupo_id || grupo.id

    if (!grupoId) {
      toast.error('No se pudo identificar el grupo')
      return
    }

    try {
      const response = await grupoService.getGrupo(grupoId)
      if (response.success) {
        setViewingGrupo(response.data)
        setShowViewModal(true)
      } else {
        toast.error(response.message || 'Error al cargar detalles del grupo')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al cargar detalles del grupo'
      toast.error(errorMessage)
    }
  }

  const handleDelete = async (grupo) => {
    // Usar siempre el id para eliminar
    const grupoId = grupo.grupo_id || grupo.id

    if (!grupoId) {
      toast.error('No se pudo identificar el grupo')
      return
    }

    const programaNombre = grupo.programa?.nombre || 'N/A'
    const moduloNombre = grupo.modulo?.nombre || 'N/A'

    if (!window.confirm(`¿Está seguro de eliminar el grupo "${programaNombre} - ${moduloNombre}"?`)) {
      return
    }

    try {
      const response = await grupoService.deleteGrupo(grupoId)
      if (response.success) {
        toast.success(response.message)
        fetchGrupos()
      } else {
        toast.error(response.message)
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al eliminar grupo'
      toast.error(errorMessage)
    }
  }

  const handleNew = () => {
    setEditingGrupo(null)
    reset({
      fecha_ini: '',
      fecha_fin: '',
      programa_id: '',
      modulo_id: '',
      docente_id: ''
    })
    setHorariosSeleccionados([])
    setShowModal(true)
  }

  const handleSort = (column, direction) => {
    setSortBy(column)
    setSortDirection(direction)
    setCurrentPage(1)
  }

  const columns = [
    { 
      key: 'programa', 
      label: 'Programa',
      render: (row) => row.programa?.nombre || 'N/A'
    },
    { 
      key: 'modulo', 
      label: 'Módulo',
      render: (row) => row.modulo?.nombre || 'N/A'
    },
    { 
      key: 'docente', 
      label: 'Docente',
      render: (row) => {
        if (row.docente) {
          return `${row.docente.nombre || ''} ${row.docente.apellido || ''}`.trim() || 'N/A'
        }
        return 'N/A'
      }
    },
    { 
      key: 'fecha_ini', 
      label: 'Fecha Inicio',
      render: (row) => {
        if (row.fecha_ini) {
          const fecha = new Date(row.fecha_ini)
          return fecha.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' })
        }
        return 'N/A'
      }
    },
    { 
      key: 'fecha_fin', 
      label: 'Fecha Fin',
      render: (row) => {
        if (row.fecha_fin) {
          const fecha = new Date(row.fecha_fin)
          return fecha.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' })
        }
        return 'N/A'
      }
    },
    { 
      key: 'estudiantes_count', 
      label: 'Estudiantes',
      render: (row) => row.estudiantes_count || 0
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
          <h1 className="text-3xl font-bold gradient-text">Grupos de Enseñanza</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestión de grupos con asignación de programa, módulo, docente y horarios
          </p>
        </div>
        <Button onClick={handleNew} icon={<Plus className="h-5 w-5" />}>
          Nuevo Grupo
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-primary-500 to-primary-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-sm">Total Grupos</p>
              <p className="text-3xl font-bold mt-1">{stats.total}</p>
            </div>
            <Users className="h-12 w-12 text-primary-200" />
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-accent-500 to-accent-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-accent-100 text-sm">Grupos Activos</p>
              <p className="text-3xl font-bold mt-1">{stats.activos}</p>
            </div>
            <CheckCircle className="h-12 w-12 text-accent-200" />
          </div>
        </Card>
      </div>

      {/* Búsqueda y filtros */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <Input
              type="text"
              placeholder="Buscar por programa, módulo o docente..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              icon={Search}
            />
          </div>
          <div>
            <select
              value={selectedPrograma}
              onChange={(e) => {
                setSelectedPrograma(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-800"
            >
              <option value="">Todos los programas</option>
              {datosFormulario.programas && datosFormulario.programas.length > 0 && datosFormulario.programas.map(prog => (
                <option key={prog.id} value={prog.id}>
                  {prog.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={selectedDocente}
              onChange={(e) => {
                setSelectedDocente(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-800"
            >
              <option value="">Todos los docentes</option>
              {datosFormulario.docentes && datosFormulario.docentes.length > 0 && datosFormulario.docentes.map(doc => (
                <option key={doc.id} value={doc.id}>
                  {doc.nombre_completo}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Tabla */}
      <Card>
        <Table
          columns={columns}
          data={grupos}
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
          setEditingGrupo(null)
          setHorariosSeleccionados([])
          reset()
        }}
        title={editingGrupo ? 'Editar Grupo' : 'Nuevo Grupo'}
        size="xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Programa *
              </label>
              <select
                {...register('programa_id', { required: 'El programa es requerido' })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-800"
              >
                <option value="">Seleccionar programa...</option>
                {Array.isArray(datosFormulario.programas) && datosFormulario.programas.length > 0 ? (
                  datosFormulario.programas.map(prog => (
                    <option key={prog.id || prog.programa_id} value={prog.id || prog.programa_id}>
                      {prog.nombre || 'Sin nombre'}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    {loading ? 'Cargando programas...' : 'No hay programas disponibles'}
                  </option>
                )}
              </select>
              {errors.programa_id && (
                <p className="mt-1 text-sm text-error-600">{errors.programa_id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Módulo *
              </label>
              <select
                {...register('modulo_id', { required: 'El módulo es requerido' })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-800"
                disabled={!programaId || programaId === ''}
              >
                <option value="">
                  {!programaId || programaId === '' 
                    ? 'Primero seleccione un programa...' 
                    : modulosPorPrograma.length === 0 
                      ? (loading ? 'Cargando módulos...' : 'No hay módulos disponibles para este programa')
                      : 'Seleccionar módulo...'}
                </option>
                {Array.isArray(modulosPorPrograma) && modulosPorPrograma.length > 0 ? (
                  modulosPorPrograma.map(mod => {
                    const modId = mod.id || mod.modulo_id
                    return (
                      <option key={modId} value={modId}>
                        {mod.nombre || 'Sin nombre'} ({mod.credito || 0} créditos)
                      </option>
                    )
                  })
                ) : null}
              </select>
              {errors.modulo_id && (
                <p className="mt-1 text-sm text-error-600">{errors.modulo_id.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Docente Responsable *
            </label>
            <select
              {...register('docente_id', { required: 'El docente es requerido' })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-800"
            >
              <option value="">Seleccionar docente...</option>
              {Array.isArray(datosFormulario.docentes) && datosFormulario.docentes.length > 0 ? (
                datosFormulario.docentes.map(doc => {
                  return (
                    <option key={doc.id} value={doc.id}>
                      {doc.nombre_completo || `${doc.nombre || ''} ${doc.apellido || ''}`.trim()} - CI: {doc.ci || 'N/A'}
                    </option>
                  )
                })
              ) : (
                <option value="" disabled>
                  {loading ? 'Cargando docentes...' : 'No hay docentes disponibles'}
                </option>
              )}
            </select>
            {errors.docente_id && (
              <p className="mt-1 text-sm text-error-600">{errors.docente_id.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha Inicio *
              </label>
              <Input
                type="date"
                {...register('fecha_ini', { required: 'La fecha de inicio es requerida' })}
                error={errors.fecha_ini?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha Fin *
              </label>
              <Input
                type="date"
                {...register('fecha_fin', { 
                  required: 'La fecha de fin es requerida',
                  validate: (value) => {
                    const fechaIni = watch('fecha_ini')
                    if (fechaIni && value && value <= fechaIni) {
                      return 'La fecha de fin debe ser mayor a la fecha de inicio'
                    }
                    return true
                  }
                })}
                error={errors.fecha_fin?.message}
                onBlur={() => trigger('fecha_fin')}
              />
            </div>
          </div>

          {/* Horarios */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Horarios del Grupo
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={agregarHorario}
                icon={<Plus className="h-4 w-4" />}
              >
                Agregar Horario
              </Button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {horariosSeleccionados.map((hor, index) => (
                <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-gray-900 dark:text-white">Horario {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removerHorario(index)}
                      className="p-1 text-error-600 hover:bg-error-50 rounded"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <select
                        value={hor.horario_id}
                        onChange={(e) => actualizarHorario(index, 'horario_id', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-800"
                        required
                      >
                        <option value="">Seleccionar horario...</option>
                        {datosFormulario.horarios && datosFormulario.horarios.length > 0 ? (
                          datosFormulario.horarios
                            .filter(h => !horariosSeleccionados.some((sel, idx) => idx !== index && sel.horario_id === h.id.toString()))
                            .map(horOption => {
                              const horaIni = horOption.hora_ini_formatted || horOption.hora_ini || 'N/A'
                              const horaFin = horOption.hora_fin_formatted || horOption.hora_fin || 'N/A'
                              const horaIniStr = typeof horaIni === 'string' && horaIni.includes('T') ? horaIni.split('T')[1]?.substring(0, 5) : (typeof horaIni === 'string' ? horaIni.substring(0, 5) : 'N/A')
                              const horaFinStr = typeof horaFin === 'string' && horaFin.includes('T') ? horaFin.split('T')[1]?.substring(0, 5) : (typeof horaFin === 'string' ? horaFin.substring(0, 5) : 'N/A')
                              return (
                                <option key={horOption.id} value={horOption.id}>
                                  {horOption.dias} - {horaIniStr} a {horaFinStr}
                                </option>
                              )
                            })
                        ) : (
                          <option value="" disabled>Cargando horarios...</option>
                        )}
                      </select>
                    </div>
                    <div>
                      <Input
                        type="text"
                        placeholder="Aula (opcional)"
                        value={hor.aula}
                        onChange={(e) => actualizarHorario(index, 'aula', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {horariosSeleccionados.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No hay horarios agregados. Haga clic en "Agregar Horario" para comenzar.
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowModal(false)
                setEditingGrupo(null)
                setHorariosSeleccionados([])
                reset()
              }}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {editingGrupo ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Ver */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false)
          setViewingGrupo(null)
        }}
        title="Detalles del Grupo"
        size="xl"
      >
        {viewingGrupo && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Programa
                </label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {viewingGrupo.programa?.nombre || 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Módulo
                </label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {viewingGrupo.modulo?.nombre || 'N/A'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Docente Responsable
              </label>
              <p className="text-gray-700 dark:text-gray-300">
                {viewingGrupo.docente ? `${viewingGrupo.docente.nombre} ${viewingGrupo.docente.apellido}` : 'N/A'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Fecha Inicio
                </label>
                <p className="text-gray-700 dark:text-gray-300">
                  {viewingGrupo.fecha_ini 
                    ? new Date(viewingGrupo.fecha_ini).toLocaleDateString('es-ES', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })
                    : 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Fecha Fin
                </label>
                <p className="text-gray-700 dark:text-gray-300">
                  {viewingGrupo.fecha_fin 
                    ? new Date(viewingGrupo.fecha_fin).toLocaleDateString('es-ES', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })
                    : 'N/A'}
                </p>
              </div>
            </div>

            {viewingGrupo.horarios && viewingGrupo.horarios.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Horarios Asociados ({viewingGrupo.horarios.length})
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {viewingGrupo.horarios.map((hor) => (
                    <div key={hor.horario_id || hor.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {hor.dias}
                      </p>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                        <span>
                          {(() => {
                            const horaIni = hor.hora_ini_formatted || hor.hora_ini
                            const horaFin = hor.hora_fin_formatted || hor.hora_fin
                            
                            let horaIniStr = 'N/A'
                            let horaFinStr = 'N/A'
                            
                            if (horaIni) {
                              if (typeof horaIni === 'string') {
                                if (horaIni.includes('T')) {
                                  horaIniStr = horaIni.split('T')[1]?.substring(0, 5) || horaIni.substring(0, 5)
                                } else {
                                  horaIniStr = horaIni.substring(0, 5)
                                }
                              }
                            }
                            
                            if (horaFin) {
                              if (typeof horaFin === 'string') {
                                if (horaFin.includes('T')) {
                                  horaFinStr = horaFin.split('T')[1]?.substring(0, 5) || horaFin.substring(0, 5)
                                } else {
                                  horaFinStr = horaFin.substring(0, 5)
                                }
                              }
                            }
                            
                            return `${horaIniStr} - ${horaFinStr}`
                          })()}
                        </span>
                        {hor.pivot?.aula && (
                          <span>Aula: {hor.pivot.aula}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {viewingGrupo.estudiantes && viewingGrupo.estudiantes.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Estudiantes Asignados ({viewingGrupo.estudiantes.length})
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {viewingGrupo.estudiantes.map((est) => (
                    <div key={est.registro_estudiante || est.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {est.nombre} {est.apellido}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        CI: {est.ci}
                      </p>
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

export default Grupos
