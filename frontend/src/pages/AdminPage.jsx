import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Stack,
  Title,
  Tabs,
  Card,
  NumberInput,
  Button,
  Group,
  Text,
  Table,
  ActionIcon,
  Modal,
  TextInput,
  PasswordInput,
  Badge,
  Loader,
  Center,
  Alert,
  Divider,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconTrash, IconAlertTriangle } from '@tabler/icons-react';
import { getPool, initializePool, restockTiffins, updatePrice, updateThreshold } from '../api/pool';
import { getUsers, addUser, removeUser } from '../api/users';
import useAuthStore from '../store/authStore';
import usePoolStore from '../store/poolStore';

export default function AdminPage() {
  const user = useAuthStore((s) => s.user);
  const { pool, setPool } = usePoolStore();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pool initialization
  const [allocations, setAllocations] = useState({});
  const [initPrice, setInitPrice] = useState(50);
  const [initThreshold, setInitThreshold] = useState(5);

  // Restock
  const [restockAmounts, setRestockAmounts] = useState({});

  // Price & threshold
  const [price, setPrice] = useState(0);
  const [threshold, setThreshold] = useState(5);
  const [priceLoading, setPriceLoading] = useState(false);
  const [thresholdLoading, setThresholdLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(false);
  const [restockLoading, setRestockLoading] = useState(false);

  // Add user
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  // Remove user confirm
  const [removingUser, setRemovingUser] = useState(null);
  const [removeOpened, { open: openRemove, close: closeRemove }] = useDisclosure(false);

  if (user?.role !== 'owner') return <Navigate to="/dashboard" replace />;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [poolRes, usersRes] = await Promise.all([
        getPool().catch(() => ({ data: null })),
        getUsers(),
      ]);
      setPool(poolRes.data);
      setUsers(usersRes.data);
      if (poolRes.data) {
        setPrice(poolRes.data.pricePerTiffin);
        setThreshold(poolRes.data.lowAlertThreshold);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInitialize = async () => {
    const members = users.map((u) => ({
      userId: u._id,
      assigned: Number(allocations[u._id]) || 0,
    }));
    const totalAssigned = members.reduce((s, m) => s + m.assigned, 0);
    if (totalAssigned === 0) {
      notifications.show({ color: 'yellow', message: 'Assign at least some tiffins' });
      return;
    }
    setInitLoading(true);
    try {
      await initializePool({ pricePerTiffin: initPrice, lowAlertThreshold: initThreshold, members });
      notifications.show({ color: 'green', message: `Pool initialized with ${totalAssigned} tiffins!` });
      fetchData();
    } catch (err) {
      notifications.show({ color: 'red', message: err.response?.data?.message || 'Failed' });
    } finally {
      setInitLoading(false);
    }
  };

  const handleRestock = async () => {
    const members = Object.entries(restockAmounts)
      .filter(([, v]) => Number(v) > 0)
      .map(([userId, add]) => ({ userId, add: Number(add) }));
    if (members.length === 0) {
      notifications.show({ color: 'yellow', message: 'Enter amounts to add' });
      return;
    }
    setRestockLoading(true);
    try {
      const total = members.reduce((s, m) => s + m.add, 0);
      await restockTiffins({ members });
      notifications.show({ color: 'green', message: `+${total} tiffins restocked!` });
      setRestockAmounts({});
      fetchData();
    } catch (err) {
      notifications.show({ color: 'red', message: err.response?.data?.message || 'Failed' });
    } finally {
      setRestockLoading(false);
    }
  };

  const handleUpdatePrice = async () => {
    setPriceLoading(true);
    try {
      await updatePrice(Number(price) || 0);
      notifications.show({ color: 'green', message: `Price updated to ₹${price}` });
      fetchData();
    } catch (err) {
      notifications.show({ color: 'red', message: err.response?.data?.message || 'Failed' });
    } finally {
      setPriceLoading(false);
    }
  };

  const handleUpdateThreshold = async () => {
    setThresholdLoading(true);
    try {
      await updateThreshold(Number(threshold) || 5);
      notifications.show({ color: 'green', message: `Threshold updated to ${threshold}` });
      fetchData();
    } catch (err) {
      notifications.show({ color: 'red', message: err.response?.data?.message || 'Failed' });
    } finally {
      setThresholdLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      await addUser({ name: newName, email: newEmail, password: newPassword });
      notifications.show({ color: 'green', message: `${newName} added to the group!` });
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      fetchData();
    } catch (err) {
      notifications.show({ color: 'red', message: err.response?.data?.message || 'Failed' });
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemoveUser = async () => {
    try {
      await removeUser(removingUser._id);
      notifications.show({ color: 'green', message: `${removingUser.name} removed from group` });
      closeRemove();
      fetchData();
    } catch (err) {
      notifications.show({ color: 'red', message: err.response?.data?.message || 'Failed' });
    }
  };

  if (loading)
    return (
      <Center h={400}>
        <Loader />
      </Center>
    );

  return (
    <Stack gap="lg">
      <Title order={2}>Admin Panel</Title>

      <Tabs defaultValue="pool">
        <Tabs.List>
          <Tabs.Tab value="pool">Pool Management</Tabs.Tab>
          <Tabs.Tab value="users">User Management</Tabs.Tab>
        </Tabs.List>

        {/* ── POOL MANAGEMENT ── */}
        <Tabs.Panel value="pool" pt="lg">
          <Stack gap="lg">
            {!pool ? (
              <Card withBorder shadow="sm" p="lg" radius="md">
                <Text fw={600} size="lg" mb="xs">
                  Initialize Tiffin Pool
                </Text>
                <Text size="sm" c="dimmed" mb="md">
                  Set up the pool for the first time. Assign tiffins to each member.
                </Text>
                <Stack gap="md">
                  <Group grow>
                    <NumberInput
                      label="Price per Tiffin (₹)"
                      value={initPrice}
                      onChange={(v) => setInitPrice(Number(v) || 0)}
                      min={0}
                    />
                    <NumberInput
                      label="Low Alert Threshold"
                      description="Warn when remaining ≤ this"
                      value={initThreshold}
                      onChange={(v) => setInitThreshold(Number(v) || 5)}
                      min={1}
                    />
                  </Group>
                  <Divider label="Assign tiffins per member" labelPosition="center" />
                  {users.map((u) => (
                    <NumberInput
                      key={u._id}
                      label={u.name}
                      value={allocations[u._id] || 0}
                      onChange={(v) =>
                        setAllocations((prev) => ({ ...prev, [u._id]: Number(v) || 0 }))
                      }
                      min={0}
                    />
                  ))}
                  <Text size="sm" c="dimmed">
                    Total:{' '}
                    <strong>
                      {Object.values(allocations).reduce((a, b) => a + Number(b), 0)}
                    </strong>{' '}
                    tiffins
                  </Text>
                  <Button onClick={handleInitialize} loading={initLoading}>
                    Initialize Pool
                  </Button>
                </Stack>
              </Card>
            ) : (
              <Card withBorder shadow="sm" p="lg" radius="md">
                <Group justify="space-between" mb="xs">
                  <Text fw={600} size="lg">
                    Restock Tiffins
                  </Text>
                  <Badge color="teal">Pool Active · {pool.totalRemaining} remaining</Badge>
                </Group>
                <Text size="sm" c="dimmed" mb="md">
                  Add more tiffins to members' accounts.
                </Text>
                <Stack gap="md">
                  {pool.members?.map((m) => (
                    <NumberInput
                      key={m.userId?._id}
                      label={`${m.userId?.name}  (${m.remaining} left)`}
                      value={restockAmounts[m.userId?._id] || 0}
                      onChange={(v) =>
                        setRestockAmounts((prev) => ({
                          ...prev,
                          [m.userId?._id]: Number(v) || 0,
                        }))
                      }
                      min={0}
                    />
                  ))}
                  <Text size="sm" c="dimmed">
                    Total to add:{' '}
                    <strong>
                      {Object.values(restockAmounts).reduce((a, b) => a + Number(b), 0)}
                    </strong>
                  </Text>
                  <Button onClick={handleRestock} loading={restockLoading}>
                    Restock
                  </Button>
                </Stack>
              </Card>
            )}

            {/* Price */}
            <Card withBorder shadow="sm" p="lg" radius="md">
              <Text fw={600} mb="md">
                Price Per Tiffin
              </Text>
              <Group align="flex-end" gap="md">
                <NumberInput
                  label="Price (₹)"
                  value={price}
                  onChange={(v) => setPrice(Number(v) || 0)}
                  min={0}
                  w={200}
                  prefix="₹"
                />
                <Button onClick={handleUpdatePrice} loading={priceLoading}>
                  Update Price
                </Button>
              </Group>
            </Card>

            {/* Threshold */}
            <Card withBorder shadow="sm" p="lg" radius="md">
              <Text fw={600} mb="xs">
                Low Alert Threshold
              </Text>
              <Text size="sm" c="dimmed" mb="md">
                Show a warning when a member's remaining tiffins fall to or below this number.
              </Text>
              <Group align="flex-end" gap="md">
                <NumberInput
                  label="Threshold"
                  value={threshold}
                  onChange={(v) => setThreshold(Number(v) || 5)}
                  min={1}
                  w={200}
                />
                <Button onClick={handleUpdateThreshold} loading={thresholdLoading}>
                  Update Threshold
                </Button>
              </Group>
            </Card>
          </Stack>
        </Tabs.Panel>

        {/* ── USER MANAGEMENT ── */}
        <Tabs.Panel value="users" pt="lg">
          <Stack gap="lg">
            {/* Add User */}
            <Card withBorder shadow="sm" p="lg" radius="md">
              <Text fw={600} size="lg" mb="md">
                Add New Member
              </Text>
              <form onSubmit={handleAddUser}>
                <Stack gap="md">
                  <TextInput
                    label="Name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                  />
                  <TextInput
                    label="Email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                  />
                  <PasswordInput
                    label="Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <Button type="submit" loading={addLoading}>
                    Add Member
                  </Button>
                </Stack>
              </form>
            </Card>

            {/* Members list */}
            <Card withBorder shadow="sm" p="lg" radius="md">
              <Text fw={600} size="lg" mb="md">
                Members ({users.length})
              </Text>
              <Table withTableBorder>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>Email</Table.Th>
                    <Table.Th>Role</Table.Th>
                    <Table.Th w={60}></Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {users.map((u) => (
                    <Table.Tr key={u._id}>
                      <Table.Td>
                        <Text size="sm" fw={500}>
                          {u.name}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {u.email}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={u.role === 'owner' ? 'orange' : 'blue'} size="sm">
                          {u.role}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        {u.role !== 'owner' && (
                          <ActionIcon
                            color="red"
                            variant="subtle"
                            onClick={() => {
                              setRemovingUser(u);
                              openRemove();
                            }}
                          >
                            <IconTrash size={15} />
                          </ActionIcon>
                        )}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Card>
          </Stack>
        </Tabs.Panel>
      </Tabs>

      {/* Remove Confirm Modal */}
      <Modal opened={removeOpened} onClose={closeRemove} title="Remove Member" size="sm" centered>
        <Alert icon={<IconAlertTriangle size={16} />} color="red" mb="md">
          This will remove <strong>{removingUser?.name}</strong> from the group. Their tiffin
          balance will be cleared from the pool.
        </Alert>
        <Group justify="flex-end">
          <Button variant="default" onClick={closeRemove}>
            Cancel
          </Button>
          <Button color="red" onClick={handleRemoveUser}>
            Remove
          </Button>
        </Group>
      </Modal>
    </Stack>
  );
}
