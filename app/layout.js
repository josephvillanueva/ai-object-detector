import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata = {
  title: "AI Object Detector | Joseph Villanueva",
  description:
    "Real-time object detection from your webcam, running entirely in the browser with TensorFlow.js and COCO-SSD. No video leaves your device.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={geist.className}>{children}</body>
    </html>
  );
}
