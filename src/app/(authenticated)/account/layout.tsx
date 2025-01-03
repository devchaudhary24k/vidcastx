import { ReactNode } from 'react';

type AccountLayoutProps = {
  children: ReactNode;
};

const AccountLayout = ({ children }: AccountLayoutProps) => {
  return <main>{children}</main>;
};

export default AccountLayout;
