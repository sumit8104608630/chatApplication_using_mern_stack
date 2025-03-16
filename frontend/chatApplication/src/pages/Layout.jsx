import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Head from './Head';
import { authStore } from '../store/userAuth.store';

function Layout() {
  const { authUser } = authStore();
  const navigate = useNavigate();


  return (
    <>
      <Head />
      <div>
        <Outlet />
      </div>
    </>
  );
}

export default Layout;
