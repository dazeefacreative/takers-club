import { useState, useEffect } from "react";
import { Upload } from "lucide-react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { getImageUrl } from "@/lib/media";
import { MotionButton, tapScale } from "@/app/components/motion/primitives";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

const uploadLabelVariants = {
  rest: { borderColor: "var(--border)" },
  hover: { borderColor: "var(--action-border)" },
};

const submitButtonVariants = {
  rest: { backgroundColor: "var(--foreground)" },
  hover: { backgroundColor: "rgba(var(--action-rgb), 0.8)" },
};

const MAX_VIDEO_SIZE = 5 * 1024 * 1024;

function readVideoDims(file: File): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    const url = URL.createObjectURL(file);
    video.onloadedmetadata = () => { resolve({ w: video.videoWidth, h: video.videoHeight }); URL.revokeObjectURL(url); };
    video.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not read video")); };
    video.src = url;
  });
}

export default function SiteSettingsPage() {
  useDocumentTitle("Admin · Site Content");

  const [loading, setLoading] = useState(true);

  // Hero video
  const [heroVideoUrl, setHeroVideoUrl] = useState<string | null>(null);
  const [heroVideoFile, setHeroVideoFile] = useState<File | null>(null);
  const [heroPreview, setHeroPreview] = useState<string | null>(null);
  const [heroError, setHeroError] = useState("");
  const [heroSuccess, setHeroSuccess] = useState(false);
  const [heroSaving, setHeroSaving] = useState(false);

  useEffect(() => {
    api.get("/settings")
      .then(({ data }) => {
        setHeroVideoUrl(data.hero_video_url || null);
      })
      .finally(() => setLoading(false));
  }, []);

  // ─── Hero video ────────────────────────────────────────────
  const handleHeroFile = async (file: File | null) => {
    setHeroError("");
    setHeroSuccess(false);
    if (!file) return;

    if (!["video/mp4", "video/webm"].includes(file.type)) {
      setHeroError("Only .mp4 or .webm videos are allowed.");
      return;
    }
    if (file.size > MAX_VIDEO_SIZE) {
      setHeroError(`Video must be 5MB or smaller (this file is ${(file.size / 1024 / 1024).toFixed(1)}MB).`);
      return;
    }
    try {
      const { w, h } = await readVideoDims(file);
      if (h >= w) {
        setHeroError(`Video must be landscape orientation. Got ${w}x${h}.`);
        return;
      }
    } catch {
      setHeroError("Could not read this video file.");
      return;
    }
    setHeroVideoFile(file);
    setHeroPreview(URL.createObjectURL(file));
  };

  const submitHeroVideo = async () => {
    if (!heroVideoFile) return;
    setHeroSaving(true);
    setHeroError("");
    setHeroSuccess(false);
    try {
      const fd = new FormData();
      fd.append("video", heroVideoFile);
      const { data } = await api.put("/settings/hero-video", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000, // videos take longer to upload/process than the client's default timeout
      });
      setHeroVideoUrl(data.hero_video_url);
      setHeroVideoFile(null);
      setHeroPreview(null);
      setHeroSuccess(true);
    } catch (err: any) {
      if (err.code === "ECONNABORTED") {
        setHeroError("The upload timed out, but it may have finished on the server. Reload the page to check before retrying.");
      } else {
        setHeroError(err.response?.data?.error || "Upload failed");
      }
    } finally {
      setHeroSaving(false);
    }
  };


  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-6 md:py-10 px-4 md:px-6 space-y-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-secondary animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6 md:py-10 px-4 md:px-6">
      <h1 className="text-2xl font-normal tracking-tight mb-8" style={{ fontFamily: "var(--font-display)" }}>
        Site Content
      </h1>

      {/* Hero video */}
      <section className="mb-12">
        <h2 className="text-[10px] tracking-widest uppercase font-bold mb-4 border-b border-border pb-2">
          Homepage Hero Video
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          Optional. Plays in place of the hero photo on the homepage (right-hand panel). .webm or .mp4, max 5MB, landscape orientation (around 5:4 works best — edges are cropped to fit).
        </p>

        {(heroPreview || heroVideoUrl) && (
          <video src={heroPreview || getImageUrl(heroVideoUrl)} muted autoPlay loop playsInline
            className="w-full max-h-86 object-cover bg-black mb-4" />
        )}

        <motion.label initial="rest" whileHover="hover" variants={uploadLabelVariants}
          className="flex flex-col items-center justify-center border-2 border-dashed p-8 cursor-pointer">
          <Upload size={20} className="text-muted-foreground mb-2" />
          <span className="text-xs text-muted-foreground">Click to upload a new hero video</span>
          <input type="file" accept="video/mp4,video/webm" className="hidden"
            onChange={(e) => handleHeroFile(e.target.files?.[0] || null)} />
        </motion.label>

        {heroError && <p className="text-red-500 text-xs mt-3">{heroError}</p>}
        {heroSuccess && <p className="text-green-600 text-xs mt-3">Hero video updated.</p>}

        {heroVideoFile && (
          <MotionButton type="button" onClick={submitHeroVideo} disabled={heroSaving}
            initial="rest" whileHover={heroSaving ? undefined : "hover"} whileTap={heroSaving ? undefined : tapScale}
            variants={submitButtonVariants}
            className="mt-4 text-primary-foreground py-3 px-8 text-xs tracking-widest uppercase font-semibold disabled:opacity-50">
            {heroSaving ? "Uploading…" : "Save Hero Video"}
          </MotionButton>
        )}
      </section>

    </div>
  );
}
