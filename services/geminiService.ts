import { GoogleGenAI, Type } from "@google/genai";
import { PoseData, BoneID } from "../types";
import { INITIAL_POSE } from "../constants";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

export const generatePoseFromDescription = async (description: string): Promise<PoseData> => {
  try {
    const ai = getClient();
    
    // We construct a schema to ensure we get valid rotation data for all bones
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a JSON object representing the 3D Euler rotation angles (in radians) for a human skeleton to achieve this pose: "${description}". 
      
      Rules:
      1. Return ONLY the JSON.
      2. Coordinate system: Y is Up, Z is Forward, X is Right.
      3. Use realistic human joint limits.
      4. "Hips" is the root, rotation rotates the whole body.
      5. Arms are T-pose by default. To hang arms down, Z rotation is needed.
      6. Legs are straight down by default.
      
      Provide values for these keys: Hips, Spine, Chest, Neck, Head, Shoulder_L, UpperArm_L, LowerArm_L, Hand_L, Shoulder_R, UpperArm_R, LowerArm_R, Hand_R, UpperLeg_L, LowerLeg_L, Foot_L, UpperLeg_R, LowerLeg_R, Foot_R.
      
      Example format: { "Hips": { "x": 0, "y": 0.5, "z": 0 }, ... }`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            Hips: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER }, z: { type: Type.NUMBER } } },
            Spine: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER }, z: { type: Type.NUMBER } } },
            Chest: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER }, z: { type: Type.NUMBER } } },
            Neck: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER }, z: { type: Type.NUMBER } } },
            Head: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER }, z: { type: Type.NUMBER } } },
            Shoulder_L: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER }, z: { type: Type.NUMBER } } },
            UpperArm_L: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER }, z: { type: Type.NUMBER } } },
            LowerArm_L: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER }, z: { type: Type.NUMBER } } },
            Hand_L: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER }, z: { type: Type.NUMBER } } },
            Shoulder_R: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER }, z: { type: Type.NUMBER } } },
            UpperArm_R: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER }, z: { type: Type.NUMBER } } },
            LowerArm_R: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER }, z: { type: Type.NUMBER } } },
            Hand_R: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER }, z: { type: Type.NUMBER } } },
            UpperLeg_L: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER }, z: { type: Type.NUMBER } } },
            LowerLeg_L: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER }, z: { type: Type.NUMBER } } },
            Foot_L: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER }, z: { type: Type.NUMBER } } },
            UpperLeg_R: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER }, z: { type: Type.NUMBER } } },
            LowerLeg_R: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER }, z: { type: Type.NUMBER } } },
            Foot_R: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER }, z: { type: Type.NUMBER } } },
          }
        }
      }
    });

    let text = response.text;
    if (!text) throw new Error("Empty response from AI");
    
    // Clean up potential markdown code blocks
    if (text.startsWith('```')) {
      text = text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/```$/, '');
    }
    
    const parsed = JSON.parse(text);
    
    // Merge with initial pose to ensure structure safety
    return { ...INITIAL_POSE, ...parsed };

  } catch (error) {
    console.error("Gemini Pose Gen Error:", error);
    throw error;
  }
};