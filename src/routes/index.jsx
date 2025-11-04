// Configuración de rutas del sistema académico FICCT

import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

// Componentes de layout
import Layout from '../components/layout/Layout'

// Páginas
import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import Docentes from '../pages/Docentes'
import Materias from '../pages/Materias'
import Aulas from '../pages/Aulas'
import Grupos from '../pages/Grupos'
import Horarios from '../pages/Horarios'
import Asistencias from '../pages/Asistencias'
import Reportes from '../pages/Reportes'
import Notificaciones from '../pages/Notificaciones'
import Auditoria from '../pages/Auditoria'
import Perfil from '../pages/Perfil'
import GestionesAcademicas from '../pages/GestionesAcademicas'
import Roles from '../pages/Roles'
import Usuarios from '../pages/Usuarios'
import NotFound from '../pages/NotFound'

// Componentes de autenticación
import ProtectedRoute from '../components/auth/ProtectedRoute'
import RoleBasedRoute from '../components/auth/RoleBasedRoute'

// Componente de rutas principales
const AppRoutes = () => {
  const { isAuthenticated, user } = useAuth()

  return (
    <Routes>
      {/* Rutas públicas */}
      <Route 
        path="/login" 
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
        } 
      />
      
      {/* Rutas protegidas */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Redirección por defecto */}
        <Route index element={<Navigate to="/dashboard" replace />} />
        
        {/* Dashboard */}
        <Route path="dashboard" element={<Dashboard />} />
        
        {/* Gestión de usuarios */}
        <Route 
          path="usuarios" 
          element={
            <RoleBasedRoute allowedRoles={['admin', 'coordinador']}>
              <Usuarios />
            </RoleBasedRoute>
          } 
        />

        {/* Gestión de roles y permisos */}
        <Route 
          path="roles" 
          element={
            <RoleBasedRoute allowedRoles={['admin']}>
              <Roles />
            </RoleBasedRoute>
          } 
        />
        
        {/* Gestión de docentes */}
        <Route 
          path="docentes" 
          element={
            <RoleBasedRoute allowedRoles={['admin', 'coordinador']}>
              <Docentes />
            </RoleBasedRoute>
          } 
        />
        
        {/* Gestión de materias */}
        <Route 
          path="materias" 
          element={
            <RoleBasedRoute allowedRoles={['admin', 'coordinador']}>
              <Materias />
            </RoleBasedRoute>
          } 
        />

        {/* Gestión académica */}
        <Route 
          path="gestiones-academicas" 
          element={
            <RoleBasedRoute allowedRoles={['admin', 'coordinador']}>
              <GestionesAcademicas />
            </RoleBasedRoute>
          } 
        />
        
        {/* Gestión de aulas */}
        <Route 
          path="aulas" 
          element={
            <RoleBasedRoute allowedRoles={['admin', 'coordinador']}>
              <Aulas />
            </RoleBasedRoute>
          } 
        />
        
        {/* Gestión de grupos */}
        <Route 
          path="grupos" 
          element={
            <RoleBasedRoute allowedRoles={['admin', 'coordinador']}>
              <Grupos />
            </RoleBasedRoute>
          } 
        />
        
        {/* Gestión de horarios */}
        <Route 
          path="horarios" 
          element={
            <RoleBasedRoute allowedRoles={['admin', 'coordinador', 'docente']}>
              <Horarios />
            </RoleBasedRoute>
          } 
        />
        
        {/* Control de asistencias */}
        <Route 
          path="asistencias" 
          element={
            <RoleBasedRoute allowedRoles={['admin', 'coordinador', 'docente']}>
              <Asistencias />
            </RoleBasedRoute>
          } 
        />
        
        {/* Registro de asistencia para docentes */}
        <Route 
          path="asistencias/registrar" 
          element={
            <RoleBasedRoute allowedRoles={['docente']}>
              <div>Registro de Asistencia - En desarrollo</div>
            </RoleBasedRoute>
          } 
        />
        
        {/* Escaneo de QR para docentes */}
        <Route 
          path="asistencias/escanear-qr" 
          element={
            <RoleBasedRoute allowedRoles={['docente']}>
              <div>Escáner QR - En desarrollo</div>
            </RoleBasedRoute>
          } 
        />
        
        {/* Reportes */}
        <Route 
          path="reportes" 
          element={
            <RoleBasedRoute allowedRoles={['admin', 'coordinador', 'autoridad']}>
              <Reportes />
            </RoleBasedRoute>
          } 
        />
        
        {/* Notificaciones */}
        <Route 
          path="notificaciones" 
          element={
            <RoleBasedRoute allowedRoles={['admin', 'coordinador', 'docente']}>
              <Notificaciones />
            </RoleBasedRoute>
          } 
        />

        {/* Auditoría */}
        <Route 
          path="auditoria" 
          element={
            <RoleBasedRoute allowedRoles={['admin', 'coordinador']}>
              <Auditoria />
            </RoleBasedRoute>
          } 
        />
        
        {/* Perfil de usuario */}
        <Route path="perfil" element={<Perfil />} />
        
        {/* Configuración (solo admin) */}
        <Route 
          path="configuracion" 
          element={
            <RoleBasedRoute allowedRoles={['admin']}>
              <div>Configuración del Sistema - En desarrollo</div>
            </RoleBasedRoute>
          } 
        />
      </Route>
      
      {/* Ruta 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default AppRoutes