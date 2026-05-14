"use client";

import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    window.location.replace('/dashboard');
  }, []);
  return <div className="bg-gray-50 min-h-screen" />;
}
