
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/* eslint-disable */

// Payment Success Page
'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

/**
 * ConfettiCanvas - simple canvas confetti (no deps).
 * Fires a few bursts and stops automatically after `durationMs`.
 */
function ConfettiCanvas({ trigger, durationMs = 4500 }: { trigger: boolean; durationMs?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const particlesRef = useRef<any[]>([]);
  const runningRef = useRef(false);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!trigger) return;
    const canvas = document.createElement('canvas');
    canvasRef.current = canvas;
    canvas.style.position = 'fixed';
    canvas.style.left = '0';
    canvas.style.top = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d')!;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    // util: random
    const rand = (min: number, max: number) => Math.random() * (max - min) + min;

    // theme colors (gold / orange / white / deep red)
    const colors = ['#FFD54F', '#FFB300', '#FFFFFF', '#FF8A00'];

    // create a burst of particles at (x,y)
    const createBurst = (x: number, y: number, count = 28) => {
      for (let i = 0; i < count; i++) {
        const angle = rand(0, Math.PI * 2);
        const speed = rand(2, 9);
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed + rand(-1.5, 1.5),
          vy: Math.sin(angle) * speed * 0.7 + rand(-2, 2),
          size: rand(6, 12),
          color: colors[Math.floor(rand(0, colors.length))],
          rot: rand(0, Math.PI * 2),
          rotSpeed: rand(-0.2, 0.2),
          drag: rand(0.995, 0.998),
          gravity: 0.18 + Math.random() * 0.12,
          life: 1,
          decay: rand(0.008, 0.016),
        });
      }
    };

    // schedule a few bursts across top area for a lively effect
    const width = window.innerWidth;
    const height = window.innerHeight;
    createBurst(width * 0.5, height * 0.18, 30);
    setTimeout(() => createBurst(width * 0.35, height * 0.12, 22), 170);
    setTimeout(() => createBurst(width * 0.65, height * 0.14, 24), 330);
    setTimeout(() => createBurst(width * 0.5, height * 0.06, 20), 650);

    runningRef.current = true;
    startRef.current = performance.now();

    const draw = (now: number) => {
      if (!runningRef.current) return;
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        // physics
        p.vx *= p.drag;
        p.vy *= p.drag;
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.rotSpeed;
        p.life -= p.decay;

        // draw rectangle confetti rotated
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        // make some pieces thinner/longer by alternating shape
        if ((i + 3) % 3 === 0) {
          ctx.fillRect(-p.size * 0.7, -p.size * 0.35, p.size * 1.4, p.size * 0.7);
        } else {
          ctx.fillRect(-p.size * 0.35, -p.size * 0.7, p.size * 0.7, p.size * 1.4);
        }
        ctx.restore();

        // remove off-screen or dead
        if (p.y > window.innerHeight + 50 || p.x < -50 || p.x > window.innerWidth + 50 || p.life <= 0) {
          particles.splice(i, 1);
        }
      }

      // stop if time exceeded and no more particles
      if (startRef.current && now - startRef.current > durationMs && particles.length === 0) {
        runningRef.current = false;
        // cleanup
        cancelAnimationFrame(rafRef.current ?? 0);
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
        window.removeEventListener('resize', resize);
        return;
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    // final cleanup on unmount
    return () => {
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current ?? 0);
      window.removeEventListener('resize', resize);
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    };
  }, [trigger, durationMs]);

  return null;
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    member_id: string;
    registration_id: string;
    transaction_id: string;
    full_name: string;
    phone_number: string;
  } | null>(null);

  // flag to trigger confetti when payment is verified
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const memberId = searchParams.get('member_id');
    const registrationId = searchParams.get('registration_id');
    const transactionId = searchParams.get('transaction');

    if (!memberId || !registrationId || !transactionId) {
      setError('Invalid payment confirmation link');
      setLoading(false);
      return;
    }

    // Verify the IDs with the server
    fetch(`/api/payment/verify-success?member_id=${memberId}&registration_id=${registrationId}&transaction=${transactionId}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setData({
            member_id: result.member_id,
            registration_id: result.registration_id,
            transaction_id: result.transaction_id,
            full_name: result.full_name,
            phone_number: result.phone_number,
          });
          // trigger confetti celebration
          setTimeout(() => setShowConfetti(true), 120); // slight delay so UI is painted
        } else {
          setError(result.error || 'Invalid payment confirmation');
          setTimeout(() => {
            router.push('/');
          }, 3000);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Verification error:', err);
        setError('Failed to verify payment');
        setLoading(false);
        setTimeout(() => {
          router.push('/');
        }, 3000);
      });
  }, [searchParams, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
           style={{ background: 'linear-gradient(135deg,#B71C1C 0%, #e64a19 50%, #ff9800 100%)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2"
             style={{ borderColor: '#FFD54F' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen py-12 px-4"
           style={{ background: 'linear-gradient(135deg,#B71C1C 0%, #e64a19 50%, #ff9800 100%)' }}>
        <div className="max-w-2xl mx-auto">
          <div className="rounded-lg shadow-lg p-8 text-center"
               style={{
                 background: 'rgba(255,255,255,0.06)',
                 border: '1px solid rgba(255,255,255,0.08)'
               }}>
            <div className="mb-4" style={{ fontSize: 36, color: '#FFD54F' }}>⚠️</div>
            <h1 className="text-2xl font-bold mb-4" style={{ color: '#FFFFFF' }}>
              {error}
            </h1>
            <p className="mb-6" style={{ color: 'rgba(255, 213, 79, 0.9)' }}>
              This payment confirmation link is invalid or has been tampered with.
            </p>
            <p className="text-sm" style={{ color: 'rgba(255, 213, 79, 0.85)' }}>
              Redirecting to home page...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen py-12 px-4"
           style={{ background: 'linear-gradient(135deg,#B71C1C 0%, #e64a19 50%, #ff9800 100%)' }}>
        <div className="max-w-2xl mx-auto">
          <div className="rounded-lg shadow-lg p-8 text-center"
               style={{
                 background: 'rgba(255,255,255,0.06)',
                 border: '1px solid rgba(255,255,255,0.08)'
               }}>
            <div className="mb-4" style={{ fontSize: 36, color: '#FFD54F' }}>⚠️</div>
            <h1 className="text-2xl font-bold mb-4" style={{ color: '#FFFFFF' }}>
              Invalid Request
            </h1>
            <p className="mb-6" style={{ color: 'rgba(255, 213, 79, 0.9)' }}>
              Registration details not found.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 rounded-md font-medium"
              style={{
                background: 'linear-gradient(90deg,#B71C1C,#e64a19)',
                color: '#ffffff'
              }}
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4"
         style={{ background: 'linear-gradient(135deg,#B71C1C 0%, #e64a19 50%, #ff9800 100%)' }}>
      {showConfetti && <ConfettiCanvas trigger={showConfetti} durationMs={4500} />}

      <div className="max-w-2xl mx-auto">
        <div className="rounded-lg shadow-lg p-8 text-center"
             style={{
               background: 'rgba(255,255,255,0.06)',
               border: '1px solid rgba(255,255,255,0.08)'
             }}>
          {/* Success Icon */}
          <div className="mb-6">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                 style={{ background: 'linear-gradient(90deg,#FFD54F,#FFB300)' }}>
              <svg
                className="w-10 h-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: '#7b2a00' }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#fff' }}>
              Payment Successful!
            </h1>
            <p className="text-xl" style={{ color: 'rgba(255, 213, 79, 0.95)' }}>
              చెల్లింపు విజయవంతమైంది!
            </p>
          </div>

          {/* Registration Details */}
          <div className="rounded-lg p-6 mb-6"
               style={{ background: 'rgba(0,0,0,0.18)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <p className="mb-4" style={{ color: '#fff' }}>
              Your registration has been completed successfully.
            </p>
            <p className="text-sm mb-4" style={{ color: 'rgba(255, 213, 79, 0.9)' }}>
              మీ నమోదు విజయవంతంగా పూర్తయింది.
            </p>

            <div className="rounded-lg p-4 space-y-3"
                 style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)' }}>
              <div className="mb-3 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <p className="text-xs" style={{ color: 'rgba(255, 213, 79, 0.9)' }}>Name</p>
                <p className="text-lg font-semibold" style={{ color: '#fff' }}>
                  {data.full_name}
                </p>
                <p className="text-sm" style={{ color: 'rgba(255, 213, 79, 0.85)' }}>{data.phone_number}</p>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <p className="text-xs" style={{ color: 'rgba(255, 213, 79, 0.9)' }}>Member ID</p>
                  <p className="text-xl font-bold font-mono" style={{ color: '#FFD54F' }}>
                    {data.member_id}
                  </p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: 'rgba(255, 213, 79, 0.9)' }}>Registration ID</p>
                  <p className="text-sm font-mono" style={{ color: '#fff' }}>
                    {data.registration_id}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-3 mb-6">
            <p className="text-sm" style={{ color: 'rgba(255, 213, 79, 0.9)' }}>
              Please save your Member ID and Registration ID for future reference.
            </p>
            <p className="text-sm" style={{ color: 'rgba(255, 213, 79, 0.9)' }}>
              Please collect your ID card from the front desk at the camp venue.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => window.location.href = '/profile'}
              className="px-6 py-3 rounded-md font-medium"
              style={{
                background: 'linear-gradient(90deg,#B71C1C,#e64a19)',
                color: '#ffffff'
              }}
            >
              Go to Profile
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 rounded-md"
              style={{
                background: 'linear-gradient(90deg,#FFD54F,#FFB300)',
                color: '#7b2a00'
              }}
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center"
         style={{ background: 'linear-gradient(135deg,#B71C1C 0%, #e64a19 50%, #ff9800 100%)' }}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#FFD54F' }}></div>
        <p style={{ color: 'rgba(255, 213, 79, 0.95)' }}>Loading...</p>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
