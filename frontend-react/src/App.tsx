import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuth } from './contexts/AuthContext'

import Mainlayout from './layouts/main_layout/Mainlayout'
import Dashboard from './pages/Dashboard'
import Authlayout from './layouts/auth_layout/Authlayout'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import ProtectedRoute from './components/ProtectedRoute'

import List from './pages/projects/List'
import Edit from './pages/projects/Edit'
import Add from './pages/projects/Add'
import View from './pages/projects/View'

import LeftMenuList from './pages/admin/LeftMenu/LeftMenuList'
import LeftMenuAdd from './pages/admin/LeftMenu/LeftMenuAdd'
import LeftMenuEdit from './pages/admin/LeftMenu/LeftMenuEdit'
import LeftMenuView from './pages/admin/LeftMenu/LeftMenuView'
import Bitting_list from './pages/bitings/Bitting_list'
import Bitting_view from './pages/bitings/Bitting_view'

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
        <Route path='/projects/edit/:id' element={
          <ProtectedRoute>
            <Mainlayout pageUrl="/projects/list" pageName="Project Edit"><Edit /></Mainlayout>
          </ProtectedRoute>
        } />
        <Route path='/projects/view/:id' element={
          <ProtectedRoute>
            <Mainlayout pageUrl="/projects/list" pageName="Project View"><View /></Mainlayout>
          </ProtectedRoute>
        } />

        {/* leftmenu Routes */}
        <Route path='/leftmenu/list' element={
          <ProtectedRoute>
            <Mainlayout pageUrl="/leftmenu/list" pageName="LeftMenu List"><LeftMenuList /></Mainlayout>
          </ProtectedRoute>
        } />
        <Route path='/leftmenu/add' element={
          <ProtectedRoute>
            <Mainlayout pageUrl="/leftmenu/add" pageName="LeftMenu Add"><LeftMenuAdd /></Mainlayout>
          </ProtectedRoute>
        } />
        <Route path='/leftmenu/edit/:id' element={
          <ProtectedRoute>
            <Mainlayout pageUrl="/leftmenu/list" pageName="LeftMenu Edit"><LeftMenuEdit /></Mainlayout>
          </ProtectedRoute>
        } />
        <Route path='/leftmenu/view/:id' element={
          <ProtectedRoute>
            <Mainlayout pageUrl="/leftmenu/list" pageName="LeftMenu View"><LeftMenuView /></Mainlayout>
          </ProtectedRoute>
        } />

        {/* Bitting Routes */}
        <Route path='/bittings/list' element={
          <ProtectedRoute>
            <Mainlayout pageUrl="/bittings/list" pageName="Bittings List"><Bitting_list /></Mainlayout>
          </ProtectedRoute>
        } />
        <Route path='/bittings/view/:project_id' element={
          <ProtectedRoute>
            <Mainlayout pageUrl="/bittings/list" pageName="Bittings View"><Bitting_view /></Mainlayout>
          </ProtectedRoute>
        } />

        {/* Default redirect */}
        <Route path='/' element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <Toaster
        position="top-right"
        containerStyle={{ top: '55px' }}
      />
    </BrowserRouter>
  )
}

export default App
