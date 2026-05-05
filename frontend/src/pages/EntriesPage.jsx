import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stack,
  Title,
  Table,
  Badge,
  Group,
  Select,
  Button,
  Text,
  Loader,
  Center,
  ActionIcon,
  Modal,
  Alert,
  Card,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconEdit, IconPlus } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { getEntries, updateEntry } from '../api/entries';
import { getUsers } from '../api/users';

const MEAL_OPTIONS = Array.from({ length: 6 }, (_, i) => ({
  value: String(i),
  label: String(i),
}));

function EditModal({ entry, onClose, onSaved }) {
  const [morning, setMorning] = useState(String(entry.morning));
  const [night, setNight] = useState(String(entry.night));
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateEntry(entry._id, { morning: parseInt(morning), night: parseInt(night) });
      notifications.show({ color: 'green', message: 'Entry updated!' });
      onSaved();
    } catch (err) {
      notifications.show({ color: 'red', message: err.response?.data?.message || 'Update failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack gap="md">
      <Text size="sm">
        Editing entry for <strong>{entry.userId?.name}</strong> on{' '}
        <strong>{entry.date}</strong>
      </Text>
      <Select label="Morning" data={MEAL_OPTIONS} value={morning} onChange={(v) => setMorning(v || '0')} />
      <Select label="Night" data={MEAL_OPTIONS} value={night} onChange={(v) => setNight(v || '0')} />
      <Text size="sm" c="dimmed">
        New total: {parseInt(morning) + parseInt(night)}
      </Text>
      <Group justify="flex-end">
        <Button variant="default" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} loading={loading}>
          Save
        </Button>
      </Group>
    </Stack>
  );
}

export default function EntriesPage() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [users, setUsers] = useState([]);
  const [filterUser, setFilterUser] = useState('');
  const [filterMonth, setFilterMonth] = useState(String(dayjs().month() + 1));
  const [filterYear, setFilterYear] = useState(String(dayjs().year()));
  const [loading, setLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState(null);
  const [opened, { open, close }] = useDisclosure(false);

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: dayjs().month(i).format('MMMM'),
  }));
  const years = ['2024', '2025', '2026'].map((y) => ({ value: y, label: y }));

  useEffect(() => {
    getUsers().then(({ data }) => setUsers(data));
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [filterUser, filterMonth, filterYear]);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterUser) params.userId = filterUser;
      if (filterMonth && filterYear) {
        params.month = filterMonth;
        params.year = filterYear;
      }
      const { data } = await getEntries(params);
      setEntries(data);
    } catch {
      notifications.show({ color: 'red', message: 'Failed to load entries' });
    } finally {
      setLoading(false);
    }
  };

  const userOptions = [
    { value: '', label: 'All Members' },
    ...users.map((u) => ({ value: u._id, label: u.name })),
  ];

  const openEdit = (entry) => {
    setEditingEntry(entry);
    open();
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={2}>Entries</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={() => navigate('/entries/new')}>
          Add Entry
        </Button>
      </Group>

      <Group gap="sm" wrap="wrap">
        <Select
          data={userOptions}
          value={filterUser}
          onChange={(v) => setFilterUser(v || '')}
          w={160}
          placeholder="All Members"
        />
        <Select data={months} value={filterMonth} onChange={(v) => setFilterMonth(v || '')} w={140} />
        <Select data={years} value={filterYear} onChange={(v) => setFilterYear(v || '')} w={100} />
      </Group>

      {loading ? (
        <Center h={200}>
          <Loader />
        </Center>
      ) : entries.length === 0 ? (
        <Card withBorder p="xl">
          <Text c="dimmed" ta="center">
            No entries found for this period.
          </Text>
        </Card>
      ) : (
        <Table.ScrollContainer minWidth={620}>
          <Table striped highlightOnHover withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Date</Table.Th>
                <Table.Th>Member</Table.Th>
                <Table.Th>Morning</Table.Th>
                <Table.Th>Night</Table.Th>
                <Table.Th>Total</Table.Th>
                <Table.Th>Entry By</Table.Th>
                <Table.Th w={50}></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {entries.map((e) => (
                <Table.Tr key={e._id}>
                  <Table.Td>
                    <Text size="sm">{e.date}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={500}>
                      {e.userId?.name}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light" color="orange" size="sm">
                      {e.morning}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light" color="blue" size="sm">
                      {e.night}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge color="teal" size="sm">
                      {e.total}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" c="dimmed">
                      {e.entryBy?.name}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <ActionIcon variant="subtle" color="blue" onClick={() => openEdit(e)}>
                      <IconEdit size={15} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}

      <Modal opened={opened} onClose={close} title="Edit Entry" centered size="sm">
        {editingEntry && (
          <EditModal
            entry={editingEntry}
            onClose={close}
            onSaved={() => {
              close();
              fetchEntries();
            }}
          />
        )}
      </Modal>
    </Stack>
  );
}
