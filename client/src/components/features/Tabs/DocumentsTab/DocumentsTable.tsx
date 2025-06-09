import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import Button from '../../ui/Button.js';
import Badge from '../../ui/Badge.js';
import { DocumentsTableProps } from './types';
import { formatDate, formatFileSize, getStatusIcon } from './utils';

const DocumentsTable: React.FC<DocumentsTableProps> = ({
  documents,
  isLoading,
  onDelete,
  onEdit,
  onView
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Filename
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Topic
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Last Modified
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Size
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {documents.map((doc) => (
            <tr key={doc.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onView(doc.id)}
                    className="text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
                  >
                    {doc.filename}
                  </button>
                  {getStatusIcon(doc.ingestionStatus)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <Badge variant="default">{doc.topic}</Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(doc.lastModified)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatFileSize(doc.size)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onEdit(doc)}
                    icon={<Edit2 className="h-4 w-4" />}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => onDelete(doc.id)}
                    icon={<Trash2 className="h-4 w-4" />}
                  >
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DocumentsTable; 