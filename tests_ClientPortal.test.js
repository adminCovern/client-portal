const React = require('react');
const { render, fireEvent, waitFor } = require('@testing-library/react');
const { createClient } = require('@supabase/supabase-js');
const ClientPortal = require('../index.jsx').default;

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: null } })),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn((cb) => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => Promise.resolve({ data: [], error: null })),
      insert: jest.fn(() => Promise.resolve({ error: null })),
      delete: jest.fn(() => Promise.resolve({ error: null })),
    })),
    channel: jest.fn(() => ({
      on: jest.fn(() => ({ subscribe: jest.fn() })),
    })),
  })),
}));

describe('ClientPortal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders login form with business terminology', () => {
    const { getByText, getByLabelText } = render(<ClientPortal />);
    expect(getByText('Login')).toBeInTheDocument();
    expect(getByLabelText('Email Address')).toBeInTheDocument();
    expect(getByLabelText('Password')).toBeInTheDocument();
  });

  test('handles login error', async () => {
    const mockError = new Error('Invalid credentials');
    createClient().auth.signInWithPassword.mockRejectedValue(mockError);
    const { getByLabelText, getByText, findByText } = render(<ClientPortal />);
    fireEvent.change(getByLabelText('Email Address'), { target: { value: 'test@business.com' } });
    fireEvent.change(getByLabelText('Password'), { target: { value: 'password' } });
    fireEvent.click(getByText('Login'));
    expect(await findByText('Invalid credentials')).toBeInTheDocument();
  });

  test('applies professional styles', () => {
    const { container } = render(<ClientPortal />);
    expect(container.querySelector('.neon-glow')).toBeInTheDocument();
    expect(container.querySelector('.glitch')).toBeInTheDocument();
    expect(container.querySelector('.flicker')).toBeInTheDocument();
  });
});