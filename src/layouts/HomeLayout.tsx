import React from 'react';
import { Outlet } from 'react-router-dom';
import HeroHeader from '../components/HeroHeader';
import BurgerMenu from '../components/BurgerMenu';

/**
 * HomeLayout
 * - Specific layout for the Home route
 * - Places HeroHeader first, then BottomNav, then Home page content via Outlet
 */
const HomeLayout: React.FC = () => {
  return (
    <div className="w-full">
      <HeroHeader />
      <BurgerMenu />
      <Outlet />
    </div>
  );
};

export default HomeLayout;
