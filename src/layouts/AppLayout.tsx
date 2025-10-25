import React from 'react';
import { Outlet } from 'react-router-dom';
import NavigationBar from '../components/NavigationBar';

/**
 * AppLayout
 * - Renders the mobile BottomNav once for all pages (no per-page duplication)
 * - Provides an Outlet for page content
 */
const AppLayout: React.FC = () => {
  return (
    <div className="w-full">
      {/* Global mobile nav (sticky at top on small screens) */}
      <NavigationBar />
      {/* Route content */}
      <Outlet />
    </div>
  );
};

export default AppLayout;
