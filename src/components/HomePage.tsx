import React, { useState } from 'react';
import { m as motion } from 'framer-motion';
import { Wand2, Sparkles, Zap, ArrowRight, Youtube, FileText, Rss, MessageSquare } from 'lucide-react';
import { AuthPage } from './AuthPage';

export function HomePage() {
  const [showAuth, setShowAuth] = useState(false);

  const features = [
    {
      icon: <Youtube className="h-8 w-8 text-red-500" />,
      title: "YouTube Content",
      description: "Transform YouTube videos into engaging blog posts, social content, and more"
    },
    {
      icon: <FileText className="h-8 w-8 text-emerald-500" />,
      title: "Blog Posts",
      description: "Repurpose your blog content across multiple platforms automatically"
    },
    {
      icon: <Rss className="h-8 w-8 text-orange-500" />,
      title: "RSS Feeds",
      description: "Auto-import and transform content from your favorite RSS feeds"
    },
    {
      icon: <MessageSquare className="h-8 w-8 text-blue-500" />,
      title: "AI Assistant",
      description: "Get intelligent suggestions and optimizations for your content"
    }
  ];

  return (
    <div className="relative">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 25px 25px, rgba(79, 70, 229, 0.15) 2%, transparent 0%)',
          backgroundSize: '50px 50px'
        }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-5xl font-bold text-slate-900 mb-6"
            >
              Transform Your Content
              <span className="text-primary block mt-2">
                Across All Platforms
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-xl text-slate-600 mb-8"
            >
              Automatically repurpose your content into multiple formats with AI-powered transformation.
              Save time and reach more audiences.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <button
                onClick={() => setShowAuth(true)}
                className="btn-primary text-lg px-8 py-4 shadow-lg hover:shadow-xl"
              >
                <Wand2 className="h-6 w-6 mr-3" />
                Start Transforming Now
              </button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Everything You Need for Content Transformation
          </h2>
          <p className="text-lg text-slate-600">
            Powerful features to help you repurpose content efficiently
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-slate-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-gradient-to-br from-slate-900 to-primary py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              Why Choose Our Platform?
            </h2>
            <p className="text-lg text-slate-300">
              Save time and resources while maximizing your content's reach
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white/10 backdrop-blur-lg p-6 rounded-xl"
            >
              <div className="bg-primary/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                10x Faster Content Creation
              </h3>
              <p className="text-slate-300">
                Automatically transform your content into multiple formats in minutes, not hours.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white/10 backdrop-blur-lg p-6 rounded-xl"
            >
              <div className="bg-primary/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                AI-Powered Optimization
              </h3>
              <p className="text-slate-300">
                Get intelligent suggestions to improve your content's performance across platforms.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white/10 backdrop-blur-lg p-6 rounded-xl"
            >
              <div className="bg-primary/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <ArrowRight className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Seamless Integration
              </h3>
              <p className="text-slate-300">
                Works with your existing content workflow and favorite platforms.
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuth && (
        <AuthPage onClose={() => setShowAuth(false)} />
      )}
    </div>
  );
}