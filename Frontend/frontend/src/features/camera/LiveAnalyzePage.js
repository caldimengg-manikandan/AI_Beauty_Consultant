import { useEffect, useRef, useState, useContext } from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { AuthContext } from "../../context/AuthContext";
import { analyzeImage } from "../../services/api";
import ResultCard from "../analysis/ResultCard";
import { FaCamera, FaSpinner, FaLongArrowAltLeft, FaRobot, FaMicrochip, FaUserCircle } from 'react-icons/fa';

const LiveAnalyzePage = () => {
  const videoRef = useRef(null);
  const landmarkerRef = useRef(null);
  const { token } = useContext(AuthContext);

  const [faces, setFaces] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [error, setError] = useState("");
  const [initStage, setInitStage] = useState("Initializing Vision...");

  useEffect(() => {
    let stream = null;
    let animationId = null;

    const setupLiveAnalysis = async () => {
      try {
        setLoading(true);
        setInitStage("Loading AI Neural Models...");
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        setInitStage("Calibrating Face Landmarker...");
        try {
          landmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
              delegate: "GPU"
            },
            runningMode: "VIDEO",
            numFaces: 1
          });
        } catch (gpuError) {
          console.warn("GPU Delegate failed, falling back to CPU:", gpuError);
          landmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
              delegate: "CPU"
            },
            runningMode: "VIDEO",
            numFaces: 1
          });
        }

        setInitStage("Activating Imaging Core...");
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user"
          }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            predictWebcam();
            setLoading(false);
          };
        }

      } catch (err) {
        console.error("Setup error:", err);
        setError("Optical Access Denied. Please ensure camera permissions are active.");
        setLoading(false);
      }
    };

    let lastVideoTime = -1;
    function predictWebcam() {
      if (
        landmarkerRef.current &&
        videoRef.current &&
        videoRef.current.readyState === 4
      ) {
        let startTimeMs = performance.now();
        if (videoRef.current.currentTime !== lastVideoTime) {
          lastVideoTime = videoRef.current.currentTime;
          const results = landmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);

          if (results.faceLandmarks) {
            const count = results.faceLandmarks.length;
            if (count !== faces) setFaces(count);
          }
        }
      }
      animationId = requestAnimationFrame(predictWebcam);
    }

    setupLiveAnalysis();

    return () => {
      cancelAnimationFrame(animationId);
      if (stream) stream.getTracks().forEach((track) => track.stop());
      if (landmarkerRef.current) landmarkerRef.current.close();
    };
  }, []); // eslint-disable-next-line

  const captureAndAnalyze = async () => {
    if (!videoRef.current || faces === 0) {
      if (faces === 0) setError("Biometric Lock: No subject detected in frame.");
      return;
    }
    setError("");
    setLoading(true);
    setInitStage("Capturing High-Fidelity Data...");

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Cap dimensions at 1024px for faster processing
    let width = videoRef.current.videoWidth;
    let height = videoRef.current.videoHeight;
    const MAX_DIM = 1024;

    if (width > height) {
      if (width > MAX_DIM) {
        height *= MAX_DIM / width;
        width = MAX_DIM;
      }
    } else {
      if (height > MAX_DIM) {
        width *= MAX_DIM / height;
        height = MAX_DIM;
      }
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(videoRef.current, 0, 0, width, height);

    // Compress to 85% for balanced speed/accuracy
    const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.85));

    if (!blob) {
      setError("Image capture sequence failed.");
      setLoading(false);
      return;
    }

    const previewUrl = URL.createObjectURL(blob);
    setCapturedImage(previewUrl);

    const formData = new FormData();
    formData.append("image", blob, "analysis_frame.jpg");

    setInitStage("Processing via Neural Engine...");
    try {
      const res = await analyzeImage(formData);
      let analysisData = res;

      if (res.success && res.data) {
        analysisData = {
          faceShape: res.data.face_shape,
          gender: res.data.gender,
          skinScores: res.data.skin_analysis || {},
          colorAnalysis: res.data.color_analysis || {},
          recommendations: res.data.recommendations || [],
          personalizedTips: res.data.personalized_tips || [],
          imageUrl: res.data.image_url,
          annotatedImageUrl: res.data.annotated_image_url
        };
      } else if (res.error) {
        setError(res.error);
        setLoading(false);
        return;
      }

      setResult(analysisData);
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.error || "Neural Processing Exception. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setCapturedImage(null);
    setError("");
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-slate-300 font-sans selection:bg-indigo-500 selection:text-white overflow-x-hidden">

      {/* PROFESSIONAL HEADER GRID */}
      <div className="max-w-7xl mx-auto pt-10 px-6 sm:px-10 flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]">
              <FaRobot />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">AI VISIONCORE</h1>
              <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">System v2.4.0 • Enterprise-Ready</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Latency</span>
              <span className="text-xs font-bold text-emerald-500">24ms <span className="text-[8px] opacity-60">STABLE</span></span>
            </div>
            <div className="h-10 w-[1px] bg-slate-800"></div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[10px] font-black text-slate-500 uppercase">Status</div>
                <div className="text-[10px] text-white font-bold px-2 py-0.5 bg-slate-800 rounded border border-slate-700">AUTHORIZED</div>
              </div>
              <FaUserCircle className="text-3xl text-slate-700" />
            </div>
          </div>
        </div>

        <div className="w-full max-w-5xl">

          {!result && (
            <div className="relative group animate-fade-in-up">

              {/* STATUS OVERLAYS */}
              <div className="absolute top-6 left-6 z-20 space-y-3">
                <div className={`flex items-center gap-3 px-4 py-2 rounded-xl backdrop-blur-xl border transition-all duration-500 
                    ${faces > 0 ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                  <div className={`w-2 h-2 rounded-full animate-pulse ${faces > 0 ? 'bg-indigo-400 shadow-[0_0_10px_indigo]' : 'bg-red-400 shadow-[0_0_10px_red]'}`}></div>
                  <span className="text-[10px] font-black uppercase tracking-widest">{faces > 0 ? 'Biometric Locked' : 'Searching for Subject'}</span>
                </div>
                {loading && (
                  <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 text-white animate-pulse">
                    <FaSpinner className="animate-spin text-indigo-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{initStage}</span>
                  </div>
                )}
              </div>

              {/* CAMERA INTERFACE */}
              <div className="relative aspect-video rounded-[2.5rem] overflow-hidden bg-slate-900 shadow-[0_0_50px_rgba(0,0,0,0.5)] border-8 border-slate-800/50 group-hover:border-indigo-600/20 transition-all duration-700 mx-auto max-w-[800px]">

                {/* SCANNER OVERLAY */}
                <div className="absolute inset-0 pointer-events-none z-10 opacity-30">
                  <div className="absolute inset-0 border-[1px] border-white/5 m-10 rounded-3xl"></div>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]"></div>
                  {faces > 0 && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-indigo-500/40 rounded-full animate-ping-slow"></div>}
                </div>

                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100 mix-blend-screen opacity-90"
                />

                {!loading && error && (
                  <div className="absolute inset-x-6 top-6 z-30">
                    <div className="bg-red-500/20 border border-red-500/50 backdrop-blur-xl p-4 rounded-2xl flex items-center gap-4 text-red-200 shadow-2xl animate-shake">
                      <FaMicrochip className="text-xl" />
                      <span className="text-xs font-bold tracking-tight">{error}</span>
                    </div>
                  </div>
                )}

                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 w-full px-10 flex flex-col items-center gap-6">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] opacity-60">Positonal Alignment: Optimal</p>
                  <button
                    onClick={captureAndAnalyze}
                    disabled={loading || faces === 0}
                    className={`relative group/btn overflow-hidden w-full max-w-[280px] py-4 rounded-2xl font-black text-xs tracking-[0.2em] uppercase transition-all duration-500 shadow-2xl
                        ${loading || faces === 0
                        ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'
                        : 'bg-white text-slate-900 border border-white hover:bg-slate-900 hover:text-white transform hover:scale-[1.02]'
                      }`}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      {loading ? <FaSpinner className="animate-spin" /> : <FaCamera />}
                      {loading ? "Synthesizing Data" : "Initiate Capture"}
                    </span>
                  </button>
                </div>
              </div>

              {/* DESIGN ACCENTS */}
              <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-indigo-600/10 blur-[100px] pointer-events-none"></div>
              <div className="absolute -top-10 -left-10 w-64 h-64 bg-blue-600/10 blur-[100px] pointer-events-none"></div>
            </div>
          )}

          {result && (
            <div className="animate-fade-in-up pb-20">
              <button
                onClick={reset}
                className="group mb-10 flex items-center gap-4 text-slate-500 hover:text-white transition-all font-black text-[10px] tracking-[0.2em] uppercase"
              >
                <div className="w-10 h-10 border border-slate-800 rounded-xl flex items-center justify-center group-hover:bg-slate-800 transition-all text-sm">
                  <FaLongArrowAltLeft />
                </div>
                Return to Neural Feed
              </button>
              <div className="bg-[#0f1117] rounded-[3rem] p-4 sm:p-2 border border-slate-800/50 shadow-2xl">
                <ResultCard
                  data={{
                    ...result,
                    faceShape: result.face_shape || result.faceShape,
                    skinScores: result.skin_scores || result.skinScores || result.skin_analysis || result.skinAnalysis
                  }}
                  image={capturedImage}
                  annotatedImage={result.annotatedImageUrl || result.annotated_image_url}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveAnalyzePage;
