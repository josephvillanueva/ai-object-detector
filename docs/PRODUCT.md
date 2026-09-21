# Product brief: AI Object Detector

## Problem

Computer vision feels abstract to most people. Explaining object detection is harder than letting someone point a camera at their desk and watch it label a cup, a laptop and a person in real time.

## Who it's for

- **Curious non-specialists** who want to see what in-browser AI can do, with nothing to install
- **Developers** evaluating whether TensorFlow.js is fast enough for client-side vision

## What v1 does

Live webcam feed with bounding boxes and labels for 80 everyday object classes, running entirely in the browser.

## Key decisions

| Decision | Why |
| --- | --- |
| Run inference in the browser, not on a server | Video never leaves the device, which removes the biggest trust barrier to allowing camera access. It also means no server costs and a static deploy. |
| Pre-trained COCO-SSD | Good coverage of everyday objects at a size that loads in seconds. Training a custom model wouldn't change the demo's value. |
| 0.6 confidence threshold | Hides most false positives while keeping the common objects visible |
| No capture or recording | Reinforces the privacy promise and keeps scope tight |

## Out of scope for now

Custom models, saving snapshots or video, multi-camera setups.

## How I'd measure success

- **Camera-permission grant rate:** the biggest drop-off point for any webcam demo
- **Time to first detection:** model download plus warm-up. If it's too slow, people leave before seeing anything.
- **Session length after first detection:** a sign the demo is engaging enough to explore

## What's next

The prioritized backlog is on the [v1.1 milestone](https://github.com/josephvillanueva/ai-object-detector/milestone/1). The detection-loop cleanup bug comes first: a demo that drains the battery undercuts everything else.
