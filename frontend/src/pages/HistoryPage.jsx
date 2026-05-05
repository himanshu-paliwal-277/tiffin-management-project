import { useState, useEffect } from 'react';
import {
  Stack,
  Title,
  Table,
  Badge,
  Text,
  Select,
  Loader,
  Center,
  Pagination,
  Group,
  Card,
} from '@mantine/core';
import dayjs from 'dayjs';
import { getHistory } from '../api/history';

const ACTION_META = {
  TIFFIN_ADDED: { label: 'Tiffins Added', color: 'green' },
  TIFFIN_CONSUMED: { label: 'Consumed', color: 'blue' },
  PRICE_UPDATED: { label: 'Price Updated', color: 'violet' },
  THRESHOLD_UPDATED: { label: 'Threshold Updated', color: 'indigo' },
  USER_ADDED: { label: 'User Added', color: 'teal' },
  USER_REMOVED: { label: 'User Removed', color: 'red' },
  ENTRY_UPDATED: { label: 'Entry Updated', color: 'yellow' },
};

function formatDetails(action, details) {
  if (!details) return '—';
  switch (action) {
    case 'TIFFIN_ADDED':
      return details.type === 'restock'
        ? `Restocked +${details.totalAdded} tiffins`
        : `Pool initialized: ${details.totalTiffins} tiffins @ ₹${details.pricePerTiffin}`;
    case 'TIFFIN_CONSUMED':
      return `Morning: ${details.morning} · Night: ${details.night} · Total: ${details.total} · Left: ${details.remainingAfter}`;
    case 'PRICE_UPDATED':
      return `₹${details.oldPrice} → ₹${details.newPrice}`;
    case 'THRESHOLD_UPDATED':
      return `Threshold: ${details.oldThreshold} → ${details.newThreshold}`;
    case 'ENTRY_UPDATED':
      return `${details.date}: ${details.before?.total} → ${details.after?.total} tiffins`;
    case 'USER_ADDED':
    case 'USER_REMOVED':
      return `${details.name} (${details.email})`;
    default:
      return JSON.stringify(details);
  }
}

export default function HistoryPage() {
  const [logs, setLogs] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filterAction, setFilterAction] = useState('');
  const [loading, setLoading] = useState(true);

  const actionOptions = [
    { value: '', label: 'All Actions' },
    ...Object.entries(ACTION_META).map(([k, v]) => ({ value: k, label: v.label })),
  ];

  useEffect(() => {
    fetchHistory();
  }, [page, filterAction]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filterAction) params.action = filterAction;
      const { data } = await getHistory(params);
      setLogs(data.logs);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={2}>History</Title>
        <Group gap="sm">
          <Text size="sm" c="dimmed">
            {total} records
          </Text>
          <Select
            data={actionOptions}
            value={filterAction}
            onChange={(v) => {
              setFilterAction(v || '');
              setPage(1);
            }}
            w={200}
            placeholder="All Actions"
          />
        </Group>
      </Group>

      {loading ? (
        <Center h={200}>
          <Loader />
        </Center>
      ) : logs.length === 0 ? (
        <Card withBorder p="xl">
          <Text c="dimmed" ta="center">
            No history found.
          </Text>
        </Card>
      ) : (
        <>
          <Table.ScrollContainer minWidth={700}>
            <Table striped highlightOnHover withTableBorder withColumnBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Action</Table.Th>
                  <Table.Th>By</Table.Th>
                  <Table.Th>For</Table.Th>
                  <Table.Th>Details</Table.Th>
                  <Table.Th>Date & Time</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {logs.map((log) => {
                  const meta = ACTION_META[log.action] || { label: log.action, color: 'gray' };
                  return (
                    <Table.Tr key={log._id}>
                      <Table.Td>
                        <Badge color={meta.color} size="sm" variant="light">
                          {meta.label}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" fw={500}>
                          {log.performedBy?.name || '—'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {log.targetUser?.name || '—'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs" c="dimmed" maw={280} truncate>
                          {formatDetails(log.action, log.details)}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs">
                          {dayjs(log.createdAt).format('DD MMM YYYY')}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {dayjs(log.createdAt).format('HH:mm')}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>

          {totalPages > 1 && (
            <Group justify="center">
              <Pagination total={totalPages} value={page} onChange={setPage} />
            </Group>
          )}
        </>
      )}
    </Stack>
  );
}
