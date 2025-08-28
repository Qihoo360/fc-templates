import { useEffect } from 'react';

import { LoginModal } from '../../components/login-modal';
import { useSearchParams } from 'react-router-dom';

const Login = () => {
  const [searchParams] = useSearchParams();
  const isFromExtension = searchParams.get('from') === 'refly-extension-login';

  // Check if the login is from the extension page, set a flag, and control the state based on this flag
  useEffect(() => {
    if (isFromExtension) {
      // If from the extension, set the login status to true
      localStorage.setItem('refly-login-status', 'true');
    } else {
      // If not opened from the extension, clear the status to differentiate between extension and normal page
      localStorage.removeItem('refly-login-status');
    }
  }, [isFromExtension]);

  return (
    <>
      <LoginModal visible={true} from="extension-login" />
    </>
  );
};

export default Login;
