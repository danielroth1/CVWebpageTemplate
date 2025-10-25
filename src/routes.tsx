import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import About from './pages/About';
import Resume from './pages/Resume';
import Contact from './pages/Contact';
import AppLayout from './layouts/AppLayout';
import HomeLayout from './layouts/HomeLayout';

const AppRoutes: React.FC = () => (
    <Routes>
        {/* Home has a special layout to render HeroHeader above BottomNav */}
        <Route path="/" element={<HomeLayout />}> 
            <Route index element={<Home />} />
        </Route>
        {/* Root layout renders BottomNav once for all pages */}
        <Route element={<AppLayout />}> 
            
            {/* Other pages use the root layout directly */}
            <Route path="/about" element={<About />} />
            <Route path="/resume" element={<Resume />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/contact" element={<Contact />} />
        </Route>
    </Routes>
);

export default AppRoutes;