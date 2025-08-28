import { Injectable, Logger } from '@nestjs/common';
import { batchTranslateText } from '@refly/utils';

interface LanguageDetectionResult {
  language: string;
  isEnglish: boolean;
  confidence: number;
}

interface PromptProcessingResult {
  translatedPrompt: string;
  originalPrompt: string;
  detectedLanguage: string;
  isTranslated: boolean;
}

@Injectable()
export class PromptProcessorService {
  private readonly logger = new Logger(PromptProcessorService.name);

  /**
   * Detect the language of the given prompt
   * @param prompt The input prompt to analyze
   * @returns Language detection result
   */
  async detectLanguage(prompt: string): Promise<LanguageDetectionResult> {
    if (!prompt?.trim()) {
      return {
        language: 'en',
        isEnglish: true,
        confidence: 1.0,
      };
    }

    // Simple Chinese character detection
    const chineseRegex = /[\u4e00-\u9fff]/g;
    const chineseMatches = prompt.match(chineseRegex);
    const chineseCharCount = chineseMatches?.length || 0;
    const totalCharCount = prompt.length;
    const chineseRatio = chineseCharCount / totalCharCount;

    // Japanese character detection (Hiragana, Katakana, Kanji)
    const japaneseRegex = /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]/g;
    const japaneseMatches = prompt.match(japaneseRegex);
    const japaneseCharCount = japaneseMatches?.length || 0;
    const japaneseRatio = japaneseCharCount / totalCharCount;

    // Korean character detection
    const koreanRegex = /[\uac00-\ud7af]/g;
    const koreanMatches = prompt.match(koreanRegex);
    const koreanCharCount = koreanMatches?.length || 0;
    const koreanRatio = koreanCharCount / totalCharCount;

    // English detection (basic Latin characters)
    const englishRegex = /[a-zA-Z]/g;
    const englishMatches = prompt.match(englishRegex);
    const englishCharCount = englishMatches?.length || 0;
    const englishRatio = englishCharCount / totalCharCount;

    // Determine language based on character ratios
    const threshold = 0.1; // 10% threshold for language detection

    if (chineseRatio > threshold) {
      return {
        language: 'zh-CN',
        isEnglish: false,
        confidence: Math.min(chineseRatio * 2, 1.0),
      };
    }

    if (japaneseRatio > threshold) {
      return {
        language: 'ja',
        isEnglish: false,
        confidence: Math.min(japaneseRatio * 2, 1.0),
      };
    }

    if (koreanRatio > threshold) {
      return {
        language: 'ko',
        isEnglish: false,
        confidence: Math.min(koreanRatio * 2, 1.0),
      };
    }

    // Default to English if no other language is detected with sufficient confidence
    return {
      language: 'en',
      isEnglish: true,
      confidence: Math.min(englishRatio * 2, 1.0),
    };
  }

  /**
   * Translate prompt to English if needed
   * @param prompt The original prompt
   * @param sourceLanguage The detected source language
   * @returns Translation result
   */
  async translateToEnglish(
    prompt: string,
    sourceLanguage: string,
  ): Promise<{
    translatedPrompt: string;
    originalPrompt: string;
    translationSucceeded: boolean;
  }> {
    if (!prompt?.trim()) {
      throw new Error('Prompt cannot be empty');
    }

    try {
      this.logger.log(
        `Starting translation: ${sourceLanguage} → en, text length: ${prompt.length}`,
      );

      // Use batchTranslateText from utils to translate to English (now with retry logic)
      const translatedTexts = await batchTranslateText([prompt], 'en', sourceLanguage);

      if (!translatedTexts || translatedTexts.length === 0) {
        this.logger.warn('Translation service returned empty result');
        return {
          translatedPrompt: prompt,
          originalPrompt: prompt,
          translationSucceeded: false,
        };
      }

      const translatedText = translatedTexts[0] || prompt;

      // More sophisticated success detection
      const translationSucceeded = this.isTranslationSuccessful(
        prompt,
        translatedText,
        sourceLanguage,
      );

      if (translationSucceeded) {
        this.logger.log(
          `Translation successful: ${sourceLanguage} → en, output length: ${translatedText.length}`,
        );
      } else {
        this.logger.warn(
          'Translation validation failed: output appears to be unchanged or invalid',
        );
      }

      return {
        translatedPrompt: translatedText,
        originalPrompt: prompt,
        translationSucceeded,
      };
    } catch (error) {
      this.logger.error(`Translation failed after retries: ${error?.message}`, error?.stack);
      // Fallback to original prompt if translation fails
      return {
        translatedPrompt: prompt,
        originalPrompt: prompt,
        translationSucceeded: false,
      };
    }
  }

  /**
   * Check if translation was actually successful
   * @param original Original text
   * @param translated Translated text
   * @param sourceLanguage Source language
   * @returns Whether translation appears successful
   */
  private isTranslationSuccessful(
    original: string,
    translated: string,
    sourceLanguage: string,
  ): boolean {
    // If texts are identical, translation likely failed
    if (original === translated) {
      return false;
    }

    // If source is Chinese and translated text still contains significant Chinese characters
    if (sourceLanguage === 'zh-CN') {
      const chineseRegex = /[\u4e00-\u9fff]/g;
      const chineseInTranslated = translated.match(chineseRegex);
      const chineseRatio = (chineseInTranslated?.length || 0) / translated.length;

      // If more than 30% of translated text is still Chinese, likely failed
      if (chineseRatio > 0.3) {
        return false;
      }
    }

    // If translated text is much longer than original (suspicious)
    if (translated.length > original.length * 3) {
      return false;
    }

    // If translated text is much shorter (suspicious)
    if (translated.length < original.length * 0.2) {
      return false;
    }

    return true;
  }

  /**
   * Process prompt: detect language and translate to English if needed
   * @param originalPrompt The user's original prompt
   * @returns Complete processing result
   */
  async processPrompt(originalPrompt: string): Promise<PromptProcessingResult> {
    try {
      this.logger.log(`Processing prompt: length=${originalPrompt.length}`);

      // Step 1: Detect language
      const detection = await this.detectLanguage(originalPrompt);
      this.logger.log(
        `Language detected: ${detection.language}, isEnglish=${detection.isEnglish}, confidence=${detection.confidence.toFixed(2)}`,
      );

      // Step 2: If already English, return as-is
      if (detection.isEnglish) {
        return {
          translatedPrompt: originalPrompt,
          originalPrompt,
          detectedLanguage: detection.language,
          isTranslated: false,
        };
      }

      // Step 3: Translate to English with retry mechanism
      this.logger.log(`Translating from ${detection.language} to English with retry logic`);
      const translation = await this.translateToEnglish(originalPrompt, detection.language);

      this.logger.log(
        `Translation completed: success=${translation.translationSucceeded}, originalLength=${originalPrompt.length}, translatedLength=${translation.translatedPrompt.length}`,
      );

      return {
        translatedPrompt: translation.translatedPrompt,
        originalPrompt: translation.originalPrompt,
        detectedLanguage: detection.language,
        isTranslated: translation.translationSucceeded,
      };
    } catch (error) {
      this.logger.error(`Prompt processing failed: ${error?.message}`, error?.stack);

      // Fallback: return original prompt if processing fails
      return {
        translatedPrompt: originalPrompt,
        originalPrompt,
        detectedLanguage: 'unknown',
        isTranslated: false,
      };
    }
  }
}
