"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const plans = [
  {
    name: "Normal Registration",
    nameTelugu: "ఒక్కరి రిజిస్ట్రేషన్ ఫీజ్",
    price: "300",
    description: "Click the button below",
    descriptionTelugu: "ఈ క్రింది బటన్ క్లిక్ చేయండి",
    buttonGradient: "from-[#C84037] to-[#E67E3A]", // Red to Orange
    borderColor: "border-[#FFD700]",
    delay: 0,
    href: "/register?type=normal",
    active: true
  },
  {
    name: "Kids Registration",
    nameTelugu: "కిడ్స్ రిజిస్ట్రేషన్ ఫీజ్",
    price: "100",
    description: "Coming Soon",
    descriptionTelugu: "త్వరలో వస్తుంది",
    buttonGradient: "from-[#E67E3A] to-[#F5A623]", // Orange to Yellow
    borderColor: "border-[#FFD700]",
    delay: 0.1,
    href: "#",
    active: false
  },
  {
    name: "Faithbox Registration",
    nameTelugu: "ఫెయిత్ బాక్స్ కలిగిన వారి రిజిస్ట్రేషన్ ఫీజ్",
    price: "50",
    description: "Click the button below",
    descriptionTelugu: "ఈ క్రింది బటన్ క్లిక్ చేయండి",
    buttonGradient: "from-[#F5A623] to-[#FFA500]", // Yellow to Gold
    borderColor: "border-[#FFD700]",
    delay: 0.2,
    href: "/register?type=faithbox",
    active: true
  },
];

export default function RegistrationSection() {
  return (
    <section className="relative w-full py-20 bg-gradient-to-b from-[#8B1A1A] to-[#C84037] overflow-hidden">
       {/* Background Pattern - Premium Dark Gradient with Noise */}
       <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255, 215, 0, 0.1) 0%, transparent 50%)`,
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
        >
            <span className="text-[#FFD700] font-[DIN_Pro] tracking-[0.2em] text-xs font-bold uppercase mb-2 block">
                Join The Event
            </span>
            <h2 className="text-4xl md:text-6xl font-black text-white font-[DIN_Pro] uppercase tracking-tight drop-shadow-2xl mb-4">
                Register Now
            </h2>
            <div className="flex items-center justify-center gap-2 opacity-50">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#FFD700]"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-[#FFD700]"></div>
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#FFD700]"></div>
            </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
                <PricingCard key={index} plan={plan} />
            ))}
        </div>
      </div>
    </section>
  );
}

interface Plan {
  name: string;
  nameTelugu: string;
  price: string;
  description: string;
  descriptionTelugu: string;
  buttonGradient: string;
  borderColor: string;
  delay: number;
  href: string;
  active: boolean;
}

function PricingCard({ plan }: { plan: Plan }) {
    const ButtonContent = (
        <div 
            className={`
                w-full py-3 px-5 rounded-lg font-bold text-white text-sm uppercase tracking-[0.15em] font-[DIN_Pro]
                bg-gradient-to-r ${plan.buttonGradient}
                shadow-lg transform transition-all duration-300
                border border-white/10
                ${plan.active 
                    ? 'hover:shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer' 
                    : 'cursor-not-allowed opacity-60 grayscale-[0.3]'
                }
            `}
        >
            {plan.active ? 'Register Now' : 'Coming Soon'}
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: plan.delay }}
            className="relative group h-full"
        >
            <div className={`
                h-full flex flex-col items-center text-center p-6 rounded-[1.5rem]
                border border-white/10 bg-white/[0.03] backdrop-blur-xl
                hover:bg-white/[0.06] transition-all duration-500
                hover:border-[#FFD700]/30 hover:shadow-[0_0_40px_rgba(255,215,0,0.1)]
                group-hover:-translate-y-2
            `}>
                {/* Top Accent Line */}
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-1 rounded-b-full bg-gradient-to-r ${plan.buttonGradient} opacity-70`} />

                <h3 className="text-xl md:text-2xl font-bold text-white mb-1 font-[DIN_Pro] tracking-tight mt-2">
                    {plan.name}
                </h3>
                <p className="text-base text-white/60 font-['Anek_Telugu'] font-medium mb-6 tracking-wide">
                    {plan.nameTelugu}
                </p>

                <div className="flex-1 flex flex-col justify-center items-center w-full mb-8 relative">
                    {/* Price Glow */}
                    <div className="absolute inset-0 bg-[#FFD700] blur-[60px] opacity-5 rounded-full" />
                    
                    <div className="relative text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#FFD700] to-[#B8860B] font-[DIN_Pro] mb-4 tracking-tighter">
                        <span className="text-3xl align-top opacity-60 mr-1">₹</span>{plan.price}
                    </div>
                    <div className="space-y-2 text-white/70 text-sm font-medium">
                        <p className="font-[DIN_Pro] tracking-wide uppercase text-xs opacity-70">{plan.description}</p>
                        <p className="font-['Anek_Telugu'] text-base">{plan.descriptionTelugu}</p>
                    </div>
                </div>

                {plan.active ? (
                    <Link href={plan.href} className="w-full">
                        {ButtonContent}
                    </Link>
                ) : (
                    ButtonContent
                )}
            </div>
        </motion.div>
    )
}
