import { ModelInfo, ModelType } from './types';

/**
 * List of recommended models by task
 */
export const recommendedModels: Record<ModelType, ModelInfo[]> = {
	[ModelType.TextClassification]: [
		{
			name: 'Distilled BERT for Sentiment Analysis',
			type: ModelType.TextClassification,
			description: 'Fast sentiment analysis model',
			size: '67 MB',
			quantized: true,
			huggingfaceId: 'distilbert-base-uncased-finetuned-sst-2-english'
		}
	],
	[ModelType.TokenClassification]: [
		{
			name: 'BERT for Named Entity Recognition',
			type: ModelType.TokenClassification,
			description: 'Identifies persons, organizations, locations, etc.',
			size: '268 MB',
			quantized: true,
			huggingfaceId: 'dbmdz/bert-large-cased-finetuned-conll03-english'
		}
	],
	[ModelType.QuestionAnswering]: [
		{
			name: 'Distilled RoBERTa for Question Answering',
			type: ModelType.QuestionAnswering,
			description: 'Answers questions based on provided context',
			size: '83 MB',
			quantized: true,
			huggingfaceId: 'distilroberta-base'
		}
	],
	[ModelType.TextGeneration]: [
		{
			name: 'GPT-2 Small',
			type: ModelType.TextGeneration,
			description: 'Small language model for text generation',
			size: '548 MB',
			quantized: true,
			huggingfaceId: 'gpt2'
		}
	],
	[ModelType.TextToImage]: [
		{
			name: 'Stable Diffusion v2',
			type: ModelType.TextToImage,
			description: 'Generates images from text descriptions',
			size: '4.2 GB',
			quantized: true,
			huggingfaceId: 'stabilityai/stable-diffusion-2'
		}
	],
	[ModelType.ImageClassification]: [
		{
			name: 'ViT Image Classification',
			type: ModelType.ImageClassification,
			description: 'Classifies images into 1000 categories',
			size: '343 MB',
			quantized: true,
			huggingfaceId: 'google/vit-base-patch16-224'
		}
	],
	[ModelType.ImageSegmentation]: [
		{
			name: 'DETR for Segmentation',
			type: ModelType.ImageSegmentation,
			description: 'Segments images into different regions',
			size: '191 MB',
			quantized: true,
			huggingfaceId: 'facebook/detr-resnet-50-panoptic'
		}
	],
	[ModelType.ObjectDetection]: [
		{
			name: 'DETR for Object Detection',
			type: ModelType.ObjectDetection,
			description: 'Detects multiple objects in images',
			size: '159 MB',
			quantized: true,
			huggingfaceId: 'facebook/detr-resnet-50'
		}
	],
	[ModelType.AudioClassification]: [
		{
			name: 'Audio Classification',
			type: ModelType.AudioClassification,
			description: 'Classifies audio into different categories',
			size: '94 MB',
			quantized: true,
			huggingfaceId: 'facebook/wav2vec2-base-960h'
		}
	],
	[ModelType.AutomaticSpeechRecognition]: [
		{
			name: 'Whisper Small',
			type: ModelType.AutomaticSpeechRecognition,
			description: 'Transcribes speech to text',
			size: '461 MB',
			quantized: true,
			huggingfaceId: 'openai/whisper-small'
		}
	]
};

/**
 * Get recommended models for a specific task
 * @param modelType Type of model to get recommendations for
 * @returns Array of recommended models
 */
export function getRecommendedModels(modelType: ModelType): ModelInfo[] {
	return recommendedModels[modelType] || [];
}

/**
 * Find model by name or Hugging Face ID
 * @param nameOrId Model name or Hugging Face ID
 * @returns Model info if found, undefined otherwise
 */
export function findModel(nameOrId: string): ModelInfo | undefined {
	for (const modelType of Object.values(ModelType)) {
		const models = recommendedModels[modelType];
		if (models) {
			const model = models.find(
				m => m.name === nameOrId || m.huggingfaceId === nameOrId
			);
			if (model) {
				return model;
			}
		}
	}
	return undefined;
}