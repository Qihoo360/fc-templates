import { BaseImageGenerator, ImageGenerationRequest, ImageGenerationResponse } from './base';

export class ReplicateImageGenerator extends BaseImageGenerator {
  /**
   * Generate image using asynchronous polling mechanism
   * @param request image generation request
   * @returns image generation response
   */
  async generate(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    const url = `https://api.replicate.com/v1/models/${request.model}/predictions`;

    const headers = {
      Authorization: `Bearer ${request.apiKey}`,
      'Content-Type': 'application/json',
    };

    const data = {
      input: {
        prompt: request.prompt,
        aspectRatio: request.aspectRatio,
      },
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Replicate API error: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      const result = await response.json();
      const predictionId = result.id;
      let status = result.status;

      console.log(`Initial prediction status: ${status}, id: ${predictionId}`);

      if (!predictionId) {
        console.log('Full Replicate response:', result);
        throw new Error('Replicate API returned no prediction id');
      }

      const pollingUrl = `https://api.replicate.com/v1/predictions/${predictionId}`;
      let output = result.output;

      while (status !== 'succeeded' && status !== 'failed' && status !== 'canceled') {
        console.log(`Polling prediction ${predictionId}, current status: ${status} ...`);

        await new Promise((resolve) => setTimeout(resolve, 3000));

        const pollResponse = await fetch(pollingUrl, {
          method: 'GET',
          headers,
        });

        if (!pollResponse.ok) {
          const errorText = await pollResponse.text();
          throw new Error(
            `Replicate polling error: ${pollResponse.status} ${pollResponse.statusText} - ${errorText}`,
          );
        }

        const pollResult = await pollResponse.json();
        status = pollResult.status;
        output = pollResult.output;
      }

      if (status !== 'succeeded' || !output) {
        const detailError = result.detail ? `: ${JSON.stringify(result.detail)}` : '';
        throw new Error(`Replicate image generation failed${detailError}`);
      }

      console.log(`Prediction succeeded, output url: ${output}`);

      return {
        output: Array.isArray(output) ? output[0] : output,
      };
    } catch (error) {
      console.error('Error generating image with replicate:', error);
      throw error;
    }
  }
}
