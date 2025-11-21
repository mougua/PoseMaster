import React, { useState, useEffect } from 'react';
import { Scene } from './components/Scene';
import { PoseData, BoneID, Gender } from './types';
import { INITIAL_POSE, BONE_LABELS } from './constants';
import { generatePoseFromDescription } from './services/geminiService';
import { Loader2, RotateCcw, Wand2, MousePointer2, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [pose, setPose] = useState<PoseData>(INITIAL_POSE);
  const [selectedBone, setSelectedBone] = useState<BoneID | null>(null);
  const [gender, setGender] = useState<Gender>(Gender.Male);
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showIntro, setShowIntro] = useState(true);

  // Auto-hide intro after 5 seconds
  useEffect(() => {
    if (showIntro) {
      const timer = setTimeout(() => setShowIntro(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showIntro]);

  const handleGeneratePose = async () => {
    if (!prompt.trim()) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const newPose = await generatePoseFromDescription(prompt);
      setPose(newPose);
    } catch (err) {
      setError("Failed to generate pose. Please check API Key or try a simpler description.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setPose(INITIAL_POSE);
    setSelectedBone(null);
    setPrompt('');
  };

  return (
    <div className="relative w-full h-screen overflow-hidden font-sans text-white selection:bg-blue-500 selection:text-white">
      
      {/* Main 3D Scene */}
      <Scene 
        pose={pose} 
        setPose={setPose} 
        selectedBone={selectedBone} 
        setSelectedBone={setSelectedBone}
        gender={gender}
      />

      {/* --- UI OVERLAY --- */}

      {/* Top Bar: Header & Gender Toggle */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start pointer-events-none">
        <div className="pointer-events-auto bg-black/60 backdrop-blur-md rounded-lg p-3 border border-white/10 shadow-lg">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            PoseMaster AI
          </h1>
          <p className="text-xs text-gray-400">3D Reference for Artists</p>
        </div>

        <div className="pointer-events-auto flex gap-2 bg-black/60 backdrop-blur-md rounded-lg p-1 border border-white/10">
          <button
            onClick={() => setGender(Gender.Male)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              gender === Gender.Male ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
            }`}
          >
            Male
          </button>
          <button
            onClick={() => setGender(Gender.Female)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              gender === Gender.Female ? 'bg-pink-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
            }`}
          >
            Female
          </button>
        </div>
      </div>

      {/* Bottom Bar: AI Controls */}
      <div className="absolute bottom-0 left-0 w-full p-4 md:p-6 flex justify-center pointer-events-none">
        <div className="pointer-events-auto w-full max-w-2xl bg-black/80 backdrop-blur-lg border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col gap-3">
          
          {/* Input Area */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Wand2 className="w-4 h-4 text-purple-400" />
              </div>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGeneratePose()}
                placeholder="Describe a pose (e.g. 'Superhero landing', 'Ballerina jump')"
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all placeholder-gray-500"
              />
            </div>
            <button
              onClick={handleGeneratePose}
              disabled={isProcessing || !prompt.trim()}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium text-sm shadow-lg shadow-purple-900/20 flex items-center gap-2 transition-all"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate'}
            </button>
          </div>

          {/* Actions & Status */}
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-400 flex items-center gap-2">
               {selectedBone ? (
                 <span className="text-yellow-400 flex items-center gap-1">
                   <MousePointer2 className="w-3 h-3" /> 
                   Selected: {BONE_LABELS[selectedBone]}
                   <span className="text-gray-500 ml-2 font-mono">
                     [{pose[selectedBone].x.toFixed(2)}, {pose[selectedBone].y.toFixed(2)}, {pose[selectedBone].z.toFixed(2)}]
                   </span>
                 </span>
               ) : (
                 <span>Click a body part to rotate</span>
               )}
            </div>

            <button 
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors px-3 py-1 hover:bg-white/5 rounded-lg"
            >
              <RotateCcw className="w-3 h-3" /> Reset Pose
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-xs bg-red-900/20 p-2 rounded-lg border border-red-900/50">
              <AlertCircle className="w-3 h-3" />
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Intro Tooltip */}
      {showIntro && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="bg-blue-600/90 backdrop-blur text-white px-6 py-4 rounded-xl shadow-2xl flex flex-col items-center gap-2 animate-bounce">
            <MousePointer2 className="w-6 h-6" />
            <p className="font-medium">Click limbs to rotate!</p>
            <p className="text-xs opacity-80">Or use AI below to generate poses.</p>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;