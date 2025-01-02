import React from 'react'
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { useRef, useEffect, useState } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import * as THREE from 'three';

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

const CanvasResizer = () => {
    const { size, camera, gl } = useThree();

    useEffect(() => {
        camera.aspect = size.width / size.height;
        camera.updateProjectionMatrix();
        gl.setSize(size.width, size.height);
    }, [size, camera, gl]);

    return null;
};

const RocketModel = ({ rotation }) => {
    const gltf = useGLTF("/Rocket.gltf");
    const modelRef = useRef();
    const groupRef = useRef();
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        if (gltf.scene && !isInitialized) {
            const boundingBox = new THREE.Box3().setFromObject(gltf.scene);
            const center = boundingBox.getCenter(new THREE.Vector3());
            gltf.scene.position.sub(center);

            gltf.scene.rotation.set(-Math.PI / 2, 0, 0);

            const newColor = new THREE.Color("#9CA3AF");
            gltf.scene.traverse((child) => {
                if (child.isMesh) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => {
                            material.transparent = true;
                            material.opacity = 0.5;
                            material.color = newColor;
                        });
                    } else {
                        child.material.transparent = true;
                        child.material.opacity = 0.5;
                        child.material.color = newColor;
                    }
                }
            });

            setIsInitialized(true);
        }
    }, [gltf, isInitialized]);

    useEffect(() => {
        if (groupRef.current && isInitialized) {            
            const yawRad = THREE.MathUtils.degToRad(rotation.yaw);
            const pitchRad = THREE.MathUtils.degToRad(rotation.pitch);
            const rollRad = THREE.MathUtils.degToRad(rotation.roll);

            const quaternion = new THREE.Quaternion();
            const euler = new THREE.Euler(pitchRad, yawRad, rollRad, 'YXZ');
            quaternion.setFromEuler(euler);

            groupRef.current.setRotationFromQuaternion(quaternion);
        }
    }, [rotation, isInitialized]);

    return (
        <group ref={groupRef}>
            <primitive ref={modelRef} object={gltf.scene} />
        </group>
    );
};

function Orientation({ rotation }) {
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
        <div className="flex-1 min-w-0" data-swapy-slot="2">
            <div ref={containerRef} data-swapy-item="b" className="border-2 border-[#201F1F] rounded-md flex flex-col h-full w-full overflow-hidden backdrop-blur-sm">
                <div className="w-full bg-[#09090B] flex items-center py-1 px-2 border-b-2 border-[#201F1F] drag-handle cursor-move select-none" data-swapy-handle>
                    <p className="text-[#9CA3AF] text-lg">Orientation</p>
                </div>
                <div className="flex-1 overflow-hidden flex relative">
                    <div className="absolute inset-0 h-full w-full bg-[radial-gradient(#201F1F_1px,transparent_1px)] [background-size:9px_9px]" />
                    {dimensions.width > 0 && dimensions.height > 0 && (
                        <Canvas
                            style={{
                                width: dimensions.width,
                                height: dimensions.height,
                                position: 'absolute',
                                left: 0,
                                top: 0
                            }}
                            camera={{
                                position: [4, 0, 0],
                                fov: 50,
                                near: 0.1,
                                far: 1000,
                                up: [0, 1, 0]
                            }}
                        >
                            <axesHelper args={[1]} />
                            <CanvasResizer />
                            <ambientLight intensity={0.5} />
                            <pointLight position={[10, 10, 10]} />
                            <RocketModel rotation={rotation} />
                            <OrbitControls
                                enableZoom={true}
                                enableRotate={true}
                                enablePan={false}
                                target={[0, 0, 0]}
                            />
                        </Canvas>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Orientation