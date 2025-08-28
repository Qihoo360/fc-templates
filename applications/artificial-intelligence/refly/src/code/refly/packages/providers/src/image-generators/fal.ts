import { BaseImageGenerator, ImageGenerationRequest, ImageGenerationResponse } from './base';

export class FalImageGenerator extends BaseImageGenerator {
  /**
   * Generate image using Fal.ai API
   * @param request image generation request
   * @returns image generation response
   */
  async generate(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    const url = `https://queue.fal.run/${request.model}`;

    const modelMap: Record<string, string> = {
      'fal-ai/flux-pro/v1.1-ultra': 'fal-ai/flux-pro',
      'fal-ai/imagen4/preview': 'fal-ai/imagen4',
      'fal-ai/recraft/v2/text-to-image': 'fal-ai/recraft',
      'fal-ai/luma-photon/flash': 'fal-ai/luma-photon',
    };
    const baseModel = modelMap[request.model] || request.model;

    const headers = {
      Authorization: `Key ${request.apiKey}`,
      'Content-Type': 'application/json',
    };

    // Format the request data according to Fal.ai API documentation
    const data = {
      prompt: request.prompt,
    };

    try {
      // Submit the request to Fal.ai API
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Fal API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      const requestId = result.request_id;

      console.log(`Request submitted, id: ${requestId}`);

      if (!requestId) {
        console.log('Full Fal response:', result);
        throw new Error('Fal API returned no request id');
      }

      // Status polling URL
      const statusUrl = `https://queue.fal.run/${baseModel}/requests/${requestId}/status`;
      let status = 'IN_QUEUE';
      let finalResult = null;

      // Poll the status until the request is completed
      while (status === 'IN_QUEUE' || status === 'IN_PROGRESS') {
        console.log(`Polling request ${requestId}, current status: ${status} ...`);

        await new Promise((resolve) => setTimeout(resolve, 3000));

        const pollResponse = await fetch(statusUrl, {
          method: 'GET',
          headers: {
            Authorization: `Key ${request.apiKey}`,
          },
        });

        if (!pollResponse.ok) {
          const errorText = await pollResponse.text();
          throw new Error(
            `Fal polling error: ${pollResponse.status} ${pollResponse.statusText} - ${errorText}`,
          );
        }

        const pollResult = await pollResponse.json();
        status = pollResult.status;

        // Get the final result if the request is completed
        if (status === 'COMPLETED') {
          const resultUrl = `https://queue.fal.run/${baseModel}/requests/${requestId}`;
          const resultResponse = await fetch(resultUrl, {
            method: 'GET',
            headers: {
              Authorization: `Key ${request.apiKey}`,
            },
          });

          if (!resultResponse.ok) {
            const errorText = await resultResponse.text();
            throw new Error(
              `Fal result error: ${resultResponse.status} ${resultResponse.statusText} - ${errorText}`,
            );
          }

          finalResult = await resultResponse.json();
          break;
        }
      }

      // Check if the request is completed successfully
      if (status !== 'COMPLETED' || !finalResult) {
        throw new Error(`Fal image generation failed with status: ${status}`);
      }

      console.log('Request succeeded, result:', finalResult);

      // Extract the image URL from the response
      const images = finalResult.images;
      if (!images || !Array.isArray(images) || images.length === 0) {
        throw new Error('No images found in response');
      }

      return {
        output: images[0].url,
      };
    } catch (error) {
      console.error('Error generating image with fal:', error);
      throw error;
    }
  }
}
