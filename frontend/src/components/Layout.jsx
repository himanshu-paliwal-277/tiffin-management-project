import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppShell,
  Burger,
  Group,
  NavLink,
  Text,
  Badge,
  Button,
  Stack,
  Divider,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconLayoutDashboard,
  IconPlus,
  IconList,
  IconHistory,
  IconChartBar,
  IconSettings,
  IconLogout,
} from '@tabler/icons-react';
import useAuthStore from '../store/authStore';
import usePoolStore from '../store/poolStore';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: IconLayoutDashboard, path: '/dashboard' },
  { label: 'Add Entry', icon: IconPlus, path: '/entries/new' },
  { label: 'Entries', icon: IconList, path: '/entries' },
  { label: 'History', icon: IconHistory, path: '/history' },
  { label: 'Expenses', icon: IconChartBar, path: '/expenses' },
];

export default function Layout() {
  const [opened, { toggle, close }] = useDisclosure();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const clearPool = usePoolStore((s) => s.clearPool);

  const handleLogout = () => {
    logout();
    clearPool();
    navigate('/login');
  };

  const navItems = [...NAV_ITEMS];
  if (user?.role === 'owner') {
    navItems.push({ label: 'Admin', icon: IconSettings, path: '/admin' });
  }

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 220, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Text fw={700} size="lg" c="blue">
              Tiffin Manager
            </Text>
          </Group>
          <Group gap="xs">
            <Text size="sm" c="dimmed" visibleFrom="sm">
              {user?.name}
            </Text>
            {user?.role === 'owner' && (
              <Badge size="sm" color="orange" visibleFrom="sm">
                Owner
              </Badge>
            )}
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Stack justify="space-between" h="100%">
          <Stack gap={4}>
            <Text size="xs" c="dimmed" fw={500} mb={4} tt="uppercase">
              {user?.name}
            </Text>
            <Divider mb={8} />
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                label={item.label}
                leftSection={<item.icon size={16} />}
                active={location.pathname === item.path}
                onClick={() => {
                  navigate(item.path);
                  close();
                }}
                styles={{ root: { borderRadius: 6 } }}
              />
            ))}
          </Stack>
          <Button
            leftSection={<IconLogout size={16} />}
            variant="subtle"
            color="red"
            onClick={handleLogout}
            fullWidth
          >
            Logout
          </Button>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
