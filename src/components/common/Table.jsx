// Componente Table reutilizable

import React from 'react'
import { clsx } from 'clsx'
import { ChevronUp, ChevronDown } from 'lucide-react'

const Table = ({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'No hay datos disponibles',
  onSort,
  sortBy,
  sortDirection = 'asc',
  className,
  headerClassName,
  bodyClassName,
  rowClassName,
  cellClassName,
  striped = false,
  hover = true,
  bordered = false,
  compact = false,
  currentPage,
  totalPages,
  onPageChange,
  perPage,
  onPerPageChange,
  ...restProps
}) => {
  const tableClasses = clsx(
    'min-w-full divide-y divide-gray-200 dark:divide-gray-700',
    bordered && 'border border-gray-200 dark:border-gray-700',
    className
  )
  
  const headerClasses = clsx(
    'bg-gray-50 dark:bg-gray-800',
    headerClassName
  )
  
  const bodyClasses = clsx(
    'bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700',
    bodyClassName
  )
  
  const getRowClasses = (index) => clsx(
    striped && index % 2 === 1 && 'bg-gray-50 dark:bg-gray-800/50',
    hover && 'hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150',
    rowClassName
  )
  
  const getCellClasses = () => clsx(
    compact ? 'px-3 py-2' : 'px-6 py-4',
    'text-sm text-gray-900 dark:text-gray-100',
    cellClassName
  )
  
  const handleSort = (column) => {
    if (!onSort || !column.sortable) return
    
    const newDirection = sortBy === column.key && sortDirection === 'asc' ? 'desc' : 'asc'
    onSort(column.key, newDirection)
  }
  
  const getSortIcon = (column) => {
    if (!column.sortable) return null
    
    if (sortBy === column.key) {
      return sortDirection === 'asc' ? (
        <ChevronUp className="h-4 w-4" />
      ) : (
        <ChevronDown className="h-4 w-4" />
      )
    }
    
    return <ChevronUp className="h-4 w-4 opacity-30" />
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary-200 dark:border-primary-800 rounded-full animate-spin"></div>
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-primary-600 dark:border-t-primary-400 rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }
  
  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <p className="text-gray-500 dark:text-gray-400 font-medium">{emptyMessage}</p>
      </div>
    )
  }
  
  // Filtrar props que no deben ir al elemento table
  const tableProps = Object.keys(restProps).reduce((acc, key) => {
    // Solo pasar props válidos para elementos HTML
    if (!['currentPage', 'totalPages', 'onPageChange', 'perPage', 'onPerPageChange'].includes(key)) {
      acc[key] = restProps[key]
    }
    return acc
  }, {})

  return (
    <div className="overflow-x-auto">
      <table className={tableClasses} {...tableProps}>
        <thead className={headerClasses}>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={clsx(
                  compact ? 'px-3 py-2' : 'px-6 py-3',
                  'text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider',
                  column.sortable && 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150',
                  column.className
                )}
                onClick={() => handleSort(column)}
              >
                <div className="flex items-center space-x-1">
                  <span>{column.label || column.title}</span>
                  {column.sortable && getSortIcon(column)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={bodyClasses}>
          {data.map((row, index) => (
            <tr key={row.id || index} className={getRowClasses(index)}>
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={clsx(
                    getCellClasses(),
                    column.cellClassName
                  )}
                >
                  {column.render ? column.render(row, index) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Table
