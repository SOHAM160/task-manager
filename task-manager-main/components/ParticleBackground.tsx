"use client";

import { useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

export default function ParticleBackground() {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  if (!init) return null;

  return (
    <Particles
      id="tsparticles"
      options={{
        background: {
          color: "#020617"
        },
        fpsLimit: 60,
        interactivity: {
          events: {
            onHover: {
              enable: true,
              mode: "repulse"
            }
          },
          modes: {
            repulse: {
              distance: 100
            }
          }
        },
        particles: {
          color: {
            value: "#3b82f6"
          },
          links: {
            color: "#3b82f6",
            distance: 150,
            enable: true,
            opacity: 0.3
          },
          move: {
            enable: true,
            speed: 1
          },
          number: {
            value: 60
          },
          opacity: {
            value: 0.5
          },
          size: {
            value: { min: 1, max: 3 }
          }
        }
      }}
      className="absolute inset-0 -z-10"
    />
  );
}