import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaHome, FaProjectDiagram, FaEnvelopeOpenText } from 'react-icons/fa';

const NavigationBar: React.FC = () => {
  const baseItemClasses =
    'flex flex-col items-center justify-center py-3 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-solid)]/70 transition-colors';

  return (
    <nav className="sticky md:fixed top-0 inset-x-0 md:hidden app-surface border-t app-border z-50">
      <ul className="flex">
        <li className="flex-1">
          <NavLink
            to="/"
            className={({ isActive }) => `${baseItemClasses} ${isActive ? 'bg-primary-200 dark:bg-primary-700 font-semibold' : ''}`}
          >
            <span className="inline-flex items-center gap-2">
              <FaHome className="w-4 h-4" />
              Home
            </span>
          </NavLink>
        </li>
        <li className="flex-1 border-l app-border">
          <NavLink
            to="/projects"
            className={({ isActive }) => `${baseItemClasses} ${isActive ? 'bg-primary-200 dark:bg-primary-700 font-semibold' : ''}`}
          >
            <span className="inline-flex items-center gap-2">
              <FaProjectDiagram />
              Projects
            </span>
          </NavLink>
        </li>
        <li className="flex-1 border-l app-border">
          <NavLink
            to="/contact"
            className={({ isActive }) => `${baseItemClasses} ${isActive ? 'bg-primary-200 dark:bg-primary-700 font-semibold' : ''}`}
          >
            <span className="inline-flex items-center gap-2">
              <FaEnvelopeOpenText />
              Contact
            </span>
          </NavLink>
        </li>
      </ul>
    </nav>
  );
};

export default NavigationBar;
