import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Cylinder, Box, Torus, Sphere } from '@react-three/drei';
import * as THREE from 'three';

const DCPReactorModel = ({ telemetry }) => {
    const stirrerRef = useRef();

    const temp = telemetry?.temp || 45;
    const pressure = telemetry?.pressure || 1.0;
    const rpm = telemetry?.inputs?.rpm || 0;
    const cl2Flow = telemetry?.inputs?.cl2 || 0;
    const purity = telemetry?.moles_dcp ? Math.min(100, (telemetry.moles_dcp / 10.0) * 100) : 0;

    // Heatmap Color: Green (Optimal 45) -> Yellow -> Red (>75)
    const heatColor = useMemo(() => {
        const t = Math.max(0, Math.min(1, (temp - 40) / 40)); // Normalize 40-80 range
        return new THREE.Color().setHSL(0.35 * (1 - t), 1, 0.4);
    }, [temp]);

    useFrame((state, delta) => {
        if (stirrerRef.current) {
            // Rotate based on actual RPM (convert RPM to rad/s)
            const rotationSpeed = (rpm / 60) * Math.PI * 2; // Convert RPM to rad/s
            stirrerRef.current.rotation.y += delta * rotationSpeed;
        }
    });

    return (
        <group dispose={null}>
            {/* Main Tank Body - Metallic Glass */}
            <mesh position={[0, 0, 0]}>
                <cylinderGeometry args={[2, 2, 5, 64]} />
                <meshPhysicalMaterial
                    color={heatColor}
                    metalness={0.9}
                    roughness={0.1}
                    transmission={0.2}
                    transparent
                    opacity={0.8}
                />
            </mesh>

            {/* Top Cap */}
            <mesh position={[0, 2.6, 0]}>
                <cylinderGeometry args={[2.1, 2.1, 0.2, 64]} />
                <meshStandardMaterial color="#1f2937" metalness={0.8} />
            </mesh>

            {/* Piping Complex */}
            <group position={[1.5, 2, 0]} rotation={[0, 0, Math.PI / 2]}>
                <Cylinder args={[0.2, 0.2, 2]} material-color="#4b5563" />
                <Sphere args={[0.3]} position={[0, 1.1, 0]}>
                    <meshStandardMaterial 
                        color={cl2Flow > 0 ? "#10b981" : "#ef4444"} 
                        emissive={cl2Flow > 0 ? "#10b981" : "#000"} 
                        emissiveIntensity={cl2Flow > 0 ? 0.5 + (cl2Flow / 100) * 0.5 : 0} 
                    />
                </Sphere>
            </group>

            {/* Internal Stirrer */}
            <group ref={stirrerRef}>
                <mesh position={[0, 0, 0]}>
                    <cylinderGeometry args={[0.1, 0.1, 4.5]} />
                    <meshStandardMaterial color="#d1d5db" />
                </mesh>
                <mesh position={[0, -2, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <boxGeometry args={[3, 0.4, 0.1]} />
                    <meshStandardMaterial color="#9ca3af" />
                </mesh>
                <mesh position={[0, -1, 0]} rotation={[0, Math.PI / 2, Math.PI / 2]}>
                    <boxGeometry args={[3, 0.4, 0.1]} />
                    <meshStandardMaterial color="#9ca3af" />
                </mesh>
            </group>

            {/* Digital HUD Overlay in 3D Space */}
            <Text
                position={[-3, 2.5, 0]}
                fontSize={0.4}
                color="white"
                anchorX="right"
            >
                {`PURITY: ${purity.toFixed(1)}%`}
            </Text>
            <Text
                position={[-3, 2, 0]}
                fontSize={0.25}
                color={temp > 75 ? "#ef4444" : "#94a3b8"}
                anchorX="right"
            >
                {`TEMP: ${temp.toFixed(1)}°C`}
            </Text>
            <Text
                position={[-3, 1.5, 0]}
                fontSize={0.25}
                color={pressure > 2.0 ? "#ef4444" : "#94a3b8"}
                anchorX="right"
            >
                {`PRESS: ${pressure.toFixed(2)} BAR`}
            </Text>
            <Text
                position={[-3, 1, 0]}
                fontSize={0.25}
                color="#94a3b8"
                anchorX="right"
            >
                {`RPM: ${rpm.toFixed(0)}`}
            </Text>
        </group>
    );
};

export default DCPReactorModel;

