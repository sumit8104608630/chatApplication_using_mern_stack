import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import {createBrowserRouter,RouterProvider} from "react-router-dom"
import App from './App.jsx'
import Layout from './pages/Layout.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import SignUpPage from './pages/SignUpPage.jsx'


import {authStore} from "./store/userAuth.store.js"

const AppWrapper = () => {
  const {authUser,checkAuth} = authStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth(); // ✅ Call checkAuth on mount
  }, [checkAuth]);

  return <RouterProvider router={router} />;
};



const router=createBrowserRouter([
  {
    path: '/',
    element:<Layout/>,
    children:[
      {
        path: '',
        element: <Home/>, 
      },
      {
        path:'login',
        element:<Login/>
      },
      {
        path:'signUpPage',
        element:<SignUpPage/>
      }
    ]
  }
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} >
    </RouterProvider>
  </StrictMode>,
)
