import ObjectDetection from "@/component/object-detection";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <h1 className="gradient-title font-extrabold text-3xl md:text-6xl lg:text-8xl tracking-tighter md:px-6 text-center">
        AI Object Detector
      </h1>
      <p className="mt-4 max-w-2xl text-center text-gray-400">
        Live object detection from your webcam using TensorFlow.js and
        COCO-SSD. Everything runs on your device: no video is uploaded.
      </p>
      <ObjectDetection />
    </main>
  );
}
