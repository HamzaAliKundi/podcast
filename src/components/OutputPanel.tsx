import React from 'react';
import { FileText, Share2, Music, Download, Copy } from 'lucide-react';
import { useStore } from '../store/useStore';
import toast from 'react-hot-toast';

export function OutputPanel() {
  const { outputs } = useStore();

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard!');
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'blog':
        return <FileText className="h-5 w-5 text-purple-500" />;
      case 'social':
        return <Share2 className="h-5 w-5 text-blue-500" />;
      case 'audio':
        return <Music className="h-5 w-5 text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-5 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Generated Content</h3>
      </div>
      
      <div className="divide-y divide-gray-200">
        {outputs.map((output) => (
          <div key={output.id} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                {getIcon(output.type)}
                <span className="ml-2 text-sm font-medium text-gray-900">
                  {output.type.charAt(0).toUpperCase() + output.type.slice(1)} - {output.format}
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleCopy(output.content)}
                  className="p-1 text-gray-400 hover:text-gray-500"
                >
                  <Copy className="h-5 w-5" />
                </button>
                {output.type === 'audio' && (
                  <button className="p-1 text-gray-400 hover:text-gray-500">
                    <Download className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              {output.type === 'audio' ? (
                <div className="bg-gray-50 p-2 rounded">
                  Audio file ready for download
                </div>
              ) : (
                <div className="bg-gray-50 p-2 rounded max-h-32 overflow-y-auto">
                  {output.content}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {outputs.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No content generated yet. Transform your content to see results here.
          </div>
        )}
      </div>
    </div>
  );
}