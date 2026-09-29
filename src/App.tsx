import { Route, Routes } from 'react-router-dom';
import { AppPage } from './pages/AppPage';
import { ComponentGallery } from './pages/ComponentGallery';
import { EnterpriseDashboard } from './pages/EnterpriseDashboard';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<EnterpriseDashboard />} />
      <Route path="/gallery" element={<ComponentGallery />} />
      <Route path="/:appId/*" element={<AppPage />} />
    </Routes>
  );
}
