import { BaseAudioGenerator, AudioGenerationRequest, AudioGenerationResponse } from './base';

/**
 * Replicate Audio Generator
 */
export class ReplicateAudioGenerator extends BaseAudioGenerator {
  // Hardcoded version numbers for specific models
  private static readonly MODEL_VERSIONS: Record<string, string> = {
    'haoheliu/audio-ldm': 'b61392adecdd660326fc9cfc5398182437dbe5e97b5decfb36e1a36de68b5b95',
    'meta/musicgen': '671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb',
    'lucataco/ace-step': '280fc4f9ee507577f880a167f639c02622421d8fecf492454320311217b688f1',
    'suno-ai/bark': 'b76242b40d67c76ab6742e987628a2a9ac019e11d56ab96c4e91ce03b79b2787',
  };

  /**
   * Replicate API
   * @param request audio generation request
   * @returns audio generation response
   */
  async generate(request: AudioGenerationRequest): Promise<AudioGenerationResponse> {
    const isVersionModel = Object.keys(ReplicateAudioGenerator.MODEL_VERSIONS).includes(
      request.model,
    );

    // Use different URL format for version models
    const url = isVersionModel
      ? 'https://api.replicate.com/v1/predictions'
      : `https://api.replicate.com/v1/models/${request.model}/predictions`;

    const headers = {
      Authorization: `Bearer ${request.apiKey}`,
      'Content-Type': 'application/json',
    };

    // switch text or prompt according to model type
    const isTextModel =
      request.model === 'minimax/speech-02-hd' ||
      request.model === 'minimax/speech-02-turbo' ||
      request.model === 'jaaari/kokoro-82m' ||
      request.model === 'haoheliu/audio-ldm';

    const isMusicModel = request.model === 'minimax/music-01';
    const isAceStepModel = request.model === 'lucataco/ace-step';
    const isBarkModel = request.model === 'suno-ai/bark';
    const isMusicGenModel = request.model === 'meta/musicgen';

    let inputData = {};

    if (isTextModel) {
      // text
      inputData = { text: request.prompt };
    } else if (isMusicModel) {
      // minimax/music-01 lyrics song_file
      inputData = {
        lyrics: request.prompt,
        song_file:
          'https://replicate.delivery/pbxt/M9zum1Y6qujy02jeigHTJzn0lBTQOemB7OkH5XmmPSC5OUoO/MiniMax-Electronic.wav',
      };
    } else if (isAceStepModel) {
      // lucataco/ace-step lyrics tags
      inputData = {
        lyrics: request.prompt,
        tags: 'synth-pop, electronic, pop, synthesizer, drums, bass, piano, 128 BPM, energetic, uplifting, modern',
      };
    } else if (isBarkModel) {
      // suno-ai/bark prompt
      inputData = { prompt: request.prompt };
    } else if (isMusicGenModel) {
      // meta/musicgen prompt
      inputData = { prompt: request.prompt };
    } else {
      // prompt
      inputData = { prompt: request.prompt };
    }

    let data: any;

    if (isVersionModel) {
      // For version models, include version field
      data = {
        version: `${request.model}:${ReplicateAudioGenerator.MODEL_VERSIONS[request.model]}`,
        input: inputData,
      };
    } else {
      // For regular models, use original format
      data = {
        input: inputData,
      };
    }

    return this.generateWithPolling(url, headers, data);
  }

  /**
   * Generate audio with polling mechanism
   */
  private async generateWithPolling(
    url: string,
    headers: Record<string, string>,
    data: any,
  ): Promise<AudioGenerationResponse> {
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

      if (
        status !== 'succeeded' ||
        !output ||
        (typeof output !== 'string' && !Array.isArray(output))
      ) {
        const detailError = result.detail || `Prediction failed with status: ${status}`;
        throw new Error(`Replicate audio generation failed: ${detailError}`);
      }

      console.log(`Prediction succeeded, output url: ${output}`);

      return {
        output: Array.isArray(output) ? output[0] : output,
      };
    } catch (error) {
      console.error('Error generating audio with replicate:', error);
      throw error;
    }
  }
}
