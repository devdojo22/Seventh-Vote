import { useState } from 'react';
import { useNavigate } from 'react-router';
import { signOut } from './auth-session';

export function useSignOut() {
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch {
      // The local session is already cleared; leave for the login page regardless.
    }
    void navigate('/login', { replace: true });
  };

  return { signingOut, handleSignOut };
}
