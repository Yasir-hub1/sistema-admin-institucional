# Ejemplos de Código - Sistema de Autenticación y Autorización

Este documento contiene ejemplos prácticos de cómo usar el sistema de autenticación y autorización en React + Laravel.

---

## 🔐 Autenticación

### Login en React

```jsx
// pages/Login.jsx
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'

function Login() {
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
    userType: 'admin' // 'admin' o 'estudiante'
  })
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Opción 1: Usar el método genérico (detecta automáticamente)
      const result = await login(credentials)
      
      // Opción 2: Usar métodos específicos
      // const result = credentials.userType === 'estudiante'
      //   ? await authService.loginEstudiante(credentials)
      //   : await authService.loginAdmin(credentials)

      if (result.success) {
        navigate('/dashboard')
      }
    } catch (error) {
      console.error('Error en login:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={credentials.email}
        onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
        placeholder="Email"
      />
      <input
        type="password"
        value={credentials.password}
        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
        placeholder="Contraseña"
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
      </button>
    </form>
  )
}
```

### Login para Estudiante (con CI)

```jsx
// pages/LoginEstudiante.jsx
import { useState } from 'react'
import { authService } from '../services/authService'

function LoginEstudiante() {
  const [credentials, setCredentials] = useState({
    ci: '',
    password: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await authService.loginEstudiante(credentials)
    
    if (result.success) {
      localStorage.setItem('token', result.data.token)
      // Redirigir al dashboard del estudiante
      window.location.href = '/estudiante/dashboard'
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={credentials.ci}
        onChange={(e) => setCredentials({ ...credentials, ci: e.target.value })}
        placeholder="CI"
      />
      <input
        type="password"
        value={credentials.password}
        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
        placeholder="Contraseña"
      />
      <button type="submit">Iniciar sesión</button>
    </form>
  )
}
```

---

## 🛡️ Protección de Rutas

### Ruta Protegida Simple

```jsx
// routes/index.jsx
import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import Dashboard from '../pages/Dashboard'

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
```

### Ruta Protegida por Rol

```jsx
// routes/index.jsx
import RoleBasedRoute from '../components/auth/RoleBasedRoute'
import AdminPanel from '../pages/AdminPanel'
import DocentePanel from '../pages/DocentePanel'

function AppRoutes() {
  return (
    <Routes>
      {/* Solo ADMIN puede acceder */}
      <Route
        path="/admin/panel"
        element={
          <RoleBasedRoute allowedRoles={['ADMIN']}>
            <AdminPanel />
          </RoleBasedRoute>
        }
      />
      
      {/* ADMIN o DOCENTE pueden acceder */}
      <Route
        path="/docente/panel"
        element={
          <RoleBasedRoute allowedRoles={['ADMIN', 'DOCENTE']}>
            <DocentePanel />
          </RoleBasedRoute>
        }
      />
    </Routes>
  )
}
```

### Ruta con Múltiples Roles

```jsx
<Route
  path="/reportes"
  element={
    <RoleBasedRoute allowedRoles={['ADMIN', 'DOCENTE']}>
      <Reportes />
    </RoleBasedRoute>
  }
/>
```

---

## 👤 Verificación de Roles en Componentes

### Usando el Hook useAuth

```jsx
// components/Dashboard.jsx
import { useAuth } from '../contexts/AuthContext'
import { ROLES } from '../utils/roleUtils'

function Dashboard() {
  const { user, isAdmin, isDocente, isEstudiante, getUserRole } = useAuth()

  return (
    <div>
      <h1>Dashboard</h1>
      
      {/* Mostrar contenido según rol */}
      {isAdmin() && (
        <div>
          <h2>Panel de Administración</h2>
          <p>Bienvenido, administrador</p>
        </div>
      )}
      
      {isDocente() && (
        <div>
          <h2>Panel del Docente</h2>
          <p>Bienvenido, {user?.nombre}</p>
        </div>
      )}
      
      {isEstudiante() && (
        <div>
          <h2>Panel del Estudiante</h2>
          <p>Bienvenido, {user?.nombre}</p>
        </div>
      )}
      
      {/* Obtener rol normalizado */}
      <p>Tu rol: {getUserRole()}</p>
    </div>
  )
}
```

### Verificación Condicional con hasRole

```jsx
import { useAuth } from '../contexts/AuthContext'
import { ROLES } from '../utils/roleUtils'

function Navigation() {
  const { hasRole, hasAnyRole } = useAuth()

  return (
    <nav>
      <a href="/dashboard">Dashboard</a>
      
      {/* Mostrar solo si es ADMIN */}
      {hasRole(ROLES.ADMIN) && (
        <a href="/admin/usuarios">Usuarios</a>
      )}
      
      {/* Mostrar si es ADMIN o DOCENTE */}
      {hasAnyRole([ROLES.ADMIN, ROLES.DOCENTE]) && (
        <a href="/reportes">Reportes</a>
      )}
    </nav>
  )
}
```

---

## 🔑 Verificación de Permisos

### Usando el Hook usePermissions

```jsx
// components/EstudiantesList.jsx
import { usePermissions } from '../hooks/usePermissions'

function EstudiantesList() {
  const { can, canCreate, canEdit, canDelete, canView } = usePermissions()

  return (
    <div>
      <h1>Lista de Estudiantes</h1>
      
      {/* Botón de crear solo si tiene permiso */}
      {canCreate('estudiantes') && (
        <button onClick={handleCreate}>
          Crear Estudiante
        </button>
      )}
      
      {/* Tabla de estudiantes */}
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>CI</th>
            {canEdit('estudiantes') && <th>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {estudiantes.map(estudiante => (
            <tr key={estudiante.id}>
              <td>{estudiante.nombre}</td>
              <td>{estudiante.ci}</td>
              {canEdit('estudiantes') && (
                <td>
                  <button onClick={() => handleEdit(estudiante.id)}>
                    Editar
                  </button>
                  {canDelete('estudiantes') && (
                    <button onClick={() => handleDelete(estudiante.id)}>
                      Eliminar
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

### Verificación Directa de Permisos

```jsx
import { useAuth } from '../contexts/AuthContext'

function DocumentosList() {
  const { hasPermission, hasPermissionByModuleAction } = useAuth()

  return (
    <div>
      {/* Verificar permiso específico */}
      {hasPermission('documentos_ver') && (
        <div>Lista de documentos</div>
      )}
      
      {/* Verificar permiso por módulo y acción */}
      {hasPermissionByModuleAction('documentos', 'crear') && (
        <button>Subir Documento</button>
      )}
    </div>
  )
}
```

---

## 🎨 Componente de Sidebar Adaptado por Rol

```jsx
// components/layout/Sidebar.jsx
import { useAuth } from '../../contexts/AuthContext'
import { ROLES } from '../../utils/roleUtils'
import { getRoleLabel, getRoleColor } from '../../utils/roleUtils'

function Sidebar() {
  const { user, isAdmin, isDocente, isEstudiante, logout } = useAuth()

  const adminMenu = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: 'home' },
    { path: '/admin/estudiantes', label: 'Estudiantes', icon: 'users' },
    { path: '/admin/docentes', label: 'Docentes', icon: 'academic-cap' },
    { path: '/admin/grupos', label: 'Grupos', icon: 'user-group' },
    { path: '/admin/reportes', label: 'Reportes', icon: 'chart-bar' },
    { path: '/admin/roles', label: 'Roles y Permisos', icon: 'shield-check' },
  ]

  const docenteMenu = [
    { path: '/docente/dashboard', label: 'Dashboard', icon: 'home' },
    { path: '/docente/grupos', label: 'Mis Grupos', icon: 'user-group' },
    { path: '/docente/notas', label: 'Calificaciones', icon: 'pencil' },
    { path: '/docente/asistencias', label: 'Asistencias', icon: 'clock' },
  ]

  const estudianteMenu = [
    { path: '/estudiante/dashboard', label: 'Dashboard', icon: 'home' },
    { path: '/estudiante/materias', label: 'Mis Materias', icon: 'book' },
    { path: '/estudiante/notas', label: 'Mis Notas', icon: 'academic-cap' },
    { path: '/estudiante/documentos', label: 'Documentos', icon: 'document' },
    { path: '/estudiante/pagos', label: 'Pagos', icon: 'currency-dollar' },
  ]

  const getMenu = () => {
    if (isAdmin()) return adminMenu
    if (isDocente()) return docenteMenu
    if (isEstudiante()) return estudianteMenu
    return []
  }

  return (
    <aside className="sidebar">
      {/* Header con información del usuario */}
      <div className="sidebar-header">
        <div className="user-info">
          <p className="user-name">{user?.nombre} {user?.apellido}</p>
          <span className={`role-badge ${getRoleColor(user?.rol)}`}>
            {getRoleLabel(user?.rol)}
          </span>
        </div>
      </div>

      {/* Menú de navegación */}
      <nav className="sidebar-nav">
        {getMenu().map(item => (
          <a key={item.path} href={item.path} className="nav-item">
            <span className="icon">{item.icon}</span>
            <span className="label">{item.label}</span>
          </a>
        ))}
      </nav>

      {/* Footer con logout */}
      <div className="sidebar-footer">
        <button onClick={logout} className="logout-btn">
          Cerrar Sesión
        </button>
      </div>
    </aside>
  )
}
```

---

## 🔧 Backend - Controlador con Verificación de Permisos

```php
// app/Http/Controllers/Admin/EstudianteController.php
namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Estudiante;
use Illuminate\Http\Request;

class EstudianteController extends Controller
{
    /**
     * Listar estudiantes (requiere permiso estudiantes_ver)
     */
    public function listar(Request $request)
    {
        // El middleware 'permission:estudiantes_ver' ya verificó el permiso
        $estudiantes = Estudiante::with('persona', 'estado')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $estudiantes
        ]);
    }

    /**
     * Crear estudiante (requiere permiso estudiantes_crear)
     */
    public function crear(Request $request)
    {
        // El middleware 'permission:estudiantes_crear' ya verificó el permiso
        $validated = $request->validate([
            'ci' => 'required|unique:persona,ci',
            'nombre' => 'required|string|max:255',
            'apellido' => 'required|string|max:255',
            // ... más validaciones
        ]);

        $estudiante = Estudiante::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Estudiante creado exitosamente',
            'data' => $estudiante
        ], 201);
    }

    /**
     * Actualizar estudiante (requiere permiso estudiantes_editar)
     */
    public function actualizar(Request $request, $id)
    {
        // El middleware 'permission:estudiantes_editar' ya verificó el permiso
        $estudiante = Estudiante::findOrFail($id);
        
        $validated = $request->validate([
            'nombre' => 'sometimes|string|max:255',
            'apellido' => 'sometimes|string|max:255',
            // ... más validaciones
        ]);

        $estudiante->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Estudiante actualizado exitosamente',
            'data' => $estudiante
        ]);
    }
}
```

### Rutas con Middleware de Permisos

```php
// routes/api.php
Route::middleware(['auth:api', 'role:ADMIN'])->prefix('admin')->group(function () {
    
    // Rutas de estudiantes con permisos específicos
    Route::prefix('estudiantes')->group(function () {
        Route::get('/', [EstudianteController::class, 'listar'])
            ->middleware('permission:estudiantes_ver');
        
        Route::post('/', [EstudianteController::class, 'crear'])
            ->middleware('permission:estudiantes_crear');
        
        Route::put('/{id}', [EstudianteController::class, 'actualizar'])
            ->middleware('permission:estudiantes_editar');
        
        Route::delete('/{id}', [EstudianteController::class, 'eliminar'])
            ->middleware('permission:estudiantes_eliminar');
    });
});
```

---

## 🎯 Ejemplo Completo: Componente con Permisos

```jsx
// components/admin/EstudiantesManager.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { usePermissions } from '../../hooks/usePermissions'
import { estudianteService } from '../../services/estudianteService'
import Button from '../common/Button'
import Table from '../common/Table'
import Modal from '../common/Modal'

function EstudiantesManager() {
  const { user, isAdmin } = useAuth()
  const { canCreate, canEdit, canDelete, canView } = usePermissions()
  const [estudiantes, setEstudiantes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (canView('estudiantes')) {
      loadEstudiantes()
    }
  }, [])

  const loadEstudiantes = async () => {
    try {
      const response = await estudianteService.listar()
      if (response.success) {
        setEstudiantes(response.data)
      }
    } catch (error) {
      console.error('Error cargando estudiantes:', error)
    } finally {
      setLoading(false)
    }
  }

  // Si no tiene permiso de ver, no mostrar nada
  if (!canView('estudiantes')) {
    return (
      <div className="alert alert-warning">
        No tienes permisos para ver estudiantes
      </div>
    )
  }

  return (
    <div className="estudiantes-manager">
      <div className="header">
        <h1>Gestión de Estudiantes</h1>
        {canCreate('estudiantes') && (
          <Button onClick={() => setShowModal(true)}>
            Crear Estudiante
          </Button>
        )}
      </div>

      {loading ? (
        <div>Cargando...</div>
      ) : (
        <Table
          data={estudiantes}
          columns={[
            { key: 'nombre', label: 'Nombre' },
            { key: 'ci', label: 'CI' },
            { key: 'email', label: 'Email' },
            {
              key: 'actions',
              label: 'Acciones',
              render: (estudiante) => (
                <div className="actions">
                  {canEdit('estudiantes') && (
                    <Button
                      variant="secondary"
                      onClick={() => handleEdit(estudiante.id)}
                    >
                      Editar
                    </Button>
                  )}
                  {canDelete('estudiantes') && (
                    <Button
                      variant="danger"
                      onClick={() => handleDelete(estudiante.id)}
                    >
                      Eliminar
                    </Button>
                  )}
                </div>
              )
            }
          ]}
        />
      )}

      {showModal && canCreate('estudiantes') && (
        <Modal onClose={() => setShowModal(false)}>
          <EstudianteForm
            onSuccess={() => {
              setShowModal(false)
              loadEstudiantes()
            }}
          />
        </Modal>
      )}
    </div>
  )
}
```

---

## 📝 Notas Importantes

1. **Siempre normalizar roles**: Usar `normalizeRole()` antes de comparar
2. **Verificar permisos en backend**: El frontend solo oculta UI, el backend es la fuente de verdad
3. **Manejar estados de carga**: Mostrar loading mientras se verifica autenticación
4. **Manejar errores 401**: El interceptor de Axios redirige automáticamente al login
5. **Cachear permisos**: Considerar guardar permisos en localStorage para verificaciones rápidas

---

**Última actualización**: Enero 2025

