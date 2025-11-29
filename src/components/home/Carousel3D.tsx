'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { client } from '@/sanity/lib/client';
import { urlFor } from '@/sanity/lib/image';
import styles from './Carousel3D.module.css';

// Cache for Sanity data to avoid refetching
let cachedSanityImages: CarouselImage[] | null = null;

interface CarouselImage {
  src: string;
  alt: string;
}

interface SanityImage {
  _type: 'image';
  asset: {
    _ref: string;
    _type: 'reference';
  };
  alt?: string;
}

interface SanityCard {
  image1?: SanityImage;
  text?: string;
}

interface SanityCarousel3D {
  card1?: SanityCard;
  card2?: SanityCard;
  card3?: SanityCard;
  card4?: SanityCard;
  card5?: SanityCard;
  card6?: SanityCard;
  card7?: SanityCard;
  card8?: SanityCard;
  card9?: SanityCard;
  card10?: SanityCard;
  card11?: SanityCard;
  card12?: SanityCard;
  card13?: SanityCard;
  card14?: SanityCard;
}

interface Carousel3DProps {
  images?: CarouselImage[];
  className?: string;
  /** Enable auto-slide feature - set to true to enable, false to disable */
  autoSlide?: boolean;
  /** Auto-slide interval in milliseconds (default: 2000ms = 2 seconds) */
  autoSlideInterval?: number;
}

// ============================================
// AUTO-SLIDE CONFIGURATION
// Set to true to enable auto-slide, false to disable
const AUTO_SLIDE_ENABLED = true;
// Interval in milliseconds (2000 = 2 seconds)
const AUTO_SLIDE_INTERVAL = 2000;
// ============================================

const defaultImages: CarouselImage[] = [
  {
    src: "https://images.unsplash.com/photo-1554080353-a576cf803bda?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=75",
    alt: "Nature Photography"
  },
  {
    src: "https://images.unsplash.com/photo-1748382018115-cdcecf7b4b43?auto=format&fit=crop&w=400&q=75",
    alt: "Travel Photography"
  },
  {
    src: "https://images.unsplash.com/photo-1559827291-72ee739d0d9a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=75",
    alt: "Architecture Photography"
  },
  {
    src: "https://images.unsplash.com/photo-1587502536575-6dfba0a6e017?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=75",
    alt: "Ocean Photography"
  },
  {
    src: "https://images.unsplash.com/photo-1610128114197-485d933885c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=75",
    alt: "Wildlife Photography"
  },
  {
    src: "https://images.unsplash.com/photo-1756089882368-4060f412bd06?auto=format&fit=crop&w=400&q=75",
    alt: "Cityscape Photography"
  },
  {
    src: "https://images.unsplash.com/photo-1509549649946-f1b6276d4f35?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=75",
    alt: "Flower Photography"
  },
  {
    src: "https://images.unsplash.com/photo-1543039625-14cbd3802e7d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=75",
    alt: "Aurora Photography"
  },
  {
    src: "https://images.unsplash.com/photo-1519681393784-d120267933ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=75",
    alt: "Mountain Photography"
  },
  {
    src: "https://images.unsplash.com/photo-1559666126-84f389727b9a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=75",
    alt: "Sunrise Photography"
  },
  {
    src: "https://images.unsplash.com/photo-1501854140801-50d01698950b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=75",
    alt: "Nature Photography"
  },
  {
    src: "https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=75",
    alt: "Historical Architecture"
  },
  {
    src: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=75",
    alt: "Landscape Photography"
  },
  {
    src: "https://images.unsplash.com/photo-1682687982134-2ac563b2228b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=75",
    alt: "Night Sky Photography"
  }
];

const Carousel3D: React.FC<Carousel3DProps> = ({ 
  images, 
  className = '',
  autoSlide = AUTO_SLIDE_ENABLED,
  autoSlideInterval = AUTO_SLIDE_INTERVAL
}) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const armsRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [currentRotation, setCurrentRotation] = useState(0);
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });
  const [sanityImages, setSanityImages] = useState<CarouselImage[]>(defaultImages);
  const [loading, setLoading] = useState(true);
  const [isAutoSliding, setIsAutoSliding] = useState(autoSlide);
  const autoSlideTimerRef = useRef<NodeJS.Timeout | null>(null);

  const angleStep = 30; // 30 degrees per step (360 / 12 arms)
  const totalArms = 7; // Number of arms in the carousel

  // Fetch Sanity data with caching
  useEffect(() => {
    const fetchCarouselData = async () => {
      // Use cached data if available
      if (cachedSanityImages) {
        setSanityImages(cachedSanityImages);
        setLoading(false);
        return;
      }

      try {
        const query = `*[_type == "carousel3d"][0] {
          card1 { image1, text },
          card2 { image1, text },
          card3 { image1, text },
          card4 { image1, text },
          card5 { image1, text },
          card6 { image1, text },
          card7 { image1, text },
          card8 { image1, text },
          card9 { image1, text },
          card10 { image1, text },
          card11 { image1, text },
          card12 { image1, text },
          card13 { image1, text },
          card14 { image1, text }
        }`;
        
        const data: SanityCarousel3D = await client.fetch(query);
        
        if (data) {
          const processedImages: CarouselImage[] = [];
          
          // Process all 14 cards with optimized image sizes
          for (let i = 1; i <= 14; i++) {
            const cardKey = `card${i}` as keyof SanityCarousel3D;
            const card = data[cardKey];
            
            if (card?.image1?.asset) {
              processedImages.push({
                src: urlFor(card.image1).width(400).height(300).quality(75).auto('format').url(),
                alt: card.image1.alt || card.text || `Card ${i} Image`
              });
            }
          }
          
          // Cache the processed images
          if (processedImages.length > 0) {
            cachedSanityImages = processedImages;
            setSanityImages(processedImages);
          }
        }
      } catch (error) {
        console.error('Error fetching carousel data:', error);
        // Keep using default images on error
      } finally {
        setLoading(false);
      }
    };

    // Use passed images prop if available, otherwise fetch from Sanity
    if (images) {
      setSanityImages(images);
      setLoading(false);
    } else {
      fetchCarouselData();
    }
  }, [images]);

  // Create arms data with perfect 1:1 image distribution (7 arms × 2 images = 14 images)
  const armsData = useMemo(() => {
    const arms = [];
    const rotations = [90, 120, 150, 180, 0, 30, 60];
    
    for (let i = 0; i < totalArms; i++) {
      const leftImageIndex = (i * 2) % sanityImages.length;
      const rightImageIndex = (i * 2 + 1) % sanityImages.length;
      
      arms.push({
        rotation: rotations[i],
        leftImage: sanityImages[leftImageIndex],
        rightImage: sanityImages[rightImageIndex]
      });
    }
    
    return arms;
  }, [sanityImages, totalArms]);

  const goToIndex = useCallback((index: number, animated = true) => {
    setCurrentIndex(index);
    const targetRotation = -index * angleStep;
    
    if (animated) {
      setCurrentRotation(targetRotation);
    }
    
    if (armsRef.current) {
      armsRef.current.style.transform = `rotateY(${targetRotation}deg)`;
    }
  }, [angleStep]);

  // Auto-slide to next slide
  const goToNextSlide = useCallback(() => {
    const nextIndex = (currentIndex + 1) % totalArms;
    goToIndex(nextIndex, true);
  }, [currentIndex, totalArms, goToIndex]);

  // Auto-slide effect
  useEffect(() => {
    if (!isAutoSliding || loading || isDragging) {
      // Clear timer if auto-slide is disabled or user is interacting
      if (autoSlideTimerRef.current) {
        clearInterval(autoSlideTimerRef.current);
        autoSlideTimerRef.current = null;
      }
      return;
    }

    // Start auto-slide timer
    autoSlideTimerRef.current = setInterval(() => {
      goToNextSlide();
    }, autoSlideInterval);

    return () => {
      if (autoSlideTimerRef.current) {
        clearInterval(autoSlideTimerRef.current);
        autoSlideTimerRef.current = null;
      }
    };
  }, [isAutoSliding, loading, isDragging, autoSlideInterval, goToNextSlide]);

  // Pause auto-slide on user interaction, resume after delay
  const pauseAutoSlide = useCallback(() => {
    if (autoSlide) {
      setIsAutoSliding(false);
      // Resume auto-slide after 5 seconds of no interaction
      setTimeout(() => {
        setIsAutoSliding(true);
      }, 5000);
    }
  }, [autoSlide]);

  const handleDotClick = useCallback((index: number) => {
    pauseAutoSlide();
    goToIndex(index, true);
  }, [goToIndex, pauseAutoSlide]);

  const handleMouseDown = (e: React.MouseEvent) => {
    pauseAutoSlide();
    setIsDragging(true);
    setStartPosition({ x: e.clientX, y: e.clientY });
    
    if (carouselRef.current) {
      carouselRef.current.style.cursor = 'grabbing';
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    pauseAutoSlide();
    setIsDragging(true);
    setStartPosition({ 
      x: e.touches[0].clientX, 
      y: e.touches[0].clientY 
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !armsRef.current) return;

      const deltaX = e.clientX - startPosition.x;
      const newRotation = currentRotation + deltaX * 0.5;
      
      setCurrentRotation(newRotation);
      armsRef.current.style.transform = `rotateY(${newRotation}deg)`;
      setStartPosition({ x: e.clientX, y: e.clientY });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || !armsRef.current) return;
      
      e.preventDefault();
      const deltaX = e.touches[0].clientX - startPosition.x;
      const newRotation = currentRotation + deltaX * 0.5;
      
      setCurrentRotation(newRotation);
      armsRef.current.style.transform = `rotateY(${newRotation}deg)`;
      setStartPosition({ 
        x: e.touches[0].clientX, 
        y: e.touches[0].clientY 
      });
    };

    const handleMouseUp = () => {
      if (!isDragging) return;
      
      setIsDragging(false);
      
      if (carouselRef.current) {
        carouselRef.current.style.cursor = 'grab';
      }

      // Update active dot based on closest position
      let normalizedAngle = currentRotation % 360;
      if (normalizedAngle < 0) normalizedAngle += 360;

      const closestIndex = Math.round(normalizedAngle / angleStep) % totalArms;
      setCurrentIndex(closestIndex >= 0 ? closestIndex : 0);
    };

    const handleTouchEnd = () => {
      handleMouseUp();
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, startPosition, currentRotation, angleStep, totalArms]);

  useEffect(() => {
    // Initialize carousel
    goToIndex(0, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className={`${styles.container} ${className}`}>
        <div className={styles.carouselContainer}>
          <div className="flex items-center justify-center h-64">
            {/* Skeleton loader for carousel */}
            <div className="flex gap-4 animate-pulse">
              <div className="w-32 h-44 bg-white/10 rounded-lg" />
              <div className="w-40 h-52 bg-white/20 rounded-lg" />
              <div className="w-32 h-44 bg-white/10 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className} `}>
      <div className={styles.carouselContainer}>
        <div className={styles.preserve3d}>
          <div
            ref={carouselRef}
            className={styles.carousel}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div ref={armsRef} className={`${styles.arms} ${isDragging ? styles.dragging : ''}`}>
              {armsData.map((arm, index) => (
                <div
                  key={index}
                  className={styles.arm}
                  style={{ transform: `rotateY(${arm.rotation}deg)` }}
                >
                  <div 
                    className={styles.videoContainer} 
                    style={{ transform: 'rotateY(90deg)' }}
                  >
                    <Image
                      src={arm.leftImage.src}
                      alt={arm.leftImage.alt}
                      width={260}
                      height={370}
                      style={{ objectFit: 'cover' }}
                      priority={index < 2}
                      loading={index < 2 ? 'eager' : 'lazy'}
                      placeholder="blur"
                      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAMH/8QAIBAAAgICAgIDAAAAAAAAAAAAAQIDBAAREiEFMRNBUf/EABUBAQEAAAAAAAAAAAAAAAAAAAAB/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AyXx1l4Z4pJIlkjLKWQ9qw9g5WTTV6x+vWMYP/9k="
                    />
                  </div>
                  <div 
                    className={styles.videoContainer} 
                    style={{ transform: 'rotateY(-90deg)' }}
                  >
                    <Image
                      src={arm.rightImage.src}
                      alt={arm.rightImage.alt}
                      width={260}
                      height={370}
                      style={{ objectFit: 'cover' }}
                      priority={index < 2}
                      loading={index < 2 ? 'eager' : 'lazy'}
                      placeholder="blur"
                      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAMH/8QAIBAAAgICAgIDAAAAAAAAAAAAAQIDBAAREiEFMRNBUf/EABUBAQEAAAAAAAAAAAAAAAAAAAAB/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AyXx1l4Z4pJIlkjLKWQ9qw9g5WTTV6x+vWMYP/9k="
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation dots */}
        <div className={styles.navigation}>
          {Array.from({ length: totalArms }, (_, index) => (
            <button
              key={index}
              type="button"
              className={`${styles.dot} ${index === currentIndex ? styles.active : ''}`}
              onClick={() => handleDotClick(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Carousel3D;