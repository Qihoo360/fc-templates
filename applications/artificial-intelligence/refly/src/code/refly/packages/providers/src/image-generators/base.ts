export interface ImageGenerationRequest {
  prompt: string;
  model: string;
  aspectRatio?: string;
  apiKey: string;
}

export interface ImageGenerationResponse {
  output: string;
}

export abstract class BaseImageGenerator {
  abstract generate(request: ImageGenerationRequest): Promise<ImageGenerationResponse>;
}
