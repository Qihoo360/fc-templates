import { BaseAudioGenerator, AudioGenerationRequest, AudioGenerationResponse } from './base';

export class FalAudioGenerator extends BaseAudioGenerator {
  /**
   * Generate audio using Fal.ai API
   * @param request audio generation request
   * @returns audio generation response
   */
  async generate(request: AudioGenerationRequest): Promise<AudioGenerationResponse> {
    const url = `https://queue.fal.run/${request.model}`;

    const modelMap: Record<string, string> = {
      'fal-ai/playai/tts/v3': 'fal-ai/playai',
      'fal-ai/elevenlabs/tts/turbo-v2.5': 'fal-ai/elevenlabs',
      'fal-ai/orpheus-tts': 'fal-ai/orpheus-tts',
      'fal-ai/elevenlabs/sound-effects': 'fal-ai/elevenlabs',
      'fal-ai/elevenlabs/tts/multilingual-v2': 'fal-ai/elevenlabs',
    };
    const baseModel = modelMap[request.model] || request.model;

    const headers = {
      Authorization: `Key ${request.apiKey}`,
      'Content-Type': 'application/json',
    };

    // 根据不同模型设置相应的参数
    let data = {};

    switch (request.model) {
      case 'fal-ai/playai/tts/v3':
        data = {
          input: request.prompt,
          voice: 'Jennifer (English (US)/American)',
        };
        break;

      case 'fal-ai/elevenlabs/tts/turbo-v2.5':
      case 'fal-ai/orpheus-tts':
      case 'fal-ai/dia-tts':
      case 'fal-ai/elevenlabs/sound-effects':
      case 'fal-ai/elevenlabs/tts/multilingual-v2':
        data = {
          text: request.prompt,
        };
        break;

      case 'fal-ai/yue':
        data = {
          lyrics: request.prompt,
          genres: 'inspiring female uplifting pop airy vocal electronic bright vocal vocal',
        };
        break;

      case 'fal-ai/diffrhythm':
      case 'fal-ai/ace-step':
        if (request.model === 'fal-ai/ace-step') {
          data = {
            lyrics: request.prompt,
            tags: 'lofi, hiphop, drum and bass, trap, chill',
          };
        } else {
          data = {
            lyrics: request.prompt,
          };
        }
        break;

      case 'cassetteai/sound-effects-generator':
        data = {
          prompt: request.prompt,
          duration: 30,
        };
        break;

      default:
        // 默认使用prompt参数
        data = {
          prompt: request.prompt,
        };
        break;
    }

    try {
      // 提交请求到队列
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

      console.log(`Initial audio request status: ${status}, id: ${requestId}`);

      if (!requestId) {
        console.log('Full Fal response:', result);
        throw new Error('Fal API returned no request id');
      }

      const statusUrl = `https://queue.fal.run/${baseModel}/requests/${requestId}/status`;
      let output = null;

      // 轮询直到完成
      while (status !== 'COMPLETED' && status !== 'FAILED') {
        console.log(`Polling audio request ${requestId}, current status: ${status} ...`);

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

        if (status === 'COMPLETED') {
          // 获取最终结果
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
          // 根据实际响应格式提取音频URL
          output =
            finalResult.audio?.url ||
            finalResult.audio_file?.url ||
            finalResult.audio_url ||
            finalResult.output;
        }
      }

      // 检查生成结果
      if (status !== 'COMPLETED' || !output) {
        throw new Error(`Fal audio generation failed with status: ${status}`);
      }

      console.log('Audio request succeeded, output:', output);

      return {
        output: Array.isArray(output) ? output[0].url || output[0] : output,
      };
    } catch (error) {
      console.error('Error generating audio with fal:', error);
      throw error;
    }
  }
}
