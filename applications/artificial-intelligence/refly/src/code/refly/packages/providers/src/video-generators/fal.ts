import { BaseVideoGenerator, VideoGenerationRequest, VideoGenerationResponse } from './base';

export class FalVideoGenerator extends BaseVideoGenerator {
  /**
   * Generate video using Fal.ai API
   * @param request video generation request
   * @returns video generation response
   */
  async generate(request: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    const url = `https://queue.fal.run/${request.model}`;

    const modelMap: Record<string, string> = {
      'fal-ai/bytedance/seedance/v1/lite/text-to-video': 'fal-ai/bytedance',
      'fal-ai/bytedance/seedance/v1/pro/text-to-video': 'fal-ai/bytedance',
      'fal-ai/minimax/hailuo-02/pro/text-to-video': 'fal-ai/minimax',
      'fal-ai/minimax/hailuo-02/standard/text-to-video': 'fal-ai/minimax',
      'fal-ai/veo3/fast': 'fal-ai/veo3',
    };
    const baseModel = modelMap[request.model] || request.model;

    const headers = {
      Authorization: `Key ${request.apiKey}`,
      'Content-Type': 'application/json',
    };

    const data = {
      prompt: request.prompt,
      aspect_ratio: request.aspectRatio,
    };

    try {
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
      let status = result.status;

      console.log(`Initial video request status: ${status}, id: ${requestId}`);

      if (!requestId) {
        console.log('Full Fal response:', result);
        throw new Error('Fal API returned no request id');
      }

      const statusUrl = `https://queue.fal.run/${baseModel}/requests/${requestId}/status`;
      let output = null;

      while (status !== 'COMPLETED' && status !== 'FAILED') {
        console.log(`Polling video request ${requestId}, current status: ${status} ...`);

        await new Promise((resolve) => setTimeout(resolve, 5000));

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

        if (status === 'COMPLETED') {
          const responseUrl = `https://queue.fal.run/${baseModel}/requests/${requestId}`;
          const finalResponse = await fetch(responseUrl, {
            method: 'GET',
            headers: {
              Authorization: `Key ${request.apiKey}`,
            },
          });

          if (!finalResponse.ok) {
            const errorText = await finalResponse.text();
            throw new Error(
              `Fal result error: ${finalResponse.status} ${finalResponse.statusText} - ${errorText}`,
            );
          }

          const finalResult = await finalResponse.json();
          output = finalResult.video || finalResult.output;
        }
      }

      if (status !== 'COMPLETED' || !output) {
        throw new Error(`Fal video generation failed with status: ${status}`);
      }

      console.log('Video request succeeded, output:', output);

      let outputUrl: string;
      if (typeof output === 'string') {
        outputUrl = output;
      } else if (output && typeof output === 'object') {
        if (Array.isArray(output)) {
          const firstItem = output[0];
          outputUrl = typeof firstItem === 'string' ? firstItem : firstItem?.url || firstItem;
        } else {
          outputUrl = output.url || output;
        }
      } else {
        throw new Error('Invalid output format from Fal API');
      }

      return {
        output: outputUrl,
      };
    } catch (error) {
      console.error('Error generating video with fal:', error);
      throw error;
    }
  }
}
