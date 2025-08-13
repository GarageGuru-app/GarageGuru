// Hybrid scanner using both native BarcodeDetector and ZXing fallback
import { BrowserMultiFormatReader, BarcodeFormat } from "@zxing/browser";

type ScanResult = { text: string; format: string };
type StopFn = () => void;

/** Start camera and return the MediaStream + selected video track */
export async function startCameraStream(): Promise<{ stream: MediaStream; track: MediaStreamTrack }> {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: { ideal: "environment" },
      width: { ideal: 1920 },
      height: { ideal: 1080 },
    },
    audio: false,
  });
  const track = stream.getVideoTracks()[0];
  return { stream, track };
}

/** Wait until the video element has real dimensions */
export async function waitVideoReady(video: HTMLVideoElement): Promise<void> {
  if (video.readyState >= 2 && video.videoWidth && video.videoHeight) return;
  await new Promise<void>((res) => {
    const onLoaded = () => {
      if (video.videoWidth && video.videoHeight) {
        video.removeEventListener("loadeddata", onLoaded);
        res();
      }
    };
    video.addEventListener("loadeddata", onLoaded);
  });
}

/** Hybrid decode: BarcodeDetector → ZXing; returns stop() and fires onResult once */
export async function startHybridDecode(
  video: HTMLVideoElement,
  onResult: (r: ScanResult) => void,
  onError?: (e: any) => void
): Promise<StopFn> {
  // ensure video is ready
  await waitVideoReady(video);

  // ---- A) Native BarcodeDetector (QR + most 1D barcodes) ----
  // @ts-ignore
  if (window.BarcodeDetector) {
    try {
      // @ts-ignore
      const detector = new window.BarcodeDetector({
        formats: [
          "qr_code",
          "code_128",
          "code_39",
          "ean_13",
          "ean_8",
          "upc_a",
          "upc_e",
          "itf",
          "codabar",
          "data_matrix",
          "pdf417",
        ],
      });

      let stopped = false;
      const loop = async () => {
        if (stopped) return;
        try {
          const codes = await detector.detect(video);
          if (codes && codes.length) {
            const c = codes[0];
            onResult({ text: c.rawValue ?? "", format: c.format ?? "unknown" });
            stopped = true;
            return;
          }
        } catch (e) {
          onError?.(e);
        }
        requestAnimationFrame(loop);
      };
      loop();

      return () => {
        stopped = true;
      };
    } catch (e) {
      onError?.(e);
      // fall through to ZXing
    }
  }

  // ---- B) ZXing fallback (multi-format) ----
  const reader = new BrowserMultiFormatReader();
  let controls: any = null;

  try {
    controls = await reader.decodeFromVideoElement(video, (res, err) => {
      if (res) {
        onResult({ text: res.getText(), format: res.getBarcodeFormat().toString() });
        controls?.stop();
      } else if (err) {
        // ignore NotFound; report other errors
      }
    });

    return () => {
      controls?.stop();
    };
  } catch (e) {
    onError?.(e);
    return () => {};
  }
}