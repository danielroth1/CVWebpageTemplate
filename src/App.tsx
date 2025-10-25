import React from 'react';
import { HashRouter } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import NavigationBar from './components/NavigationBar';
import Footer from './components/Footer';
import AppRoutes from './routes';
import './styles/globals.css';

const App: React.FC = () => {
  return (
    // If you dont like the hashes in the addresses, you can use <BrowserRouter> instead.
    // Then make sure your server redirects all unknown routes to index.html, e.g. <address>/projects, <address>/contact, etc.
    <HashRouter>
      <div className="min-h-screen flex flex-col app-bg md:pb-0">
        {/* Not really needed because navigation is already possible via side bar */}
        {/* <Header /> */} 
        <div className="flex flex-1">
          <aside className="hidden md:block w-64 app-surface border-r app-border sticky top-0 h-screen overflow-y-auto">
            <Sidebar />
          </aside>
          <main className="flex-1">
            <AppRoutes />
          </main>
        </div>
        {/* Mobile bottom navigation */}
        
        <Footer />
      </div>
    </HashRouter>
  );
};

export default App;