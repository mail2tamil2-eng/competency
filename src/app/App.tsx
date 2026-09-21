import { RouterProvider } from 'react-router';
import { router } from './routes';
import { CourseProvider } from './context/CourseContext';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from './components/ui/sonner';

export default function App() {
  return (
    <AuthProvider>
      <CourseProvider>
        <RouterProvider router={router} />
        <Toaster position="top-right" richColors />
      </CourseProvider>
    </AuthProvider>
  );
}