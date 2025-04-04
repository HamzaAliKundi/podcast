import React, { useState } from 'react';
import { FileText, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export function ProcessingHistory() {
  const { sources, selectSource, selectedSource, getProcessingStatus } = useStore();
  const [page, setPage] = useState(0);
  const itemsPerPage = 5;

  const paginatedSources = sources.slice(page * itemsPerPage, (page + 1) * itemsPerPage);
  const totalPages = Math.ceil(sources.length / itemsPerPage);

  const getStatusIcon = (sourceId: string) => {
    const processingStatus = getProcessingStatus(sourceId);
    const source = sources.find(s => s.id === sourceId);

    if (processingStatus === 'processing') {
      return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
    }
    if (processingStatus === 'queued') {
      return <Clock className="h-5 w-5 text-yellow-500" />;
    }

    switch (source?.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-error" />;
      default:
        return <Clock className="h-5 w-5 text-slate-400" />;
    }
  };

  const getStatusClass = (sourceId: string) => {
    const processingStatus = getProcessingStatus(sourceId);
    const source = sources.find(s => s.id === sourceId);

    if (processingStatus === 'processing') {
      return 'bg-primary/10 text-primary';
    }
    if (processingStatus === 'queued') {
      return 'bg-yellow-100 text-yellow-800';
    }

    switch (source?.status) {
      case 'completed':
        return 'bg-success/10 text-success';
      case 'error':
        return 'bg-error/10 text-error';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  const formatDate = (dateString: string | Date) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const handleSelectSource = async (id: string) => {
    try {
      selectSource(id);
      toast.success('Content selected for processing');
    } catch (error) {
      toast.error('Failed to select source');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="border-b border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Processing History</h2>
        </div>
      </div>

      {sources.length === 0 ? (
        <div className="p-8 text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="h-6 w-6 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">No Content Yet</h3>
          <p className="text-slate-500 mb-4">
            Start by adding content sources to see your processing history here.
          </p>
        </div>
      ) : (
        <>
          <div className="divide-y divide-slate-200">
            {paginatedSources.map((source) => (
              <motion.div
                key={source.id}
                initial={false}
                animate={{ opacity: 1 }}
                className={`transition-colors ${
                  selectedSource?.id === source.id ? 'bg-primary/5 border-l-4 border-primary' : ''
                }`}
              >
                <div className="p-4 hover:bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="flex-1">
                        <h3 className="font-medium text-slate-900">
                          {source.metadata?.title || 'Untitled Content'}
                        </h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(source.id)}`}>
                            {getStatusIcon(source.id)}
                            <span className="ml-1.5">{getProcessingStatus(source.id) || source.status}</span>
                          </span>
                          <span className="text-sm text-slate-500">
                            {formatDate(source.createdAt)}
                          </span>
                        </div>
                        {source.metadata?.description && (
                          <p className="mt-1 text-sm text-slate-500 line-clamp-2">
                            {source.metadata.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleSelectSource(source.id)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        selectedSource?.id === source.id
                          ? 'bg-primary text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Select
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-3 py-1 text-sm text-slate-600 hover:bg-slate-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-600">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page === totalPages - 1}
                  className="px-3 py-1 text-sm text-slate-600 hover:bg-slate-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {selectedSource && (
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Selected for Processing:</span>
            <span className="text-sm text-primary">{selectedSource.metadata?.title}</span>
          </div>
        </div>
      )}
    </div>
  );
}