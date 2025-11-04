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
  ...props
}) => {
  const tableClasses = clsx(
    'min-w-full divide-y divide-gray-200',
    bordered && 'border border-gray-200',
    className
  )
  
  const headerClasses = clsx(
    'bg-gray-50',
    headerClassName
  )
  
  const bodyClasses = clsx(
    'bg-white divide-y divide-gray-200',
    bodyClassName
  )
  
  const getRowClasses = (index) => clsx(
    striped && index % 2 === 1 && 'bg-gray-50',
    hover && 'hover:bg-gray-50',
    rowClassName
  )
  
  const getCellClasses = () => clsx(
    compact ? 'px-3 py-2' : 'px-6 py-4',
    'text-sm text-gray-900',
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    )
  }
  
  return (
    <div className="overflow-x-auto">
      <table className={tableClasses} {...props}>
        <thead className={headerClasses}>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={clsx(
                  compact ? 'px-3 py-2' : 'px-6 py-3',
                  'text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                  column.sortable && 'cursor-pointer hover:bg-gray-100',
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
