import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SimpleGrid,
  Card,
  Text,
  Title,
  Badge,
  Group,
  Button,
  Alert,
  Loader,
  Center,
  Progress,
  Stack,
  ThemeIcon,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { IconAlertTriangle, IconPlus, IconRefresh } from '@tabler/icons-react';
import { getPool } from '../api/pool';
import useAuthStore from '../store/authStore';
import usePoolStore from '../store/poolStore';

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { pool, setPool } = usePoolStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPool = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await getPool();
      setPool(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load pool data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPool();
  }, []);

  if (loading)
    return (
      <Center h={400}>
        <Loader />
      </Center>
    );

  if (error)
    return (
      <Alert color="red" title="Error">
        {error}
      </Alert>
    );

  if (!pool)
    return (
      <Alert color="yellow" title="Pool Not Initialized">
        Tiffin pool is not set up yet.
        {user?.role === 'owner' && (
          <Button mt="sm" size="xs" onClick={() => navigate('/admin')}>
            Go to Admin to initialize
          </Button>
        )}
      </Alert>
    );

  const myMember = pool.members?.find((m) => m.userId?._id === user?._id);
  const consumed = pool.totalTiffins - pool.totalRemaining;
  const progressPct = pool.totalTiffins > 0 ? (pool.totalRemaining / pool.totalTiffins) * 100 : 0;

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={2}>Dashboard</Title>
        <Group gap="sm">
          <Tooltip label="Refresh">
            <ActionIcon variant="subtle" onClick={fetchPool}>
              <IconRefresh size={18} />
            </ActionIcon>
          </Tooltip>
          <Button leftSection={<IconPlus size={16} />} onClick={() => navigate('/entries/new')}>
            Add Entry
          </Button>
        </Group>
      </Group>

      {pool.isGroupLow && (
        <Alert
          icon={<IconAlertTriangle size={16} />}
          color="orange"
          title="Low Tiffins — Restock Soon!"
        >
          Only <strong>{pool.totalRemaining}</strong> tiffins remaining in the group pool.
        </Alert>
      )}

      {/* Group Pool Card */}
      <Card withBorder shadow="sm" p="lg" radius="md">
        <Group justify="space-between" mb="md">
          <Title order={4}>Group Pool</Title>
          {pool.isGroupLow ? (
            <Badge color="orange" leftSection={<IconAlertTriangle size={12} />}>
              Low
            </Badge>
          ) : (
            <Badge color="teal">Active</Badge>
          )}
        </Group>
        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md" mb="md">
          <div>
            <Text c="dimmed" size="xs" tt="uppercase" fw={500}>
              Total Bought
            </Text>
            <Text fw={700} size="xl">
              {pool.totalTiffins}
            </Text>
          </div>
          <div>
            <Text c="dimmed" size="xs" tt="uppercase" fw={500}>
              Remaining
            </Text>
            <Text fw={700} size="xl" c={pool.isGroupLow ? 'orange' : 'teal'}>
              {pool.totalRemaining}
            </Text>
          </div>
          <div>
            <Text c="dimmed" size="xs" tt="uppercase" fw={500}>
              Consumed
            </Text>
            <Text fw={700} size="xl" c="blue">
              {consumed}
            </Text>
          </div>
          <div>
            <Text c="dimmed" size="xs" tt="uppercase" fw={500}>
              Price / Tiffin
            </Text>
            <Text fw={700} size="xl">
              ₹{pool.pricePerTiffin}
            </Text>
          </div>
        </SimpleGrid>
        <Progress
          value={progressPct}
          color={pool.isGroupLow ? 'orange' : 'teal'}
          size="lg"
          radius="xl"
        />
        <Text size="xs" c="dimmed" mt={6}>
          {progressPct.toFixed(0)}% remaining · Total group cost so far: ₹
          {consumed * pool.pricePerTiffin}
        </Text>
      </Card>

      {/* My Stats */}
      {myMember && (
        <Card withBorder shadow="sm" p="lg" radius="md" style={{ borderColor: 'var(--mantine-color-blue-4)' }}>
          <Group justify="space-between" mb="md">
            <Title order={4}>My Tiffins</Title>
            <Badge color="blue">You</Badge>
          </Group>
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md" mb="md">
            <div>
              <Text c="dimmed" size="xs" tt="uppercase" fw={500}>
                Assigned
              </Text>
              <Text fw={700} size="xl">
                {myMember.assigned}
              </Text>
            </div>
            <div>
              <Text c="dimmed" size="xs" tt="uppercase" fw={500}>
                Remaining
              </Text>
              <Text fw={700} size="xl" c={myMember.isLow ? 'orange' : 'teal'}>
                {myMember.remaining}
              </Text>
            </div>
            <div>
              <Text c="dimmed" size="xs" tt="uppercase" fw={500}>
                Consumed
              </Text>
              <Text fw={700} size="xl" c="blue">
                {myMember.assigned - myMember.remaining}
              </Text>
            </div>
            <div>
              <Text c="dimmed" size="xs" tt="uppercase" fw={500}>
                My Cost
              </Text>
              <Text fw={700} size="xl" c="grape">
                ₹{(myMember.assigned - myMember.remaining) * pool.pricePerTiffin}
              </Text>
            </div>
          </SimpleGrid>
          {myMember.isLow && (
            <Alert color="orange" size="sm" icon={<IconAlertTriangle size={14} />}>
              Your tiffins are running low! Only {myMember.remaining} left.
            </Alert>
          )}
        </Card>
      )}

      {/* All Members */}
      <Title order={4}>All Members</Title>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
        {pool.members?.map((m) => {
          const isMe = m.userId?._id === user?._id;
          const memberConsumed = m.assigned - m.remaining;
          const memberPct = m.assigned > 0 ? (m.remaining / m.assigned) * 100 : 0;
          return (
            <Card key={m.userId?._id} withBorder shadow="sm" p="md" radius="md">
              <Group justify="space-between" mb="xs">
                <Text fw={600}>{m.userId?.name}</Text>
                <Group gap={4}>
                  {isMe && (
                    <Badge color="blue" size="xs">
                      You
                    </Badge>
                  )}
                  {m.isLow && (
                    <Badge color="orange" size="xs">
                      Low
                    </Badge>
                  )}
                </Group>
              </Group>
              <SimpleGrid cols={3} spacing="xs" mb="sm">
                <div>
                  <Text c="dimmed" size="xs">
                    Assigned
                  </Text>
                  <Text fw={600} size="sm">
                    {m.assigned}
                  </Text>
                </div>
                <div>
                  <Text c="dimmed" size="xs">
                    Remaining
                  </Text>
                  <Text fw={600} size="sm" c={m.isLow ? 'orange' : 'teal'}>
                    {m.remaining}
                  </Text>
                </div>
                <div>
                  <Text c="dimmed" size="xs">
                    Cost
                  </Text>
                  <Text fw={600} size="sm" c="grape">
                    ₹{memberConsumed * pool.pricePerTiffin}
                  </Text>
                </div>
              </SimpleGrid>
              <Progress
                value={memberPct}
                color={m.isLow ? 'orange' : 'blue'}
                size="sm"
                radius="xl"
              />
              <Text size="xs" c="dimmed" mt={4}>
                {memberPct.toFixed(0)}% remaining
              </Text>
            </Card>
          );
        })}
      </SimpleGrid>
    </Stack>
  );
}
