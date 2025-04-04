import React, { useState } from 'react';
import { FileText, Share2, Music, Check, AlertCircle } from 'lucide-react';
import { TransformationOptions } from '../types';
import { useStore } from '../store/useStore';
import toast from 'react-hot-toast';

export function TransformationPanel() {
  const { selectedSource } = useStore();
  const [options, setOptions] = useState<TransformationOptions>({
    writingStyle: 'professional',
    seoOptimized: true,
    platformFormat: 'twitter',
    audioVoice: 'default',
  });

  const handleStartTransformation = () => {
    if (!selectedSource) {
      toast.error('Please select a content source first');
      return;
    }
    
    // Handle transformation logic here
    toast.success('Starting content transformation...');
  };

  if (!selectedSource) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No Content Selected</h3>
          <p className="text-slate-500">
            Select content from your processing history to begin transformation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-5 border-b border-slate-200">
        <h3 className="text-lg font-medium text-slate-900">Transform Content</h3>
        <p className="mt-1 text-sm text-slate-500">
          Transforming: {selectedSource.metadata?.title}
        </p>
      </div>
      
      <div className="p-4 space-y-6">
        <div>
          <h4 className="text-sm font-medium text-slate-900 mb-3">Blog Post Options</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Writing Style</label>
              <select
                value={options.writingStyle}
                onChange={(e) => setOptions({ ...options, writingStyle: e.target.value as any })}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              >
                <option value="analytical">Analytical</option>
                <option value="conversational">Conversational</option>
                <option value="professional">Professional</option>
              </select>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={options.seoOptimized}
                onChange={(e) => setOptions({ ...options, seoOptimized: e.target.checked })}
                className="h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded"
              />
              <label className="ml-2 block text-sm text-slate-900">
                SEO Optimization
              </label>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-slate-900 mb-3">Social Media Options</h4>
          <div>
            <label className="block text-sm font-medium text-slate-700">Platform</label>
            <select
              value={options.platformFormat}
              onChange={(e) => setOptions({ ...options, platformFormat: e.target.value as any })}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            >
              <option value="twitter">Twitter</option>
              <option value="linkedin">LinkedIn</option>
              <option value="facebook">Facebook</option>
            </select>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-slate-900 mb-3">Audio Options</h4>
          <div>
            <label className="block text-sm font-medium text-slate-700">Voice Selection</label>
            <select
              value={options.audioVoice}
              onChange={(e) => setOptions({ ...options, audioVoice: e.target.value })}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            >
              <option value="default">Default Voice</option>
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
            </select>
          </div>
        </div>

        <div className="pt-4">
          <button
            onClick={handleStartTransformation}
            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <Check className="h-4 w-4 mr-2" />
            Start Transformation
          </button>
        </div>
      </div>
    </div>
  );
}