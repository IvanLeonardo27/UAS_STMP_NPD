import { Redirect } from 'expo-router';
import React from 'react';

import { useAuth } from '@/context/AuthContext';

export default function Index() {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) return null;

  return <Redirect href={(isLoggedIn ? '/(main)' : '/(auth)/login') as any} />;
}
