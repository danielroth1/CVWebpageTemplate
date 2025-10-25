import React from 'react';
import { Outlet } from 'react-router-dom';
import HeroHeader from '../components/HeroHeader';
import NavigationBar from '../components/NavigationBar';

/**
 * HomeLayout
 * - Specific layout for the Home route
 * - Places HeroHeader first, then BottomNav, then Home page content via Outlet
 */
const HomeLayout: React.FC = () => {
  return (
    <div className="w-full">
      <HeroHeader />
      <NavigationBar />
      <Outlet />
    </div>
  );
};

export default HomeLayout;
