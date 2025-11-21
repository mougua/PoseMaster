import React, { useRef, useLayoutEffect } from 'react';
import { Group } from 'three';
import { BoneID, PoseData, Gender } from '../types';

// --- Materials ---
// Classic Wooden Mannequin Style
const woodMaterialProps = { 
  color: '#e3cba8', // Light wood
  roughness: 0.6, 
  metalness: 0.05 
};

const jointMaterialProps = {
  color: '#d4b68d', // Slightly darker wood for joints
  roughness: 0.5,
  metalness: 0.1
};

const selectedMaterialProps = { 
  color: '#4488ff', 
  emissive: '#0033aa', 
  emissiveIntensity: 0.4, 
  roughness: 0.2 
};

// --- Types ---
interface BoneProps {
  id: BoneID;
  position: [number, number, number]; // Relative to parent
  poseRotation: { x: number, y: number, z: number };
  children?: React.ReactNode;
  onSelect: (id: BoneID, obj: Group) => void;
  isSelected: boolean;
  gender: Gender;
  // Visual definition
  type?: 'limb' | 'joint' | 'torso' | 'head';
  visualArgs?: any[]; // Args for the geometry
  visualPosition?: [number, number, number]; // Offset for the mesh inside the bone group
  visualRotation?: [number, number, number];
}

// --- Reusable Geometry Helper ---
// This component handles the logic of a rotating bone container AND its visual representation
const MannequinPart: React.FC<BoneProps> = ({ 
  id, position, poseRotation, children, onSelect, isSelected, 
  type = 'limb', visualArgs, visualPosition = [0, 0, 0], visualRotation = [0, 0, 0]
}) => {
  const groupRef = useRef<Group>(null);

  // Use useLayoutEffect instead of useFrame to apply rotations.
  // This updates the rotation whenever the pose state changes, but allows
  // TransformControls to mutate the rotation freely during a drag operation
  // without being overwritten every frame.
  useLayoutEffect(() => {
    if (groupRef.current) {
      groupRef.current.rotation.x = poseRotation.x;
      groupRef.current.rotation.y = poseRotation.y;
      groupRef.current.rotation.z = poseRotation.z;
    }
  }, [poseRotation.x, poseRotation.y, poseRotation.z]);

  const handleClick = (e: any) => {
    // Crucial: Stop propagation so we don't click "through" to the background or parent
    e.stopPropagation(); 
    if (groupRef.current) {
      onSelect(id, groupRef.current);
    }
  };

  // Select Material
  const materialProps = isSelected ? selectedMaterialProps : (type === 'joint' ? jointMaterialProps : woodMaterialProps);

  // Select Geometry
  // We use memoized geometries or simple primitives. 
  // For a mannequin, standard primitives with segment adjustments work great.
  const renderGeometry = () => {
    if (!visualArgs) return null;

    switch (type) {
      case 'joint':
        return <sphereGeometry args={visualArgs} />;
      case 'limb':
        // visualArgs: [radiusTop, radiusBottom, height, segments]
        return <cylinderGeometry args={visualArgs} />;
      case 'torso':
        // visualArgs: [width, height, depth]
        return <boxGeometry args={visualArgs} />;
      case 'head':
        // Simplified ovoid head using sphere with scaling
        return <sphereGeometry args={visualArgs} />;
      default:
        return <boxGeometry args={[0.1, 0.1, 0.1]} />;
    }
  };

  return (
    <group position={position} ref={groupRef} name={id}>
      {/* The Visual Mesh */}
      {visualArgs && (
        <mesh 
          position={visualPosition} 
          rotation={visualRotation}
          onClick={handleClick}
          castShadow 
          receiveShadow
        >
          {renderGeometry()}
          <meshStandardMaterial {...materialProps} />
        </mesh>
      )}
      
      {/* Visual Joint (Pivot visualizer) - Optional: Add a small sphere at 0,0,0 for every bone to show pivot */}
      {type !== 'joint' && id !== 'Hips' && (
        <mesh position={[0, 0, 0]} receiveShadow castShadow onClick={handleClick}>
           <sphereGeometry args={[0.035, 16, 16]} />
           <meshStandardMaterial {...(isSelected ? selectedMaterialProps : jointMaterialProps)} />
        </mesh>
      )}

      {/* Children Bones */}
      {children}
    </group>
  );
};

interface MannequinProps {
  pose: PoseData;
  selectedBone: BoneID | null;
  onSelectBone: (id: BoneID | null, obj: Group | null) => void;
  gender: Gender;
}

export const Mannequin: React.FC<MannequinProps> = ({ pose, selectedBone, onSelectBone, gender }) => {
  
  const handleSelect = (id: BoneID, obj: Group) => {
    onSelectBone(id, obj);
  };

  // --- Proportions & Geometry Config ---
  // Male: Broader shoulders, narrower hips. Female: Narrower shoulders, wider hips.
  const isMale = gender === Gender.Male;
  
  // Dimensions
  const hipWidth = isMale ? 0.28 : 0.32;
  const shoulderWidth = isMale ? 0.42 : 0.34;
  const torsoTaper = isMale ? 0.85 : 0.7; // How much the chest tapers to waist

  return (
    <group position={[0, 0, 0]}>
      {/* === ROOT: HIPS/PELVIS === */}
      <MannequinPart
        id="Hips"
        position={[0, 0.95, 0]}
        poseRotation={pose.Hips}
        onSelect={handleSelect}
        isSelected={selectedBone === 'Hips'}
        gender={gender}
        type="limb" // Treating pelvis as a shaped block/cylinder
        visualArgs={[hipWidth/2 * 0.9, hipWidth/2 * 0.8, 0.22, 16]} // Cylinder pelvis
        visualPosition={[0, 0.05, 0]} // Shift visual up slightly
      >
        {/* === LOWER BODY STARTS HERE === */}
        
        {/* LEFT LEG */}
        <group position={[hipWidth * 0.5 - 0.04, 0, 0]}>
           <MannequinPart
              id="UpperLeg_L"
              position={[0, 0, 0]}
              poseRotation={pose.UpperLeg_L}
              onSelect={handleSelect}
              isSelected={selectedBone === 'UpperLeg_L'}
              gender={gender}
              type="limb" // Thigh
              visualArgs={[0.075, 0.055, 0.45, 16]} // Tapered cylinder
              visualPosition={[0, -0.225, 0]}
           >
              {/* Left Knee */}
              <group position={[0, -0.45, 0]}>
                 <mesh castShadow receiveShadow>
                    <sphereGeometry args={[0.06, 16, 16]} />
                    <meshStandardMaterial {...jointMaterialProps} />
                 </mesh>
                 <MannequinPart
                    id="LowerLeg_L"
                    position={[0, 0, 0]}
                    poseRotation={pose.LowerLeg_L}
                    onSelect={handleSelect}
                    isSelected={selectedBone === 'LowerLeg_L'}
                    gender={gender}
                    type="limb" // Calf
                    visualArgs={[0.055, 0.04, 0.42, 16]}
                    visualPosition={[0, -0.21, 0]}
                 >
                    {/* Left Ankle/Foot */}
                    <MannequinPart
                       id="Foot_L"
                       position={[0, -0.42, 0.02]}
                       poseRotation={pose.Foot_L}
                       onSelect={handleSelect}
                       isSelected={selectedBone === 'Foot_L'}
                       gender={gender}
                       type="torso" // Box foot
                       visualArgs={[0.08, 0.05, 0.22]}
                       visualPosition={[0, -0.025, 0.05]}
                    />
                 </MannequinPart>
              </group>
           </MannequinPart>
        </group>

        {/* RIGHT LEG */}
        <group position={[-hipWidth * 0.5 + 0.04, 0, 0]}>
           <MannequinPart
              id="UpperLeg_R"
              position={[0, 0, 0]}
              poseRotation={pose.UpperLeg_R}
              onSelect={handleSelect}
              isSelected={selectedBone === 'UpperLeg_R'}
              gender={gender}
              type="limb"
              visualArgs={[0.075, 0.055, 0.45, 16]}
              visualPosition={[0, -0.225, 0]}
           >
              {/* Right Knee */}
              <group position={[0, -0.45, 0]}>
                 <mesh castShadow receiveShadow>
                    <sphereGeometry args={[0.06, 16, 16]} />
                    <meshStandardMaterial {...jointMaterialProps} />
                 </mesh>
                 <MannequinPart
                    id="LowerLeg_R"
                    position={[0, 0, 0]}
                    poseRotation={pose.LowerLeg_R}
                    onSelect={handleSelect}
                    isSelected={selectedBone === 'LowerLeg_R'}
                    gender={gender}
                    type="limb"
                    visualArgs={[0.055, 0.04, 0.42, 16]}
                    visualPosition={[0, -0.21, 0]}
                 >
                    <MannequinPart
                       id="Foot_R"
                       position={[0, -0.42, 0.02]}
                       poseRotation={pose.Foot_R}
                       onSelect={handleSelect}
                       isSelected={selectedBone === 'Foot_R'}
                       gender={gender}
                       type="torso"
                       visualArgs={[0.08, 0.05, 0.22]}
                       visualPosition={[0, -0.025, 0.05]}
                    />
                 </MannequinPart>
              </group>
           </MannequinPart>
        </group>


        {/* === UPPER BODY STARTS HERE === */}
        <MannequinPart
          id="Spine"
          position={[0, 0.11, 0]} // Small gap from hips
          poseRotation={pose.Spine}
          onSelect={handleSelect}
          isSelected={selectedBone === 'Spine'}
          gender={gender}
          type="limb" // Waist area
          visualArgs={[0.1, 0.11, 0.15, 16]}
          visualPosition={[0, 0.075, 0]}
        >
           <MannequinPart
              id="Chest"
              position={[0, 0.15, 0]}
              poseRotation={pose.Chest}
              onSelect={handleSelect}
              isSelected={selectedBone === 'Chest'}
              gender={gender}
              type="limb" // Ribcage - Tapered cylinder inverted
              visualArgs={[shoulderWidth/2, hipWidth/2 * torsoTaper, 0.35, 4]} // 4 segments = blocky aesthetic
              visualPosition={[0, 0.175, 0]}
              visualRotation={[0, Math.PI/4, 0]} // Rotate 4-sided cylinder to look like box
           >
              {/* NECK & HEAD */}
              <MannequinPart
                 id="Neck"
                 position={[0, 0.35, 0]}
                 poseRotation={pose.Neck}
                 onSelect={handleSelect}
                 isSelected={selectedBone === 'Neck'}
                 gender={gender}
                 type="limb"
                 visualArgs={[0.04, 0.05, 0.1, 16]}
                 visualPosition={[0, 0.05, 0]}
              >
                 <MannequinPart
                    id="Head"
                    position={[0, 0.1, 0]}
                    poseRotation={pose.Head}
                    onSelect={handleSelect}
                    isSelected={selectedBone === 'Head'}
                    gender={gender}
                    type="head"
                    visualArgs={[0.11, 16, 16]} // Sphere head, scale it in Y to make it egg-shaped
                    visualPosition={[0, 0.11, 0]}
                 >
                    {/* Face indicator (optional, simple nose bump to show direction) */}
                    <mesh position={[0, 0.11, 0.09]} castShadow>
                       <boxGeometry args={[0.02, 0.06, 0.04]} />
                       <meshStandardMaterial {...woodMaterialProps} color="#cbb" />
                    </mesh>
                 </MannequinPart>
              </MannequinPart>

              {/* LEFT ARM */}
              <group position={[shoulderWidth * 0.5 + 0.02, 0.3, 0]}>
                 <MannequinPart
                    id="Shoulder_L"
                    position={[0, 0, 0]}
                    poseRotation={pose.Shoulder_L}
                    onSelect={handleSelect}
                    isSelected={selectedBone === 'Shoulder_L'}
                    gender={gender}
                    type="joint"
                    visualArgs={[0.07, 16, 16]} // Shoulder Joint Sphere
                 >
                    <MannequinPart
                       id="UpperArm_L"
                       position={[0.04, 0, 0]} // Offset from joint center
                       poseRotation={pose.UpperArm_L}
                       onSelect={handleSelect}
                       isSelected={selectedBone === 'UpperArm_L'}
                       gender={gender}
                       type="limb"
                       visualArgs={[0.065, 0.05, 0.32, 16]}
                       visualPosition={[0, -0.16, 0]}
                    >
                       {/* Elbow Joint */}
                       <group position={[0, -0.32, 0]}>
                          <mesh castShadow receiveShadow>
                             <sphereGeometry args={[0.05, 16, 16]} />
                             <meshStandardMaterial {...jointMaterialProps} />
                          </mesh>
                          <MannequinPart
                             id="LowerArm_L"
                             position={[0, 0, 0]}
                             poseRotation={pose.LowerArm_L}
                             onSelect={handleSelect}
                             isSelected={selectedBone === 'LowerArm_L'}
                             gender={gender}
                             type="limb"
                             visualArgs={[0.05, 0.04, 0.3, 16]}
                             visualPosition={[0, -0.15, 0]}
                          >
                             {/* Wrist/Hand */}
                             <MannequinPart
                                id="Hand_L"
                                position={[0, -0.3, 0]}
                                poseRotation={pose.Hand_L}
                                onSelect={handleSelect}
                                isSelected={selectedBone === 'Hand_L'}
                                gender={gender}
                                type="torso" // Box hand
                                visualArgs={[0.04, 0.14, 0.08]}
                                visualPosition={[0, -0.07, 0]}
                             />
                          </MannequinPart>
                       </group>
                    </MannequinPart>
                 </MannequinPart>
              </group>

              {/* RIGHT ARM */}
              <group position={[-shoulderWidth * 0.5 - 0.02, 0.3, 0]}>
                 <MannequinPart
                    id="Shoulder_R"
                    position={[0, 0, 0]}
                    poseRotation={pose.Shoulder_R}
                    onSelect={handleSelect}
                    isSelected={selectedBone === 'Shoulder_R'}
                    gender={gender}
                    type="joint"
                    visualArgs={[0.07, 16, 16]}
                 >
                    <MannequinPart
                       id="UpperArm_R"
                       position={[-0.04, 0, 0]}
                       poseRotation={pose.UpperArm_R}
                       onSelect={handleSelect}
                       isSelected={selectedBone === 'UpperArm_R'}
                       gender={gender}
                       type="limb"
                       visualArgs={[0.065, 0.05, 0.32, 16]}
                       visualPosition={[0, -0.16, 0]}
                    >
                       {/* Elbow Joint */}
                       <group position={[0, -0.32, 0]}>
                          <mesh castShadow receiveShadow>
                             <sphereGeometry args={[0.05, 16, 16]} />
                             <meshStandardMaterial {...jointMaterialProps} />
                          </mesh>
                          <MannequinPart
                             id="LowerArm_R"
                             position={[0, 0, 0]}
                             poseRotation={pose.LowerArm_R}
                             onSelect={handleSelect}
                             isSelected={selectedBone === 'LowerArm_R'}
                             gender={gender}
                             type="limb"
                             visualArgs={[0.05, 0.04, 0.3, 16]}
                             visualPosition={[0, -0.15, 0]}
                          >
                             <MannequinPart
                                id="Hand_R"
                                position={[0, -0.3, 0]}
                                poseRotation={pose.Hand_R}
                                onSelect={handleSelect}
                                isSelected={selectedBone === 'Hand_R'}
                                gender={gender}
                                type="torso"
                                visualArgs={[0.04, 0.14, 0.08]}
                                visualPosition={[0, -0.07, 0]}
                             />
                          </MannequinPart>
                       </group>
                    </MannequinPart>
                 </MannequinPart>
              </group>

           </MannequinPart>
        </MannequinPart>
      </MannequinPart>
    </group>
  );
};