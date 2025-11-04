import React, { useState, useEffect, useRef } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Home,
  Users,
  BookOpen,
  Building,
  UserCheck,
  Clock,
  ClipboardList,
  BarChart3,
  User,
  Menu,
  X,
  LogOut,
  GraduationCap,
  Moon,
  Sun,
  Bell,
  Search,
  Settings,
  History,
  CalendarDays,
  Shield
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import NotificationsDropdown from '../common/NotificationsDropdown'
import api from '../../services/api'

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const searchRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, roles: ['admin', 'coordinador', 'docente', 'autoridad'] },
    { name: 'Gestiones Académicas', href: '/gestiones-academicas', icon: CalendarDays, roles: ['admin', 'coordinador'] },
    { name: 'Roles y Permisos', href: '/roles', icon: Shield, roles: ['admin'] },
    { name: 'Usuarios', href: '/usuarios', icon: Users, roles: ['admin', 'coordinador'] },
    { name: 'Docentes', href: '/docentes', icon: GraduationCap, roles: ['admin', 'coordinador'] },
    { name: 'Materias', href: '/materias', icon: BookOpen, roles: ['admin', 'coordinador'] },
    { name: 'Aulas', href: '/aulas', icon: Building, roles: ['admin', 'coordinador'] },
    { name: 'Grupos', href: '/grupos', icon: UserCheck, roles: ['admin', 'coordinador'] },
    { name: 'Horarios', href: '/horarios', icon: Clock, roles: ['admin', 'coordinador', 'docente'] },
    { name: 'Asistencias', href: '/asistencias', icon: ClipboardList, roles: ['admin', 'coordinador', 'docente'] },
    { name: 'Reportes', href: '/reportes', icon: BarChart3, roles: ['admin', 'coordinador', 'autoridad'] },
    { name: 'Notificaciones', href: '/notificaciones', icon: Bell, roles: ['admin', 'coordinador', 'docente'] },
    { name: 'Auditoría', href: '/auditoria', icon: History, roles: ['admin', 'coordinador'] },
  ]

  const isActive = (href) => {
    return location.pathname === href || location.pathname.startsWith(href + '/')
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const filteredNavigation = user?.rol 
    ? navigation.filter(item => !item.roles || item.roles.includes(user.rol))
    : navigation // Mostrar todos los elementos si no hay usuario autenticado

  const closeSidebar = () => setSidebarOpen(false)

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('dark')
  }

  const handleSearch = async (term) => {
    // Normalizar término de búsqueda a minúsculas y trim
    // Esto asegura búsqueda case-insensitive
    const normalizedTerm = term.trim().toLowerCase()
    
    if (!normalizedTerm || normalizedTerm.length < 2) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    // Limpiar espacios múltiples y caracteres especiales problemáticos
    const cleanTerm = normalizedTerm.replace(/\s+/g, ' ').trim()

    try {
      // Buscar en todos los módulos del sistema
      const searchPromises = []
      const modules = [
        { 
          name: 'docentes', 
          route: '/docentes', 
          icon: GraduationCap,
          label: 'Docentes',
          getDisplayName: (item) => item.user?.name || item.codigo_docente || item.nombre || 'Sin nombre',
          getSubtitle: (item) => item.user?.email || item.especialidad || ''
        },
        { 
          name: 'materias', 
          route: '/materias', 
          icon: BookOpen,
          label: 'Materias',
          getDisplayName: (item) => item.nombre || item.codigo_materia || 'Sin nombre',
          getSubtitle: (item) => `${item.codigo_materia || ''} ${item.sigla || ''}`.trim() || item.nivel || ''
        },
        { 
          name: 'aulas', 
          route: '/aulas', 
          icon: Building,
          label: 'Aulas',
          getDisplayName: (item) => item.nombre || item.codigo_aula || 'Sin nombre',
          getSubtitle: (item) => `${item.edificio || ''} - Piso ${item.piso || ''}`.trim() || item.tipo || ''
        },
        { 
          name: 'grupos', 
          route: '/grupos', 
          icon: UserCheck,
          label: 'Grupos',
          getDisplayName: (item) => item.nombre || `Grupo ${item.numero_grupo || ''}` || 'Sin nombre',
          getSubtitle: (item) => item.materia?.nombre || item.materia?.sigla || item.gestion?.nombre || ''
        },
        { 
          name: 'usuarios', 
          route: '/usuarios', 
          icon: Users,
          label: 'Usuarios',
          getDisplayName: (item) => item.name || item.email || 'Sin nombre',
          getSubtitle: (item) => item.email || item.rol?.nombre || ''
        },
        { 
          name: 'horarios', 
          route: '/horarios', 
          icon: Clock,
          label: 'Horarios',
          getDisplayName: (item) => {
            const materia = item.grupo?.materia?.nombre || item.materia || 'Sin materia'
            const grupo = item.grupo?.numero_grupo || item.grupo || ''
            return `${materia} - Grupo ${grupo}`.trim()
          },
          getSubtitle: (item) => {
            const aula = item.aula?.nombre || item.aula || 'Sin aula'
            const docente = item.docente?.user?.name || item.docente || 'Sin docente'
            const hora = item.hora_inicio && item.hora_fin ? `${item.hora_inicio} - ${item.hora_fin}` : ''
            return `${aula} • ${docente} ${hora ? `• ${hora}` : ''}`.trim()
          }
        },
        { 
          name: 'asistencias', 
          route: '/asistencias', 
          icon: ClipboardList,
          label: 'Asistencias',
          getDisplayName: (item) => {
            const materia = item.horario?.grupo?.materia?.nombre || item.materia || 'Sin materia'
            const fecha = item.fecha || ''
            return `${materia} - ${fecha}`.trim()
          },
          getSubtitle: (item) => {
            const docente = item.docente?.user?.name || item.docente || 'Sin docente'
            const estado = item.estado || ''
            return `${docente} • ${estado}`.trim()
          }
        },
        { 
          name: 'gestiones-academicas', 
          route: '/gestiones-academicas', 
          icon: CalendarDays,
          label: 'Gestiones Académicas',
          getDisplayName: (item) => item.nombre || `${item.anio || item.año || ''} - ${item.periodo || ''}`.trim() || 'Sin nombre',
          getSubtitle: (item) => `${item.anio || item.año || ''} ${item.periodo || ''}`.trim() || ''
        }
      ]

      // Solo buscar en módulos a los que el usuario tiene acceso
      const accessibleModules = modules.filter(mod => {
        const navItem = navigation.find(item => item.href === mod.route)
        return navItem && (!navItem.roles || navItem.roles.includes(user?.rol))
      })

      // Buscar en paralelo en todos los módulos accesibles
      for (const module of accessibleModules) {
        searchPromises.push(
          api.get(`/${module.name}`, { 
            params: {
              search: cleanTerm, // Enviar término normalizado a minúsculas y limpio
              per_page: 5 
            }
          })
            .then(response => {
              const results = response.data?.success 
                ? (response.data.data?.data || response.data.data || [])
                : []
              
              return {
                module: module.name,
                route: module.route,
                icon: module.icon,
                label: module.label,
                getDisplayName: module.getDisplayName,
                getSubtitle: module.getSubtitle,
                results: results
              }
            })
            .catch((error) => {
              console.error(`Error buscando en ${module.name}:`, error)
              return { 
                module: module.name, 
                route: module.route, 
                icon: module.icon,
                label: module.label,
                getDisplayName: module.getDisplayName,
                getSubtitle: module.getSubtitle,
                results: [] 
              }
            })
        )
      }

      const results = await Promise.all(searchPromises)
      const filteredResults = results.filter(r => r.results && r.results.length > 0)
      
      setSearchResults(filteredResults)
      setShowSearchResults(filteredResults.length > 0)
    } catch (error) {
      console.error('Error en búsqueda global:', error)
      setSearchResults([])
      setShowSearchResults(false)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm && searchTerm.trim().length >= 2) {
        handleSearch(searchTerm)
      } else {
        setSearchResults([])
        setShowSearchResults(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, user?.rol])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark' : ''}`}>
      {/* Overlay para móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar móvil */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 glass-card transform transition-all duration-300 ease-in-out lg:hidden ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header del sidebar móvil */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-glow">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold gradient-text">FICCT Sistema</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Académico</p>
              </div>
            </div>
            <button
              onClick={closeSidebar}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navegación móvil */}
          <nav className="flex-1 overflow-y-auto px-4 py-6">
            <div className="space-y-2">
              {filteredNavigation.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={closeSidebar}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
                      active
                        ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-glow'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                  >
                    <Icon className={`mr-3 h-5 w-5 flex-shrink-0 transition-transform duration-200 ${
                      active ? 'text-white' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                    }`} />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </nav>

          {/* Usuario info móvil */}
          <div className="border-t border-gray-200/50 dark:border-gray-700/50 p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-glow">
                  <span className="text-white font-bold text-lg">
                    {user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {user?.name || 'Usuario'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {user?.rol || 'Usuario'}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Link
                to="/perfil"
                onClick={closeSidebar}
                className="flex-1 flex items-center justify-center px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
              >
                <User className="h-4 w-4 mr-2" />
                Perfil
              </Link>
              <button
                onClick={handleLogout}
                className="flex-1 flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-error-500 to-error-600 text-white rounded-xl text-sm font-medium hover:shadow-glow transition-all duration-200"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Salir
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-col flex-1 min-h-0 glass-card border-r border-gray-200/50 dark:border-gray-700/50">
          {/* Header del sidebar */}
          <div className="flex items-center h-20 flex-shrink-0 px-6 border-b border-gray-200/50 dark:border-gray-700/50 group">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform duration-300">
                <GraduationCap className="h-7 w-7 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-success-500 rounded-full flex items-center justify-center shadow-glow animate-pulse">
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="ml-4">
              <h1 className="text-xl font-bold gradient-text group-hover:scale-105 transition-transform duration-300">FICCT Sistema</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Académico</p>
            </div>
          </div>

          {/* Navegación */}
          <nav className="flex-1 overflow-y-auto px-4 py-6">
            <div className="space-y-2">
              {filteredNavigation.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 group relative overflow-hidden ${
                      active
                        ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-glow'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 hover:shadow-soft'
                    }`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-r from-primary-500/10 to-accent-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                      active ? 'opacity-100' : ''
                    }`}></div>
                    <Icon className={`mr-3 h-5 w-5 flex-shrink-0 transition-all duration-300 ${
                      active ? 'text-white scale-110' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 group-hover:scale-110'
                    }`} />
                    <span className="relative z-10 group-hover:translate-x-1 transition-transform duration-300">{item.name}</span>
                    {active && (
                      <div className="absolute right-2 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    )}
                  </Link>
                )
              })}
            </div>
          </nav>

          {/* Usuario info desktop */}
          <div className="flex-shrink-0 border-t border-gray-200/50 dark:border-gray-700/50 p-6">
            <Link to="/perfil" className="flex items-center group mb-4">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-glow">
                  <span className="text-white font-bold text-lg">
                    {user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 truncate transition-colors duration-200">
                  {user?.name || 'Usuario'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {user?.rol || 'Usuario'}
                </p>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-error-500 to-error-600 text-white rounded-xl text-sm font-medium hover:shadow-glow transition-all duration-200"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="lg:pl-72 flex flex-col min-h-screen">
        {/* Header móvil */}
        <div className="sticky top-0 z-30 lg:hidden glass-card border-b border-gray-200/50 dark:border-gray-700/50 shadow-soft">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold gradient-text">FICCT</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-xl text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Header desktop */}
        <div className="hidden lg:block sticky top-0 z-30 glass-card border-b border-gray-200/50 dark:border-gray-700/50 shadow-soft">
          <div className="flex items-center justify-between h-20 px-8">
            <div className="flex items-center space-x-4">
              <div className="relative group">
                <h2 className="text-2xl font-bold gradient-text group-hover:scale-105 transition-transform duration-300">
                  {navigation.find(item => isActive(item.href))?.name || 'Dashboard'}
                </h2>
                <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-500 to-accent-500 group-hover:w-full transition-all duration-300"></div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative group" ref={searchRef}>
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-hover:text-primary-500 transition-colors duration-200" />
                <input
                  type="text"
                  placeholder="Buscar en todo el sistema..."
                  value={searchTerm}
                  onChange={(e) => {
                    const value = e.target.value
                    setSearchTerm(value)
                    // Mostrar resultados si hay texto y resultados
                    if (value.trim().length >= 2 && searchResults.length > 0) {
                      setShowSearchResults(true)
                    } else if (value.trim().length < 2) {
                      setShowSearchResults(false)
                    }
                  }}
                  onFocus={() => {
                    if (searchTerm.trim().length >= 2 && searchResults.length > 0) {
                      setShowSearchResults(true)
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setShowSearchResults(false)
                      setSearchTerm('')
                    }
                  }}
                  className="pl-10 pr-4 py-2 w-64 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 hover:shadow-soft group-hover:shadow-glow"
                />
                
                {/* Resultados de búsqueda */}
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-glow-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto z-50">
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20">
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {searchResults.reduce((sum, r) => sum + r.results.length, 0)} resultados encontrados
                      </p>
                    </div>
                    {searchResults.map((moduleResult, idx) => {
                      const Icon = moduleResult.icon
                      return (
                        <div key={idx} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 flex items-center space-x-2">
                            <Icon className="h-4 w-4 text-primary-500 dark:text-primary-400" />
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                              {moduleResult.label || moduleResult.module}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-500">
                              ({moduleResult.results.length})
                            </span>
                          </div>
                          <div className="py-2">
                            {moduleResult.results.slice(0, 3).map((item, itemIdx) => {
                              const displayName = moduleResult.getDisplayName 
                                ? moduleResult.getDisplayName(item)
                                : (item.name || item.nombre || item.codigo_docente || item.codigo_materia || item.codigo_aula || 'Sin nombre')
                              const subtitle = moduleResult.getSubtitle 
                                ? moduleResult.getSubtitle(item)
                                : (item.user?.email || item.user?.name || item.materia?.nombre || '')
                              
                              return (
                                <Link
                                  key={itemIdx}
                                  to={`${moduleResult.route}${item.id ? `?highlight=${item.id}&search=${encodeURIComponent(searchTerm)}` : `?search=${encodeURIComponent(searchTerm)}`}`}
                                  onClick={() => {
                                    setShowSearchResults(false)
                                    setSearchTerm('')
                                  }}
                                  className="block px-4 py-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors border-l-2 border-transparent hover:border-primary-500"
                                >
                                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {displayName}
                                  </p>
                                  {subtitle && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                      {subtitle}
                                    </p>
                                  )}
                                </Link>
                              )
                            })}
                            {moduleResult.results.length > 3 && (
                              <Link
                                to={`${moduleResult.route}?search=${encodeURIComponent(searchTerm)}`}
                                onClick={() => {
                                  setShowSearchResults(false)
                                  setSearchTerm('')
                                }}
                                className="block px-4 py-2 text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 font-medium border-l-2 border-transparent hover:border-primary-500"
                              >
                                Ver todos los resultados ({moduleResult.results.length}) →
                              </Link>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    {searchResults.length === 0 && (
                      <div className="px-4 py-8 text-center">
                        <Search className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">No se encontraron resultados</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <NotificationsDropdown />
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-xl text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group"
              >
                <div className="group-hover:scale-110 transition-transform duration-200">
                  {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </div>
              </button>
              <Link
                to="/perfil"
                className="p-2 rounded-xl text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group"
              >
                <Settings className="h-5 w-5 group-hover:scale-110 group-hover:rotate-90 transition-all duration-200" />
              </Link>
            </div>
          </div>
        </div>

        {/* Contenido de la página */}
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
