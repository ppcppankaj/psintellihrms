import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import Login from './pages/Login';
import SuperAdminDashboard from './pages/superadmin/Dashboard';
import Organizations from './pages/superadmin/Organizations';
import GlobalUsers from './pages/superadmin/GlobalUsers';
import SystemSettings from './pages/superadmin/SystemSettings';
import Plans from './pages/superadmin/Plans';
import Invoices from './pages/superadmin/Invoices';
import AIModels from './pages/superadmin/AIModels';
import AdminDashboard from './pages/admin/Dashboard';
import EmployeeDashboard from './pages/employee/Dashboard';
import Profile from './pages/employee/Profile';
import MyAttendance from './pages/employee/MyAttendance';
import MyLeaves from './pages/employee/MyLeaves';
import MyPayslips from './pages/employee/MyPayslips';
import EmployeeManagement from './pages/admin/Employees';
import ProtectedRoute from './auth/ProtectedRoute';
import SuperAdminLayout from './layouts/SuperAdminLayout';
import AdminLayout from './layouts/AdminLayout';
import EmployeeLayout from './layouts/EmployeeLayout';
import Departments from './pages/admin/Departments';
import Designations from './pages/admin/Designations';
import Locations from './pages/admin/Locations';
import Attendance from './pages/admin/Attendance';
import Shifts from './pages/admin/Shifts';
import GeoFences from './pages/admin/GeoFences';
import LeaveRequests from './pages/admin/LeaveRequests';
import LeaveTypes from './pages/admin/LeaveTypes';
import Holidays from './pages/admin/Holidays';
import PayrollRuns from './pages/admin/PayrollRuns';
import Payslips from './pages/admin/Payslips';
import ExpenseClaims from './pages/admin/ExpenseClaims';
import AssetInventory from './pages/admin/AssetInventory';
import PerformanceCycles from './pages/admin/PerformanceCycles';
import PerformanceReviews from './pages/admin/PerformanceReviews';
import JobPostings from './pages/admin/JobPostings';
import Candidates from './pages/admin/Candidates';
import Chat from './pages/admin/Chat';
import Notifications from './pages/admin/Notifications';
import NotificationTemplates from './pages/admin/NotificationTemplates';
import OnboardingManagement from './pages/admin/Onboarding';
import Branches from './pages/admin/Branches';
import Roles from './pages/admin/Roles';
import Approvals from './pages/admin/Approvals';
import Compliance from './pages/admin/Compliance';
import Reports from './pages/admin/Reports';
import Integrations from './pages/admin/Integrations';
import { PagePlaceholder } from './components/PagePlaceholder';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/superadmin" element={
            <ProtectedRoute allowedRoles={['SUPERADMIN']}>
              <SuperAdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<SuperAdminDashboard />} />
            <Route path="organizations" element={<Organizations />} />
            <Route path="users" element={<GlobalUsers />} />
            <Route path="system-settings" element={<SystemSettings />} />
            <Route path="plans" element={<Plans />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="ai-models" element={<AIModels />} />
          </Route>

          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="employees" element={<EmployeeManagement />} />
            <Route path="departments" element={<Departments />} />
            <Route path="designations" element={<Designations />} />
            <Route path="locations" element={<Locations />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="shifts" element={<Shifts />} />
            <Route path="geo-fences" element={<GeoFences />} />
            <Route path="leaves" element={<LeaveRequests />} />
            <Route path="leave-types" element={<LeaveTypes />} />
            <Route path="holidays" element={<Holidays />} />
            <Route path="payroll" element={<PayrollRuns />} />
            <Route path="payslips" element={<Payslips />} />
            <Route path="expenses" element={<ExpenseClaims />} />
            <Route path="assets" element={<AssetInventory />} />
            <Route path="performance-cycles" element={<PerformanceCycles />} />
            <Route path="performance-reviews" element={<PerformanceReviews />} />

            {/* Recruitment */}
            <Route path="recruitment/jobs" element={<JobPostings />} />
            <Route path="recruitment/candidates" element={<Candidates />} />

            {/* Communication & Systems */}
            <Route path="chat" element={<Chat />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="notification-templates" element={<NotificationTemplates />} />
            <Route path="onboarding" element={<OnboardingManagement />} />
            <Route path="branches" element={<Branches />} />
            <Route path="roles" element={<Roles />} />

            <Route path="approvals" element={<Approvals />} />
            <Route path="compliance" element={<Compliance />} />
            <Route path="reports" element={<Reports />} />
            <Route path="integrations" element={<Integrations />} />
          </Route>

          <Route path="/employee" element={
            <ProtectedRoute allowedRoles={['EMPLOYEE']}>
              <EmployeeLayout />
            </ProtectedRoute>
          }>
            <Route index element={<EmployeeDashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="attendance" element={<MyAttendance />} />
            <Route path="leaves" element={<MyLeaves />} />
            <Route path="payslips" element={<MyPayslips />} />
            <Route path="tasks" element={<PagePlaceholder title="My Tasks" />} />
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<div>404 Not Found</div>} />
        </Routes>
      </Router>
    </Provider>
  );
}

export default App;
