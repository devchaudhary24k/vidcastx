'use client';

import { Button } from '@/components/ui/button';
import { signOut, useSession } from '@/auth/client';
import { useRouter } from 'next/navigation';

const Dashboard = () => {
  const router = useRouter();
  const onclick = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push(`/auth/login`);
        },
      },
    });
  };

  const { data } = useSession();

  return (
    <div>
      {JSON.stringify(data?.user)}
      <Button onClick={onclick}>Logout</Button>
    </div>
  );
};

export default Dashboard;
