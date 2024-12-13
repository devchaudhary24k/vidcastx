import { ReactNode } from 'react';

type AuthLayoutProps = {
  children: ReactNode;
};

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="h-screen flex flex-col items-center justify-center">
      {children}
    </div>
  );
};

export default AuthLayout;
