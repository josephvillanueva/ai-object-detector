import ObjectDetection from "@/component/object-detection";

export default function Home() {
  return (
    <div className="min-h-[100dvh]">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <span className="font-semibold">AI Object Detector</span>
        <a
          href="https://github.com/josephvillanueva/ai-object-detector"
          className="rounded-xl px-3 py-1.5 text-sm text-zinc-400 ring-1 ring-white/10 transition hover:text-white hover:ring-white/25"
        >
          View source
        </a>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-16 pt-8">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-cyan-300">
            Runs on your device. No video is uploaded.
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            See what your camera sees
          </h1>
          <p className="mt-3 text-lg leading-relaxed text-zinc-400">
            Live object detection in your browser, using TensorFlow.js and a
            model that knows 80 everyday objects.
          </p>
        </div>

        <div className="mt-10">
          <ObjectDetection />
        </div>
      </main>

      <footer className="border-t border-white/5 py-6 text-center text-sm text-zinc-500">
        Built by{" "}
        <a
          href="https://joseph-react-portfolio.vercel.app"
          className="font-medium text-zinc-300 underline-offset-4 hover:underline"
        >
          Joseph Villanueva
        </a>
      </footer>
    </div>
  );
}
