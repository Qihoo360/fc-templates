import { BaseVideoGenerator, VideoGenerationRequest, VideoGenerationResponse } from './base';

/**
 * Volces video generator using asynchronous task mechanism
 * Supports Doubao Seedance models for text-to-video generation
 */
export class VolcesVideoGenerator extends BaseVideoGenerator {
  /**
   * Generate video using asynchronous polling mechanism
   * @param request video generation request
   * @returns video generation response
   */
  async generate(request: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    const createTaskUrl = 'https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks';

    const headers = {
      Authorization: `Bearer ${request.apiKey}`,
      'Content-Type': 'application/json',
    };

    // Build request data for task creation
    const data = {
      model: request.model,
      content: [
        {
          type: 'text',
          text: request.prompt,
        },
      ],
    };

    try {
      // Create video generation task
      const response = await fetch(createTaskUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Volces API error: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      const result = await response.json();
      const taskId = result.id;

      console.log(`Video generation task created with ID: ${taskId}`);

      if (!taskId) {
        console.log('Full Volces response:', result);
        throw new Error('Volces API returned no task id');
      }

      // Poll task status until completion
      const queryUrl = `https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks/${taskId}`;
      let status = 'queued';
      let videoUrl = null;

      while (status !== 'succeeded' && status !== 'failed') {
        console.log(`Polling task ${taskId}, current status: ${status} ...`);

        await new Promise((resolve) => setTimeout(resolve, 3000));

        const pollResponse = await fetch(queryUrl, {
          method: 'GET',
          headers,
        });

        if (!pollResponse.ok) {
          const errorText = await pollResponse.text();
          throw new Error(
            `Volces polling error: ${pollResponse.status} ${pollResponse.statusText} - ${errorText}`,
          );
        }

        const pollResult = await pollResponse.json();
        status = pollResult.status;

        if (status === 'succeeded' && pollResult.content && pollResult.content.video_url) {
          videoUrl = pollResult.content.video_url;
        }
      }

      // Check final result
      if (status !== 'succeeded' || !videoUrl) {
        throw new Error(`Volces video generation failed with status: ${status}`);
      }

      console.log(`Video generation succeeded, output url: ${videoUrl}`);

      return {
        output: videoUrl,
      };
    } catch (error) {
      console.error('Error generating video with Volces:', error);
      throw error;
    }
  }
}
