import React, { useState, useEffect } from 'react'
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Filter,
  Download,
  Upload,
  Clock,
  GraduationCap,
  Hash
} from 'lucide-react'
import { materiaService } from '../services/materiaService'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Modal from '../components/common/Modal'
import Table from '../components/common/Table'
import Card from '../components/common/Card'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { exportToCSV } from '../utils/helpers'

const Materias = () => {
  const [materias, setMaterias] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [editingMateria, setEditingMateria] = useState(null)
  const [viewingMateria, setViewingMateria] = useState(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const fileInputRef = React.useRef(null)
  const [filtrosAvanzados, setFiltrosAvanzados] = useState({
    nivel: '',
    semestre: '',
    activa: ''
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    fetchMaterias()
  }, [currentPage, perPage, searchTerm, filtrosAvanzados])

  const fetchMaterias = async () => {
    try {
      setLoading(true)
      const params = {
        page: currentPage,
        per_page: perPage,
        search: searchTerm
      }

      // Agregar filtros avanzados solo si tienen valor
      if (filtrosAvanzados.nivel) {
        params.nivel = filtrosAvanzados.nivel
      }
      if (filtrosAvanzados.semestre) {
        params.semestre = filtrosAvanzados.semestre
      }
      if (filtrosAvanzados.activa !== '') {
        params.activa = filtrosAvanzados.activa
      }

      const response = await materiaService.getMaterias(params)
      
      if (response.success && response.data) {
        setMaterias(response.data.data || [])
        setTotalPages(response.data.last_page || 1)
      } else {
        toast.error(response.message || 'Error al cargar materias')
        setMaterias([])
        setTotalPages(1)
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error de conexión: No se pudo cargar las materias'
      toast.error(errorMessage)
      console.error('Error al cargar materias:', error)
      setMaterias([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingMateria(null)
    reset({
      codigo_materia: '',
      nombre: '',
      sigla: '',
      horas_teoricas: 0,
      horas_practicas: 0,
      nivel: 1,
      semestre: 1
    })
    setShowModal(true)
  }

  const handleEdit = (materia) => {
    setEditingMateria(materia)
    reset(materia)
    setShowModal(true)
  }

  const handleView = async (materia) => {
    try {
      const response = await materiaService.getMateria(materia.id)
      setViewingMateria(response.data)
      setShowViewModal(true)
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al cargar los detalles de la materia'
      toast.error(errorMessage)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar esta materia?')) return

    try {
      const response = await materiaService.deleteMateria(id)
      if (response.success) {
        toast.success(response.message || 'Materia eliminada exitosamente')
        fetchMaterias()
      } else {
        toast.error(response.message || 'Error al eliminar la materia')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al eliminar la materia'
      toast.error(errorMessage)
    }
  }

  const handleExport = async () => {
    try {
      setLoading(true)
      const response = await materiaService.exportarMaterias({ 
        search: searchTerm, 
        ...filtrosAvanzados 
      })
      
      if (response.success && response.data && Array.isArray(response.data)) {
        if (response.data.length === 0) {
          toast.error('No hay materias para exportar')
          return
        }
        
        const datosExportar = response.data.map(materia => ({
          'Código': materia.codigo_materia || '',
          'Nombre': materia.nombre || '',
          'Sigla': materia.sigla || '',
          'Horas Teóricas': materia.horas_teoricas || 0,
          'Horas Prácticas': materia.horas_practicas || 0,
          'Nivel': materia.nivel || '',
          'Semestre': materia.semestre || '',
          'Estado': materia.activa !== false ? 'Activa' : 'Inactiva'
        }))
        
        exportToCSV(datosExportar, `materias_${new Date().toISOString().split('T')[0]}.csv`)
        toast.success(`Se exportaron ${datosExportar.length} materias exitosamente`)
      } else {
        toast.error(response.message || 'Error al exportar materias: No se recibieron datos válidos')
        console.error('Error en exportación:', response)
      }
    } catch (error) {
      console.error('Error al exportar materias:', error)
      toast.error(error.response?.data?.message || error.message || 'Error al exportar materias')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error('Por favor, selecciona un archivo Excel o CSV')
      return
    }

    setImporting(true)
    setImportResult(null)

    try {
      const response = await materiaService.importarMaterias(file)
      
      if (response.success) {
        setImportResult(response.data)
        toast.success(response.message || 'Materias importadas exitosamente')
        await fetchMaterias()
        setTimeout(() => {
          setShowImportModal(false)
          setImportResult(null)
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        }, 3000)
      } else {
        toast.error(response.message || 'Error al importar materias')
        if (response.errors) {
          setImportResult({ errores: Array.isArray(response.errors) ? response.errors : [response.errors] })
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al importar materias'
      toast.error(errorMessage)
    } finally {
      setImporting(false)
    }
  }

  const downloadTemplate = () => {
    const template = 'codigo_materia,nombre,sigla,horas_teoricas,horas_practicas,nivel,semestre\nMAT001,Matemáticas I,MATE1,4,2,1,1\nMAT002,Matemáticas II,MATE2,4,2,1,2\n'
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'template_materias.csv'
    link.click()
  }

  const onSubmit = async (data) => {
    try {
      // Convertir números a enteros
      const datosBackend = {
        ...data,
        horas_teoricas: parseInt(data.horas_teoricas),
        horas_practicas: parseInt(data.horas_practicas),
        nivel: parseInt(data.nivel),
        semestre: parseInt(data.semestre)
      }

      let response
      if (editingMateria) {
        response = await materiaService.updateMateria(editingMateria.id, datosBackend)
      } else {
        response = await materiaService.createMateria(datosBackend)
      }
      
      if (response.success) {
        toast.success(response.message || (editingMateria ? 'Materia actualizada exitosamente' : 'Materia creada exitosamente'))
        setShowModal(false)
        fetchMaterias()
        reset()
      } else {
        toast.error(response.message || 'Error al guardar la materia')
        if (response.errors) {
          Object.keys(response.errors).forEach(key => {
            toast.error(`${key}: ${response.errors[key]}`)
          })
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al guardar la materia'
      toast.error(errorMessage)
      if (error.response?.data?.errors) {
        Object.keys(error.response.data.errors).forEach(key => {
          toast.error(`${key}: ${error.response.data.errors[key]}`)
        })
      }
    }
  }

  const columns = [
    {
      key: 'codigo_materia',
      label: 'Código',
      sortable: true,
      render: (row) => (
        <span className="font-mono font-semibold text-green-600">
          {row.codigo_materia}
        </span>
      )
    },
    {
      key: 'nombre',
      label: 'Materia',
      sortable: true,
      render: (row) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-semibold">
              {row.sigla?.substring(0, 2) || 'M'}
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-900">{row.nombre}</div>
            <div className="text-sm text-gray-500">
              Sigla: {row.sigla}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'nivel',
      label: 'Nivel',
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Nivel {row.nivel}
        </span>
      )
    },
    {
      key: 'semestre',
      label: 'Semestre',
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          {row.semestre}° Semestre
        </span>
      )
    },
    {
      key: 'horas',
      label: 'Horas',
      render: (row) => (
        <div className="text-sm">
          <div className="flex items-center text-gray-700">
            <Clock className="h-4 w-4 mr-1 text-gray-400" />
            <span className="font-medium">{row.horas_teoricas + row.horas_practicas}h</span>
          </div>
          <div className="text-xs text-gray-500">
            T: {row.horas_teoricas}h | P: {row.horas_practicas}h
          </div>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleView(row)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            title="Ver detalles"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleEdit(row)}
            className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-md transition-colors"
            title="Editar"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <BookOpen className="h-8 w-8 mr-3 text-green-600" />
              Gestión de Materias
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Administra el catálogo de materias del sistema
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              icon={<Upload className="h-4 w-4" />}
              onClick={() => setShowImportModal(true)}
            >
              Importar
            </Button>
            <Button
              variant="primary"
              icon={<Plus className="h-5 w-5" />}
              onClick={handleCreate}
            >
              Nueva Materia
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Buscar por nombre, código o sigla..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="h-5 w-5 text-gray-400" />}
            />
          </div>
          <Button 
            variant="outline" 
            icon={<Filter className="h-4 w-4" />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filtros
          </Button>
          <Button 
            variant="outline" 
            icon={<Upload className="h-4 w-4" />}
            onClick={() => setShowImportModal(true)}
          >
            Importar
          </Button>
          <Button 
            variant="outline" 
            icon={<Download className="h-4 w-4" />}
            onClick={handleExport}
            disabled={loading}
          >
            Exportar
          </Button>
        </div>

        {/* Panel de filtros avanzados */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nivel
                </label>
                <Input
                  type="number"
                  placeholder="Filtrar por nivel..."
                  value={filtrosAvanzados.nivel}
                  onChange={(e) => setFiltrosAvanzados(prev => ({ ...prev, nivel: e.target.value }))}
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Semestre
                </label>
                <Input
                  type="number"
                  placeholder="Filtrar por semestre..."
                  value={filtrosAvanzados.semestre}
                  onChange={(e) => setFiltrosAvanzados(prev => ({ ...prev, semestre: e.target.value }))}
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estado
                </label>
                <select
                  value={filtrosAvanzados.activa}
                  onChange={(e) => setFiltrosAvanzados(prev => ({ ...prev, activa: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Todos</option>
                  <option value="true">Activas</option>
                  <option value="false">Inactivas</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFiltrosAvanzados({ nivel: '', semestre: '', activa: '' })
                  fetchMaterias()
                }}
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          data={materias}
          loading={loading}
          emptyMessage="No hay materias registradas"
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">Mostrar</span>
              <select
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="text-sm text-gray-700">por página</span>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-gray-700">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingMateria ? 'Editar Materia' : 'Nueva Materia'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Código de Materia"
              {...register('codigo_materia', { required: 'El código es obligatorio' })}
              error={errors.codigo_materia?.message}
              placeholder="Ej: INF-101"
            />
            <Input
              label="Sigla"
              {...register('sigla', { required: 'La sigla es obligatoria' })}
              error={errors.sigla?.message}
              placeholder="Ej: PROG1"
            />
          </div>

          <Input
            label="Nombre de la Materia"
            {...register('nombre', { required: 'El nombre es obligatorio' })}
            error={errors.nombre?.message}
            placeholder="Ej: Programación I"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Horas Teóricas"
              type="number"
              min="0"
              max="10"
              {...register('horas_teoricas', {
                required: 'Las horas teóricas son obligatorias',
                min: 0,
                max: 10
              })}
              error={errors.horas_teoricas?.message}
            />
            <Input
              label="Horas Prácticas"
              type="number"
              min="0"
              max="10"
              {...register('horas_practicas', {
                required: 'Las horas prácticas son obligatorias',
                min: 0,
                max: 10
              })}
              error={errors.horas_practicas?.message}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nivel"
              type="number"
              min="1"
              max="5"
              {...register('nivel', {
                required: 'El nivel es obligatorio',
                min: 1,
                max: 5
              })}
              error={errors.nivel?.message}
            />
            <Input
              label="Semestre"
              type="number"
              min="1"
              max="10"
              {...register('semestre', {
                required: 'El semestre es obligatorio',
                min: 1,
                max: 10
              })}
              error={errors.semestre?.message}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowModal(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              {editingMateria ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Detalles de la Materia"
        size="lg"
      >
        {viewingMateria && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white text-2xl font-bold">
                {viewingMateria.data?.materia?.sigla?.substring(0, 2) || 'M'}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {viewingMateria.data?.materia?.nombre}
                </h3>
                <p className="text-sm text-gray-500">
                  {viewingMateria.data?.materia?.codigo_materia} - {viewingMateria.data?.materia?.sigla}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Nivel</p>
                <p className="font-medium flex items-center">
                  <GraduationCap className="h-4 w-4 mr-2 text-gray-400" />
                  Nivel {viewingMateria.data?.materia?.nivel}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Semestre</p>
                <p className="font-medium flex items-center">
                  <Hash className="h-4 w-4 mr-2 text-gray-400" />
                  {viewingMateria.data?.materia?.semestre}° Semestre
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Horas Teóricas</p>
                <p className="font-medium flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-gray-400" />
                  {viewingMateria.data?.materia?.horas_teoricas} horas
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Horas Prácticas</p>
                <p className="font-medium flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-gray-400" />
                  {viewingMateria.data?.materia?.horas_practicas} horas
                </p>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Total de Horas</p>
              <p className="text-2xl font-bold text-blue-600">
                {(viewingMateria.data?.materia?.horas_teoricas || 0) +
                 (viewingMateria.data?.materia?.horas_practicas || 0)} horas semanales
              </p>
            </div>

            {viewingMateria.data?.estadisticas && (
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">Estadísticas</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {viewingMateria.data.estadisticas.total_grupos}
                    </p>
                    <p className="text-xs text-gray-600">Total Grupos</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">
                      {viewingMateria.data.estadisticas.grupos_activos}
                    </p>
                    <p className="text-xs text-gray-600">Grupos Activos</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal de Importar */}
      <Modal
        isOpen={showImportModal}
        onClose={() => {
          setShowImportModal(false)
          setImportResult(null)
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        }}
        title="Importar Materias"
        size="lg"
      >
        <div className="space-y-6">
          <div className="p-4 bg-info-50 dark:bg-info-900/20 rounded-lg">
            <h4 className="font-semibold text-info-900 dark:text-info-100 mb-2">Formato del archivo</h4>
            <p className="text-sm text-info-700 dark:text-info-300 mb-2">
              El archivo debe ser Excel (.xlsx, .xls) o CSV con las siguientes columnas:
            </p>
            <ul className="text-sm text-info-700 dark:text-info-300 list-disc list-inside space-y-1">
              <li><strong>codigo_materia</strong> (obligatorio)</li>
              <li><strong>nombre</strong> (obligatorio)</li>
              <li><strong>sigla</strong> (opcional)</li>
              <li><strong>horas_teoricas</strong> (opcional)</li>
              <li><strong>horas_practicas</strong> (opcional)</li>
              <li><strong>nivel</strong> (opcional)</li>
              <li><strong>semestre</strong> (opcional)</li>
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Seleccionar archivo
            </label>
            <div className="flex items-center space-x-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleImport}
                disabled={importing}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
              <Button
                type="button"
                variant="outline"
                icon={<Download className="h-4 w-4" />}
                onClick={downloadTemplate}
              >
                Template
              </Button>
            </div>
          </div>

          {importing && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="mt-2 text-sm text-gray-600">Importando materias...</p>
            </div>
          )}

          {importResult && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Resultado de la importación</h4>
              <div className="space-y-2">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong className="text-success-600">Creados:</strong> {importResult.creados || 0}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong className="text-info-600">Actualizados:</strong> {importResult.actualizados || 0}
                </p>
                {importResult.errores && importResult.errores.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-semibold text-error-600 mb-2">Errores:</p>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {importResult.errores.map((error, index) => (
                        <p key={index} className="text-xs text-error-600">{error}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default Materias
