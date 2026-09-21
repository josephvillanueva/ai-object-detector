"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { load as loadCocoSsd } from "@tensorflow-models/coco-ssd";
// Registers the WebGL and CPU backends that COCO-SSD runs on.
import "@tensorflow/tfjs";
import { renderPredictions } from "@/utils/render-predictions";

const MIN_SCORE = 0.6;

const CAMERA_MESSAGES = {
  NotAllowedError:
    "Camera access was blocked. Allow it in your browser's site settings, then reload.",
  NotFoundError: "No camera was found on this device.",
  NotReadableError:
    "The camera is already in use by another app. Close it and reload.",
};

// Groups predictions by class, keeping the count and best score for each.
function summarise(predictions) {
  const byClass = new Map();
  for (const { class: label, score } of predictions) {
    const entry = byClass.get(label) ?? { label, count: 0, score: 0 };
    entry.count += 1;
    entry.score = Math.max(entry.score, score);
    byClass.set(label, entry);
  }
  return [...byClass.values()].sort((a, b) => b.score - a.score);
}

// Coarse fingerprint so the panel only re-renders when what it shows changes.
const fingerprint = (summary) =>
  summary.map((s) => `${s.label}:${s.count}:${Math.round(s.score * 20)}`).join("|");

const ObjectDetection = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const modelRef = useRef(null);

  const [modelStatus, setModelStatus] = useState("loading");
  const [cameraError, setCameraError] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(4 / 3);
  const [paused, setPaused] = useState(false);
  const [detected, setDetected] = useState([]);
  const [fps, setFps] = useState(0);

  useEffect(() => {
    let cancelled = false;
    loadCocoSsd()
      .then((model) => {
        if (cancelled) return;
        modelRef.current = model;
        setModelStatus("ready");
      })
      .catch((error) => {
        console.error("Failed to load COCO-SSD", error);
        if (!cancelled) setModelStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // The stage takes the camera's real aspect ratio, so the video fills it with
  // no letterboxing and the canvas overlay covers exactly the same pixels.
  useEffect(() => {
    const video = webcamRef.current?.video;
    if (!cameraReady || !video) return;
    const update = () => {
      if (video.videoWidth && video.videoHeight) {
        setAspectRatio(video.videoWidth / video.videoHeight);
      }
    };
    update();
    video.addEventListener("loadedmetadata", update);
    video.addEventListener("resize", update);
    return () => {
      video.removeEventListener("loadedmetadata", update);
      video.removeEventListener("resize", update);
    };
  }, [cameraReady]);

  // One detection per animation frame, and the next frame is only requested
  // after the current detection resolves, so inference calls never overlap.
  useEffect(() => {
    if (modelStatus !== "ready" || !cameraReady || paused) return;

    let frameId;
    let stopped = false;
    let frames = 0;
    let windowStart = performance.now();
    let lastFingerprint = "";

    const detectFrame = async () => {
      const video = webcamRef.current?.video;
      const canvas = canvasRef.current;
      if (stopped || !video || !canvas) return;

      if (video.readyState === 4) {
        if (canvas.width !== video.videoWidth) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }
        const predictions = await modelRef.current.detect(
          video,
          undefined,
          MIN_SCORE
        );
        if (stopped) return;
        renderPredictions(predictions, canvas.getContext("2d"));

        const summary = summarise(predictions);
        const next = fingerprint(summary);
        if (next !== lastFingerprint) {
          lastFingerprint = next;
          setDetected(summary);
        }

        frames += 1;
        const now = performance.now();
        if (now - windowStart >= 1000) {
          setFps((frames * 1000) / (now - windowStart));
          frames = 0;
          windowStart = now;
        }
      }

      frameId = requestAnimationFrame(detectFrame);
    };

    frameId = requestAnimationFrame(detectFrame);

    return () => {
      stopped = true;
      cancelAnimationFrame(frameId);
    };
  }, [modelStatus, cameraReady, paused]);

  const handleCameraError = useCallback((error) => {
    console.error("Camera failed to start", error);
    const name = error?.name ?? "";
    setCameraError(
      CAMERA_MESSAGES[name] ??
        "The camera could not be started. Check that this page is allowed to use it."
    );
  }, []);

  const fatal =
    modelStatus === "error"
      ? "The detection model could not be downloaded. Check your connection and reload the page."
      : cameraError;

  if (fatal) {
    return (
      <p
        role="alert"
        className="max-w-xl rounded-2xl border border-red-400/30 bg-red-500/10 p-5 text-red-100"
      >
        {fatal}
      </p>
    );
  }

  const running = modelStatus === "ready" && cameraReady;
  const rate = fps < 10 ? fps.toFixed(1) : Math.round(fps);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section aria-label="Camera">
        <div
          className="relative overflow-hidden rounded-2xl bg-zinc-900 ring-1 ring-white/10"
          style={{ aspectRatio }}
        >
          <Webcam
            ref={webcamRef}
            className="absolute inset-0 h-full w-full object-cover"
            muted
            audio={false}
            videoConstraints={{ facingMode: "environment" }}
            onUserMedia={() => setCameraReady(true)}
            onUserMediaError={handleCameraError}
          />
          <canvas
            ref={canvasRef}
            className="pointer-events-none absolute inset-0 h-full w-full"
            aria-hidden="true"
          />

          {running && (
            <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2 text-xs font-medium">
              {/* One static dot, because it marks real state (live or paused). */}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-950/70 px-2.5 py-1 backdrop-blur">
                <span
                  aria-hidden="true"
                  className={`h-2 w-2 rounded-full ${paused ? "bg-zinc-500" : "bg-red-500"}`}
                />
                {paused ? "Paused" : "Live"}
              </span>
              {!paused && (
                <span className="rounded-full bg-zinc-950/70 px-2.5 py-1 tabular-nums backdrop-blur">
                  {rate} fps
                </span>
              )}
            </div>
          )}

          {!running && (
            <div className="absolute inset-0 grid place-items-center bg-zinc-900 px-6 text-center">
              <div>
                <p className="font-medium text-zinc-200">
                  {modelStatus === "loading"
                    ? "Downloading the detection model"
                    : "Waiting for camera access"}
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  {modelStatus === "loading"
                    ? "Your browser caches it, so later visits start faster."
                    : "Your browser should be asking for permission."}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            disabled={!running}
            aria-pressed={paused}
            className="rounded-xl bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {paused ? "Resume detection" : "Pause detection"}
          </button>
          <p className="text-sm text-zinc-500">
            Shows objects detected with at least {Math.round(MIN_SCORE * 100)}%
            confidence
          </p>
        </div>
      </section>

      <aside className="flex flex-col gap-4">
        <section className="rounded-2xl bg-white/[0.03] p-5 ring-1 ring-white/10">
          <h2 className="font-semibold">Detected now</h2>
          <div aria-live="polite">
            {detected.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-500">
                Nothing yet. Try pointing the camera at a person or a coffee
                mug.
              </p>
            ) : (
              <ul className="mt-3 flex flex-col gap-3">
                {detected.map(({ label, count, score }) => (
                  <li key={label}>
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="font-medium capitalize">
                        {label}
                        {count > 1 && (
                          <span className="ml-1.5 text-zinc-500">×{count}</span>
                        )}
                      </span>
                      <span className="tabular-nums text-zinc-400">
                        {Math.round(score * 100)}%
                      </span>
                    </div>
                    <div
                      aria-hidden="true"
                      className="mt-1.5 h-1 rounded-full bg-cyan-400"
                      style={{ width: `${score * 100}%` }}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="px-1">
          <h2 className="font-semibold">How it works</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            The COCO-SSD model runs through TensorFlow.js on your own GPU, or
            your CPU if there isn&apos;t one, and checks each frame the moment
            the last check finishes. Nothing is sent to a server, which is why
            this works as a static site with no backend.
          </p>
        </section>
      </aside>
    </div>
  );
};

export default ObjectDetection;
