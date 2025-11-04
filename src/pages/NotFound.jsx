import React from 'react'
import { Link } from 'react-router-dom'

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-300">404</h1>
          <h2 className="text-2xl font-bold text-gray-900 mt-4">Página no encontrada</h2>
          <p className="text-gray-600 mt-2">
            Lo sentimos, la página que buscas no existe.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link
            to="/dashboard"
            className="block w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Ir al Dashboard
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="block w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
          >
            Volver Atrás
          </button>
        </div>
      </div>
    </div>
  )
}

export default NotFound
