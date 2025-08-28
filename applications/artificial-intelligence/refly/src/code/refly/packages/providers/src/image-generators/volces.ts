import { BaseImageGenerator, ImageGenerationRequest, ImageGenerationResponse } from './base';

export class VolcesImageGenerator extends BaseImageGenerator {
  async generate(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    const url = 'https://ark.cn-beijing.volces.com/api/v3/images/generations';

    const headers = {
      Authorization: `Bearer ${request.apiKey}`,
      'Content-Type': 'application/json',
    };

    const data = {
      model: request.model,
      prompt: request.prompt,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Volces API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();

    if (!result.data || !Array.isArray(result.data) || result.data.length === 0) {
      throw new Error('No image data returned from Volces API');
    }

    const imageData = result.data[0];
    if (!imageData.url) {
      throw new Error('No image URL found in response');
    }
    return {
      output: imageData.url,
    };
  }
}
