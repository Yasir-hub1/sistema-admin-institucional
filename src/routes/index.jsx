// Configuración de rutas del sistema académico ICAP

import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

// Componentes de layout
import Layout from '../components/layout/Layout'

// Páginas públicas
import Home from '../pages/public/Home'
import Portales from '../pages/public/Portales'

// Páginas de autenticación
import LoginDocente from '../pages/auth/LoginDocente'
import LoginEstudiante from '../pages/auth/LoginEstudiante'
import RegistroEstudiante from '../pages/auth/RegistroEstudiante'

// Páginas compartidas
import Login from '../pages/shared/Login'
import Perfil from '../pages/shared/Perfil'
import NotFound from '../pages/shared/NotFound'

// Páginas Admin
import AdminDashboard from '../pages/admin/Dashboard'
import Usuarios from '../pages/admin/Usuarios'
import SistemaUsuarios from '../pages/admin/SistemaUsuarios'
import TipoConvenios from '../pages/admin/TipoConvenios'
import Convenios from '../pages/admin/Convenios'
import RamasAcademicas from '../pages/admin/RamasAcademicas'
import Versiones from '../pages/admin/Versiones'
import TiposPrograma from '../pages/admin/TiposPrograma'
import Modulos from '../pages/admin/Modulos'
import Roles from '../pages/admin/Roles'
import Docentes from '../pages/admin/Docentes'
import Horarios from '../pages/admin/Horarios'
import Estudiantes from '../pages/admin/Estudiantes'
import Programas from '../pages/admin/Programas'
import Inscripciones from '../pages/admin/Inscripciones'
import Pagos from '../pages/admin/Pagos'
import Materias from '../pages/admin/Materias'
import Aulas from '../pages/admin/Aulas'
import Grupos from '../pages/admin/Grupos'
import Asistencias from '../pages/admin/Asistencias'
import Reportes from '../pages/admin/Reportes'
import Notificaciones from '../pages/admin/Notificaciones'
import Auditoria from '../pages/admin/Auditoria'
import GestionesAcademicas from '../pages/admin/GestionesAcademicas'
import Paises from '../pages/admin/Paises'
import Provincias from '../pages/admin/Provincias'
import Ciudades from '../pages/admin/Ciudades'
import Instituciones from '../pages/admin/Instituciones'
import TiposDocumento from '../pages/admin/TiposDocumento'
import ValidacionDocumentos from '../pages/admin/ValidacionDocumentos'
import PlanesPago from '../pages/admin/PlanesPago'
import Descuentos from '../pages/admin/Descuentos'
import GestionPagos from '../pages/admin/GestionPagos'

// Páginas Docente
import DocenteDashboard from '../pages/docente/Dashboard'
import MisGrupos from '../pages/docente/MisGrupos'
import EvaluacionGrupo from '../pages/docente/EvaluacionGrupo'

// Páginas Estudiante
import EstudianteDashboard from '../pages/estudiante/Dashboard'
import EstudianteMaterias from '../pages/estudiante/Materias'
import EstudianteNotas from '../pages/estudiante/Notas'
import EstudianteDocumentos from '../pages/estudiante/Documentos'
import MisDocumentos from '../pages/student/MisDocumentos'
import EstudiantePagos from '../pages/estudiante/Pagos'
import MisPagos from '../pages/student/MisPagos'
import InscripcionesEstudiante from '../pages/estudiante/Inscripciones'

// Componentes de autenticación
import ProtectedRoute from '../components/auth/ProtectedRoute'
import RoleBasedRoute from '../components/auth/RoleBasedRoute'

// Utilidades
import { normalizeRole, ROLES } from '../utils/roleUtils'

// Componente de rutas principales
const AppRoutes = () => {
  const { isAuthenticated, user } = useAuth()

  return (
    <Routes>
      {/* Ruta pública principal - Landing Page ICAP */}
      <Route path="/" element={<Home />} />
      
      {/* Página de selección de portales */}
      <Route path="/portales" element={<Portales />} />
      
      {/* Rutas públicas de autenticación */}
      <Route 
        path="/docente/login" 
        element={
          isAuthenticated && user?.rol === 'DOCENTE' 
            ? <Navigate to="/docente/dashboard" replace /> 
            : <LoginDocente />
        } 
      />
      
      <Route 
        path="/estudiante/login" 
        element={
          isAuthenticated && user?.rol === 'ESTUDIANTE' 
            ? <Navigate to="/estudiante/dashboard" replace /> 
            : <LoginEstudiante />
        } 
      />
      
      <Route 
        path="/estudiante/registro" 
        element={
          isAuthenticated && user?.rol === 'ESTUDIANTE' 
            ? <Navigate to="/estudiante/dashboard" replace /> 
            : <RegistroEstudiante />
        } 
      />
      
      {/* Login genérico (mantener para compatibilidad) - Para ADMIN */}
      <Route 
        path="/login" 
        element={
          isAuthenticated && user ? (
            (() => {
              const userRole = normalizeRole(user?.rol)
              if (userRole === ROLES.ADMIN) {
                return <Navigate to="/admin/dashboard" replace />
              } else if (userRole === ROLES.DOCENTE) {
                return <Navigate to="/docente/dashboard" replace />
              } else if (userRole === ROLES.ESTUDIANTE) {
                return <Navigate to="/estudiante/dashboard" replace />
              }
              return <Login />
            })()
          ) : (
            <Login />
          )
        } 
      />
      
      {/* Ruta de perfil genérica - redirige según el rol del usuario */}
      <Route 
        path="/perfil" 
        element={
          <ProtectedRoute>
            {(() => {
              if (!isAuthenticated || !user) {
                return <Navigate to="/login" replace />
              }
              
              const userRole = normalizeRole(user?.rol)
              
              if (userRole === ROLES.ADMIN) {
                return <Navigate to="/admin/perfil" replace />
              } else if (userRole === ROLES.DOCENTE) {
                return <Navigate to="/docente/perfil" replace />
              } else if (userRole === ROLES.ESTUDIANTE) {
                return <Navigate to="/estudiante/perfil" replace />
              }
              
              return <Navigate to="/login" replace />
            })()}
          </ProtectedRoute>
        } 
      />
      
      {/* Rutas protegidas - Portal ADMIN (solo por ruta directa) */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute requiredRoles={['ADMIN']}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        
        {/* Gestión de usuarios - Solo ADMIN */}
        <Route 
          path="usuarios" 
          element={
            <RoleBasedRoute allowedRoles={['ADMIN']}>
              <Usuarios />
            </RoleBasedRoute>
          } 
        />

        {/* Gestión de roles y permisos - Solo ADMIN */}
        <Route 
          path="roles" 
          element={
            <RoleBasedRoute allowedRoles={['ADMIN']}>
              <Roles />
            </RoleBasedRoute>
          } 
        />
        
        {/* Gestión de docentes - ADMIN */}
        <Route 
          path="docentes" 
          element={
            <RoleBasedRoute allowedRoles={['ADMIN']}>
              <Docentes />
            </RoleBasedRoute>
          } 
        />
        
        {/* Gestión de estudiantes - ADMIN */}
        <Route 
          path="estudiantes" 
          element={
            <RoleBasedRoute allowedRoles={['ADMIN']}>
              <Estudiantes />
            </RoleBasedRoute>
          } 
        />
        
        {/* Gestión de programas - ADMIN */}
        <Route 
          path="programas" 
          element={
            <RoleBasedRoute allowedRoles={['ADMIN']}>
              <Programas />
            </RoleBasedRoute>
          } 
        />
        
        {/* Gestión de inscripciones - ADMIN */}
        <Route 
          path="inscripciones" 
          element={
            <RoleBasedRoute allowedRoles={['ADMIN']}>
              <Inscripciones />
            </RoleBasedRoute>
          } 
        />
        
        {/* Gestión de pagos - ADMIN */}
        <Route 
          path="pagos" 
          element={
            <RoleBasedRoute allowedRoles={['ADMIN']}>
              <Pagos />
            </RoleBasedRoute>
          } 
        />
        <Route 
          path="planes-pago" 
          element={
            <RoleBasedRoute allowedRoles={['ADMIN']}>
              <PlanesPago />
            </RoleBasedRoute>
          } 
        />
        <Route 
          path="descuentos" 
          element={
            <RoleBasedRoute allowedRoles={['ADMIN']}>
              <Descuentos />
            </RoleBasedRoute>
          } 
        />
        <Route 
          path="gestion-pagos" 
          element={
            <RoleBasedRoute allowedRoles={['ADMIN']}>
              <GestionPagos />
            </RoleBasedRoute>
          } 
        />
        
        {/* Gestión de documentos - ADMIN */}
        <Route 
          path="documentos" 
          element={
            <RoleBasedRoute allowedRoles={['ADMIN']}>
              <ValidacionDocumentos />
            </RoleBasedRoute>
          } 
        />
        <Route 
          path="validacion-documentos" 
          element={
            <RoleBasedRoute allowedRoles={['ADMIN']}>
              <ValidacionDocumentos />
            </RoleBasedRoute>
          } 
        />
        <Route 
          path="tipos-documento" 
          element={
            <RoleBasedRoute allowedRoles={['ADMIN']}>
              <TiposDocumento />
            </RoleBasedRoute>
          } 
        />
        
        {/* Gestión de materias - ADMIN */}
        <Route 
          path="materias" 
          element={
            <RoleBasedRoute allowedRoles={['ADMIN']}>
              <Materias />
            </RoleBasedRoute>
          } 
        />

        {/* Gestión académica - ADMIN */}
        <Route 
          path="gestiones-academicas" 
          element={
            <RoleBasedRoute allowedRoles={['ADMIN']}>
              <GestionesAcademicas />
            </RoleBasedRoute>
          } 
        />
        
        {/* Gestión de aulas - ADMIN */}
        <Route 
          path="aulas" 
          element={
            <RoleBasedRoute allowedRoles={['ADMIN']}>
              <Aulas />
            </RoleBasedRoute>
          } 
        />
        
        {/* Gestión de grupos - ADMIN */}
        <Route 
          path="grupos" 
          element={
            <RoleBasedRoute allowedRoles={['ADMIN']}>
              <Grupos />
            </RoleBasedRoute>
          } 
        />
        
        {/* Gestión de horarios - ADMIN */}
        <Route 
          path="horarios" 
          element={
            <RoleBasedRoute allowedRoles={['ADMIN']}>
              <Horarios />
            </RoleBasedRoute>
          } 
        />
        
        {/* Control de asistencias - ADMIN */}
        <Route 
          path="asistencias" 
          element={
            <RoleBasedRoute allowedRoles={['ADMIN']}>
              <Asistencias />
            </RoleBasedRoute>
          } 
        />
        
        {/* Reportes - ADMIN */}
        <Route 
          path="reportes" 
          element={
            <RoleBasedRoute allowedRoles={['ADMIN']}>
              <Reportes />
            </RoleBasedRoute>
          } 
        />
        
        {/* Notificaciones - ADMIN */}
        <Route 
          path="notificaciones" 
          element={
            <RoleBasedRoute allowedRoles={['ADMIN']}>
              <Notificaciones />
            </RoleBasedRoute>
          } 
        />

        {/* Auditoría - ADMIN */}
        <Route 
          path="auditoria" 
          element={
            <RoleBasedRoute allowedRoles={['ADMIN']}>
              <Auditoria />
            </RoleBasedRoute>
          } 
        />

        {/* Configuración inicial del sistema - ADMIN */}
        <Route 
          path="paises" 
          element={
            <RoleBasedRoute allowedRoles={['ADMIN']}>
              <Paises />
            </RoleBasedRoute>
          } 
        />
        <Route 
          path="provincias" 
          element={
            <RoleBasedRoute allowedRoles={['ADMIN']}>
              <Provincias />
            </RoleBasedRoute>
          } 
        />
        <Route 
          path="ciudades" 
          element={
            <RoleBasedRoute allowedRoles={['ADMIN']}>
              <Ciudades />
            </RoleBasedRoute>
          } 
        />
        <Route 
          path="instituciones" 
          element={
            <RoleBasedRoute allowedRoles={['ADMIN']}>
              <Instituciones />
            </RoleBasedRoute>
          } 
        />
        <Route 
          path="sistema-usuarios" 
          element={
            <RoleBasedRoute allowedRoles={['ADMIN']}>
              <SistemaUsuarios />
            </RoleBasedRoute>
          } 
        />
        
        {/* Gestión de convenios institucionales - ADMIN */}
        <Route 
          path="tipo-convenios" 
          element={
            <RoleBasedRoute allowedRoles={['ADMIN']}>
              <TipoConvenios />
            </RoleBasedRoute>
          } 
        />
        <Route 
          path="convenios" 
          element={
            <RoleBasedRoute allowedRoles={['ADMIN']}>
              <Convenios />
            </RoleBasedRoute>
          } 
        />
        
        {/* Gestión de planificación académica - ADMIN */}
        <Route 
          path="ramas-academicas" 
          element={
            <RoleBasedRoute allowedRoles={['ADMIN']}>
              <RamasAcademicas />
            </RoleBasedRoute>
          } 
        />
        <Route 
          path="versiones" 
          element={
            <RoleBasedRoute allowedRoles={['ADMIN']}>
              <Versiones />
            </RoleBasedRoute>
          } 
        />
        <Route 
          path="tipos-programa" 
          element={
            <RoleBasedRoute allowedRoles={['ADMIN']}>
              <TiposPrograma />
            </RoleBasedRoute>
          } 
        />
        <Route 
          path="modulos" 
          element={
            <RoleBasedRoute allowedRoles={['ADMIN']}>
              <Modulos />
            </RoleBasedRoute>
          } 
        />
        <Route 
          path="programas" 
          element={
            <RoleBasedRoute allowedRoles={['ADMIN']}>
              <Programas />
            </RoleBasedRoute>
          } 
        />
        
        {/* Gestión de asignación de docentes y grupos - ADMIN */}
        <Route 
          path="docentes" 
          element={
            <RoleBasedRoute allowedRoles={['ADMIN']}>
              <Docentes />
            </RoleBasedRoute>
          } 
        />
        <Route 
          path="horarios" 
          element={
            <RoleBasedRoute allowedRoles={['ADMIN']}>
              <Horarios />
            </RoleBasedRoute>
          } 
        />
        <Route 
          path="grupos" 
          element={
            <RoleBasedRoute allowedRoles={['ADMIN']}>
              <Grupos />
            </RoleBasedRoute>
          } 
        />
        
        {/* Perfil de usuario - ADMIN */}
        <Route path="perfil" element={<Perfil />} />
      </Route>

      {/* Rutas protegidas - Portal DOCENTE */}
      <Route 
        path="/docente" 
        element={
          <ProtectedRoute requiredRoles={['DOCENTE']}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/docente/dashboard" replace />} />
        <Route path="dashboard" element={<DocenteDashboard />} />
        
        {/* Gestión de grupos y evaluación - DOCENTE */}
        <Route 
          path="grupos" 
          element={
            <RoleBasedRoute allowedRoles={['DOCENTE']}>
              <MisGrupos />
            </RoleBasedRoute>
          } 
        />
        <Route 
          path="grupos/:grupoId" 
          element={
            <RoleBasedRoute allowedRoles={['DOCENTE']}>
              <EvaluacionGrupo />
            </RoleBasedRoute>
          } 
        />
        
        {/* Gestión de horarios - DOCENTE */}
        <Route 
          path="horarios" 
          element={
            <RoleBasedRoute allowedRoles={['DOCENTE']}>
              <Horarios />
            </RoleBasedRoute>
          } 
        />
        
        {/* Control de asistencias - DOCENTE */}
        <Route 
          path="asistencias" 
          element={
            <RoleBasedRoute allowedRoles={['DOCENTE']}>
              <Asistencias />
            </RoleBasedRoute>
          } 
        />
        
        {/* Registro de asistencia para docentes - DOCENTE */}
        <Route 
          path="asistencias/registrar" 
          element={
            <RoleBasedRoute allowedRoles={['DOCENTE']}>
              <div>Registro de Asistencia - En desarrollo</div>
            </RoleBasedRoute>
          } 
        />
        
        {/* Escaneo de QR para docentes - DOCENTE */}
        <Route 
          path="asistencias/escanear-qr" 
          element={
            <RoleBasedRoute allowedRoles={['DOCENTE']}>
              <div>Escáner QR - En desarrollo</div>
            </RoleBasedRoute>
          } 
        />
        
        {/* Notificaciones - DOCENTE */}
        <Route 
          path="notificaciones" 
          element={
            <RoleBasedRoute allowedRoles={['DOCENTE']}>
              <Notificaciones />
            </RoleBasedRoute>
          } 
        />
        
        {/* Perfil de usuario - DOCENTE */}
        <Route path="perfil" element={<Perfil />} />
      </Route>

      {/* Rutas protegidas - Portal ESTUDIANTE */}
      <Route 
        path="/estudiante" 
        element={
          <ProtectedRoute requiredRoles={['ESTUDIANTE']}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/estudiante/dashboard" replace />} />
        <Route path="dashboard" element={<EstudianteDashboard />} />
        <Route path="materias" element={<EstudianteMaterias />} />
        <Route path="notas" element={<EstudianteNotas />} />
        <Route path="documentos" element={<EstudianteDocumentos />} />
        <Route path="mis-documentos" element={<MisDocumentos />} />
        <Route path="pagos" element={<EstudiantePagos />} />
        <Route path="mis-pagos" element={<MisPagos />} />
        <Route path="inscripciones" element={<InscripcionesEstudiante />} />
        
        {/* Perfil de usuario - ESTUDIANTE */}
        <Route path="perfil" element={<Perfil />} />
      </Route>
      
      {/* Ruta 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default AppRoutes