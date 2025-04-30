/**
 * Supported model types for Docker integration
 */
export enum ModelType {
  TextClassification = 'text-classification',
  TokenClassification = 'token-classification',
  QuestionAnswering = 'question-answering',
  TextGeneration = 'text-generation',
  TextToImage = 'text-to-image',
  ImageClassification = 'image-classification',
  ImageSegmentation = 'image-segmentation',
  ObjectDetection = 'object-detection',
  AudioClassification = 'audio-classification',
  AutomaticSpeechRecognition = 'automatic-speech-recognition'
}

/**
 * Model information interface
 */
export interface ModelInfo {
  name: string;
  type: ModelType;
  description: string;
  size: string;
  quantized: boolean;
  huggingfaceId?: string;
}

/**
 * Configuration options for Transformers Docker integration
 */
export interface TransformersDockerConfig {
  /** Whether to use quantized models */
  quantize?: boolean;
  /** Quantization bits (8, 4, etc.) */
  quantizationBits?: number;
  /** Whether to cache models */
  cacheModels?: boolean;
  /** Path to cache models */
  modelCachePath?: string;
  /** Custom model paths */
  modelPaths?: Record<string, string>;
  /** Whether to log verbose information */
  verbose?: boolean;
}