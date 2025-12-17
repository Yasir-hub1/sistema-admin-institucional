import React, { useState, useEffect } from 'react'
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Building2,
  Calendar,
  X,
  CheckCircle,
  GraduationCap
} from 'lucide-react'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Modal from '../../components/common/Modal'
import Table from '../../components/common/Table'
import Card from '../../components/common/Card'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { programaService } from '../../services/planificacionService'

const Programas = () => {
  const [programas, setProgramas] = useState([])
  const [datosFormulario, setDatosFormulario] = useState({
    ramas_academicas: [],
    versiones: [],
    tipos_programa: [],
    instituciones: [],
    modulos: []
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRama, setSelectedRama] = useState('')
  const [selectedTipo, setSelectedTipo] = useState('')
  const [selectedVersion, setSelectedVersion] = useState('')
  const [selectedInstitucion, setSelectedInstitucion] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [totalRegistros, setTotalRegistros] = useState(0)
  const [from, setFrom] = useState(0)
  const [to, setTo] = useState(0)
  const [sortBy, setSortBy] = useState('nombre')
  const [sortDirection, setSortDirection] = useState('asc')
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingPrograma, setEditingPrograma] = useState(null)
  const [viewingPrograma, setViewingPrograma] = useState(null)
  const [modulosSeleccionados, setModulosSeleccionados] = useState([])
  const [subprogramasSeleccionados, setSubprogramasSeleccionados] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    activos: 0
  })

  const { register, handleSubmit, reset, formState: { errors }, watch, setValue } = useForm()

  useEffect(() => {
    fetchDatosFormulario()
    fetchProgramas()
  }, [currentPage, perPage, searchTerm, selectedRama, selectedTipo, selectedVersion, selectedInstitucion, sortBy, sortDirection])

  const fetchDatosFormulario = async () => {
    try {
      const response = await programaService.getDatosFormulario()
      if (response.success && response.data) {
        setDatosFormulario(response.data)
      }
    } catch (error) {
      console.error('Error al cargar datos del formulario:', error)
    }
  }

  const fetchProgramas = async () => {
    try {
      setLoading(true)
      const response = await programaService.getProgramas({
        page: currentPage,
        per_page: perPage,
        search: searchTerm,
        rama_academica_id: selectedRama || undefined,
        tipo_programa_id: selectedTipo || undefined,
        version_id: selectedVersion || undefined,
        institucion_id: selectedInstitucion || undefined,
        sort_by: sortBy,
        sort_direction: sortDirection
      })
      
      if (response.success && response.data) {
        const programasData = response.data.data || []
        setProgramas(programasData)
        setTotalPages(response.data.last_page || 1)
        setTotalRegistros(response.data.total || 0)
        setFrom(response.data.from || 0)
        setTo(response.data.to || 0)
        setStats({
          total: response.data.total || 0,
          activos: programasData.length || 0
        })
      } else {
        toast.error(response.message || 'Error al cargar programas')
        setProgramas([])
        setTotalPages(1)
        setTotalRegistros(0)
        setFrom(0)
        setTo(0)
      }
    } catch (error) {
      toast.error('Error al cargar programas')
      setProgramas([])
      setTotalPages(1)
      setTotalRegistros(0)
      setFrom(0)
      setTo(0)
    } finally {
      setLoading(false)
    }
  }

  const agregarModulo = () => {
    setModulosSeleccionados([
      ...modulosSeleccionados,
      { id: '', edicion: '' }
    ])
  }

  const removerModulo = (index) => {
    setModulosSeleccionados(modulosSeleccionados.filter((_, i) => i !== index))
  }

  const actualizarModulo = (index, field, value) => {
    const nuevas = [...modulosSeleccionados]
    if (field === 'id') {
      // Asegurar que el ID sea un string válido
      nuevas[index][field] = value && value !== '' ? value.toString() : ''
    } else {
      nuevas[index][field] = value
    }
    setModulosSeleccionados(nuevas)
  }

  const agregarSubprograma = () => {
    setSubprogramasSeleccionados([
      ...subprogramasSeleccionados,
      ''
    ])
  }

  const removerSubprograma = (index) => {
    setSubprogramasSeleccionados(subprogramasSeleccionados.filter((_, i) => i !== index))
  }

  const actualizarSubprograma = (index, value) => {
    const nuevas = [...subprogramasSeleccionados]
    nuevas[index] = value
    setSubprogramasSeleccionados(nuevas)
  }

  const onSubmit = async (data) => {
    // Validación adicional antes de enviar
    if (!data.nombre || data.nombre.trim() === '') {
      toast.error('El nombre del programa es obligatorio')
      return
    }

    if (!data.duracion_meses || parseInt(data.duracion_meses) < 1) {
      toast.error('La duración debe ser al menos 1 mes')
      return
    }

    // Validar que los módulos seleccionados tengan IDs válidos
    const modulosInvalidos = modulosSeleccionados.filter(mod => !mod.id || mod.id === '' || mod.id === null)
    if (modulosSeleccionados.length > 0 && modulosInvalidos.length > 0) {
      toast.error('Por favor, seleccione un módulo válido para todos los módulos agregados')
      return
    }

    try {
      setLoading(true)
      // Preparar módulos con validación
      const modulosValidos = modulosSeleccionados
        .filter(mod => {
          const id = mod.id?.toString().trim()
          return id && id !== '' && id !== 'null' && id !== 'undefined'
        })
        .map(mod => {
          const moduloId = parseInt(mod.id)
          if (isNaN(moduloId) || moduloId <= 0) {
            throw new Error(`ID de módulo inválido: ${mod.id}`)
          }
          return {
            id: moduloId,
            edicion: mod.edicion && mod.edicion.trim() !== '' ? parseInt(mod.edicion) : null
          }
        })

      const programaData = {
        nombre: data.nombre.trim(),
        duracion_meses: parseInt(data.duracion_meses),
        total_modulos: data.total_modulos ? parseInt(data.total_modulos) : null,
        costo: data.costo ? parseFloat(data.costo) : null,
        version_id: parseInt(data.version_id),
        rama_academica_id: parseInt(data.rama_academica_id),
        tipo_programa_id: parseInt(data.tipo_programa_id),
        institucion_id: parseInt(data.institucion_id),
        modulos: modulosValidos,
        subprogramas: subprogramasSeleccionados
          .filter(sub => sub)
          .map(sub => parseInt(sub))
      }

      let response
      if (editingPrograma) {
        // Asegurar que tenemos el ID correcto
        const programaId = editingPrograma.id || editingPrograma.programa_id
        
        if (!programaId) {
          toast.error('No se pudo identificar el ID del programa para actualizar')
          setLoading(false)
          return
        }

        response = await programaService.updatePrograma(programaId, programaData)
      } else {
        response = await programaService.createPrograma(programaData)
      }

      if (response.success) {
        toast.success(response.message || (editingPrograma ? 'Programa actualizado exitosamente' : 'Programa creado exitosamente'))
        setShowModal(false)
        reset()
        setEditingPrograma(null)
        setModulosSeleccionados([])
        setSubprogramasSeleccionados([])
        await fetchProgramas()
      } else {
        toast.error(response.message || 'Error al guardar programa')
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
      const errorMessage = error.response?.data?.message || error.message || 'Error al guardar programa'
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

  const handleEdit = async (programa) => {
    // Asegurar que tenemos el ID correcto
    const programaId = programa.id || programa.programa_id
    
    if (!programaId) {
      toast.error('No se pudo identificar el ID del programa')
      return
    }

    try {
      const response = await programaService.getProgramaById(programaId)
      if (response.success) {
        const programaData = response.data
        setEditingPrograma(programaData)
        
        reset({
          nombre: programaData.nombre,
          duracion_meses: programaData.duracion_meses,
          total_modulos: programaData.total_modulos || '',
          costo: programaData.costo || '',
          version_id: programaData.version_id,
          rama_academica_id: programaData.rama_academica_id,
          tipo_programa_id: programaData.tipo_programa_id,
          institucion_id: programaData.institucion_id
        })

        // Cargar módulos asociados
        if (programaData.modulos && programaData.modulos.length > 0) {
          setModulosSeleccionados(
            programaData.modulos.map(mod => {
              // Asegurar que obtenemos el ID correcto (modulo_id o id)
              const moduloId = mod.modulo_id?.toString() || mod.id?.toString() || ''
              return {
                id: moduloId,
                edicion: mod.pivot?.edicion?.toString() || ''
              }
            })
          )
        } else {
          setModulosSeleccionados([])
        }

        // Cargar subprogramas asociados
        if (programaData.subprogramas && programaData.subprogramas.length > 0) {
          setSubprogramasSeleccionados(
            programaData.subprogramas.map(sub => sub.id.toString())
          )
        } else {
          setSubprogramasSeleccionados([])
        }

        setShowModal(true)
      } else {
        toast.error(response.message || 'Error al cargar datos del programa')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al cargar datos del programa'
      toast.error(errorMessage)
    }
  }

  const handleView = async (programa) => {
    // Asegurar que tenemos el ID correcto
    const programaId = programa.id || programa.programa_id
    
    if (!programaId) {
      toast.error('No se pudo identificar el ID del programa')
      return
    }

    try {
      const response = await programaService.getProgramaById(programaId)
      if (response.success) {
        setViewingPrograma(response.data)
        setShowViewModal(true)
      } else {
        toast.error(response.message || 'Error al cargar detalles del programa')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al cargar detalles del programa'
      toast.error(errorMessage)
    }
  }

  const handleDelete = async (programa) => {
    // Asegurar que tenemos el ID correcto
    const programaId = programa.id || programa.programa_id
    
    if (!programaId) {
      toast.error('No se pudo identificar el ID del programa')
      return
    }

    if (!window.confirm(`¿Está seguro de eliminar el programa "${programa.nombre}"?`)) {
      return
    }

    try {
      const response = await programaService.removePrograma(programaId)
      if (response.success) {
        toast.success(response.message || 'Programa eliminado exitosamente')
        await fetchProgramas()
      } else {
        toast.error(response.message || 'Error al eliminar programa')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al eliminar programa'
      toast.error(errorMessage)
    }
  }

  const handleNew = () => {
    setEditingPrograma(null)
    reset({
      nombre: '',
      duracion_meses: '',
      total_modulos: '',
      costo: '',
      version_id: '',
      rama_academica_id: '',
      tipo_programa_id: '',
      institucion_id: ''
    })
    setModulosSeleccionados([])
    setSubprogramasSeleccionados([])
    setShowModal(true)
  }

  const handleSort = (column, direction) => {
    setSortBy(column)
    setSortDirection(direction)
    setCurrentPage(1)
  }

  const columns = [
    { 
      key: 'nombre', 
      label: 'Nombre',
      render: (row) => row.nombre || '-'
    },
    { 
      key: 'tipo_programa', 
      label: 'Tipo',
      render: (row) => row.tipo_programa?.nombre || 'N/A'
    },
    { 
      key: 'rama_academica', 
      label: 'Rama',
      render: (row) => row.rama_academica?.nombre || 'N/A'
    },
    { 
      key: 'version', 
      label: 'Versión',
      render: (row) => row.version?.nombre || 'N/A'
    },
    { 
      key: 'institucion', 
      label: 'Institución',
      render: (row) => row.institucion?.nombre || 'N/A'
    },
    { 
      key: 'duracion_meses', 
      label: 'Duración (meses)',
      render: (row) => row.duracion_meses || 'N/A'
    },
    { 
      key: 'costo', 
      label: 'Costo',
      render: (row) => row.costo ? `$${row.costo}` : 'N/A'
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
          <h1 className="text-3xl font-bold gradient-text">Programas Académicos</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestión de programas y asociación con módulos y subprogramas
            </p>
          </div>
        <Button onClick={handleNew} icon={<Plus className="h-5 w-5" />}>
            Nuevo Programa
          </Button>
        </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-primary-500 to-primary-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-sm">Total Programas</p>
              <p className="text-3xl font-bold mt-1">{stats.total}</p>
            </div>
            <BookOpen className="h-12 w-12 text-primary-200" />
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-accent-500 to-accent-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-accent-100 text-sm">Programas Activos</p>
              <p className="text-3xl font-bold mt-1">{stats.activos}</p>
            </div>
            <CheckCircle className="h-12 w-12 text-accent-200" />
          </div>
        </Card>
      </div>

      {/* Búsqueda y filtros */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
        <Input
              type="text"
              placeholder="Buscar por nombre..."
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
              value={selectedRama}
              onChange={(e) => {
                setSelectedRama(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-800"
            >
              <option value="">Todas las ramas</option>
              {datosFormulario.ramas_academicas.map(rama => (
                <option key={rama.id} value={rama.id}>
                  {rama.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={selectedTipo}
              onChange={(e) => {
                setSelectedTipo(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-800"
            >
              <option value="">Todos los tipos</option>
              {datosFormulario.tipos_programa.map(tipo => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={selectedVersion}
              onChange={(e) => {
                setSelectedVersion(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-800"
            >
              <option value="">Todas las versiones</option>
              {datosFormulario.versiones.map(version => (
                <option key={version.id} value={version.id}>
                  {version.nombre} ({version.año})
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
          data={programas}
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
          setEditingPrograma(null)
          setModulosSeleccionados([])
          setSubprogramasSeleccionados([])
          reset()
        }}
        title={editingPrograma ? 'Editar Programa' : 'Nuevo Programa'}
        size="xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre del Programa *
            </label>
            <Input
              {...register('nombre', { required: 'El nombre es requerido' })}
              placeholder="Ej: Maestría en Educación"
              error={errors.nombre?.message}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rama Académica *
              </label>
              <select
                {...register('rama_academica_id', { required: 'La rama académica es requerida' })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-800"
              >
                <option value="">Seleccionar rama...</option>
                {datosFormulario.ramas_academicas.map(rama => (
                  <option key={rama.id} value={rama.id}>
                    {rama.nombre}
                  </option>
                ))}
              </select>
              {errors.rama_academica_id && (
                <p className="mt-1 text-sm text-error-600">{errors.rama_academica_id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Programa *
              </label>
              <select
                {...register('tipo_programa_id', { required: 'El tipo de programa es requerido' })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-800"
              >
                <option value="">Seleccionar tipo...</option>
                {datosFormulario.tipos_programa.map(tipo => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nombre}
                  </option>
                ))}
              </select>
              {errors.tipo_programa_id && (
                <p className="mt-1 text-sm text-error-600">{errors.tipo_programa_id.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Versión *
              </label>
              <select
                {...register('version_id', { required: 'La versión es requerida' })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-800"
              >
                <option value="">Seleccionar versión...</option>
                {datosFormulario.versiones.map(version => (
                  <option key={version.id} value={version.id}>
                    {version.nombre} ({version.año})
                  </option>
                ))}
              </select>
              {errors.version_id && (
                <p className="mt-1 text-sm text-error-600">{errors.version_id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Institución *
              </label>
              <select
                {...register('institucion_id', { required: 'La institución es requerida' })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-800"
              >
                <option value="">Seleccionar institución...</option>
                {datosFormulario.instituciones.map(inst => (
                  <option key={inst.id} value={inst.id}>
                    {inst.nombre}
                  </option>
                ))}
              </select>
              {errors.institucion_id && (
                <p className="mt-1 text-sm text-error-600">{errors.institucion_id.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duración (meses) *
              </label>
              <Input
                type="number"
                {...register('duracion_meses', { 
                  required: 'La duración es requerida',
                  min: { value: 1, message: 'Mínimo 1 mes' }
                })}
                placeholder="Ej: 24"
                error={errors.duracion_meses?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Total Módulos
              </label>
              <Input
                type="number"
                {...register('total_modulos', { min: { value: 0, message: 'Mínimo 0' } })}
                placeholder="Ej: 12"
                error={errors.total_modulos?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Costo
              </label>
              <Input
                type="number"
                step="0.01"
                {...register('costo', { min: { value: 0, message: 'Mínimo 0' } })}
                placeholder="Ej: 5000.00"
                error={errors.costo?.message}
              />
            </div>
          </div>

          {/* Módulos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Módulos del Programa
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={agregarModulo}
                icon={<Plus className="h-4 w-4" />}
              >
                Agregar Módulo
              </Button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {modulosSeleccionados.map((mod, index) => (
                <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-gray-900 dark:text-white">Módulo {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removerModulo(index)}
                      className="p-1 text-error-600 hover:bg-error-50 rounded"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <select
                        value={mod.id || ''}
                        onChange={(e) => {
                          const value = e.target.value
                          actualizarModulo(index, 'id', value)
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-800"
                        required
                      >
                        <option value="">Seleccionar módulo...</option>
                        {datosFormulario.modulos && Array.isArray(datosFormulario.modulos) && datosFormulario.modulos
                          .filter(m => {
                            const modId = m.id?.toString() || m.modulo_id?.toString()
                            return !modulosSeleccionados.some((sel, idx) => {
                              const selId = sel.id?.toString()
                              return idx !== index && selId && selId === modId
                            })
                          })
                          .map(modOption => {
                            const modId = modOption.id?.toString() || modOption.modulo_id?.toString() || ''
                            return (
                              <option key={modId} value={modId}>
                                {modOption.nombre} ({modOption.credito || 0} créditos)
                              </option>
                            )
                          })}
                      </select>
                    </div>
                    <div>
                      <Input
                        type="number"
                        value={mod.edicion || ''}
                        onChange={(e) => actualizarModulo(index, 'edicion', e.target.value)}
                        placeholder="Edición (opcional)"
                        min="1"
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {modulosSeleccionados.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No hay módulos agregados. Haga clic en "Agregar Módulo" para comenzar.
                </p>
              )}
            </div>
          </div>

          {/* Subprogramas */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Subprogramas (Opcional)
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={agregarSubprograma}
                icon={<Plus className="h-4 w-4" />}
              >
                Agregar Subprograma
              </Button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {subprogramasSeleccionados.map((sub, index) => (
                <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-gray-900 dark:text-white">Subprograma {index + 1}</h4>
                  <button
                      type="button"
                      onClick={() => removerSubprograma(index)}
                      className="p-1 text-error-600 hover:bg-error-50 rounded"
                  >
                      <X className="h-4 w-4" />
                  </button>
                  </div>
                  <div>
                    <select
                      value={sub}
                      onChange={(e) => actualizarSubprograma(index, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-800"
                    >
                      <option value="">Seleccionar subprograma...</option>
                      {programas
                        .filter(p => !editingPrograma || p.id !== editingPrograma.id)
                        .filter(p => !subprogramasSeleccionados.some((sel, idx) => idx !== index && sel === p.id.toString()))
                        .map(prog => (
                          <option key={prog.id} value={prog.id}>
                            {prog.nombre} - {prog.tipo_programa?.nombre || ''}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              ))}
              {subprogramasSeleccionados.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No hay subprogramas agregados. Haga clic en "Agregar Subprograma" para comenzar.
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
                setEditingPrograma(null)
                setModulosSeleccionados([])
                setSubprogramasSeleccionados([])
                reset()
              }}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {editingPrograma ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Ver */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false)
          setViewingPrograma(null)
        }}
        title="Detalles del Programa"
        size="xl"
      >
        {viewingPrograma && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Nombre del Programa
                </label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {viewingPrograma.nombre}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Tipo de Programa
                </label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {viewingPrograma.tipo_programa?.nombre || 'N/A'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Rama Académica
                </label>
                <p className="text-gray-700 dark:text-gray-300">
                  {viewingPrograma.rama_academica?.nombre || 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Versión
                </label>
                <p className="text-gray-700 dark:text-gray-300">
                  {viewingPrograma.version?.nombre || 'N/A'} {viewingPrograma.version?.año ? `(${viewingPrograma.version.año})` : ''}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Institución
              </label>
              <p className="text-gray-700 dark:text-gray-300">
                {viewingPrograma.institucion?.nombre || 'N/A'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Duración (meses)
                </label>
                <p className="text-gray-700 dark:text-gray-300">
                  {viewingPrograma.duracion_meses || 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Total Módulos
                </label>
                <p className="text-gray-700 dark:text-gray-300">
                  {viewingPrograma.total_modulos || 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Costo
                </label>
                <p className="text-gray-700 dark:text-gray-300">
                  {viewingPrograma.costo ? `$${viewingPrograma.costo}` : 'N/A'}
                </p>
              </div>
            </div>

            {viewingPrograma.modulos && viewingPrograma.modulos.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Módulos Asociados ({viewingPrograma.modulos.length})
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {viewingPrograma.modulos.map((mod) => (
                    <div key={mod.modulo_id || mod.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {mod.nombre}
                      </p>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                        <span>Créditos: {mod.credito}</span>
                        <span>Horas: {mod.horas_academicas}</span>
                        {mod.pivot?.edicion !== undefined && mod.pivot.edicion !== null && (
                          <span>Edición: {mod.pivot.edicion}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {viewingPrograma.subprogramas && viewingPrograma.subprogramas.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Subprogramas ({viewingPrograma.subprogramas.length})
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {viewingPrograma.subprogramas.map((sub) => (
                    <div key={sub.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {sub.nombre}
                      </p>
                      {sub.tipo_programa && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {sub.tipo_programa.nombre}
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

export default Programas
