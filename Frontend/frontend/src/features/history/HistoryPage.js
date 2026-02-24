import { useEffect, useState } from "react";
import { getHistory } from "../../services/api";
import { FaCalendarAlt, FaStar } from "react-icons/fa";

const HistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await getHistory();
      // res is now the direct array since api.js returns res.data
      setHistory(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error("History fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 animate-fade-in-up">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-800">Your Skin Journey</h1>
            <p className="text-gray-500 mt-1">Track your progress over time.</p>
          </div>
          <div className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-full">
            {history.length} Scans Found
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {history.map((scan) => (
            <div key={scan.id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group">

              {/* Image */}
              <div className="relative h-48 bg-gray-100">
                <img
                  src={scan.annotated_image_url || scan.image_url}
                  alt="scan"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1">
                  <FaCalendarAlt className="text-blue-500" />
                  {scan.date}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  {/* Safe Label Extraction */}
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">
                      {typeof scan.face_shape === 'string' ? scan.face_shape : (scan.face_shape?.value || (Array.isArray(scan.face_shape) ? scan.face_shape[0] : "Unknown"))} <span className="text-xs font-normal text-gray-400">Face</span>
                    </h3>
                    <div className="flex gap-2 mt-1">
                      <Badge
                        label={
                          scan.recommendations && scan.recommendations[0] && scan.recommendations[0].includes(":")
                            ? scan.recommendations[0].split(":")[1].replace("Skin", "").trim()
                            : "Analysis"
                        }
                        color="blue"
                      />
                      {scan.gender && <Badge label={scan.gender} color={scan.gender === "Male" ? "slate" : "teal"} />}
                    </div>
                  </div>

                  {/* Score Mini-Chart */}
                  <div className="text-right">
                    <div className="text-xs text-gray-400 font-bold uppercase">Acne</div>
                    <div className={`text-lg font-bold ${scan.skin_scores?.acne < 0.3 ? 'text-green-500' : 'text-red-500'}`}>
                      {Math.round((scan.skin_scores?.acne || 0) * 100)}%
                    </div>
                  </div>
                </div>

                {/* Findings Summary */}
                <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Oiliness:</span>
                    <span className="font-bold">{Math.round((scan.skin_scores?.oiliness || 0) * 100)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Texture:</span>
                    <span className="font-bold">{Math.round((scan.skin_scores?.texture || 0) * 100)}%</span>
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>

        {history.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📸</div>
            <h3 className="text-2xl font-bold text-gray-400">No History Yet</h3>
            <p className="text-gray-500">Perform your first analysis to start tracking.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const Badge = ({ label, color }) => {
  const colors = {
    blue: "bg-blue-100 text-blue-700",
    teal: "bg-teal-100 text-teal-700",
    slate: "bg-slate-100 text-slate-700",
    green: "bg-green-100 text-green-700"
  };
  const bgClass = colors[color] || colors.blue;
  return (
    <span className={`${bgClass} px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide`}>
      {label}
    </span>
  );
};

export default HistoryPage;
