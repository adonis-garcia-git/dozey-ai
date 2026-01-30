/**
 * Audio Visualizer Component
 *
 * Displays real-time frequency bars during recording
 * Shows 32 bars with gradient colors that respond to audio input
 */

import React, { useEffect, useRef, useState } from 'react';
import { AudioVisualizer as AudioVisualizerService } from '../services/audioVisualizer';

interface AudioVisualizerProps {
  isRecording: boolean;
  isPaused: boolean;
  audioStream: MediaStream | null;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isRecording,
  isPaused,
  audioStream,
}) => {
  // State to hold bar heights (32 bars, values 0-100)
  const [barHeights, setBarHeights] = useState<number[]>(new Array(32).fill(0));

  // Ref to persist visualizer instance across renders
  const visualizerRef = useRef<AudioVisualizerService | null>(null);

  useEffect(() => {
    // Only initialize visualizer when actually recording (not paused)
    if (isRecording && !isPaused && audioStream) {
      try {
        // Create visualizer instance
        const visualizer = new AudioVisualizerService();
        visualizerRef.current = visualizer;

        // Initialize with audio stream
        visualizer.initialize(audioStream);

        // Start visualization loop
        visualizer.startVisualization((frequencyData) => {
          // frequencyData is Uint8Array with 128 frequency bins (0-255 values)
          // We want 32 bars, so sample every 4th bin
          const bars: number[] = [];

          for (let i = 0; i < 32; i++) {
            // Get every 4th frequency bin
            const index = i * 4;
            const value = frequencyData[index];

            // Convert from 0-255 to 0-100 percentage
            // Also apply a minimum height of 4% for visual consistency
            const percentage = Math.max(4, (value / 255) * 100);
            bars.push(percentage);
          }

          // Update bar heights
          setBarHeights(bars);
        });
      } catch (error) {
        console.error('Error starting visualizer:', error);
      }
    } else {
      // Not recording or paused - flatten bars
      setBarHeights(new Array(32).fill(4)); // Minimum height

      // Cleanup visualizer if exists
      if (visualizerRef.current) {
        visualizerRef.current.cleanup();
        visualizerRef.current = null;
      }
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (visualizerRef.current) {
        visualizerRef.current.cleanup();
        visualizerRef.current = null;
      }
    };
  }, [isRecording, isPaused, audioStream]);

  // Don't show visualizer if not recording
  if (!isRecording) {
    return null;
  }

  return (
    <div className="flex items-end justify-center gap-1 h-32 bg-gray-900 rounded-lg p-4">
      {barHeights.map((height, index) => (
        <div
          key={index}
          className="flex-1 bg-gradient-to-t from-blue-500 to-purple-500 rounded-t transition-all duration-75"
          style={{
            height: `${height}%`,
            minWidth: '4px',
          }}
        />
      ))}
    </div>
  );
};
