import React, { useState, useEffect } from 'react';
import { Plus, Wand2, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { ContentWizard } from './ContentWizard';
import { ProcessingHistory } from './ProcessingHistory';
import { ContentProcessor } from './ContentProcessor';
import { ContentResults } from './ContentResults';
import { ContentPreview } from './ContentPreview';
import { SubscriptionStatus } from './SubscriptionStatus';
import { motion, AnimatePresence } from 'framer-motion';

export function Dashboard({ onProfileClick }: { onProfileClick: () => void }) {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const { selectedSource, selectSource, loadSubscription } = useStore();
  const [isFullPreview, setIsFullPreview] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  useEffect(() => {
    loadSubscription();
  }, []);

  const handleBack = () => {
    if (isFullPreview) {
      setIsFullPreview(false);
    } else {
      selectSource('');
    }
  };

  // Determine what to show based on source status
  const shouldShowPreview = selectedSource && selectedSource.status !== 'pending' && selectedSource.status !== 'processing';
  const shouldShowProcessor = selectedSource && (selectedSource.status === 'pending' || selectedSource.status === 'processing');

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {selectedSource && (
                <button
                  onClick={handleBack}
                  className="flex items-center text-slate-600 hover:text-slate-900"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Back to Overview
                </button>
              )}
              {!selectedSource && (
                <h1 className="text-2xl font-bold text-slate-900">Content Dashboard</h1>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {showSidebar && (
                <button
                  onClick={() => setShowSidebar(false)}
                  className="p-2 text-slate-400 hover:text-slate-500 rounded-full hover:bg-slate-100"
                  title="Hide Sidebar"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}
              {!showSidebar && (
                <button
                  onClick={() => setShowSidebar(true)}
                  className="p-2 text-slate-400 hover:text-slate-500 rounded-full hover:bg-slate-100"
                  title="Show Sidebar"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}
              <button
                onClick={onProfileClick}
                className="btn-secondary"
              >
                Profile
              </button>
              <button
                onClick={() => setIsWizardOpen(true)}
                className="btn-primary"
              >
                <Wand2 className="h-5 w-5 mr-2" />
                New Transformation
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {selectedSource ? (
            <motion.div
              key="content-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {/* Content Preview - Only show if not pending or processing */}
              {shouldShowPreview && (
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <ContentPreview />
                </div>
              )}

              {/* Content Processing Area */}
              <div className={`grid gap-8 ${showSidebar ? 'grid-cols-12' : 'grid-cols-1'}`}>
                {showSidebar && (
                  <div className="col-span-12 lg:col-span-4 space-y-8">
                    <SubscriptionStatus />
                    <ProcessingHistory onFullPreview={() => setIsFullPreview(true)} />
                  </div>
                )}
                
                <div className={showSidebar ? 'col-span-12 lg:col-span-8' : 'col-span-1'}>
                  {shouldShowProcessor && <ContentProcessor />}
                  {selectedSource.status === 'completed' && (
                    <ContentResults isFullscreen={isFullPreview} onClose={() => setIsFullPreview(false)} />
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {/* Subscription Status */}
              <div className="md:col-span-3">
                <SubscriptionStatus />
              </div>

              {/* Quick Start Guide */}
              <div className="md:col-span-3 bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-xl font-semibold text-slate-900 mb-6">
                  Transform Your Content in 3 Easy Steps
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    {
                      step: 1,
                      title: "Select Your Source",
                      description: "Choose from YouTube videos, blog posts, or RSS feeds"
                    },
                    {
                      step: 2,
                      title: "Configure Options",
                      description: "Customize how your content will be transformed"
                    },
                    {
                      step: 3,
                      title: "Generate Content",
                      description: "Get AI-powered content across multiple formats"
                    }
                  ].map((item) => (
                    <div key={item.step} className="relative">
                      <div className="absolute -top-4 -left-4 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                        {item.step}
                      </div>
                      <div className="bg-slate-50 rounded-lg p-6 h-full">
                        <h3 className="text-lg font-medium text-slate-900 mb-2">
                          {item.title}
                        </h3>
                        <p className="text-slate-600">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                <ProcessingHistory />
              </div>

              {/* Stats & Quick Actions */}
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-medium text-slate-900 mb-4">Quick Stats</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-lg p-4">
                      <div className="text-2xl font-semibold text-slate-900">
                        {selectedSource ? '1' : '0'}
                      </div>
                      <div className="text-sm text-slate-500">Active Process</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <div className="text-2xl font-semibold text-slate-900">
                        {selectedSource?.status === 'completed' ? '1' : '0'}
                      </div>
                      <div className="text-sm text-slate-500">Completed</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-medium text-slate-900 mb-4">Quick Actions</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setIsWizardOpen(true)}
                      className="w-full btn-primary py-2"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Content
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Content Wizard */}
      <ContentWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
      />
    </div>
  );
}