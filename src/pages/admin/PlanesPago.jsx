import React, { useState, useEffect } from 'react'
import { DollarSign, Plus, Search, Edit2, Trash2, Eye, Calendar, FileText, User, GraduationCap } from 'lucide-react'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Modal from '../../components/common/Modal'
import Table from '../../components/common/Table'
import Card from '../../components/common/Card'
import { useForm, useFieldArray } from 'react-hook-form'
import toast from 'react-hot-toast'
import { planPagoService } from '../../services/pagoService'

const PlanesPago = () => {
  const [planes, setPlanes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [totalRegistros, setTotalRegistros] = useState(0)
  const [from, setFrom] = useState(0)
  const [to, setTo] = useState(0)
  const [sortBy, setSortBy] = useState('id')
  const [sortDirection, setSortDirection] = useState('desc')
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  const [viewingPlan, setViewingPlan] = useState(null)
  const [datosFormulario, setDatosFormulario] = useState({ inscripciones: [], programas: [] })
  const [inscripcionActual, setInscripcionActual] = useState(null)

  const { register, handleSubmit, reset, control, watch, formState: { errors } } = useForm({
    defaultValues: {
      inscripcion_id: '',
      monto_total: '',
      total_cuotas: 1,
      cuotas: [{ fecha_ini: '', fecha_fin: '', monto: '' }]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'cuotas'
  })

  const montoTotal = watch('monto_total')
  const totalCuotas = watch('total_cuotas')

  useEffect(() => {
    fetchPlanes()
    fetchDatosFormulario()
  }, [currentPage, perPage, searchTerm, sortBy, sortDirection])

  useEffect(() => {
    // Ajustar número de cuotas cuando cambia total_cuotas
    const currentCount = fields.length
    if (totalCuotas && totalCuotas > currentCount) {
      for (let i = currentCount; i < totalCuotas; i++) {
        append({ fecha_ini: '', fecha_fin: '', monto: '' })
      }
    } else if (totalCuotas && totalCuotas < currentCount) {
      for (let i = currentCount - 1; i >= totalCuotas; i--) {
        remove(i)
      }
    }
  }, [totalCuotas])

  const fetchPlanes = async () => {
    try {
      setLoading(true)
      const response = await planPagoService.get({
        page: currentPage,
        per_page: perPage,
        search: searchTerm,
        sort_by: sortBy,
        sort_direction: sortDirection
      })
      
      if (response.success && response.data) {
        setPlanes(response.data.data || [])
        setTotalPages(response.data.last_page || 1)
        setTotalRegistros(response.data.total || 0)
        setFrom(response.data.from || 0)
        setTo(response.data.to || 0)
      } else {
        toast.error(response.message || 'Error al cargar planes de pago')
        setPlanes([])
        setTotalPages(1)
        setTotalRegistros(0)
        setFrom(0)
        setTo(0)
      }
    } catch (error) {
      toast.error('Error de conexión')
      setPlanes([])
      setTotalPages(1)
      setTotalRegistros(0)
      setFrom(0)
      setTo(0)
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (column, direction) => {
    setSortBy(column)
    setSortDirection(direction)
    setCurrentPage(1)
  }

  const fetchDatosFormulario = async () => {
    try {
      const response = await planPagoService.getDatosFormulario()
      if (response.success) {
        setDatosFormulario(response.data)
      }
    } catch (error) {
      console.error('Error fetching datos formulario:', error)
    }
  }

  const handleCreate = () => {
    setEditingPlan(null)
    setInscripcionActual(null)
    reset({
      inscripcion_id: '',
      monto_total: '',
      total_cuotas: 1,
      cuotas: [{ fecha_ini: '', fecha_fin: '', monto: '' }]
    })
    setShowModal(true)
  }

  const handleEdit = async (plan) => {
    try {
      setLoading(true)
      // Cargar los datos completos del plan desde el backend
      const response = await planPagoService.getById(plan.id)
      if (response.success) {
        const planData = response.data
        setEditingPlan(planData)
        
        // Guardar la información de la inscripción actual para mostrarla
        if (planData.inscripcion) {
          setInscripcionActual({
            id: planData.inscripcion.id,
            estudiante: planData.inscripcion.estudiante,
            programa: planData.inscripcion.programa,
            fecha_formatted: planData.inscripcion.fecha_formatted
          })
        }
        
        // Formatear fechas para los inputs de tipo date (YYYY-MM-DD)
        const formatDateForInput = (dateString) => {
          if (!dateString) return ''
          const date = new Date(dateString)
          if (isNaN(date.getTime())) return ''
          return date.toISOString().split('T')[0]
        }
        
        reset({
          inscripcion_id: planData.inscripcion_id || planData.inscripcion?.id || '',
          monto_total: planData.monto_total || '',
          total_cuotas: planData.total_cuotas || 1,
          cuotas: planData.cuotas && planData.cuotas.length > 0
            ? planData.cuotas.map(c => ({
                fecha_ini: formatDateForInput(c.fecha_ini),
                fecha_fin: formatDateForInput(c.fecha_fin),
                monto: c.monto || ''
              }))
            : [{ fecha_ini: '', fecha_fin: '', monto: '' }]
        })
        setShowModal(true)
      } else {
        toast.error(response.message || 'Error al cargar los datos del plan de pago')
      }
    } catch (error) {
      console.error('Error al cargar plan para editar:', error)
      toast.error('Error al cargar los datos del plan de pago')
    } finally {
      setLoading(false)
    }
  }

  const handleView = async (plan) => {
    try {
      const response = await planPagoService.getById(plan.id)
      if (response.success) {
        setViewingPlan(response.data)
        setShowViewModal(true)
      }
    } catch (error) {
      toast.error('Error al cargar el plan de pago')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este plan de pago?')) return
    
    try {
      setLoading(true)
      const response = await planPagoService.remove(id)
      
      if (response.success) {
        toast.success(response.message || 'Plan de pago eliminado exitosamente')
        await fetchPlanes()
      } else {
        toast.error(response.message || 'Error al eliminar el plan de pago')
      }
    } catch (error) {
      toast.error('Error al eliminar el plan de pago')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      
      // Validar que el monto total coincida con la suma de cuotas
      const sumaCuotas = data.cuotas.reduce((sum, cuota) => sum + parseFloat(cuota.monto || 0), 0)
      if (Math.abs(sumaCuotas - parseFloat(data.monto_total)) > 0.01) {
        toast.error('El monto total debe coincidir con la suma de las cuotas')
        return
      }

      // Validar que el número de cuotas coincida
      if (data.cuotas.length !== parseInt(data.total_cuotas)) {
        toast.error('El número de cuotas debe coincidir con el total de cuotas')
        return
      }
      
      let response
      
      if (editingPlan) {
        response = await planPagoService.update(editingPlan.id, data)
      } else {
        response = await planPagoService.create(data)
      }
      
      if (response.success) {
        toast.success(response.message || (editingPlan ? 'Plan de pago actualizado exitosamente' : 'Plan de pago creado exitosamente'))
        setShowModal(false)
        setEditingPlan(null)
        reset()
        await fetchPlanes()
      } else {
        toast.error(response.message || 'Error al guardar el plan de pago')
        if (response.errors) {
          // Mostrar errores de validación de forma más amigable
          Object.keys(response.errors).forEach(key => {
            const errorMessages = Array.isArray(response.errors[key]) 
              ? response.errors[key] 
              : [response.errors[key]]
            
            errorMessages.forEach(errorMsg => {
              // Convertir nombres de campos técnicos a mensajes más entendibles
              let campo = key
              if (key.includes('cuotas.')) {
                const match = key.match(/cuotas\.(\d+)\.(.+)/)
                if (match) {
                  const indice = parseInt(match[1]) + 1
                  const campoNombre = match[2]
                  const nombresCampos = {
                    'fecha_ini': 'Fecha de inicio',
                    'fecha_fin': 'Fecha de fin',
                    'monto': 'Monto'
                  }
                  campo = `Cuota ${indice} - ${nombresCampos[campoNombre] || campoNombre}`
                }
              } else {
                const nombresCampos = {
                  'inscripcion_id': 'Inscripción',
                  'monto_total': 'Monto total',
                  'total_cuotas': 'Total de cuotas'
                }
                campo = nombresCampos[key] || key
              }
              
              toast.error(`${campo}: ${errorMsg}`, {
                duration: 5000
              })
            })
          })
        }
      }
    } catch (error) {
      toast.error('Error al guardar el plan de pago')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      key: 'estudiante',
      label: 'Estudiante',
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {row.inscripcion?.estudiante?.nombre} {row.inscripcion?.estudiante?.apellido}
          </div>
          <div className="text-sm text-gray-500">
            CI: {row.inscripcion?.estudiante?.ci}
          </div>
        </div>
      )
    },
    {
      key: 'programa',
      label: 'Programa',
      render: (row) => (
        <span className="text-gray-900 dark:text-gray-100">
          {row.inscripcion?.programa?.nombre || '-'}
        </span>
      )
    },
    {
      key: 'monto_total',
      label: 'Monto Total',
      render: (row) => (
        <span className="font-semibold text-gray-900 dark:text-gray-100">
          {parseFloat(row.monto_total || 0).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
        </span>
      )
    },
    {
      key: 'total_cuotas',
      label: 'Cuotas',
      render: (row) => (
        <span className="text-gray-900 dark:text-gray-100">
          {row.total_cuotas || 0}
        </span>
      )
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (row) => {
        const montoPagado = row.monto_pagado || 0
        const montoTotal = parseFloat(row.monto_total || 0)
        const porcentaje = montoTotal > 0 ? (montoPagado / montoTotal) * 100 : 0
        
        return (
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {porcentaje.toFixed(0)}% Pagado
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ width: `${Math.min(porcentaje, 100)}%` }}
              />
            </div>
          </div>
        )
      }
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (row) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            icon={<Eye className="h-4 w-4" />}
            onClick={() => handleView(row)}
          />
          {!row.esta_completo && (
            <>
              <Button
                variant="ghost"
                size="sm"
                icon={<Edit2 className="h-4 w-4" />}
                onClick={() => handleEdit(row)}
              />
              <Button
                variant="ghost"
                size="sm"
                icon={<Trash2 className="h-4 w-4" />}
                onClick={() => handleDelete(row.id)}
              />
            </>
          )}
        </div>
      )
    }
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-4 mb-4 sm:mb-0">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center shadow-glow">
            <DollarSign className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text">Planes de Pago</h1>
            <p className="text-gray-600 dark:text-gray-400">Administra los planes de pago del sistema</p>
          </div>
        </div>
        <Button
          variant="primary"
          icon={<Plus className="h-5 w-5" />}
          onClick={handleCreate}
        >
          Nuevo Plan
        </Button>
      </div>

      <Card className="gradient" shadow="glow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h3 className="text-xl font-bold gradient-text mb-4 sm:mb-0">Lista de Planes</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar planes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
        </div>
        
        <Table
          columns={columns}
          data={planes}
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

      {/* Modal de Crear/Editar Plan */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingPlan(null)
          setInscripcionActual(null)
          reset()
        }}
        title={editingPlan ? 'Editar Plan de Pago' : 'Nuevo Plan de Pago'}
        size="xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Inscripción *
              </label>
              {editingPlan && inscripcionActual ? (
                <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  <div className="font-medium">
                    {inscripcionActual.estudiante?.nombre} {inscripcionActual.estudiante?.apellido} (CI: {inscripcionActual.estudiante?.ci})
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {inscripcionActual.programa?.nombre} - {inscripcionActual.fecha_formatted}
                  </div>
                  <input type="hidden" {...register('inscripcion_id')} value={inscripcionActual.id} />
                </div>
              ) : (
                <select
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
                  {...register('inscripcion_id', { required: 'La inscripción es obligatoria' })}
                >
                  <option value="">Seleccionar inscripción</option>
                  {datosFormulario.inscripciones?.length > 0 ? (
                    datosFormulario.inscripciones.map(insc => (
                      <option key={insc.id} value={insc.id}>
                        {insc.estudiante?.nombre} {insc.estudiante?.apellido} (CI: {insc.estudiante?.ci}) - {insc.programa?.nombre} - {insc.fecha_formatted || insc.fecha}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No hay inscripciones sin plan de pago</option>
                  )}
                </select>
              )}
              {errors.inscripcion_id && (
                <p className="text-red-500 text-xs mt-1">{errors.inscripcion_id.message}</p>
              )}
            </div>

            <Input
              label="Monto Total *"
              type="number"
              step="0.01"
              placeholder="0.00"
              error={errors.monto_total?.message}
              {...register('monto_total', { 
                required: 'El monto total es obligatorio',
                min: { value: 0.01, message: 'El monto debe ser mayor a 0' }
              })}
            />

            <Input
              label="Total de Cuotas *"
              type="number"
              min="1"
              placeholder="1"
              error={errors.total_cuotas?.message}
              {...register('total_cuotas', { 
                required: 'El total de cuotas es obligatorio',
                min: { value: 1, message: 'Debe haber al menos 1 cuota' }
              })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Cuotas *
            </label>
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Cuota {index + 1}</h4>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 className="h-4 w-4" />}
                        onClick={() => remove(index)}
                      >
                        Eliminar
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input
                      label="Fecha Inicio *"
                      type="date"
                      error={errors.cuotas?.[index]?.fecha_ini?.message}
                      {...register(`cuotas.${index}.fecha_ini`, { 
                        required: 'La fecha de inicio es obligatoria'
                      })}
                    />
                    <Input
                      label="Fecha Fin *"
                      type="date"
                      error={errors.cuotas?.[index]?.fecha_fin?.message}
                      {...register(`cuotas.${index}.fecha_fin`, { 
                        required: 'La fecha de fin es obligatoria'
                      })}
                    />
                    <Input
                      label="Monto *"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      error={errors.cuotas?.[index]?.monto?.message}
                      {...register(`cuotas.${index}.monto`, { 
                        required: 'El monto es obligatorio',
                        min: { value: 0.01, message: 'El monto debe ser mayor a 0' }
                      })}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowModal(false)
                setEditingPlan(null)
                setInscripcionActual(null)
                reset()
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={<Plus className="h-5 w-5" />}
            >
              {editingPlan ? 'Actualizar' : 'Crear'} Plan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Ver Plan */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Detalles del Plan de Pago"
        size="xl"
      >
        {viewingPlan && (
          <div className="space-y-6">
            {/* Información del Estudiante */}
            {viewingPlan.inscripcion?.estudiante && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2 text-primary-500" />
                  Información del Estudiante
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Nombre Completo
                    </label>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {viewingPlan.inscripcion.estudiante.nombre} {viewingPlan.inscripcion.estudiante.apellido}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      CI
                    </label>
                    <p className="text-gray-700 dark:text-gray-300">
                      {viewingPlan.inscripcion.estudiante.ci}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Registro Estudiante
                    </label>
                    <p className="text-gray-700 dark:text-gray-300">
                      {viewingPlan.inscripcion.estudiante.registro_estudiante}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Email
                    </label>
                    <p className="text-gray-700 dark:text-gray-300">
                      {viewingPlan.inscripcion.estudiante.email}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Celular
                    </label>
                    <p className="text-gray-700 dark:text-gray-300">
                      {viewingPlan.inscripcion.estudiante.celular || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Información del Programa */}
            {viewingPlan.inscripcion?.programa && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <GraduationCap className="h-5 w-5 mr-2 text-primary-500" />
                  Información del Programa
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Nombre del Programa
                    </label>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {viewingPlan.inscripcion.programa.nombre}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Institución
                    </label>
                    <p className="text-gray-700 dark:text-gray-300">
                      {viewingPlan.inscripcion.programa.institucion}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Rama Académica
                    </label>
                    <p className="text-gray-700 dark:text-gray-300">
                      {viewingPlan.inscripcion.programa.rama_academica}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Tipo de Programa
                    </label>
                    <p className="text-gray-700 dark:text-gray-300">
                      {viewingPlan.inscripcion.programa.tipo_programa}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Información de Pago */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-primary-500" />
                Información de Pago
              </h3>
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Monto Total
                    </label>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {parseFloat(viewingPlan.monto_total || 0).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Monto Pagado
                    </label>
                    <p className="text-lg font-bold text-success-600 dark:text-success-400">
                      {parseFloat(viewingPlan.monto_pagado || 0).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Monto Pendiente
                    </label>
                    <p className="text-lg font-bold text-error-600 dark:text-error-400">
                      {parseFloat(viewingPlan.monto_pendiente || 0).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Progreso
                    </label>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {viewingPlan.porcentaje_pagado?.toFixed(1) || viewingPlan.estado_pagos?.porcentaje_pagado?.toFixed(1) || '0'}%
                    </p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Cuotas: {viewingPlan.estado_pagos?.cuotas_pagadas || 0}/{viewingPlan.total_cuotas || 0} pagadas
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full ${
                        (viewingPlan.porcentaje_pagado || viewingPlan.estado_pagos?.porcentaje_pagado || 0) >= 100 
                          ? 'bg-success-500' 
                          : (viewingPlan.porcentaje_pagado || viewingPlan.estado_pagos?.porcentaje_pagado || 0) > 50 
                            ? 'bg-warning-500' 
                            : 'bg-error-500'
                      }`}
                      style={{ width: `${Math.min(viewingPlan.porcentaje_pagado || viewingPlan.estado_pagos?.porcentaje_pagado || 0, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Detalle de Cuotas */}
            {viewingPlan.cuotas && viewingPlan.cuotas.length > 0 && (
              <div>
                <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
                  Detalle de Cuotas
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {viewingPlan.cuotas.map((cuota, index) => (
                    <div key={cuota.id || index} className="p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            Cuota {index + 1}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {cuota.fecha_ini ? new Date(cuota.fecha_ini).toLocaleDateString('es-ES') : 'N/A'} - 
                            {cuota.fecha_fin ? new Date(cuota.fecha_fin).toLocaleDateString('es-ES') : 'N/A'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {parseFloat(cuota.monto || 0).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                          </p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            cuota.estado === 'Pagado'
                              ? 'bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-400'
                              : cuota.estado === 'Retrasado'
                                ? 'bg-error-100 text-error-800 dark:bg-error-900/20 dark:text-error-400'
                                : 'bg-warning-100 text-warning-800 dark:bg-warning-900/20 dark:text-warning-400'
                          }`}>
                            {cuota.estado}
                            {cuota.estado === 'Retrasado' && cuota.dias_retraso > 0 && (
                              <span className="ml-1">({cuota.dias_retraso} días)</span>
                            )}
                          </span>
                        </div>
                      </div>
                      {cuota.pagos && cuota.pagos.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Pagos realizados:</p>
                          {cuota.pagos.map((pago) => (
                            <div key={pago.id} className="text-xs text-gray-600 dark:text-gray-400">
                              {parseFloat(pago.monto || 0).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })} - {pago.fecha ? new Date(pago.fecha).toLocaleDateString('es-ES') : 'N/A'} 
                              {pago.metodo && ` (${pago.metodo})`}
                              {pago.verificado && <span className="ml-2 text-success-600">✓ Verificado</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fecha de Inscripción */}
            {viewingPlan.inscripcion?.fecha_formatted && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Fecha de Inscripción:
                  </span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {viewingPlan.inscripcion.fecha_formatted}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default PlanesPago

