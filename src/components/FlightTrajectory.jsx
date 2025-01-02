import React from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Line as DreiLine } from '@react-three/drei';
import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';

const PulsingSphereMaterial = {
    uniforms: {
        color: { value: new THREE.Color('#a3e635') },
        time: { value: 0 },
        pulseColor: { value: new THREE.Color('#ffffff') },
        triggerTime: { value: -1000.0 },
        triggerStrength: { value: 0.0 }
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      uniform vec3 pulseColor;
      uniform float time;
      uniform float triggerTime;
      uniform float triggerStrength;
      varying vec3 vNormal;
      varying vec3 vPosition;
      
      void main() {
        // Triggered pulse with enhanced effect
        float timeSinceTrigger = time - triggerTime;
        float triggerPulse = exp(-timeSinceTrigger * 2.5) * triggerStrength;
        
        // Enhanced fresnel effect
        float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);
        
        // Create inner glow based on distance from center
        float radius = length(vPosition);
        float innerGlow = smoothstep(0.0, 0.2, radius);
        
        // Combine effects
        float pulseStrength = max(fresnel, innerGlow) * triggerPulse;
        float finalPulse = pulseStrength * (1.0 + triggerPulse);
        
        // Enhanced color mixing
        vec3 glowColor = mix(color, pulseColor, triggerPulse);
        vec3 finalColor = mix(color, glowColor, finalPulse);
        
        // Add extra brightness during pulse peaks
        finalColor += pulseColor * triggerPulse * 0.4;
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `
};

const RocketPath = () => {
    const points = useMemo(() => {
        const pts = [];
        for (let i = 0; i <= 100; i++) {
            const t = i / 100;
            pts.push([
                Math.cos(t * Math.PI * 2) * (1 - t) * 2,
                t * 10,
                Math.sin(t * Math.PI * 2) * (1 - t) * 2
            ]);
        }
        return pts;
    }, []);

    const rocketRef = useRef();
    const materialRef = useRef();

    const triggerPulse = useCallback(() => {
        if (materialRef.current) {
            materialRef.current.uniforms.triggerTime.value = materialRef.current.uniforms.time.value;
            materialRef.current.uniforms.triggerStrength.value = 1.0;
        }
    }, []);

    useFrame(({ clock }) => {
        if (rocketRef.current) {
            const t = (clock.getElapsedTime() % 5) / 5;
            const index = Math.floor(t * (points.length - 1));
            const nextIndex = Math.min(index + 1, points.length - 1);

            const alpha = t * (points.length - 1) - index;
            rocketRef.current.position.x = points[index][0] * (1 - alpha) + points[nextIndex][0] * alpha;
            rocketRef.current.position.y = points[index][1] * (1 - alpha) + points[nextIndex][1] * alpha;
            rocketRef.current.position.z = points[index][2] * (1 - alpha) + points[nextIndex][2] * alpha;

            const dir = new THREE.Vector3().fromArray(points[nextIndex]).sub(rocketRef.current.position).normalize();
            rocketRef.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);

            if (materialRef.current) {
                materialRef.current.uniforms.time.value = clock.getElapsedTime();

                if (materialRef.current.uniforms.triggerStrength.value > 0) {
                    materialRef.current.uniforms.triggerStrength.value *= 0.95;
                }
            }
        }
    });

    // Example: Trigger pulse every 2 seconds (remove this in production)
    useFrame(({ clock }) => {
        if (clock.getElapsedTime() % 0.5 < 0.016) { // 0.016 is roughly one frame at 60fps
            triggerPulse();
        }
    });

    return (
        <group>
            <DreiLine
                points={points}
                color="white"
                lineWidth={2}
            />
            <mesh ref={rocketRef}>
                <sphereGeometry args={[0.2]} />
                <shaderMaterial
                    ref={materialRef}
                    args={[PulsingSphereMaterial]}
                    attach="material"
                />
            </mesh>
        </group>
    );
};

const CanvasResizer = () => {
    const { size, camera, gl } = useThree();

    useEffect(() => {
        camera.aspect = size.width / size.height;
        camera.updateProjectionMatrix();
        gl.setSize(size.width, size.height);
    }, [size, camera, gl]);

    return null;
};

function FlightTrajectory() {
    const containerRef = useRef();
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const { clientWidth, clientHeight } = containerRef.current;
                setDimensions({
                    width: clientWidth,
                    height: clientHeight
                });
            }
        };

        updateDimensions();

        const observer = new ResizeObserver(updateDimensions);
        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => {
            if (containerRef.current) {
                observer.unobserve(containerRef.current);
            }
        };
    }, []);

    return (
        <div className="w-[30%] min-w-0" data-swapy-slot="3">
            <div
                ref={containerRef}
                data-swapy-item="c"
                className="border-2 border-[#201F1F] rounded-md flex flex-col h-full w-full overflow-hidden backdrop-blur-sm"
            >
                <div className="w-full bg-[#09090B] flex items-center py-1 px-2 border-b-2 border-[#201F1F] drag-handle cursor-move select-none" data-swapy-handle>
                    <p className="text-[#9CA3AF] text-lg">Flight Trajectory</p>
                </div>
                <div className="flex-1 overflow-hidden flex relative">
                    {dimensions.width > 0 && dimensions.height > 0 && (
                        <Canvas
                            style={{
                                width: dimensions.width,
                                height: dimensions.height,
                                position: 'absolute',
                                left: 0,
                                top: 0
                            }}
                            camera={{ position: [5, 8, 5], fov: 75 }}
                        >
                            <CanvasResizer />
                            <ambientLight intensity={0.5} />
                            <pointLight position={[10, 10, 10]} />
                            <gridHelper args={[10, 10]} />
                            <RocketPath />
                            <OrbitControls
                                enablePan={true}
                                enableZoom={true}
                                enableRotate={true}
                            />
                        </Canvas>
                    )}
                </div>
            </div>
        </div>
    );
}

export default FlightTrajectory;