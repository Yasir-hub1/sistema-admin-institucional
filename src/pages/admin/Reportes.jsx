import React, { useState, useEffect } from 'react'
import { FileText, Download, Filter, Users, DollarSign, Building, BookOpen, GraduationCap } from 'lucide-react'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { reporteService } from '../../services/reporteService'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'

const Reportes = () => {
  const [tipoReporte, setTipoReporte] = useState('convenios-activos')
  const [loading, setLoading] = useState(false)
  const [datosReporte, setDatosReporte] = useState(null)
  const [datosFormulario, setDatosFormulario] = useState(null)
  const [filtros, setFiltros] = useState({})

  const { register, handleSubmit, watch, reset } = useForm()

  // Función helper para formatear fechas
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'N/A'
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    } catch (error) {
      return 'N/A'
    }
  }

  useEffect(() => {
    fetchDatosFormulario()
  }, [])

  useEffect(() => {
    if (tipoReporte) {
      reset()
      setDatosReporte(null)
    }
  }, [tipoReporte])

  const fetchDatosFormulario = async () => {
    try {
      const response = await reporteService.getDatosFormulario()
      if (response.success) {
        setDatosFormulario(response.data)
      }
    } catch (error) {
      console.error('Error al cargar datos del formulario:', error)
    }
  }

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      setFiltros(data)
      let response

      switch (tipoReporte) {
        case 'convenios-activos':
          response = await reporteService.getConveniosActivos(data)
          break
        case 'programas-ofrecidos':
          response = await reporteService.getProgramasOfrecidos(data)
          break
        case 'estado-academico':
          response = await reporteService.getEstadoAcademicoEstudiantes(data)
          break
        case 'movimientos-financieros':
          response = await reporteService.getMovimientosFinancieros(data)
          break
        case 'actividad-usuario':
          response = await reporteService.getActividadPorUsuario(data)
          break
        case 'actividad-institucion':
          response = await reporteService.getActividadPorInstitucion(data)
          break
        default:
          return
      }

      if (response.success) {
        setDatosReporte(response.data)
        toast.success('Reporte generado exitosamente')
      } else {
        toast.error(response.message || 'Error al generar reporte')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleExportar = () => {
    if (!datosReporte) {
      toast.error('Debe generar un reporte primero')
      return
    }

    // Convertir datos a CSV
    let csv = ''
    let headers = []
    let rows = []

    switch (tipoReporte) {
      case 'convenios-activos':
        headers = ['ID', 'Número Convenio', 'Tipo', 'Fecha Inicio', 'Fecha Fin', 'Monto Total', 'Estado']
        rows = (datosReporte.convenios || []).map(c => [
          c.id,
          c.numero_convenio,
          c.tipo,
          formatDate(c.fecha_inicio),
          formatDate(c.fecha_fin),
          c.monto_total,
          c.estado
        ])
        break
      case 'programas-ofrecidos':
        headers = ['ID', 'Nombre', 'Rama Académica', 'Tipo', 'Institución', 'Costo', 'Duración (meses)', 'Inscripciones', 'Grupos Activos']
        rows = (datosReporte.programas || []).map(p => [
          p.id,
          p.nombre,
          p.rama_academica,
          p.tipo_programa,
          p.institucion,
          p.costo,
          p.duracion_meses,
          p.total_inscripciones,
          p.grupos_activos
        ])
        break
      case 'estado-academico':
        headers = ['Registro', 'Nombre', 'Apellido', 'CI', 'Estado', 'Inscripciones', 'Grupos', 'Aprobados', 'Reprobados', 'Promedio', 'Tasa Aprobación']
        rows = (datosReporte.estudiantes || []).map(e => [
          e.registro_estudiante,
          e.nombre,
          e.apellido,
          e.ci,
          e.estado,
          e.total_inscripciones,
          e.rendimiento.total_grupos,
          e.rendimiento.aprobados,
          e.rendimiento.reprobados,
          e.rendimiento.promedio_notas || 'N/A',
          e.rendimiento.tasa_aprobacion + '%'
        ])
        break
      case 'movimientos-financieros':
        headers = ['ID', 'Fecha', 'Monto', 'Verificado', 'Estudiante', 'Programa', 'Token']
        rows = (datosReporte.pagos || []).map(p => [
          p.id,
          formatDate(p.fecha),
          p.monto,
          p.verificado ? 'Sí' : 'No',
          p.estudiante,
          p.programa,
          p.token
        ])
        break
      case 'actividad-usuario':
        headers = ['Usuario ID', 'Nombre', 'Apellido', 'Email', 'CI', 'Total Acciones', 'Acciones por Tabla']
        rows = (datosReporte.actividad_por_usuario || []).map(actividad => {
          const usuario = actividad.usuario || {}
          const accionesPorTabla = (actividad.acciones_por_tabla || []).map(accion => `${accion.tabla}: ${accion.cantidad}`).join('; ')
          return [
            usuario.id || 'N/A',
            usuario.nombre || 'N/A',
            usuario.apellido || 'N/A',
            usuario.email || 'N/A',
            usuario.ci || 'N/A',
            actividad.total_acciones || 0,
            accionesPorTabla || 'N/A'
          ]
        })
        break
      case 'actividad-institucion':
        headers = ['Institución ID', 'Nombre', 'Estado', 'Total Inscripciones', 'Convenios Activos', 'Programas Activos', 'Total Programas']
        rows = (datosReporte.actividad_por_institucion || []).map(actividad => {
          const actividadData = actividad.actividad || {}
          return [
            actividad.institucion_id || 'N/A',
            actividad.nombre || 'N/A',
            actividad.estado || 'N/A',
            actividadData.total_inscripciones || 0,
            actividadData.convenios_activos || 0,
            actividadData.programas_activos || 0,
            actividadData.total_programas || 0
          ]
        })
        break
      default:
        toast.error('Tipo de reporte no soportado para exportación')
        return
    }

    csv = headers.join(',') + '\n'
    rows.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(',') + '\n'
    })

    // Descargar archivo
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `reporte-${tipoReporte}-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success('Reporte exportado exitosamente')
  }

  const renderFiltros = () => {
    switch (tipoReporte) {
      case 'convenios-activos':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Fecha Desde"
              type="date"
              {...register('fecha_desde')}
            />
            <Input
              label="Fecha Hasta"
              type="date"
              {...register('fecha_hasta')}
            />
            {datosFormulario && (
              <Select
                label="Tipo de Convenio"
                name="tipo_convenio_id"
                options={[
                  { value: '', label: 'Todos' },
                  ...datosFormulario.tipos_convenio.map(t => ({ value: t.id, label: t.nombre }))
                ]}
                {...register('tipo_convenio_id')}
              />
            )}
          </div>
        )
      case 'programas-ofrecidos':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {datosFormulario && (
              <>
                <Select
                  label="Rama Académica"
                  name="rama_academica_id"
                  options={[
                    { value: '', label: 'Todas' },
                    ...datosFormulario.ramas_academicas.map(r => ({ value: r.id, label: r.nombre }))
                  ]}
                  {...register('rama_academica_id')}
                />
                <Select
                  label="Tipo de Programa"
                  name="tipo_programa_id"
                  options={[
                    { value: '', label: 'Todos' },
                    ...datosFormulario.tipos_programa.map(t => ({ value: t.id, label: t.nombre }))
                  ]}
                  {...register('tipo_programa_id')}
                />
                <Select
                  label="Institución"
                  name="institucion_id"
                  options={[
                    { value: '', label: 'Todas' },
                    ...datosFormulario.instituciones.map(i => ({ value: i.id, label: i.nombre }))
                  ]}
                  {...register('institucion_id')}
                />
              </>
            )}
          </div>
        )
      case 'estado-academico':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {datosFormulario && (
              <>
                <Select
                  label="Programa"
                  name="programa_id"
                  options={[
                    { value: '', label: 'Todos' }
                  ]}
                  {...register('programa_id')}
                />
                <Select
                  label="Estado del Estudiante"
                  name="estado_id"
                  options={[
                    { value: '', label: 'Todos' },
                    ...datosFormulario.estados_estudiante.map(e => ({ value: e.id, label: e.nombre }))
                  ]}
                  {...register('estado_id')}
                />
              </>
            )}
            <Input
              label="Fecha Desde"
              type="date"
              {...register('fecha_desde')}
            />
            <Input
              label="Fecha Hasta"
              type="date"
              {...register('fecha_hasta')}
            />
          </div>
        )
      case 'movimientos-financieros':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Fecha Desde"
              type="date"
              defaultValue={new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]}
              {...register('fecha_desde')}
            />
            <Input
              label="Fecha Hasta"
              type="date"
              defaultValue={new Date().toISOString().split('T')[0]}
              {...register('fecha_hasta')}
            />
          </div>
        )
      case 'actividad-usuario':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {datosFormulario && (
              <Select
                label="Usuario"
                name="usuario_id"
                options={[
                  { value: '', label: 'Todos' },
                  ...datosFormulario.usuarios.map(u => ({ 
                    value: u.id, 
                    label: `${u.email} (${u.ci})` 
                  }))
                ]}
                {...register('usuario_id')}
              />
            )}
            <Input
              label="Fecha Desde"
              type="date"
              defaultValue={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              {...register('fecha_desde')}
            />
            <Input
              label="Fecha Hasta"
              type="date"
              defaultValue={new Date().toISOString().split('T')[0]}
              {...register('fecha_hasta')}
            />
          </div>
        )
      case 'actividad-institucion':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {datosFormulario && (
              <Select
                label="Institución"
                name="institucion_id"
                options={[
                  { value: '', label: 'Todas' },
                  ...datosFormulario.instituciones.map(i => ({ value: i.id, label: i.nombre }))
                ]}
                {...register('institucion_id')}
              />
            )}
            <Input
              label="Fecha Desde"
              type="date"
              defaultValue={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              {...register('fecha_desde')}
            />
            <Input
              label="Fecha Hasta"
              type="date"
              defaultValue={new Date().toISOString().split('T')[0]}
              {...register('fecha_hasta')}
            />
          </div>
        )
      default:
        return null
    }
  }

  const renderReporte = () => {
    if (!datosReporte) return null

    switch (tipoReporte) {
      case 'convenios-activos':
        return (
          <div className="space-y-6">
            {datosReporte.estadisticas && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="gradient" shadow="glow-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Convenios</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {datosReporte.estadisticas.total_convenios}
                  </p>
                </Card>
                <Card className="gradient" shadow="glow-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Instituciones Participantes</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {datosReporte.estadisticas.instituciones_participantes}
                  </p>
                </Card>
                <Card className="gradient" shadow="glow-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Monto Total</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {parseFloat(datosReporte.estadisticas.monto_total_convenios || 0).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                  </p>
                </Card>
              </div>
            )}
            <Card className="gradient" shadow="glow-lg">
              <h3 className="text-xl font-bold gradient-text mb-4">Convenios Activos</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-semibold">Número</th>
                      <th className="text-left py-3 px-4 font-semibold">Tipo</th>
                      <th className="text-left py-3 px-4 font-semibold">Fechas</th>
                      <th className="text-left py-3 px-4 font-semibold">Monto</th>
                      <th className="text-left py-3 px-4 font-semibold">Instituciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datosReporte.convenios && datosReporte.convenios.length > 0 ? (
                      datosReporte.convenios.map((convenio, idx) => (
                      <tr key={idx} className="border-b border-gray-200 dark:border-gray-700">
                        <td className="py-3 px-4">{convenio.numero_convenio}</td>
                        <td className="py-3 px-4">{convenio.tipo}</td>
                        <td className="py-3 px-4">
                          {formatDate(convenio.fecha_inicio)} - {formatDate(convenio.fecha_fin)}
                        </td>
                        <td className="py-3 px-4">
                          {parseFloat(convenio.monto_total || 0).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                        </td>
                        <td className="py-3 px-4">
                          {convenio.instituciones.map(i => i.nombre).join(', ')}
                        </td>
                      </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-gray-500 dark:text-gray-400">
                          No hay convenios activos para mostrar
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )
      case 'programas-ofrecidos':
        return (
          <div className="space-y-6">
            {datosReporte.estadisticas && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="gradient" shadow="glow-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Programas</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {datosReporte.estadisticas.total_programas}
                  </p>
                </Card>
                <Card className="gradient" shadow="glow-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Inscripciones</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {datosReporte.estadisticas.total_inscripciones}
                  </p>
                </Card>
                <Card className="gradient" shadow="glow-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Grupos Activos</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {datosReporte.estadisticas.total_grupos_activos}
                  </p>
                </Card>
              </div>
            )}
            <Card className="gradient" shadow="glow-lg">
              <h3 className="text-xl font-bold gradient-text mb-4">Programas Ofrecidos</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-semibold">Nombre</th>
                      <th className="text-left py-3 px-4 font-semibold">Rama</th>
                      <th className="text-left py-3 px-4 font-semibold">Tipo</th>
                      <th className="text-left py-3 px-4 font-semibold">Institución</th>
                      <th className="text-left py-3 px-4 font-semibold">Costo</th>
                      <th className="text-left py-3 px-4 font-semibold">Inscripciones</th>
                      <th className="text-left py-3 px-4 font-semibold">Grupos Activos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datosReporte.programas && datosReporte.programas.length > 0 ? (
                      datosReporte.programas.map((programa, idx) => (
                      <tr key={idx} className="border-b border-gray-200 dark:border-gray-700">
                        <td className="py-3 px-4">{programa.nombre}</td>
                        <td className="py-3 px-4">{programa.rama_academica}</td>
                        <td className="py-3 px-4">{programa.tipo_programa}</td>
                        <td className="py-3 px-4">{programa.institucion}</td>
                        <td className="py-3 px-4">
                          {parseFloat(programa.costo || 0).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                        </td>
                        <td className="py-3 px-4">{programa.total_inscripciones}</td>
                        <td className="py-3 px-4">{programa.grupos_activos}</td>
                      </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="py-8 text-center text-gray-500 dark:text-gray-400">
                          No hay programas para mostrar
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )
      case 'estado-academico':
        return (
          <div className="space-y-6">
            {datosReporte.estadisticas && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="gradient" shadow="glow-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Estudiantes</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {datosReporte.estadisticas.total_estudiantes}
                  </p>
                </Card>
                <Card className="gradient" shadow="glow-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Inscripciones</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {datosReporte.estadisticas.total_inscripciones}
                  </p>
                </Card>
                <Card className="gradient" shadow="glow-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Promedio Aprobación</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {datosReporte.estadisticas.promedio_aprobacion?.toFixed(1) || 0}%
                  </p>
                </Card>
              </div>
            )}
            <Card className="gradient" shadow="glow-lg">
              <h3 className="text-xl font-bold gradient-text mb-4">Estado Académico de Estudiantes</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-semibold">Estudiante</th>
                      <th className="text-left py-3 px-4 font-semibold">CI</th>
                      <th className="text-left py-3 px-4 font-semibold">Estado</th>
                      <th className="text-left py-3 px-4 font-semibold">Inscripciones</th>
                      <th className="text-left py-3 px-4 font-semibold">Grupos</th>
                      <th className="text-left py-3 px-4 font-semibold">Aprobados</th>
                      <th className="text-left py-3 px-4 font-semibold">Promedio</th>
                      <th className="text-left py-3 px-4 font-semibold">Tasa Aprobación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datosReporte.estudiantes && datosReporte.estudiantes.length > 0 ? (
                      datosReporte.estudiantes.map((estudiante, idx) => (
                      <tr key={idx} className="border-b border-gray-200 dark:border-gray-700">
                        <td className="py-3 px-4">{estudiante.nombre} {estudiante.apellido}</td>
                        <td className="py-3 px-4">{estudiante.ci}</td>
                        <td className="py-3 px-4">{estudiante.estado}</td>
                        <td className="py-3 px-4">{estudiante.total_inscripciones}</td>
                        <td className="py-3 px-4">{estudiante.rendimiento.total_grupos}</td>
                        <td className="py-3 px-4">{estudiante.rendimiento.aprobados}</td>
                        <td className="py-3 px-4">{estudiante.rendimiento.promedio_notas || 'N/A'}</td>
                        <td className="py-3 px-4">{estudiante.rendimiento.tasa_aprobacion}%</td>
                      </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="py-8 text-center text-gray-500 dark:text-gray-400">
                          No hay estudiantes para mostrar
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )
      case 'movimientos-financieros':
        return (
          <div className="space-y-6">
            {datosReporte.estadisticas && datosReporte.estadisticas.ingresos && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="gradient" shadow="glow-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Ingresos Verificados</p>
                  <p className="text-2xl font-bold text-green-600">
                    {parseFloat(datosReporte.estadisticas.ingresos.total_verificado || 0).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                  </p>
                </Card>
                <Card className="gradient" shadow="glow-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Ingresos Pendientes</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {parseFloat(datosReporte.estadisticas.ingresos.total_pendiente || 0).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                  </p>
                </Card>
                <Card className="gradient" shadow="glow-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Ingresos</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {parseFloat(datosReporte.estadisticas.ingresos.total || 0).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                  </p>
                </Card>
                <Card className="gradient" shadow="glow-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Cantidad Pagos</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {datosReporte.estadisticas.ingresos.cantidad_pagos || 0}
                  </p>
                </Card>
              </div>
            )}
            <Card className="gradient" shadow="glow-lg">
              <h3 className="text-xl font-bold gradient-text mb-4">Movimientos Financieros</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-semibold">Fecha</th>
                      <th className="text-left py-3 px-4 font-semibold">Monto</th>
                      <th className="text-left py-3 px-4 font-semibold">Verificado</th>
                      <th className="text-left py-3 px-4 font-semibold">Estudiante</th>
                      <th className="text-left py-3 px-4 font-semibold">Programa</th>
                      <th className="text-left py-3 px-4 font-semibold">Token</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datosReporte.pagos && datosReporte.pagos.length > 0 ? (
                      datosReporte.pagos.map((pago, idx) => (
                      <tr key={idx} className="border-b border-gray-200 dark:border-gray-700">
                        <td className="py-3 px-4">{formatDate(pago.fecha)}</td>
                        <td className="py-3 px-4">
                          {parseFloat(pago.monto || 0).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${pago.verificado ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {pago.verificado ? 'Sí' : 'No'}
                          </span>
                        </td>
                        <td className="py-3 px-4">{pago.estudiante}</td>
                        <td className="py-3 px-4">{pago.programa}</td>
                        <td className="py-3 px-4">{pago.token || 'N/A'}</td>
                      </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-gray-500 dark:text-gray-400">
                          No hay pagos para mostrar
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )
      case 'actividad-usuario':
        return (
          <div className="space-y-6">
            {datosReporte.estadisticas && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="gradient" shadow="glow-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Registros</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {datosReporte.estadisticas.total_registros}
                  </p>
                </Card>
                <Card className="gradient" shadow="glow-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Usuarios Activos</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {datosReporte.estadisticas.usuarios_activos}
                  </p>
                </Card>
              </div>
            )}
            <Card className="gradient" shadow="glow-lg">
              <h3 className="text-xl font-bold gradient-text mb-4">Actividad por Usuario</h3>
              <div className="space-y-4">
                {datosReporte.actividad_por_usuario && datosReporte.actividad_por_usuario.length > 0 ? (
                  datosReporte.actividad_por_usuario.map((actividad, idx) => (
                  <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {actividad.usuario ? `${actividad.usuario.nombre} ${actividad.usuario.apellido}` : 'Usuario Desconocido'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {actividad.usuario?.email || 'N/A'} - {actividad.total_acciones} acciones
                        </p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Acciones por tabla:</p>
                      <div className="flex flex-wrap gap-2">
                        {actividad.acciones_por_tabla.map((accion, aIdx) => (
                          <span key={aIdx} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                            {accion.tabla}: {accion.cantidad}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                    No hay actividad de usuarios para mostrar
                  </div>
                )}
              </div>
            </Card>
          </div>
        )
      case 'actividad-institucion':
        return (
          <div className="space-y-6">
            {datosReporte.estadisticas && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="gradient" shadow="glow-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Instituciones</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {datosReporte.estadisticas.total_instituciones}
                  </p>
                </Card>
                <Card className="gradient" shadow="glow-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Inscripciones</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {datosReporte.estadisticas.total_inscripciones}
                  </p>
                </Card>
                <Card className="gradient" shadow="glow-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Convenios Activos</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {datosReporte.estadisticas.total_convenios_activos}
                  </p>
                </Card>
                <Card className="gradient" shadow="glow-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Programas Activos</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {datosReporte.estadisticas.total_programas_activos}
                  </p>
                </Card>
              </div>
            )}
            <Card className="gradient" shadow="glow-lg">
              <h3 className="text-xl font-bold gradient-text mb-4">Actividad por Institución</h3>
              <div className="space-y-4">
                {datosReporte.actividad_por_institucion && datosReporte.actividad_por_institucion.length > 0 ? (
                  datosReporte.actividad_por_institucion.map((actividad, idx) => (
                  <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{actividad.nombre}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Estado: {actividad.estado}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Inscripciones</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          {actividad.actividad.total_inscripciones}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Convenios Activos</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          {actividad.actividad.convenios_activos}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Programas Activos</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          {actividad.actividad.programas_activos}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Programas</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          {actividad.actividad.total_programas}
                        </p>
                      </div>
                    </div>
                  </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                    No hay actividad de instituciones para mostrar
                  </div>
                )}
              </div>
            </Card>
          </div>
        )
      default:
        return null
    }
  }

  const tiposReporte = [
    { value: 'convenios-activos', label: 'Convenios Activos', icon: Building },
    { value: 'programas-ofrecidos', label: 'Programas Ofrecidos', icon: BookOpen },
    { value: 'estado-academico', label: 'Estado Académico Estudiantes', icon: GraduationCap },
    { value: 'movimientos-financieros', label: 'Movimientos Financieros', icon: DollarSign },
    { value: 'actividad-usuario', label: 'Actividad por Usuario', icon: Users },
    { value: 'actividad-institucion', label: 'Actividad por Institución', icon: Building }
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center shadow-glow">
          <FileText className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold gradient-text">Reportes y Bitácora</h1>
          <p className="text-gray-600 dark:text-gray-400">Genera reportes detallados del sistema</p>
        </div>
      </div>

      <Card className="gradient" shadow="glow-lg">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de Reporte
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {tiposReporte.map((tipo) => {
                const Icon = tipo.icon
                return (
                  <button
                    key={tipo.value}
                    type="button"
                    onClick={() => setTipoReporte(tipo.value)}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      tipoReporte === tipo.value
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                    }`}
                  >
                    <Icon className="h-6 w-6 mx-auto mb-2" />
                    <p className="text-sm font-medium text-center">{tipo.label}</p>
                  </button>
                )
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {renderFiltros()}
            <div className="flex justify-end space-x-4">
              <Button
                type="submit"
                variant="primary"
                icon={<Filter className="h-5 w-5" />}
                disabled={loading}
              >
                {loading ? 'Generando...' : 'Generar Reporte'}
              </Button>
            </div>
          </form>
        </div>
      </Card>

      {loading && <LoadingSpinner />}

      {datosReporte && !loading && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              variant="secondary"
              icon={<Download className="h-5 w-5" />}
              onClick={handleExportar}
            >
              Exportar CSV
            </Button>
          </div>
          {renderReporte()}
        </div>
      )}
    </div>
  )
}

export default Reportes
