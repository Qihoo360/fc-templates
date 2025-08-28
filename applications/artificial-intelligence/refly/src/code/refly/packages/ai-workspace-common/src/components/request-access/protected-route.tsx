import { lazy } from 'react';
import { Navigate } from 'react-router-dom';

const RequestAccess = lazy(() => import('./index'));

const BetaProtectedRoute = ({
  component: Component,
  hasBetaAccess,
  ...rest
}: {
  component: React.ComponentType<any>;
  hasBetaAccess: boolean;
  [key: string]: any;
}) => {
  if (hasBetaAccess === false) {
    return <Navigate to="/request-access" replace />;
  }
  return <Component {...rest} />;
};

// add a new component for request-access route
const RequestAccessRoute = (props: { hasBetaAccess: boolean }) => {
  const { hasBetaAccess } = props;

  if (hasBetaAccess === true) {
    return <Navigate to="/" replace />;
  }
  return <RequestAccess />;
};

export { BetaProtectedRoute, RequestAccessRoute, RequestAccess };
