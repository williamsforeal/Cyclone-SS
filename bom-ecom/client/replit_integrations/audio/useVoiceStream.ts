/**
 * React hook for handling SSE voice streaming responses.
 * Converts audio blob to base64 and sends as JSON to match server expectations.
 */
import { useCallback, useEffect, useRef } from "react";
import { useAudioPlayback } from "./useAudioPlayback";

interface StreamCallbacks {
  onUserTranscript?: (text: string) => void;
  onTranscript?: (text: string, full: string) => void;
  onComplete?: (transcript: string) => void;
  onError?: (error: Error) => void;
}

const EMPTY_STREAM_CALLBACKS: StreamCallbacks = {};

export function useVoiceStream(callbacks: StreamCallbacks = EMPTY_STREAM_CALLBACKS) {
  const { state, init, clear, pushAudio, signalComplete } = useAudioPlayback();
  const callbacksRef = useRef(callbacks);

  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  const streamVoiceResponse = useCallback(
    async (url: string, audioBlob: Blob) => {
      await init();
      clear();

      // Convert blob to base64 for JSON body (server expects express.json())
      const base64Audio = await new Promise<string>((resolve) => {
        const fileReader = new FileReader();
        fileReader.onload = () => {
          const result = fileReader.result as string;
          resolve(result.split(",")[1]); // Remove data URL prefix
        };
        fileReader.readAsDataURL(audioBlob);
      });

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio: base64Audio }),
      });
      if (!response.ok) throw new Error("Voice request failed");

      const streamReader = response.body?.getReader();
      if (!streamReader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";
      let fullTranscript = "";

      while (true) {
        const { done, value } = await streamReader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;

          try {
            const event = JSON.parse(line.slice(6));

            switch (event.type) {
              case "user_transcript":
                callbacksRef.current.onUserTranscript?.(event.data);
                break;
              case "transcript":
                fullTranscript += event.data;
                callbacksRef.current.onTranscript?.(event.data, fullTranscript);
                break;
              case "audio":
                pushAudio(event.data);
                break;
              case "done":
                signalComplete();
                callbacksRef.current.onComplete?.(fullTranscript);
                break;
              case "error":
                throw new Error(event.error);
            }
          } catch (e) {
            if (!(e instanceof SyntaxError)) {
              callbacksRef.current.onError?.(e as Error);
            }
          }
        }
      }
    },
    [clear, init, pushAudio, signalComplete]
  );

  return { streamVoiceResponse, playbackState: state };
}
