'use client';

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Carousel3D from './Carousel3D'
// import UnicornBackground from './unicorn/UnicornBackground'
import { Button } from '@/components/ui/button'
import YC26bgu from './unicorn/YC26bgu';

const Hero = () => {
  return (
    <section className="relative w-full min-h-screen text-foreground overflow-hidden transition-colors duration-300 pb-12 -mt-[70px]">
      {/* Fallback Gradient Background - Shows while Unicorn loads */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#B8282D] via-[#D84A3F] to-[#F58649] z-0" />
      
      {/* Unicorn Studio Gradient Background Component - Only for Hero */}
      <YC26bgu />

      {/* Hero Content */}
      <div className="relative z-10 w-full min-h-screen dark">
        <div className="flex flex-col items-center justify-center min-h-screen px-5 py-5 text-center relative lg:px-20 lg:py-5">
          {/* YESCA Logo */}
          <div className="mb-5 drop-shadow-[0_0_20px_rgba(var(--foreground)/0.3)] lg:mb-5">
            <Image
              src="/images/logo.png"
              alt="YESCA Logo"
              width={50}
              height={100}
              className="w-16 h-16 md:w-12 md:h-12 lg:w-12 lg:h-12 xl:w-12 xl:h-12 object-contain dark:invert-0 invert transition-all duration-300"
              priority
            />
          </div>

          {/* Organization Name */}
          <div className="text-xs font-light text-white/80 tracking-[3px] mb-0 uppercase opacity-100 leading-relaxed md:text-sm md:tracking-[2px] md:mb-0 lg:text-base lg:mb-0">
            YOUTH EVANGELISTIC SOLDIERS OF CHRISTIAN ASSEMBLIES
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl text-[#e1e1e1] my-2 leading-normal drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)] pacifico-font tracking-wide md:text-5xl md:my-2 lg:text-7xl lg:my-10 lg:mb-10 xl:text-[86px]">
            Empowering 
  Youth in Christ
          </h1>

          {/* Action Buttons */}
          <div className="flex gap-4 mb-8 md:mb-10 lg:mb-12">
            <Link href="/signin">
              <Button variant="default" size="lg" className="font-semibold">
                Sign In
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg" 
              className="font-semibold"
              onClick={() => {
                document.getElementById('registration-section')?.scrollIntoView({ 
                  behavior: 'smooth',
                  block: 'start'
                });
              }}
            >
              Register
            </Button>
          </div>

          {/* 3D Carousel */}
          <div className="w-full my-8 flex justify-center items-center md:my-10 lg:my-15 z-50">
            <Carousel3D />
          </div>

          {/* Bottom Text */}
          <div className="mt- text-center">
            <h2 className="text-xl font-bold text-foreground mb-1 uppercase tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)] font-[DIN_Pro_Bold,DIN_Pro,Arial,sans-serif] md:text-2xl md:mb-1 lg:text-2xl lg:mb-0">
              30 YEARS OF BUILDING
            </h2>
            <h3 className="text-xl font-bold text-foreground m-0 uppercase tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)] font-[DIN_Pro_Bold,DIN_Pro,Arial,sans-serif] md:text-2xl lg:text-2xl">
              YOUTH IN FAITH AND CHRISTIANITY
            </h3>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
