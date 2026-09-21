# AI Object Detector

Point your webcam at a room and get live bounding boxes and labels for the objects in it. Detection runs entirely in the browser.

**Live:** https://ai-object-detector-josephvillanueva.vercel.app · **[Product brief](docs/PRODUCT.md)** · **[Roadmap](https://github.com/josephvillanueva/ai-object-detector/milestone/1)**

<!-- Add a screenshot or GIF and uncomment: -->
<!-- ![Detected objects with bounding boxes](docs/demo.gif) -->

## How it works

1. **Load the model.** On mount, the app loads [COCO-SSD](https://github.com/tensorflow/tfjs-models/tree/master/coco-ssd), a pre-trained single-shot detector that recognizes 80 common object classes, through TensorFlow.js.
2. **Read the webcam.** `react-webcam` streams video into a `<video>` element.
3. **Detect on a loop.** Once the video is ready, a `requestAnimationFrame` loop passes each frame to `model.detect()` with a 0.6 confidence threshold. The next frame is requested only after the current detection resolves, so inference calls never overlap, and the loop is cancelled when the component unmounts or detection is paused.
4. **Draw the results.** A `<canvas>` overlay uses the video's native resolution and is stretched over it with CSS, so boxes stay aligned at any screen size. Each box is labelled with its class and confidence score.
5. **Handle failure.** A blocked, missing, or busy camera and a failed model download each get a specific message instead of a blank screen.

**No video leaves your device.** Inference runs on your own GPU/CPU through TensorFlow.js, with no server and no upload, which is also why the app can be a static Vercel deploy.

## Tech stack

- **Next.js 15** and **React 19**
- **TensorFlow.js** with the **COCO-SSD** model
- **react-webcam** for camera access
- **Tailwind CSS** and SCSS modules

## Running locally

```bash
git clone https://github.com/josephvillanueva/ai-object-detector.git
cd ai-object-detector
npm install
npm run dev
```

Open http://localhost:3000 and allow camera access. The first load downloads the model weights, so give it a few seconds.

## What I'd do next

- Add a front/rear camera toggle for mobile
- Let people filter to the object classes they care about
- Offer the lighter `lite_mobilenet_v2` base model on low-powered devices
