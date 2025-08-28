import { BaseVideoGenerator, VideoGenerationRequest, VideoGenerationResponse } from './base';

export class ReplicateVideoGenerator extends BaseVideoGenerator {
  /**
   * Generate video using asynchronous polling mechanism
   * @param request video generation request
   * @returns video generation response
   */
  async generate(request: VideoGenerationRequest): Promise<VideoGenerationResponse> {
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
      //prediction_id
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

      // add video url to output
      if (
        status !== 'succeeded' ||
        !output ||
        (typeof output !== 'string' && !Array.isArray(output))
      ) {
        const detailError = result.detail || `Prediction failed with status: ${status}`;
        throw new Error(`Replicate video generation failed: ${detailError}`);
      }

      console.log(`Prediction succeeded, output url: ${output}`);

      return {
        output: Array.isArray(output) ? output[0] : output,
      };
    } catch (error) {
      console.error('Error generating video with replicate:', error);
      throw error;
    }
  }
}
