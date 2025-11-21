export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export type BoneID = 
  | 'Hips'
  | 'Spine'
  | 'Chest'
  | 'Neck'
  | 'Head'
  | 'Shoulder_L'
  | 'UpperArm_L'
  | 'LowerArm_L'
  | 'Hand_L'
  | 'Shoulder_R'
  | 'UpperArm_R'
  | 'LowerArm_R'
  | 'Hand_R'
  | 'UpperLeg_L'
  | 'LowerLeg_L'
  | 'Foot_L'
  | 'UpperLeg_R'
  | 'LowerLeg_R'
  | 'Foot_R';

export type PoseData = Record<BoneID, Vector3>;

export enum Gender {
  Male = 'Male',
  Female = 'Female'
}

export interface AppState {
  gender: Gender;
  selectedBone: BoneID | null;
  pose: PoseData;
  isProcessingAI: boolean;
}