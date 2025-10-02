import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Mainlayout from './layouts/main_layout/Mainlayout'
import Dashboard from './pages/Dashboard'
import List from './pages/projects/List'
import Edit from './pages/projects/Edit'
import Add from './pages/projects/Add'
import View from './pages/projects/View'
import Authlayout from './layouts/auth_layout/Authlayout'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import ProtectedRoute from './components/ProtectedRoute'
import { Toaster } from 'react-hot-toast'
import { useAuth } from './contexts/AuthContext'

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path='/login' element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : 
          <Authlayout pageUrl='login' pageName="Login"><Login /></Authlayout>
        } />
        <Route path='/register' element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : 
          <Authlayout pageUrl='register' pageName="Register"><Register /></Authlayout>
        } />

        {/* Protected Routes */}
        <Route path='/dashboard' element={
          <ProtectedRoute>
            <Mainlayout pageUrl="/dashboard" pageName="Dashboard"><Dashboard /></Mainlayout>
          </ProtectedRoute>
        } />

        {/* Project Routes */}
        <Route path='/projects/list' element={
          <ProtectedRoute>
            <Mainlayout pageUrl="/projects/list" pageName="Project List"><List /></Mainlayout>
          </ProtectedRoute>
        } />
        <Route path='/projects/add' element={
          <ProtectedRoute>
            <Mainlayout pageUrl="/projects/add" pageName="Project Add"><Add /></Mainlayout>
          </ProtectedRoute>
        } />
        <Route path='/projects/edit' element={
          <ProtectedRoute>
            <Mainlayout pageUrl="/projects/list" pageName="Project Edit"><Edit /></Mainlayout>
          </ProtectedRoute>
        } />
        <Route path='/projects/view' element={
          <ProtectedRoute>
            <Mainlayout pageUrl="/projects/list" pageName="Project View"><View /></Mainlayout>
          </ProtectedRoute>
        } />

        {/* Default redirect */}
        <Route path='/' element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  )
}

export default App
