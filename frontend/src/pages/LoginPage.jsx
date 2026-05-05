import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  TextInput,
  PasswordInput,
  Button,
  Paper,
  Title,
  Container,
  Text,
  Stack,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { login } from '../api/auth';
import useAuthStore from '../store/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const { token, setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (token) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await login(email.trim().toLowerCase(), password);
      setAuth(data.token, data.user);
      navigate('/dashboard');
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Login Failed',
        message: err.response?.data?.message || 'Invalid email or password',
        autoClose: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size={420} my={80}>
      <Title ta="center" order={1} mb={4}>
        Tiffin Manager
      </Title>
      <Text ta="center" c="dimmed" size="sm" mb="xl">
        Sign in to manage your tiffins
      </Text>
      <Paper withBorder shadow="md" p={30} radius="md">
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput
              label="Email"
              placeholder="you@example.com"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <PasswordInput
              label="Password"
              placeholder="Your password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" fullWidth loading={loading} mt="sm">
              Sign In
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
