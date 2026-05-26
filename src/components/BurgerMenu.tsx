import React from 'react';
import { useLocation } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';
import Sidebar from './Sidebar';

const BurgerMenu: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const location = useLocation();

  // Close drawer whenever the route changes
  React.useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  return (
    <>
      {/* Burger button – mobile only (md:hidden mirrors old NavigationBar visibility) */}
      <div className="md:hidden sticky top-0 z-50 app-surface border-b app-border flex items-center px-4 py-3">
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open navigation"
          className="text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors"
        >
          <FaBars className="w-6 h-6" />
        </button>
      </div>

      {/* Slide-in drawer with backdrop – mobile only */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/40"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="absolute top-0 left-0 h-full w-64 app-surface border-r app-border overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close navigation"
              className="absolute right-3 top-3 text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors"
            >
              <FaTimes className="w-5 h-5" />
            </button>
            <div className="mt-10">
              <Sidebar />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BurgerMenu;
