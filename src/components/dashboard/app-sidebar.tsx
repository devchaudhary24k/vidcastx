'use client';

import {
  useActiveOrganization,
  useListOrganizations,
  useSession,
} from '@/auth/client';
import { NavMain } from '@/components/dashboard/nav-main';
import { NavUser } from '@/components/dashboard/nav-user';
import { OrganizationSwitcher } from '@/components/dashboard/organization-switcher';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { Organization, Session } from '@/types/auth';
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  PieChart,
  Settings2,
  SquareTerminal,
} from 'lucide-react';

// Menu items.
// This is sample data.

const fakeData = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'Acme Inc',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise',
    },
    {
      name: 'Acme Corp.',
      logo: AudioWaveform,
      plan: 'Startup',
    },
    {
      name: 'Evil Corp.',
      logo: Command,
      plan: 'Free',
    },
  ],
  navMain: [
    {
      title: 'Playground',
      url: '#',
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: 'History',
          url: '#',
        },
        {
          title: 'Starred',
          url: '#',
        },
        {
          title: 'Settings',
          url: '#',
        },
      ],
    },
    {
      title: 'Models',
      url: '#',
      icon: Bot,
      items: [
        {
          title: 'Genesis',
          url: '#',
        },
        {
          title: 'Explorer',
          url: '#',
        },
        {
          title: 'Quantum',
          url: '#',
        },
      ],
    },
    {
      title: 'Documentation',
      url: '#',
      icon: BookOpen,
      items: [
        {
          title: 'Introduction',
          url: '#',
        },
        {
          title: 'Get Started',
          url: '#',
        },
        {
          title: 'Tutorials',
          url: '#',
        },
        {
          title: 'Changelog',
          url: '#',
        },
      ],
    },
    {
      title: 'Settings',
      url: '#',
      icon: Settings2,
      items: [
        {
          title: 'General',
          url: '#',
        },
        {
          title: 'Team',
          url: '#',
        },
        {
          title: 'Billing',
          url: '#',
        },
        {
          title: 'Limits',
          url: '#',
        },
      ],
    },
  ],
  projects: [
    {
      name: 'Design Engineering',
      url: '#',
      icon: Frame,
    },
    {
      name: 'Sales & Marketing',
      url: '#',
      icon: PieChart,
    },
    {
      name: 'Travel',
      url: '#',
      icon: Map,
    },
  ],
};

type AppSidebarProps = {
  session: Session | null;
  listOrganizations: Organization[] | null;
  activeOrganization: Organization | null;
};

export function AppSidebar(props: AppSidebarProps) {
  const { data } = useSession();
  const { data: listOrganizations } = useListOrganizations();
  const { data: activeOrganization } = useActiveOrganization();
  const session = data || props.session;
  const organizations = listOrganizations || props.listOrganizations;
  const activeOrg = activeOrganization || props.activeOrganization;

  if (!session) {
    return null;
  }

  return (
    <Sidebar variant="inset" collapsible="icon">
      {/* Header */}
      <SidebarHeader>
        <OrganizationSwitcher
          teams={organizations}
          activeOrganization={activeOrg}
        />
      </SidebarHeader>

      {/* Content */}
      <SidebarContent>
        <SidebarContent>
          <NavMain items={fakeData.navMain} />
        </SidebarContent>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter>
        <NavUser
          user={{
            email: session.user.email,
            avatar: session?.user.image || undefined,
            name: session.user.name,
          }}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
