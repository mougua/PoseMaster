import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, TransformControls, Environment, Grid, SoftShadows, ContactShadows } from '@react-three/drei';
import { Group, Object3D } from 'three';
import { Mannequin } from './Mannequin';
import { PoseData, BoneID, Gender } from '../types';

interface SceneProps {
  pose: PoseData;
  setPose: React.Dispatch<React.SetStateAction<PoseData>>;
  selectedBone: BoneID | null;
  setSelectedBone: (id: BoneID | null) => void;
  gender: Gender;
}

// Wrapper for TransformControls to handle state updates properly
const TransformGizmo: React.FC<{
  target: Object3D;
  pose: PoseData;
  boneId: BoneID;
  setPose: React.Dispatch<React.SetStateAction<PoseData>>;
}> = ({ target, pose, boneId, setPose }) => {
  const { camera, gl } = useThree();
  const controlsRef = useRef<any>(null);
  const isDragging = useRef(false);

  return (
    <TransformControls
      ref={controlsRef}
      object={target}
      mode="rotate"
      camera={camera}
      // Make gizmo larger and easier to grab
      size={1.0} 
      space="local"
      // Track dragging state to differentiate object updates from camera updates
      onMouseDown={() => { isDragging.current = true; }}
      onMouseUp={() => { isDragging.current = false; }}
      // Update React state in real-time while dragging
      onChange={() => {
        if (isDragging.current && target) {
          setPose(prev => ({
            ...prev,
            [boneId]: {
              x: target.rotation.x,
              y: target.rotation.y,
              z: target.rotation.z
            }
          }));
        }
      }}
    />
  );
};

export const Scene: React.FC<SceneProps> = ({ pose, setPose, selectedBone, setSelectedBone, gender }) => {
  const [selectedObject, setSelectedObject] = useState<Group | null>(null);

  const handleBoneSelect = (id: BoneID | null, obj: Group | null) => {
    setSelectedBone(id);
    setSelectedObject(obj);
  };

  // Deselect when clicking empty space
  const onMiss = () => {
    setSelectedBone(null);
    setSelectedObject(null);
  };

  return (
    <div className="w-full h-full bg-[#1a1a1a]">
      <Canvas 
        shadows 
        camera={{ position: [0, 1.2, 4], fov: 40 }}
        onPointerMissed={onMiss}
      >
        <fog attach="fog" args={['#1a1a1a', 6, 20]} />
        <color attach="background" args={['#1a1a1a']} />

        {/* High quality soft shadows for volume visualization */}
        <SoftShadows size={15} samples={16} focus={0.5} />

        {/* Studio Lighting Setup */}
        <ambientLight intensity={0.3} />
        
        {/* Main Key Light */}
        <directionalLight 
          position={[3, 5, 4]} 
          intensity={1.8} 
          castShadow 
          shadow-bias={-0.0001}
          shadow-mapSize={[2048, 2048]}
        >
           <orthographicCamera attach="shadow-camera" args={[-5, 5, 5, -5]} />
        </directionalLight>
        
        {/* Rim Light (Cool Blue) - emphasizes outline */}
        <spotLight position={[-4, 4, -4]} intensity={2} color="#cceeff" angle={0.6} penumbra={1} />
        
        {/* Fill Light (Warm) - softens shadows */}
        <spotLight position={[0, 2, 4]} intensity={0.4} color="#ffeedd" angle={1} penumbra={1} />

        <Mannequin 
          pose={pose} 
          selectedBone={selectedBone} 
          onSelectBone={handleBoneSelect}
          gender={gender}
        />

        {/* Ground Reflections/Shadows */}
        <ContactShadows resolution={1024} scale={10} blur={1} opacity={0.5} far={1} color="#000000" />
        
        {/* Minimal Grid */}
        <Grid 
          position={[0, -0.01, 0]} 
          args={[10, 10]} 
          cellSize={0.5} 
          cellThickness={0.5} 
          cellColor="#333333" 
          sectionSize={2} 
          sectionThickness={1} 
          sectionColor="#555555" 
          fadeDistance={12} 
          infiniteGrid 
        />

        {/* Controls */}
        <OrbitControls 
          makeDefault 
          minPolarAngle={0} 
          maxPolarAngle={Math.PI / 1.8} 
          minDistance={2}
          maxDistance={10}
          enablePan={true}
          target={[0, 1, 0]} // Focus on chest area by default
        />
        
        {/* Gizmo for the selected bone */}
        {selectedBone && selectedObject && (
          <TransformGizmo 
            key={selectedBone} // Force remount when changing selected bone to clear dragging state
            target={selectedObject} 
            boneId={selectedBone} 
            pose={pose}
            setPose={setPose} 
          />
        )}
        
        <Environment preset="city" environmentIntensity={0.4} />
      </Canvas>
    </div>
  );
};