/**
 * Audio Visualizer Service
 *
 * Uses Web Audio API to analyze audio frequency data for visualization
 * Creates frequency bars animation during recording
 */

/**
 * AudioVisualizer class
 * Manages Web Audio API context and provides frequency data
 */
export class AudioVisualizer {
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private animationFrameId: number | null = null;
  private isActive: boolean = false;

  /**
   * Initialize Web Audio API components
   * @param stream - MediaStream from microphone
   */
  initialize(stream: MediaStream): void {
    try {
      // Create AudioContext
      this.audioContext = new AudioContext();

      // Create AnalyserNode for frequency analysis
      this.analyserNode = this.audioContext.createAnalyser();

      // Configure analyser settings
      // fftSize of 256 gives us 128 frequency bins (fftSize / 2)
      this.analyserNode.fftSize = 256;

      // smoothingTimeConstant controls how much the data smooths over time
      // 0 = no smoothing, 1 = maximum smoothing
      // 0.8 gives smooth animation without too much lag
      this.analyserNode.smoothingTimeConstant = 0.8;

      // Create array to hold frequency data
      const bufferLength = this.analyserNode.frequencyBinCount; // 128 bins
      this.dataArray = new Uint8Array(bufferLength);

      // Connect microphone stream to analyser
      const source = this.audioContext.createMediaStreamSource(stream);
      source.connect(this.analyserNode);

      // Note: We don't connect to destination (speakers) to avoid feedback
    } catch (error) {
      console.error('Error initializing audio visualizer:', error);
      throw new Error('Failed to initialize audio visualizer');
    }
  }

  /**
   * Get current frequency data
   * Returns array of 128 frequency values (0-255)
   * @returns Uint8Array of frequency data or null if not initialized
   */
  getFrequencyData(): Uint8Array | null {
    if (!this.analyserNode || !this.dataArray) {
      return null;
    }

    // getByteFrequencyData fills dataArray with current frequency values
    // Each value is 0-255, representing amplitude at that frequency
    this.analyserNode.getByteFrequencyData(this.dataArray);

    return this.dataArray;
  }

  /**
   * Start visualization loop
   * Calls callback function with frequency data on each animation frame
   * @param callback - Function to call with frequency data
   */
  startVisualization(callback: (data: Uint8Array) => void): void {
    this.isActive = true;

    // Animation loop
    const animate = () => {
      if (!this.isActive) {
        return;
      }

      // Get current frequency data
      const data = this.getFrequencyData();

      if (data) {
        // Call callback with frequency data
        callback(data);
      }

      // Request next frame
      this.animationFrameId = requestAnimationFrame(animate);
    };

    // Start the loop
    animate();
  }

  /**
   * Stop visualization loop
   */
  stopVisualization(): void {
    this.isActive = false;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Clean up resources
   * Must be called when done to prevent memory leaks
   */
  cleanup(): void {
    // Stop animation loop
    this.stopVisualization();

    // Close AudioContext
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    // Clear references
    this.analyserNode = null;
    this.dataArray = null;
  }

  /**
   * Check if visualizer is currently active
   */
  isVisualizationActive(): boolean {
    return this.isActive;
  }
}
