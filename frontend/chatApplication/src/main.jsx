import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Loader } from 'lucide-react';
import { authStore } from './store/userAuth.store.js';
import Layout from './pages/Layout.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import SignUpPage from './pages/SignUpPage.jsx';
import GroupForm from "./pages/GroupForm.jsx"
import Profile from './pages/Profile.jsx';
import Error from './pages/Error.jsx';
import AddContactPage from './pages/AddContactPage.jsx';
const App = () => {
  const { authUser, checkAuth, isCheckingAuth,isUpdatingProfile ,get_online_user} = authStore();

  useEffect(() => {
    checkAuth(); // ✅ Check auth on mount
  }, [checkAuth]); 

  if (isCheckingAuth) {
    return (
      <div className="flex h-screen w-full justify-center items-center">
        <Loader className="size-10 animate-spin" />
      </div>
    );
  }
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={authUser ? <Home /> : <Navigate to="/login" />} />
          <Route path="login" element={!authUser ? <Login /> : <Navigate to="/" />} />
          <Route path="signUpPage" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
          <Route path="profile" element={authUser ? <Profile /> : <Navigate to="/login" />} />
          <Route path="contacts" element={authUser ? <AddContactPage/> : <Navigate to="/login" />} />
          <Route path="createGroup" element={authUser ? <GroupForm/> : <Navigate to="/login" />} />
          <Route path="*" element={<Error/> }/>
        </Route>
      </Routes>
    </Router>
  );
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
