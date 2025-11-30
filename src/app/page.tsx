// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/* eslint-disable */
'use client';

import React from 'react'
import Hero from '@/components/home/Hero'
import { About } from '@/components/ui/skiper30'
import YC26bgu from '@/components/home/unicorn/YC26bgu';
import CampCountdown from '@/components/home/CampCountdown';
import RegistrationSection from '@/components/home/RegistrationSection';
import CampDetails from '@/components/home/CampDetails';
import Footer from '@/components/home/Footer';

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <YC26bgu />
      <Hero />

      {/* About Section with Parallax Gallery */}
      <About />
      <CampCountdown />
      <RegistrationSection />
      <CampDetails />
      <Footer />
    </>
  );
}
