import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import AppRoutes from './routes';
import './styles/globals.css';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col app-bg">
        <Header />
        <div className="flex flex-1">
          <aside className="hidden md:block w-64 app-surface border-r app-border">
            <Sidebar />
          </aside>
          <main className="flex-1 p-4 md:p-6">
            <AppRoutes />
          </main>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;