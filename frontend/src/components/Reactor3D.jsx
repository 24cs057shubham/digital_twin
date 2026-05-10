import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Cylinder } from '@react-three/drei';
import * as THREE from 'three';

const Reactor3D = ({ telemetry }) => {
    const agitatorRef = useRef();

    // Safe defaults
    const level = telemetry?.level || 50; // 0-100
    const temp = telemetry?.temperature || 25;
    const rpm = telemetry?.agitation_rpm || 0;

    // Fluid Color: Blue (Cold) -> Purple -> Red (Hot)
    const fluidColor = useMemo(() => {
        const t = Math.min(1, Math.max(0, (temp - 25) / 100)); // 25C to 125C range
        return new THREE.Color().setHSL(0.6 * (1 - t), 1, 0.5);
    }, [temp]);

    // Fluid Height (Scale Y)
    const fluidScale = Math.max(0.05, level / 100);
    const fluidY = -1 + fluidScale; // Anchor at bottom

    useFrame((state, delta) => {
        // Spin Agitator
        if (agitatorRef.current) {
            agitatorRef.current.rotation.y += (rpm / 60) * Math.PI * 2 * delta;
        }
    });

    return (
        <group dispose={null}>
            {/* 1. Main Vessel (Glass) */}
            <mesh position={[0, 0, 0]}>
                <cylinderGeometry args={[1.5, 1.5, 2.5, 32]} />
                <meshPhysicalMaterial
                    color="#aaddff"
                    transparent
                    opacity={0.3}
                    roughness={0.1}
                    metalness={0.1}
                    transmission={0.6}
                    thickness={2}
                />
            </mesh>

            {/* 2. Fluid Content */}
            <group position={[0, -1.25, 0]}> {/* Bottom anchored group */}
                <mesh position={[0, fluidScale, 0]} scale={[0.95, fluidScale * 2.5, 0.95]}>
                    {/* Note: Cylinder origin is center, so we scale height and push up */}
                    <cylinderGeometry args={[1.4, 1.4, 1.0, 32]} />
                    <meshStandardMaterial color={fluidColor} roughness={0.2} />
                </mesh>
            </group>

            {/* 3. Agitator Assembly */}
            <group ref={agitatorRef}>
                <mesh position={[0, 0, 0]}>
                    <cylinderGeometry args={[0.1, 0.1, 3, 12]} />
                    <meshStandardMaterial color="#888" metalness={0.8} />
                </mesh>
                {/* Blades */}
                <mesh position={[0, -1, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <boxGeometry args={[2.8, 0.2, 0.1]} />
                    <meshStandardMaterial color="#666" metalness={0.8} />
                </mesh>
                <mesh position={[0, -1, 0]} rotation={[0, Math.PI / 2, Math.PI / 2]}>
                    <boxGeometry args={[2.8, 0.2, 0.1]} />
                    <meshStandardMaterial color="#666" metalness={0.8} />
                </mesh>
            </group>

            {/* 4. Labels floating */}
            <Html position={[1.8, 1, 0]} center>
                <div className="font-mono text-xs text-white bg-black/60 p-2 rounded whitespace-nowrap">
                    Process Temp: {Math.round(temp)}°C
                </div>
            </Html>
            <Html position={[1.8, 0, 0]} center>
                <div className="font-mono text-xs text-white bg-black/60 p-2 rounded whitespace-nowrap">
                    Level: {Math.round(level)}%
                </div>
            </Html>
        </group>
    );
};

export default Reactor3D;
