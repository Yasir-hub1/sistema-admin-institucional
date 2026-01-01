import React, { useState, useEffect } from 'react'
import {
  FileText,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Building2,
  Calendar,
  X,
  CheckCircle,
  XCircle
} from 'lucide-react'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Modal from '../../components/common/Modal'
import Table from '../../components/common/Table'
import Card from '../../components/common/Card'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { convenioService, tipoConvenioService, institucionService } from '../../services/configuracionService'

/**
 * Parsea una fecha evitando problemas de zona horaria
 * Cuando Laravel envía una fecha como "2024-01-15" (solo fecha), 
 * JavaScript la interpreta como UTC medianoche, causando que se muestre un día anterior.
 * Esta función parsea la fecha manualmente para evitar este problema.
 */
const parseDateLocal = (dateString) => {
  if (!dateString) return null
  
  try {
    // Si la fecha viene en formato "YYYY-MM-DD" o "YYYY-MM-DD HH:mm:ss"
    // Parseamos manualmente para evitar problemas de zona horaria
    if (typeof dateString === 'string') {
      // Si es solo fecha (YYYY-MM-DD), parseamos manualmente
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-').map(Number)
        return new Date(year, month - 1, day)
      }
      
      // Si incluye hora, intentamos parsear normalmente pero ajustamos
      if (dateString.includes('T') || dateString.includes(' ')) {
        // Si es una fecha ISO sin zona horaria, extraemos solo la fecha
        if (dateString.includes('T') && !dateString.includes('Z') && !dateString.includes('+')) {
          const dateOnly = dateString.split('T')[0]
          const [year, month, day] = dateOnly.split('-').map(Number)
          return new Date(year, month - 1, day)
        }
        // Si tiene zona horaria, parseamos normalmente
        return new Date(dateString)
      }
    }
    
    // Fallback: intentar parsear normalmente
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return null
    return date
  } catch (error) {
    console.error('Error parseando fecha:', error, dateString)
    return null
  }
}

/**
 * Formatea una fecha evitando problemas de zona horaria
 */
const formatDateLocal = (dateString) => {
  const date = parseDateLocal(dateString)
  if (!date) return 'N/A'
  
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const Convenios = () => {
  const [convenios, setConvenios] = useState([])
  const [tiposConvenio, setTiposConvenio] = useState([])
  const [instituciones, setInstituciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTipo, setSelectedTipo] = useState('')
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
  const [editingConvenio, setEditingConvenio] = useState(null)
  const [viewingConvenio, setViewingConvenio] = useState(null)
  const [institucionesSeleccionadas, setInstitucionesSeleccionadas] = useState([])
  const [siguienteNumeroConvenio, setSiguienteNumeroConvenio] = useState('')
  const [stats, setStats] = useState({
    total: 0,
    activos: 0
  })

  const { register, handleSubmit, reset, formState: { errors }, watch, setValue, trigger } = useForm({
    mode: 'onChange',
    defaultValues: {
      numero_convenio: '',
      objeto_convenio: '',
      fecha_ini: '',
      fecha_fin: '',
      fecha_firma: '',
      moneda: '',
      observaciones: '',
      tipo_convenio_id: ''
    }
  })

  useEffect(() => {
    fetchDatosFormulario()
    fetchConvenios()
  }, [currentPage, perPage, searchTerm, selectedTipo, sortBy, sortDirection])

  const fetchDatosFormulario = async () => {
    try {
      const response = await convenioService.getDatosFormulario()
      if (response.success && response.data) {
        setTiposConvenio(response.data.tipos_convenio || [])
        setInstituciones(response.data.instituciones || [])
        // Obtener siguiente número de convenio solo si no estamos editando
        if (!editingConvenio && response.data.siguiente_numero_convenio) {
          setSiguienteNumeroConvenio(response.data.siguiente_numero_convenio)
        }
      } else {
        toast.error(response.message || 'Error al cargar datos del formulario')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al cargar datos del formulario'
      toast.error(errorMessage)
    }
  }

  const fetchConvenios = async () => {
    try {
      setLoading(true)
      const response = await convenioService.getConvenios({
        page: currentPage,
        per_page: perPage,
        search: searchTerm,
        tipo_convenio_id: selectedTipo || undefined,
        sort_by: sortBy,
        sort_direction: sortDirection
      })
      
      if (response.success && response.data) {
        const conveniosData = response.data.data || []
        
        setConvenios(conveniosData)
        setTotalPages(response.data.last_page || 1)
        setTotalRegistros(response.data.total || 0)
        setFrom(response.data.from || 0)
        setTo(response.data.to || 0)
        
        setStats({
          total: response.data.total || 0,
          activos: conveniosData.filter(c => {
            const fechaFin = parseDateLocal(c.fecha_fin)
            if (!fechaFin) return false
            const hoy = new Date()
            hoy.setHours(0, 0, 0, 0) // Normalizar a inicio del día
            const fechaFinNormalizada = new Date(fechaFin)
            fechaFinNormalizada.setHours(0, 0, 0, 0)
            return fechaFinNormalizada >= hoy
          }).length || 0
        })
      } else {
        const errorMessage = response.message || 'Error al cargar convenios'
        toast.error(errorMessage)
        setConvenios([])
        setTotalPages(1)
        setTotalRegistros(0)
        setFrom(0)
        setTo(0)
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error de conexión. Por favor, verifica tu conexión a internet'
      toast.error(errorMessage)
      setConvenios([])
      setTotalPages(1)
      setTotalRegistros(0)
      setFrom(0)
      setTo(0)
    } finally {
      setLoading(false)
    }
  }

  const agregarInstitucion = () => {
    setInstitucionesSeleccionadas([
      ...institucionesSeleccionadas,
      { id: '', porcentaje_participacion: '', monto_asignado: '' }
    ])
  }

  const removerInstitucion = (index) => {
    setInstitucionesSeleccionadas(institucionesSeleccionadas.filter((_, i) => i !== index))
  }

  const actualizarInstitucion = (index, field, value) => {
    const nuevas = [...institucionesSeleccionadas]
    nuevas[index][field] = value
    setInstitucionesSeleccionadas(nuevas)
  }

  const onSubmit = async (data) => {
    // Validación adicional antes de enviar
    if (!data.objeto_convenio || data.objeto_convenio.trim() === '') {
      toast.error('El objeto del convenio es obligatorio')
      return
    }

    if (data.objeto_convenio.length > 500) {
      toast.error('El objeto del convenio no puede tener más de 500 caracteres')
      return
    }

    if (!data.fecha_ini) {
      toast.error('La fecha de inicio es obligatoria')
      return
    }

    if (!data.fecha_fin) {
      toast.error('La fecha de fin es obligatoria')
      return
    }

    // Validar que fecha_fin sea posterior a fecha_ini
    const fechaIni = new Date(data.fecha_ini)
    const fechaFin = new Date(data.fecha_fin)
    if (fechaFin <= fechaIni) {
      toast.error('La fecha de fin debe ser posterior a la fecha de inicio')
      return
    }

    // Validar fecha_firma si se proporciona
    if (data.fecha_firma) {
      const fechaFirma = new Date(data.fecha_firma)
      const hoy = new Date()
      hoy.setHours(23, 59, 59, 999) // Permitir hasta el final del día de hoy
      if (fechaFirma > hoy) {
        toast.error('La fecha de firma no puede ser posterior a hoy')
        return
      }
    }

    if (!data.tipo_convenio_id) {
      toast.error('El tipo de convenio es obligatorio')
      return
    }

    // Validar que haya al menos una institución
    if (institucionesSeleccionadas.length === 0) {
      toast.error('Debe agregar al menos una institución')
      return
    }

    // Validar que todas las instituciones tengan ID y datos válidos
    for (let i = 0; i < institucionesSeleccionadas.length; i++) {
      const inst = institucionesSeleccionadas[i]
      if (!inst.id || inst.id === '') {
        toast.error(`La institución ${i + 1} debe estar seleccionada`)
        return
      }

      // Validar porcentaje_participacion si se proporciona
      if (inst.porcentaje_participacion && inst.porcentaje_participacion !== '') {
        const porcentaje = parseFloat(inst.porcentaje_participacion)
        if (isNaN(porcentaje) || porcentaje < 0 || porcentaje > 100) {
          toast.error(`El porcentaje de participación de la institución ${i + 1} debe ser un número entre 0 y 100`)
          return
        }
      }

      // Validar monto_asignado si se proporciona
      if (inst.monto_asignado && inst.monto_asignado !== '') {
        const monto = parseFloat(inst.monto_asignado)
        if (isNaN(monto) || monto < 0) {
          toast.error(`El monto asignado de la institución ${i + 1} debe ser un número mayor o igual a 0`)
          return
        }
      }
    }

    // Validar moneda si se proporciona
    if (data.moneda && data.moneda.length > 10) {
      toast.error('La moneda no puede tener más de 10 caracteres')
      return
    }

    // Validar observaciones si se proporciona
    if (data.observaciones && data.observaciones.length > 1000) {
      toast.error('Las observaciones no pueden tener más de 1000 caracteres')
      return
    }

    try {
      setLoading(true)
      
      // Limpiar y preparar datos
      const convenioData = {
        objeto_convenio: data.objeto_convenio.trim(),
        fecha_ini: data.fecha_ini,
        fecha_fin: data.fecha_fin,
        fecha_firma: data.fecha_firma || null,
        moneda: data.moneda ? data.moneda.trim().toUpperCase() : null,
        observaciones: data.observaciones ? data.observaciones.trim() : null,
        tipo_convenio_id: parseInt(data.tipo_convenio_id),
        instituciones: institucionesSeleccionadas.map(inst => ({
          id: parseInt(inst.id),
          porcentaje_participacion: inst.porcentaje_participacion && inst.porcentaje_participacion !== '' 
            ? parseFloat(inst.porcentaje_participacion) 
            : null,
          monto_asignado: inst.monto_asignado && inst.monto_asignado !== '' 
            ? parseFloat(inst.monto_asignado) 
            : null
        }))
      }

      // Eliminar campos vacíos
      if (!convenioData.fecha_firma) delete convenioData.fecha_firma
      if (!convenioData.moneda) delete convenioData.moneda
      if (!convenioData.observaciones) delete convenioData.observaciones

      // Solo agregar numero_convenio si es edición
      if (editingConvenio) {
        convenioData.numero_convenio = data.numero_convenio || editingConvenio.numero_convenio
      }
      // No enviar numero_convenio al crear (se genera automáticamente en el backend)

      let response
      if (editingConvenio) {
        // Usar convenio_id que es el campo real de la base de datos
        const convenioId = editingConvenio.convenio_id || editingConvenio.id

        if (!convenioId) {
          console.error('❌ onSubmit - No se encontró ID en editingConvenio:', editingConvenio)
          toast.error('No se pudo identificar el ID del convenio para actualizar')
          setLoading(false)
          return
        }

        console.log('🔍 onSubmit - Actualizando convenio con ID:', convenioId)
        response = await convenioService.updateConvenio(convenioId, convenioData)
      } else {
        response = await convenioService.createConvenio(convenioData)
      }

      if (response.success) {
        toast.success(response.message || (editingConvenio ? 'Convenio actualizado exitosamente' : 'Convenio creado exitosamente'))
        setShowModal(false)
        reset()
        setEditingConvenio(null)
        setInstitucionesSeleccionadas([])
        setSiguienteNumeroConvenio('')
        await fetchDatosFormulario() // Recargar siguiente número
        await fetchConvenios()
      } else {
        // Mostrar mensaje principal
        toast.error(response.message || 'Error al guardar el convenio')
        
        // Mostrar errores de validación individuales
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
      const errorMessage = error.response?.data?.message || error.message || 'Error al guardar el convenio'
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

  const handleEdit = async (convenio) => {
    console.log('📋 handleEdit - Convenio recibido:', convenio)
    console.log('📋 handleEdit - convenio_id:', convenio.convenio_id, 'id:', convenio.id)
    
    try {
      // Usar convenio_id que es el campo real de la base de datos
      const convenioId = convenio.convenio_id || convenio.id

      if (!convenioId) {
        console.error('❌ handleEdit - No se encontró ID. Objeto completo:', convenio)
        toast.error('No se pudo identificar el ID del convenio')
        return
      }

      console.log('🔍 handleEdit - Llamando API con ID:', convenioId)
      const response = await convenioService.getConvenioById(convenioId)
      console.log('🔍 handleEdit - Respuesta recibida:', response)
      
      if (response.success) {
        const convenioData = response.data
        console.log('✅ handleEdit - ConvenioData recibido:', convenioData)
        console.log('✅ handleEdit - convenio_id:', convenioData.convenio_id)
        
        setEditingConvenio(convenioData)
        
        reset({
          convenio_id: convenioData.convenio_id,
          numero_convenio: convenioData.numero_convenio,
          objeto_convenio: convenioData.objeto_convenio,
          fecha_ini: convenioData.fecha_ini ? convenioData.fecha_ini.split('T')[0] : '',
          fecha_fin: convenioData.fecha_fin ? convenioData.fecha_fin.split('T')[0] : '',
          fecha_firma: convenioData.fecha_firma ? convenioData.fecha_firma.split('T')[0] : '',
          moneda: convenioData.moneda || '',
          observaciones: convenioData.observaciones || '',
          tipo_convenio_id: convenioData.tipo_convenio_id
        })

        // Cargar instituciones asociadas
        if (convenioData.instituciones && convenioData.instituciones.length > 0) {
          setInstitucionesSeleccionadas(
            convenioData.instituciones.map(inst => ({
              id: inst.id.toString(),
              porcentaje_participacion: inst.pivot?.porcentaje_participacion?.toString() || '',
              monto_asignado: inst.pivot?.monto_asignado?.toString() || ''
            }))
          )
        } else {
          setInstitucionesSeleccionadas([])
        }

        setSiguienteNumeroConvenio('') // Limpiar siguiente número al editar
        console.log('✅ handleEdit - Abriendo modal...')
        setShowModal(true)
        console.log('✅ handleEdit - Modal abierto, showModal:', true)
      } else {
        console.error('❌ handleEdit - Error en respuesta:', response.message)
        toast.error(response.message || 'Error al cargar datos del convenio')
      }
    } catch (error) {
      console.error('❌ handleEdit - Excepción:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Error al cargar datos del convenio'
      toast.error(errorMessage)
    }
  }

  const handleView = async (convenio) => {
    try {
      // Usar convenio_id que es el campo real de la base de datos
      const convenioId = convenio.convenio_id || convenio.id

      if (!convenioId) {
        console.error('❌ handleView - No se encontró ID. Objeto completo:', convenio)
        toast.error('No se pudo identificar el ID del convenio')
        return
      }

      console.log('🔍 handleView - ID extraído:', convenioId)
      const response = await convenioService.getConvenioById(convenioId)
      if (response.success) {
        setViewingConvenio(response.data)
        setShowViewModal(true)
      } else {
        toast.error(response.message || 'Error al cargar detalles del convenio')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al cargar detalles del convenio'
      toast.error(errorMessage)
    }
  }

  const handleDelete = async (convenio) => {
    // Usar convenio_id que es el campo real de la base de datos
    const convenioId = convenio.convenio_id || convenio.id

    if (!convenioId) {
      console.error('❌ handleDelete - No se encontró ID. Objeto completo:', convenio)
      toast.error('No se pudo identificar el ID del convenio')
      return
    }

    console.log('🔍 handleDelete - ID extraído:', convenioId)

    if (!window.confirm(`¿Está seguro de eliminar el convenio "${convenio.numero_convenio || 'este convenio'}"?`)) {
      return
    }

    try {
      setLoading(true)
      const response = await convenioService.removeConvenio(convenioId)
      if (response.success) {
        toast.success(response.message || 'Convenio eliminado exitosamente')
        await fetchConvenios()
      } else {
        toast.error(response.message || 'Error al eliminar el convenio')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al eliminar el convenio'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (column, direction) => {
    setSortBy(column)
    setSortDirection(direction)
    setCurrentPage(1)
  }

  const handleNew = async () => {
    setEditingConvenio(null)
    reset({
      convenio_id: '',
      numero_convenio: '',
      objeto_convenio: '',
      fecha_ini: '',
      fecha_fin: '',
      fecha_firma: '',
      moneda: '',
      observaciones: '',
      tipo_convenio_id: ''
    })
    setInstitucionesSeleccionadas([])
    // Obtener siguiente número de convenio
    await fetchDatosFormulario()
    setShowModal(true)
  }

  const columns = [
    { 
      key: 'convenio_id', 
      label: 'id',
      render: (row) => row.convenio_id || '-'
    },
    { 
      key: 'numero_convenio', 
      label: 'Número',
      render: (row) => row.numero_convenio || '-'
    },
    { 
      key: 'objeto_convenio', 
      label: 'Objeto',
      render: (row) => {
        const objeto = row.objeto_convenio || ''
        return objeto.length > 50 ? objeto.substring(0, 50) + '...' : objeto || '-'
      }
    },
    { 
      key: 'tipo_convenio', 
      label: 'Tipo',
      render: (row) => row.tipo_convenio?.nombre_tipo || row.tipoConvenio?.nombre_tipo || 'N/A'
    },
    { 
      key: 'fecha_ini', 
      label: 'Fecha Inicio',
      render: (row) => formatDateLocal(row.fecha_ini)
    },
    { 
      key: 'fecha_fin', 
      label: 'Fecha Fin',
      render: (row) => formatDateLocal(row.fecha_fin)
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (row) => {
        const fechaFin = parseDateLocal(row.fecha_fin)
        if (!fechaFin) {
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              <XCircle className="h-3 w-3 mr-1" />
              Sin fecha
            </span>
          )
        }
        
        const hoy = new Date()
        hoy.setHours(0, 0, 0, 0) // Normalizar a inicio del día
        const fechaFinNormalizada = new Date(fechaFin)
        fechaFinNormalizada.setHours(0, 0, 0, 0)
        
        if (fechaFinNormalizada >= hoy) {
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Activo
            </span>
          )
        } else {
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-error-100 text-error-800">
              <XCircle className="h-3 w-3 mr-1" />
              Vencido
            </span>
          )
        }
      }
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (row) => {
        // Debug: verificar qué datos tiene el row
        console.log('🔍 render actions - Row recibido:', row)
        console.log('🔍 render actions - convenio_id:', row?.convenio_id, 'id:', row?.id)
        
        if (!row || (!row.convenio_id && !row.id)) {
          console.error('❌ render actions - Row inválido:', row)
          return <span className="text-error-600">Error: datos inválidos</span>
        }
        
        return (
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log('🔍 onClick handleView - Row:', row)
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
                console.log('🔍 onClick handleEdit - Row:', row)
                console.log('🔍 onClick handleEdit - convenio_id:', row.convenio_id)
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
                console.log('🔍 onClick handleDelete - Row:', row)
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
    }
  ]

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Convenios Institucionales</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestión de convenios y asociación con instituciones
          </p>
        </div>
        <Button onClick={handleNew} icon={<Plus className="h-5 w-5" />}>
          Nuevo Convenio
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-primary-500 to-primary-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-sm">Total Convenios</p>
              <p className="text-3xl font-bold mt-1">{stats.total}</p>
            </div>
            <FileText className="h-12 w-12 text-primary-200" />
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-accent-500 to-accent-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-accent-100 text-sm">Convenios Activos</p>
              <p className="text-3xl font-bold mt-1">{stats.activos}</p>
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
              placeholder="Buscar por número o objeto..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              icon={Search}
            />
          </div>
          <div className="w-64">
            <select
              value={selectedTipo}
              onChange={(e) => {
                setSelectedTipo(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-800"
            >
              <option value="">Todos los tipos</option>
              {tiposConvenio.map(tipo => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre_tipo}
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
          data={convenios}
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
          setEditingConvenio(null)
          setInstitucionesSeleccionadas([])
          reset()
        }}
        title={editingConvenio ? 'Editar Convenio' : 'Nuevo Convenio'}
        size="xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Número de Convenio {!editingConvenio && '*'}
              </label>
              {editingConvenio ? (
                <Input
                  {...register('numero_convenio', { required: 'El número es requerido' })}
                  placeholder="Ej: CONV-2024-001"
                  error={errors.numero_convenio?.message}
                  readOnly
                  className="bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                />
              ) : (
                <Input
                  value={siguienteNumeroConvenio}
                  placeholder="Se generará automáticamente"
                  readOnly
                  className="bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                />
              )}
              {!editingConvenio && siguienteNumeroConvenio && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Este número se asignará automáticamente al crear el convenio
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Convenio *
              </label>
              <select
                {...register('tipo_convenio_id', { required: 'El tipo es requerido' })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-800"
              >
                <option value="">Seleccionar tipo...</option>
                {tiposConvenio.map(tipo => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nombre_tipo}
                  </option>
                ))}
              </select>
              {errors.tipo_convenio_id && (
                <p className="mt-1 text-sm text-error-600">{errors.tipo_convenio_id.message}</p>
              )}
            </div>
          </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Objeto del Convenio *
              </label>
              <textarea
                {...register('objeto_convenio', { 
                  required: 'El objeto del convenio es obligatorio',
                  maxLength: {
                    value: 500,
                    message: 'El objeto del convenio no puede tener más de 500 caracteres'
                  },
                  validate: (value) => {
                    if (value && value.trim().length === 0) {
                      return 'El objeto del convenio no puede estar vacío'
                    }
                    return true
                  }
                })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
                placeholder="Descripción del objeto del convenio..."
                onBlur={() => trigger('objeto_convenio')}
              />
              {errors.objeto_convenio && (
                <p className="mt-1 text-sm text-error-600">{errors.objeto_convenio.message}</p>
              )}
            </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha Inicio *
              </label>
              <Input
                type="date"
                {...register('fecha_ini', { 
                  required: 'La fecha de inicio es obligatoria',
                  validate: (value) => {
                    if (!value) return 'La fecha de inicio es obligatoria'
                    const fechaIni = new Date(value)
                    const fechaFin = watch('fecha_fin')
                    if (fechaFin && new Date(fechaFin) <= fechaIni) {
                      return 'La fecha de inicio debe ser anterior a la fecha de fin'
                    }
                    return true
                  }
                })}
                error={errors.fecha_ini?.message}
                onBlur={() => trigger('fecha_ini')}
                onChange={(e) => {
                  setValue('fecha_ini', e.target.value, { shouldValidate: true })
                  trigger('fecha_fin')
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha Fin *
              </label>
              <Input
                type="date"
                {...register('fecha_fin', { 
                  required: 'La fecha de fin es obligatoria',
                  validate: (value) => {
                    if (!value) return 'La fecha de fin es obligatoria'
                    const fechaFin = new Date(value)
                    const fechaIni = watch('fecha_ini')
                    if (fechaIni && fechaFin <= new Date(fechaIni)) {
                      return 'La fecha de fin debe ser posterior a la fecha de inicio'
                    }
                    return true
                  }
                })}
                error={errors.fecha_fin?.message}
                onBlur={() => trigger('fecha_fin')}
                onChange={(e) => {
                  setValue('fecha_fin', e.target.value, { shouldValidate: true })
                  trigger('fecha_ini')
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha de Firma
              </label>
              <Input
                type="date"
                {...register('fecha_firma', {
                  validate: (value) => {
                    if (value) {
                      const fechaFirma = new Date(value)
                      const hoy = new Date()
                      hoy.setHours(23, 59, 59, 999)
                      if (fechaFirma > hoy) {
                        return 'La fecha de firma no puede ser posterior a hoy'
                      }
                    }
                    return true
                  }
                })}
                error={errors.fecha_firma?.message}
                onBlur={() => trigger('fecha_firma')}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Moneda
              </label>
              <Input
                {...register('moneda', {
                  maxLength: {
                    value: 10,
                    message: 'La moneda no puede tener más de 10 caracteres'
                  }
                })}
                placeholder="Ej: BOB, USD"
                error={errors.moneda?.message}
                onBlur={() => trigger('moneda')}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase().trim()
                  setValue('moneda', value, { shouldValidate: true })
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Observaciones
            </label>
            <textarea
              {...register('observaciones', {
                maxLength: {
                  value: 1000,
                  message: 'Las observaciones no pueden tener más de 1000 caracteres'
                }
              })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
              placeholder="Observaciones adicionales..."
              onBlur={() => trigger('observaciones')}
            />
            {errors.observaciones && (
              <p className="mt-1 text-sm text-error-600">{errors.observaciones.message}</p>
            )}
          </div>

          {/* Instituciones */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Instituciones Participantes *
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={agregarInstitucion}
                icon={<Plus className="h-4 w-4" />}
              >
                Agregar Institución
              </Button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {institucionesSeleccionadas.map((inst, index) => (
                <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-gray-900 dark:text-white">Institución {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removerInstitucion(index)}
                      className="p-1 text-error-600 hover:bg-error-50 rounded"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-1">
                      <select
                        value={inst.id}
                        onChange={(e) => actualizarInstitucion(index, 'id', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-800"
                        required
                      >
                        <option value="">Seleccionar...</option>
                        {instituciones
                          .filter(i => !institucionesSeleccionadas.some((sel, idx) => idx !== index && sel.id === i.id.toString()))
                          .map(instOption => (
                            <option key={instOption.id} value={instOption.id}>
                              {instOption.nombre}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <Input
                        type="number"
                        placeholder="% Participación (0-100)"
                        value={inst.porcentaje_participacion}
                        onChange={(e) => {
                          const value = e.target.value
                          // Validar que sea un número válido entre 0 y 100
                          if (value === '' || (parseFloat(value) >= 0 && parseFloat(value) <= 100)) {
                            actualizarInstitucion(index, 'porcentaje_participacion', value)
                          }
                        }}
                        min="0"
                        max="100"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        placeholder="Monto Asignado"
                        value={inst.monto_asignado}
                        onChange={(e) => {
                          const value = e.target.value
                          // Validar que sea un número válido mayor o igual a 0
                          if (value === '' || parseFloat(value) >= 0) {
                            actualizarInstitucion(index, 'monto_asignado', value)
                          }
                        }}
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {institucionesSeleccionadas.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No hay instituciones agregadas. Haga clic en "Agregar Institución" para comenzar.
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
                setEditingConvenio(null)
                setInstitucionesSeleccionadas([])
                reset()
              }}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {editingConvenio ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Ver */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false)
          setViewingConvenio(null)
        }}
        title="Detalles del Convenio"
        size="xl"
      >
        {viewingConvenio && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Número de Convenio
                </label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {viewingConvenio.numero_convenio}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Tipo de Convenio
                </label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {viewingConvenio.tipo_convenio?.nombre_tipo || 'N/A'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Objeto del Convenio
              </label>
              <p className="text-gray-700 dark:text-gray-300">
                {viewingConvenio.objeto_convenio}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Fecha Inicio
                </label>
                <p className="text-gray-700 dark:text-gray-300">
                  {formatDateLocal(viewingConvenio.fecha_ini)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Fecha Fin
                </label>
                <p className="text-gray-700 dark:text-gray-300">
                  {formatDateLocal(viewingConvenio.fecha_fin)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Fecha de Firma
                </label>
                <p className="text-gray-700 dark:text-gray-300">
                  {formatDateLocal(viewingConvenio.fecha_firma)}
                </p>
              </div>
            </div>

            {viewingConvenio.moneda && (
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Moneda
                </label>
                <p className="text-gray-700 dark:text-gray-300">
                  {viewingConvenio.moneda}
                </p>
              </div>
            )}

            {viewingConvenio.observaciones && (
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Observaciones
                </label>
                <p className="text-gray-700 dark:text-gray-300">
                  {viewingConvenio.observaciones}
                </p>
              </div>
            )}

            {viewingConvenio.instituciones && viewingConvenio.instituciones.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Instituciones Participantes ({viewingConvenio.instituciones.length})
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {viewingConvenio.instituciones.map((inst) => (
                    <div key={inst.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {inst.nombre}
                      </p>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {inst.pivot?.porcentaje_participacion && (
                          <span>Participación: {inst.pivot.porcentaje_participacion}%</span>
                        )}
                        {inst.pivot?.monto_asignado && (
                          <span>Monto: {inst.pivot.monto_asignado} {viewingConvenio.moneda || ''}</span>
                        )}
                      </div>
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

export default Convenios

