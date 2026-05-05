import { useState, useEffect } from 'react';
import {
  Stack,
  Title,
  SimpleGrid,
  Card,
  Text,
  Select,
  Group,
  Loader,
  Center,
  Divider,
  Badge,
} from '@mantine/core';
import { BarChart, LineChart, PieChart } from '@mantine/charts';
import dayjs from 'dayjs';
import { getMonthlySummary, getDailyTrend } from '../api/entries';

const MEMBER_COLORS = ['blue.6', 'teal.6', 'orange.6', 'violet.6'];
const PIE_COLORS = ['blue.6', 'teal.6', 'orange.6', 'violet.6'];

export default function ExpensesPage() {
  const [month, setMonth] = useState(String(dayjs().month() + 1));
  const [year, setYear] = useState(String(dayjs().year()));
  const [summary, setSummary] = useState([]);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: dayjs().month(i).format('MMMM'),
  }));
  const years = ['2024', '2025', '2026'].map((y) => ({ value: y, label: y }));

  useEffect(() => {
    fetchData();
  }, [month, year]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryRes, trendRes] = await Promise.all([
        getMonthlySummary(month, year),
        getDailyTrend({ days: 30 }),
      ]);
      setSummary(summaryRes.data);
      setTrend(trendRes.data);
    } finally {
      setLoading(false);
    }
  };

  const barData = summary.map((s) => ({
    name: s.name,
    Consumed: s.totalConsumed,
    'Morning': s.totalMorning,
    'Night': s.totalNight,
  }));

  const costBarData = summary.map((s) => ({
    name: s.name,
    'Total Cost (₹)': s.totalCost,
  }));

  const pieData = summary
    .filter((s) => s.totalConsumed > 0)
    .map((s, i) => ({
      name: s.name,
      value: s.totalConsumed,
      color: PIE_COLORS[i % PIE_COLORS.length],
    }));

  const lineData = trend.map((d) => ({
    date: dayjs(d.date).format('DD MMM'),
    Morning: d.morning,
    Night: d.night,
    Total: d.total,
  }));

  const totalMonthConsumed = summary.reduce((a, s) => a + s.totalConsumed, 0);
  const totalMonthCost = summary.reduce((a, s) => a + s.totalCost, 0);

  if (loading)
    return (
      <Center h={400}>
        <Loader />
      </Center>
    );

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={2}>Expenses & Analytics</Title>
        <Group gap="sm">
          <Select data={months} value={month} onChange={(v) => setMonth(v || '')} w={140} />
          <Select data={years} value={year} onChange={(v) => setYear(v || '')} w={100} />
        </Group>
      </Group>

      {/* Month Summary */}
      {summary.length > 0 && (
        <>
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
            <Card withBorder p="md" radius="md">
              <Text c="dimmed" size="xs" tt="uppercase" fw={500}>
                Total Consumed
              </Text>
              <Text fw={700} size="xl" c="blue">
                {totalMonthConsumed}
              </Text>
              <Text size="xs" c="dimmed">
                this month
              </Text>
            </Card>
            <Card withBorder p="md" radius="md">
              <Text c="dimmed" size="xs" tt="uppercase" fw={500}>
                Total Cost
              </Text>
              <Text fw={700} size="xl" c="teal">
                ₹{totalMonthCost}
              </Text>
              <Text size="xs" c="dimmed">
                this month
              </Text>
            </Card>
            {summary[0] && (
              <Card withBorder p="md" radius="md">
                <Text c="dimmed" size="xs" tt="uppercase" fw={500}>
                  Price/Tiffin
                </Text>
                <Text fw={700} size="xl">
                  ₹{summary[0].pricePerTiffin}
                </Text>
              </Card>
            )}
            <Card withBorder p="md" radius="md">
              <Text c="dimmed" size="xs" tt="uppercase" fw={500}>
                Members
              </Text>
              <Text fw={700} size="xl">
                {summary.length}
              </Text>
            </Card>
          </SimpleGrid>

          {/* Per-member Cards */}
          <Title order={4}>Per Member — {dayjs().month(parseInt(month) - 1).format('MMMM')} {year}</Title>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
            {summary.map((s, i) => (
              <Card key={s.userId} withBorder shadow="sm" p="lg" radius="md">
                <Group justify="space-between" mb="sm">
                  <Text fw={600}>{s.name}</Text>
                  <Badge color={MEMBER_COLORS[i % MEMBER_COLORS.length].split('.')[0]}>
                    {s.totalConsumed} tiffins
                  </Badge>
                </Group>
                <SimpleGrid cols={2} spacing="xs">
                  <div>
                    <Text c="dimmed" size="xs">
                      Morning
                    </Text>
                    <Text fw={600} size="sm">
                      {s.totalMorning}
                    </Text>
                  </div>
                  <div>
                    <Text c="dimmed" size="xs">
                      Night
                    </Text>
                    <Text fw={600} size="sm">
                      {s.totalNight}
                    </Text>
                  </div>
                  <div>
                    <Text c="dimmed" size="xs">
                      Days Active
                    </Text>
                    <Text fw={600} size="sm">
                      {s.daysWithEntry}
                    </Text>
                  </div>
                  <div>
                    <Text c="dimmed" size="xs">
                      Total Cost
                    </Text>
                    <Text fw={700} size="sm" c="teal">
                      ₹{s.totalCost}
                    </Text>
                  </div>
                </SimpleGrid>
              </Card>
            ))}
          </SimpleGrid>

          <Divider />

          {/* Bar Chart — Consumption */}
          <Card withBorder shadow="sm" p="lg" radius="md">
            <Text fw={600} mb="md">
              Consumption Breakdown
            </Text>
            <BarChart
              h={260}
              data={barData}
              dataKey="name"
              series={[
                { name: 'Morning', color: 'orange.5' },
                { name: 'Night', color: 'blue.5' },
                { name: 'Consumed', color: 'teal.5' },
              ]}
              tickLine="xy"
            />
          </Card>

          {/* Bar Chart — Cost */}
          <Card withBorder shadow="sm" p="lg" radius="md">
            <Text fw={600} mb="md">
              Cost Per Member (₹)
            </Text>
            <BarChart
              h={220}
              data={costBarData}
              dataKey="name"
              series={[{ name: 'Total Cost (₹)', color: 'grape.5' }]}
              tickLine="xy"
            />
          </Card>

          {/* Pie Chart */}
          {pieData.length > 0 && (
            <Card withBorder shadow="sm" p="lg" radius="md">
              <Text fw={600} mb="md">
                Consumption Distribution
              </Text>
              <Group justify="center">
                <PieChart
                  h={260}
                  data={pieData}
                  withLabels
                  withTooltip
                  tooltipDataSource="segment"
                />
              </Group>
            </Card>
          )}
        </>
      )}

      {/* Daily Trend Line Chart */}
      {trend.some((t) => t.total > 0) && (
        <Card withBorder shadow="sm" p="lg" radius="md">
          <Text fw={600} mb="md">
            Daily Trend — Last 30 Days
          </Text>
          <LineChart
            h={260}
            data={lineData}
            dataKey="date"
            series={[
              { name: 'Morning', color: 'orange.5' },
              { name: 'Night', color: 'blue.5' },
              { name: 'Total', color: 'teal.6' },
            ]}
            curveType="monotone"
            withDots={false}
          />
        </Card>
      )}

      {summary.length === 0 && !trend.some((t) => t.total > 0) && (
        <Card withBorder p="xl">
          <Text c="dimmed" ta="center">
            No data available for this period.
          </Text>
        </Card>
      )}
    </Stack>
  );
}
