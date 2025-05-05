import React from 'react';
import { useRouter } from 'next/router';
import withAdminAuth from '../../middleware/authAdminPage';

// This component is no longer used for redirection
// It's kept as a placeholder in case we need to restore 
// SPA functionality in the future

function AdminRedirect({ section = null, children }) {
  return (
    <>
      {children}
    </>
  );
}

export default withAdminAuth(AdminRedirect);