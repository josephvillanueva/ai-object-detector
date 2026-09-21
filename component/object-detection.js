"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { load as loadCocoSsd } from "@tensorflow-models/coco-ssd";
// Registers the WebGL and CPU backends that COCO-SSD runs on.
import "@tensorflow/tfjs";
import { renderPredictions } from "@/utils/render-predictions";
import styles from "./styles.module.scss";

const MIN_SCORE = 0.6;

const CAMERA_MESSAGES = {
  NotAllowedError:
    "Camera access was blocked. Allow it in your browser's site settings, then reload.",
  NotFoundError: "No camera was found on this device.",
  NotReadableError:
    "The camera is already in use by another app. Close it and reload.",
};

const ObjectDetection = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const modelRef = useRef(null);

  const [modelStatus, setModelStatus] = useState("loading");
  const [cameraError, setCameraError] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
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

  // One detection per animation frame, and the next frame is only requested
  // after the current detection resolves, so inference calls never overlap.
  useEffect(() => {
    if (modelStatus !== "ready" || !cameraReady || paused) return;

    let frameId;
    let stopped = false;
    let frames = 0;
    let windowStart = performance.now();

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

        const labels = [...new Set(predictions.map((p) => p.class))];
        setDetected((prev) =>
          prev.join() === labels.join() ? prev : labels
        );

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

  if (modelStatus === "error") {
    return (
      <p className={styles.status} role="alert">
        The detection model could not be downloaded. Check your connection and
        reload the page.
      </p>
    );
  }

  if (cameraError) {
    return (
      <p className={styles.status} role="alert">
        {cameraError}
      </p>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.stage}>
        <Webcam
          ref={webcamRef}
          className={styles.video}
          muted
          audio={false}
          videoConstraints={{ facingMode: "environment" }}
          onUserMedia={() => setCameraReady(true)}
          onUserMediaError={handleCameraError}
        />
        {/* Sized to the video's native resolution and stretched over it with
            CSS, so boxes line up at every screen size. */}
        <canvas ref={canvasRef} className={styles.overlay} aria-hidden="true" />

        {(modelStatus === "loading" || !cameraReady) && (
          <div className={styles.loading}>
            {modelStatus === "loading"
              ? "Loading the detection model..."
              : "Waiting for camera access..."}
          </div>
        )}
      </div>

      <div className={styles.toolbar}>
        <button
          type="button"
          className={styles.button}
          onClick={() => setPaused((p) => !p)}
          disabled={modelStatus !== "ready" || !cameraReady}
          aria-pressed={paused}
        >
          {paused ? "Resume detection" : "Pause detection"}
        </button>
        <span className={styles.meta}>
          {paused
            ? "Paused"
            : // One decimal below 10, so slow CPU-only devices do not read "0".
              `${fps < 10 ? fps.toFixed(1) : Math.round(fps)} detections per second`}
        </span>
      </div>

      <p className={styles.detected} aria-live="polite">
        {detected.length > 0
          ? `Detected: ${detected.join(", ")}`
          : "Nothing detected yet. Point the camera at people or everyday objects."}
      </p>
    </div>
  );
};

export default ObjectDetection;
