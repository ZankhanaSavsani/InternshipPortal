import React from 'react';

export const Table = ({ children, className = '', ...props }) => (
  <div className="w-full overflow-auto">
    <table className={`w-full text-sm border-collapse ${className}`} {...props}>
      {children}
    </table>
  </div>
);

export const TableHeader = ({ children, className = '', ...props }) => (
  <thead className={`bg-gray-100 ${className}`} {...props}>
    {children}
  </thead>
);

export const TableBody = ({ children, className = '', ...props }) => (
  <tbody className={`bg-white ${className}`} {...props}>
    {children}
  </tbody>
);

export const TableHead = ({ children, className = '', ...props }) => (
  <th 
    className={`px-4 py-3 text-left font-medium text-gray-700 ${className}`} 
    {...props}
  >
    {children}
  </th>
);

export const TableRow = ({ children, className = '', ...props }) => (
  <tr 
    className={`border-b border-gray-200 hover:bg-gray-50 ${className}`} 
    {...props}
  >
    {children}
  </tr>
);

export const TableCell = ({ children, className = '', ...props }) => (
  <td 
    className={`px-4 py-3 text-gray-700 ${className}`} 
    {...props}
  >
    {children}
  </td>
);