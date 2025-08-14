"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCallback, useEffect, useState } from "react";
import type { Container, Engine } from "tsparticles";
import { loadSlim } from "tsparticles-slim";
import Particles from "react-tsparticles";

interface LoginScreenProps {
  onLogin: (userInfo: { name: string; email: string }) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [init, setInit] = useState(false);

  const handleDemoLogin = () => {
    onLogin({
      name: "Jane",
      email: "jane.doe@example.com",
    });
  };

  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  const particlesLoaded = useCallback(
    async (container: Container | undefined) => {
      console.log("Particles loaded");
    },
    [],
  );

  useEffect(() => {
    setInit(true);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative">
      {init && (
        <Particles
          id="tsparticles"
          init={particlesInit}
          loaded={particlesLoaded}
          options={{
            background: {
              color: {
                value: "transparent",
              },
            },
            fpsLimit: 120,
            interactivity: {
              events: {
                onClick: {
                  enable: true,
                  mode: "push",
                },
                onHover: {
                  enable: true,
                  mode: "repulse",
                },
                resize: true,
              },
              modes: {
                push: {
                  quantity: 4,
                },
                repulse: {
                  distance: 100,
                  duration: 0.4,
                },
              },
            },
            particles: {
              color: {
                value: "#6b7280", // еще более темный серый
              },
              links: {
                color: "#9ca3af", // темнее для связей
                distance: 150,
                enable: true,
                opacity: 0.4, // менее прозрачный
                width: 1,
              },
              move: {
                direction: "none",
                enable: true,
                outModes: {
                  default: "bounce",
                },
                random: false,
                speed: 1, // медленная скорость
                straight: false,
              },
              number: {
                density: {
                  enable: true,
                  value_area: 800,
                },
                value: 50, // небольшое количество частиц
              },
              opacity: {
                value: 0.4, // чуть менее прозрачные частицы
              },
              shape: {
                type: "circle",
              },
              size: {
                value: { min: 1, max: 3 }, // маленькие частицы
              },
            },
            detectRetina: true,
          }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 0, // убедимся что частицы находятся в фоне
          }}
        />
      )}
      <Card className="w-full max-w-md relative z-20 bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              fill="#3b3e45"
              viewBox="0 0 256 256"
            >
              <path
                d="M240,124a48,48,0,0,1-32,45.27h0V176a40,40,0,0,1-80,0,40,40,0,0,1-80,0v-6.73h0a48,48,0,0,1,0-90.54V72a40,40,0,0,1,80,0,40,40,0,0,1,80,0v6.73A48,48,0,0,1,240,124Z"
                opacity="0.2"
              ></path>
              <path d="M248,124a56.11,56.11,0,0,0-32-50.61V72a48,48,0,0,0-88-26.49A48,48,0,0,0,40,72v1.39a56,56,0,0,0,0,101.2V176a48,48,0,0,0,88,26.49A48,48,0,0,0,216,176v-1.41A56.09,56.09,0,0,0,248,124ZM88,208a32,32,0,0,1-31.81-28.56A55.87,55.87,0,0,0,64,180h8a8,8,0,0,0,0-16H64A40,40,0,0,1,50.67,86.27,8,8,0,0,0,56,78.73V72a32,32,0,0,1,64,0v68.26A47.8,47.8,0,0,0,88,128a8,8,0,0,0,0,16,32,32,0,0,1,0,64Zm104-44h-8a8,8,0,0,0,0,16h8a55.87,55.87,0,0,0,7.81-.56A32,32,0,1,1,168,144a8,8,0,0,0,0-16,47.8,47.8,0,0,0-32,12.26V72a32,32,0,0,1,64,0v6.73a8,8,0,0,0,5.33,7.54A40,40,0,0,1,192,164Zm16-52a8,8,0,0,1-8,8h-4a36,36,0,0,1-36-36V80a8,8,0,0,1,16,0v4a20,20,0,0,0,20,20h4A8,8,0,0,1,208,112ZM60,120H56a8,8,0,0,1,0-16h4A20,20,0,0,0,80,84V80a8,8,0,0,1,16,0v4A36,36,0,0,1,60,120Z"></path>
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold text-center text-gray-900">
            Welcome to Agents Dashboard
          </CardTitle>
          <CardDescription className="text-center text-gray-600">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white hover:text-white relative z-10"
            onClick={handleDemoLogin}
          >
            Sign In
          </Button>

          <div className="text-center text-sm text-gray-500">
            <p>This is a demo implementation.</p>
            <p>Real Auth0 integration coming soon.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
