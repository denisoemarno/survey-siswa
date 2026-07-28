import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import AdminLayout from './pages/admin/AdminLayout';
import UsersPage from './pages/admin/UsersPage';
import SurveysPage from './pages/admin/SurveysPage';
import SurveyDetailPage from './pages/admin/SurveyDetailPage';
import SurveyReportPage from './pages/admin/SurveyReportPage';
import SiswaLayout from './pages/siswa/SiswaLayout';
import SurveyListPage from './pages/siswa/SurveyListPage';
import SurveyFillPage from './pages/siswa/SurveyFillPage';
import GuruLayout from './pages/guru/GuruLayout';
import EvaluationsListPage from './pages/guru/EvaluationsListPage';
import EvaluationReportPage from './pages/guru/EvaluationReportPage';

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <p>Memuat...</p>;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={`/${user.role}`} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<HomeRedirect />} />

      <Route element={<ProtectedRoute roles={['admin']} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="users" replace />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="surveys" element={<SurveysPage />} />
          <Route path="surveys/:id" element={<SurveyDetailPage />} />
          <Route path="surveys/:id/report" element={<SurveyReportPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['siswa']} />}>
        <Route path="/siswa" element={<SiswaLayout />}>
          <Route index element={<SurveyListPage />} />
          <Route path="surveys/:id" element={<SurveyFillPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['guru']} />}>
        <Route path="/guru" element={<GuruLayout />}>
          <Route index element={<EvaluationsListPage />} />
          <Route path="evaluations/:id" element={<EvaluationReportPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
