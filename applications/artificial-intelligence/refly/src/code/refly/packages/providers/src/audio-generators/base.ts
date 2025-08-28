/**
 * Audio Generation Request Interface
 */
export interface AudioGenerationRequest {
  prompt: string;
  model: string;
  apiKey: string;
}

/**
 * Audio Generation Response Interface
 */
export interface AudioGenerationResponse {
  output: string;
}

/**
 * Base Audio Generator
 */
export abstract class BaseAudioGenerator {
  /**
   * Generate audio
   * @param request audio generation request
   * @returns audio generation response
   */
  abstract generate(request: AudioGenerationRequest): Promise<AudioGenerationResponse>;
}
