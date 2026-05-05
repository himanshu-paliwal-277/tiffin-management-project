import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stack,
  Title,
  Card,
  Select,
  Button,
  Group,
  Text,
  Alert,
  Loader,
  Center,
  Divider,
  Badge,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import { getUsers } from '../api/users';
import { createEntry } from '../api/entries';
import { getPool } from '../api/pool';
import useAuthStore from '../store/authStore';

const MEAL_OPTIONS = Array.from({ length: 6 }, (_, i) => ({
  value: String(i),
  label: i === 0 ? '0 — None' : String(i),
}));

export default function NewEntryPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [users, setUsers] = useState([]);
  const [pool, setPool] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(user?._id || '');
  const [date, setDate] = useState(new Date());
  const [morning, setMorning] = useState('0');
  const [night, setNight] = useState('0');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getUsers(), getPool()])
      .then(([usersRes, poolRes]) => {
        setUsers(usersRes.data);
        setPool(poolRes.data);
      })
      .catch(() => setError('Failed to load data'))
      .finally(() => setPageLoading(false));
  }, []);

  const userOptions = users.map((u) => ({
    value: u._id,
    label: u.name + (u._id === user?._id ? ' (You)' : ''),
  }));

  const selectedMember = pool?.members?.find((m) => m.userId?._id === selectedUserId);
  const total = parseInt(morning) + parseInt(night);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (total === 0) {
      setError('At least morning or night must be greater than 0');
      return;
    }
    if (selectedMember && selectedMember.remaining < total) {
      setError(
        `Not enough tiffins. ${selectedMember.remaining} remaining but you're trying to log ${total}.`
      );
      return;
    }
    setError('');
    setLoading(true);
    try {
      await createEntry({
        userId: selectedUserId,
        date: dayjs(date).format('YYYY-MM-DD'),
        morning: parseInt(morning),
        night: parseInt(night),
      });
      notifications.show({ color: 'green', title: 'Success', message: 'Entry added!' });
      navigate('/entries');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add entry');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading)
    return (
      <Center h={300}>
        <Loader />
      </Center>
    );

  return (
    <Stack gap="lg" maw={520}>
      <Title order={2}>Add Daily Entry</Title>

      <Card withBorder shadow="sm" p="lg" radius="md">
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            {error && (
              <Alert color="red" radius="md">
                {error}
              </Alert>
            )}

            <Select
              label="For Member"
              data={userOptions}
              value={selectedUserId}
              onChange={(v) => setSelectedUserId(v)}
              required
            />

            {selectedMember && (
              <Group gap="xs">
                <Text size="sm" c="dimmed">
                  Remaining:
                </Text>
                <Badge color={selectedMember.isLow ? 'orange' : 'teal'}>
                  {selectedMember.remaining} tiffins
                </Badge>
              </Group>
            )}

            <DatePickerInput
              label="Date"
              value={date}
              onChange={setDate}
              maxDate={new Date()}
              required
            />

            <Divider label="Meals" labelPosition="center" />

            <Select
              label="Morning"
              description="How many tiffins in the morning?"
              data={MEAL_OPTIONS}
              value={morning}
              onChange={(v) => setMorning(v || '0')}
            />

            <Select
              label="Night"
              description="How many tiffins at night?"
              data={MEAL_OPTIONS}
              value={night}
              onChange={(v) => setNight(v || '0')}
            />

            <Card withBorder p="sm" bg="gray.0" radius="sm">
              <Group justify="space-between">
                <Text size="sm" fw={500}>
                  Total today:
                </Text>
                <Badge size="lg" color={total > 0 ? 'blue' : 'gray'}>
                  {total} tiffin{total !== 1 ? 's' : ''}
                </Badge>
              </Group>
              {pool && (
                <Text size="xs" c="dimmed" mt={4}>
                  Cost: ₹{total * pool.pricePerTiffin}
                </Text>
              )}
            </Card>

            <Group justify="flex-end" mt="sm">
              <Button variant="default" onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button type="submit" loading={loading} disabled={total === 0}>
                Save Entry
              </Button>
            </Group>
          </Stack>
        </form>
      </Card>
    </Stack>
  );
}
