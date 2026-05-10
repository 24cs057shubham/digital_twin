import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html } from '@react-three/drei';
import * as THREE from 'three';

const MachineModel = ({ telemetry }) => {
    const shaftRef = useRef();
    const housingRef = useRef();
    const fanRef = useRef();

    // Safe defaults
    const rpm = telemetry?.rpm || 0;
    const temp = telemetry?.temperature || 25;
    const vib = telemetry?.vibration || 0;

    // Color interpolation (Green -> Red based on Temp 25C -> 100C)
    const color = useMemo(() => {
        const t = Math.min(1, Math.max(0, (temp - 30) / 70));
        return new THREE.Color().setHSL(0.33 * (1 - t), 1, 0.5);
    }, [temp]);

    useFrame((state, delta) => {
        // Rotation logic (RPM to Radians per frame)
        // 60 RPM = 1 RPS = 2PI rads/sec
        const rotationSpeed = (rpm / 60) * Math.PI * 2 * delta;

        if (shaftRef.current) shaftRef.current.rotation.z -= rotationSpeed;
        if (fanRef.current) fanRef.current.rotation.z -= rotationSpeed;

        // Vibration Jitter
        if (housingRef.current) {
            const shake = vib * 0.05;
            housingRef.current.position.x = (Math.random() - 0.5) * shake;
            housingRef.current.position.y = (Math.random() - 0.5) * shake;
        }
    });

    return (
        <group dispose={null}>
            {/* Base Platform */}
            <mesh position={[0, -1.2, 0]} receiveShadow>
                <boxGeometry args={[4, 0.2, 3]} />
                <meshStandardMaterial color="#333" />
            </mesh>

            {/* Vibration Group */}
            <group ref={housingRef}>
                {/* Motor Housing */}
                <mesh position={[0, 0, 0]} castShadow>
                    <cylinderGeometry args={[1, 1, 2, 32]} rotation={[0, 0, Math.PI / 2]} />
                    <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} />
                </mesh>

                {/* Cooling Fins */}
                {[...Array(6)].map((_, i) => (
                    <mesh key={i} position={[0, 0, -0.8 + i * 0.3]} rotation={[0, 0, Math.PI / 2]}>
                        <cylinderGeometry args={[1.1, 1.1, 0.1, 32]} />
                        <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} />
                    </mesh>
                ))}

                {/* Shaft */}
                <group ref={shaftRef} position={[0, 0, 1.1]}>
                    <mesh rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.2, 0.2, 1, 16]} />
                        <meshStandardMaterial color="#silver" metalness={1} roughness={0.2} />
                    </mesh>

                    {/* Fan Blades */}
                    <group position={[0, 0.4, 0]}>
                        <mesh>
                            <boxGeometry args={[2.5, 0.1, 0.3]} />
                            <meshStandardMaterial color="#444" />
                        </mesh>
                        <mesh rotation={[0, Math.PI / 2, 0]}>
                            <boxGeometry args={[2.5, 0.1, 0.3]} />
                            <meshStandardMaterial color="#444" />
                        </mesh>
                    </group>
                </group>

                {/* Info Label Floating */}
                <Html position={[0, 1.5, 0]} center>
                    <div style={{ background: 'rgba(0,0,0,0.8)', padding: '5px 10px', borderRadius: '4px', color: 'white', fontSize: '12px', pointerEvents: 'none' }}>
                        {Math.round(rpm)} RPM<br />
                        {Math.round(temp)}°C
                    </div>
                </Html>
            </group>
        </group>
    );
};

export default MachineModel;
