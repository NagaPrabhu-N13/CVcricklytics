// FireworksCanvas.jsx
import React, { useEffect, useRef } from 'react';

const FireworksCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Firework particles
    class Particle {
      constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.velocity = {
          x: (Math.random() - 0.5) * 8,
          y: (Math.random() - 0.5) * 8,
        };
        this.alpha = 1;
        this.decay = Math.random() * 0.015 + 0.01;
        this.size = Math.random() * 3 + 1;
      }

      draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      update() {
        this.velocity.y += 0.05; // Gravity effect
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= this.decay;
      }
    }

    // Firework class
    class Firework {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * canvas.width;
        this.y = canvas.height;
        this.targetY = Math.random() * canvas.height / 2;
        this.speed = 2;
        this.angle = Math.atan2(this.targetY - this.y, this.x - this.x);
        this.velocity = {
          x: 0,
          y: -this.speed,
        };
        this.particles = [];
        this.color = `hsl(${Math.random() * 360}, 100%, 50%)`; // colorful
        this.exploded = false;
      }

      explode() {
        for (let i = 0; i < 100; i++) {
          this.particles.push(new Particle(this.x, this.y, this.color));
        }
        this.exploded = true;
      }

      update() {
        if (!this.exploded) {
          this.y += this.velocity.y;
          if (this.y <= this.targetY) {
            this.explode();
          }
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
          this.particles[i].update();
          this.particles[i].draw();

          if (this.particles[i].alpha <= 0) {
            this.particles.splice(i, 1);
          }
        }

        if (this.exploded && this.particles.length === 0) {
          this.reset();
        }
      }
    }

    // Animation loop
    const fireworks = Array(5).fill().map(() => new Firework());

    function animate() {
      requestAnimationFrame(animate);
      ctx.fillStyle = 'rgba(235, 244, 255, 0.3)'; // Light bluish transparent background
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      fireworks.forEach(firework => {
        firework.update();
      });
    }

    animate();

    // Handle window resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 10,
        pointerEvents: 'none', // So user can click through
      }}
    />
  );
};

export default FireworksCanvas;
