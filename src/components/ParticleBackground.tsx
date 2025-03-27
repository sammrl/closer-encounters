import React, { useRef, useEffect } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
  alpha: number;
  twinkle: number;
  twinkleSpeed: number;
  twinklePause: number;
  brightness: number;
}

interface ParticleBackgroundProps {
  particleCount?: number;
  particleColors?: string[];
  maxSize?: number;
  maxSpeed?: number;
  connectParticles?: boolean;
  lineColor?: string;
  lineWidth?: number;
  mouseInteraction?: boolean;
}

const ParticleBackground: React.FC<ParticleBackgroundProps> = ({
  particleCount = 80,
  particleColors = ['#ffffff', '#a5f3fc', '#f0f9ff'],
  maxSize = 3,
  maxSpeed = 0.5,
  connectParticles = true,
  lineColor = 'rgba(100, 200, 255, 0.15)',
  lineWidth = 0.5,
  mouseInteraction = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef<{ x: number | null; y: number | null }>({ x: null, y: null });
  const requestIdRef = useRef<number>(0);
  const isInitializedRef = useRef<boolean>(false);

  // Create random particles
  const createParticles = (width: number, height: number) => {
    const particles: Particle[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      // Create more variance in particle sizes
      const sizeVariance = Math.random();
      const isBrightStar = Math.random() < 0.05; // 5% chance of a bright star
      const isMediumStar = Math.random() < 0.15; // 15% chance of a medium star
      
      const starSize = isBrightStar ? maxSize * (1.2 + Math.random() * 0.8) : 
                      isMediumStar ? maxSize * (0.7 + Math.random() * 0.5) : 
                      sizeVariance * maxSize * 0.7 + 0.3;
      
      // More randomized twinkling speeds - much slower overall
      const twinkleSpeed = 0.003 + Math.random() * 0.01; // 3-10x slower than before
      
      // Random pause time between twinkles
      const twinklePause = Math.random() * 100;
      
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: starSize,
        speedX: (Math.random() - 0.5) * maxSpeed * 0.3, // Even slower movement for stars
        speedY: (Math.random() - 0.5) * maxSpeed * 0.3,
        color: particleColors[Math.floor(Math.random() * particleColors.length)],
        alpha: Math.random() * 0.6 + 0.4,
        twinkle: Math.random() * Math.PI * 2, // Random starting point for twinkle
        twinkleSpeed: twinkleSpeed,
        twinklePause: twinklePause,
        brightness: isBrightStar ? 1.2 : isMediumStar ? 0.9 : 0.6 + Math.random() * 0.3
      });
    }
    
    return particles;
  };

  // Draw a single particle
  const drawParticle = (ctx: CanvasRenderingContext2D, particle: Particle) => {
    // Update twinkle phase more realistically with pauses
    if (Math.sin(particle.twinkle) < -0.9) {
      // When at minimum brightness, potentially pause
      if (Math.random() < 0.01) { // Only occasionally increment during pause
        particle.twinkle += particle.twinkleSpeed * 0.1;
      }
    } else {
      particle.twinkle += particle.twinkleSpeed;
    }
    
    // Calculate alpha based on twinkle - more subtle for realism
    // Make the twinkle effect more asymmetric (faster brightening, slower dimming)
    const twinkleCurve = Math.sin(particle.twinkle);
    let twinkleAlpha;
    
    if (twinkleCurve >= 0) {
      // Brightening phase - quicker
      twinkleAlpha = (twinkleCurve * 0.3) + 0.7; // Range from 0.7 to 1.0
    } else {
      // Dimming phase - slower
      twinkleAlpha = (twinkleCurve * 0.2) + 0.7; // Range from 0.5 to 0.7
    }
    
    const finalAlpha = particle.alpha * twinkleAlpha * particle.brightness;
    
    // Enhanced glow effect for stars
    // Add atmospheric glow for all stars
    ctx.globalAlpha = finalAlpha * 0.15;
    ctx.fillStyle = particle.color;
    
    // First outer glow - very faint
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size * 3, 0, 2 * Math.PI);
    ctx.fill();
    
    // Middle glow
    ctx.globalAlpha = finalAlpha * 0.3;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size * 1.5, 0, 2 * Math.PI);
    ctx.fill();
    
    // Core star
    ctx.globalAlpha = finalAlpha;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, 2 * Math.PI);
    ctx.fill();
    
    // Add starlight cross effect for brightest stars
    if (particle.size > maxSize * 0.9 && finalAlpha > 0.7) {
      ctx.globalAlpha = finalAlpha * 0.4;
      ctx.beginPath();
      // Horizontal line
      ctx.moveTo(particle.x - particle.size * 2, particle.y);
      ctx.lineTo(particle.x + particle.size * 2, particle.y);
      // Vertical line
      ctx.moveTo(particle.x, particle.y - particle.size * 2);
      ctx.lineTo(particle.x, particle.y + particle.size * 2);
      ctx.strokeStyle = particle.color;
      ctx.lineWidth = particle.size * 0.2;
      ctx.stroke();
    }
  };

  // Connect particles with lines if they're close enough
  const connectParticlesFunc = (ctx: CanvasRenderingContext2D, particles: Particle[], width: number, height: number) => {
    const proximityThreshold = width * 0.08;
    const maxConnections = 3;
    
    for (let i = 0; i < particles.length; i++) {
      let connections = 0;
      for (let j = i + 1; j < particles.length && connections < maxConnections; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < proximityThreshold) {
          const opacity = 1 - (distance / proximityThreshold);
          ctx.globalAlpha = opacity * 0.3; // More subtle connections
          ctx.strokeStyle = lineColor;
          ctx.lineWidth = lineWidth;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
          connections++;
        }
      }
    }
    
    // Connect to mouse position if available
    if (mouseInteraction && mouseRef.current.x !== null && mouseRef.current.y !== null) {
      const mouseProximityThreshold = width * 0.12;
      const maxMouseConnections = 5;
      
      const sorted = [...particlesRef.current]
        .map((p, idx) => {
          const dx = p.x - (mouseRef.current.x || 0);
          const dy = p.y - (mouseRef.current.y || 0);
          const distance = Math.sqrt(dx * dx + dy * dy);
          return { idx, distance };
        })
        .sort((a, b) => a.distance - b.distance)
        .slice(0, maxMouseConnections);
      
      for (const { idx, distance } of sorted) {
        if (distance < mouseProximityThreshold) {
          const particle = particlesRef.current[idx];
          const opacity = 1 - (distance / mouseProximityThreshold);
          ctx.globalAlpha = opacity * 0.5;
          ctx.strokeStyle = lineColor;
          ctx.lineWidth = lineWidth * 1.5;
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(mouseRef.current.x || 0, mouseRef.current.y || 0);
          ctx.stroke();
        }
      }
    }
  };

  // Animation frame with frame limiting
  const animate = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw particles
    particlesRef.current.forEach(particle => {
      // Update position (very slow movement)
      particle.x += particle.speedX * 0.2;
      particle.y += particle.speedY * 0.2;
      
      // Handle edge collisions
      if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
      if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;
      
      // Draw particle
      drawParticle(ctx, particle);
    });
    
    // Connect particles
    if (connectParticles) {
      connectParticlesFunc(ctx, particlesRef.current, canvas.width, canvas.height);
    }
    
    // Continue animation
    requestIdRef.current = requestAnimationFrame(animate);
  };

  // Setup canvas and start animation
  useEffect(() => {
    const canvas = canvasRef.current;
    
    if (!canvas) return;
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      if (!isInitializedRef.current) {
        particlesRef.current = createParticles(canvas.width, canvas.height);
        isInitializedRef.current = true;
      }
    };
    
    // Handle mouse movement
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    
    // Handle touch movement
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };
    
    // Handle mouse leave
    const handleMouseLeave = () => {
      mouseRef.current = { x: null, y: null };
    };
    
    // Setup event listeners
    window.addEventListener('resize', resizeCanvas);
    
    if (mouseInteraction) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('mouseleave', handleMouseLeave);
      window.addEventListener('touchend', handleMouseLeave);
    }
    
    // Initial setup
    resizeCanvas();
    
    // Start animation
    requestIdRef.current = requestAnimationFrame(animate);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      
      if (mouseInteraction) {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('mouseleave', handleMouseLeave);
        window.removeEventListener('touchend', handleMouseLeave);
      }
      
      if (requestIdRef.current) {
        cancelAnimationFrame(requestIdRef.current);
      }
    };
  }, [particleCount, maxSize, maxSpeed, connectParticles, lineColor, lineWidth, mouseInteraction]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        background: '#020408'
      }}
    />
  );
};

export default ParticleBackground; 