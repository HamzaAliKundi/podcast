import React from 'react';
import { Youtube, Rss, Apple as Api, Trash2 } from 'lucide-react';
import { ContentSource } from '../types';
import { useStore } from '../store/useStore';

interface SourceListProps {
  sources: ContentSource[];
}

export function SourceList({ sources }: SourceListProps) {
  const { removeSource } = useStore();

  const getIcon = (type: ContentSource['type']) => {
    switch (type) {
      case 'youtube':
        return <Youtube className="h-5 w-5 text-red-500" />;
      case 'rss':
        return <Rss className="h-5 w-5 text-orange-500" />;
      case 'api':
        return <Api className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStatusColor = (status: ContentSource['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-5 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Content Sources</h3>
      </div>
      <ul className="divide-y divide-gray-200">
        {sources.map((source) => (
          <li key={source.id} className="px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {getIcon(source.type)}
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{source.url}</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(source.status)}`}>
                    {source.status}
                  </span>
                </div>
              </div>
              <button
                onClick={() => removeSource(source.id)}
                className="text-gray-400 hover:text-gray-500"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}