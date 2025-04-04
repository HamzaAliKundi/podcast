import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { useStore } from './store/useStore';
import { Dashboard } from './components/Dashboard';
import { HomePage } from './components/HomePage';
import { ProfilePage } from './components/ProfilePage';
import { LazyMotion, domAnimation } from 'framer-motion';

function App() {
  const { user } = useStore();
  const [showProfile, setShowProfile] = useState(false);

  return (
    <LazyMotion features={domAnimation}>
      <div className="min-h-screen bg-slate-50">
        <Toaster position="top-right" />
        {user ? (
          showProfile ? (
            <ProfilePage onClose={() => setShowProfile(false)} />
          ) : (
            <Dashboard onProfileClick={() => setShowProfile(true)} />
          )
        ) : (
          <HomePage />
        )}
      </div>
    </LazyMotion>
  );
}

export default App;