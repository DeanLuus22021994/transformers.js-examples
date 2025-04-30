# 🤗 Transformers.js Examples

A collection of [🤗 Transformers.js](https://huggingface.co/docs/transformers.js) demos and example applications showcasing machine learning models running in JavaScript environments.

## Model Examples

<!-- BEGIN_MODEL_EXAMPLES -->
| Name | Description | Category | Demo | Implementation |
| ---- | ----------- | -------- | ---- | -------------- |
| [Phi-3.5 WebGPU](./phi-3.5-webgpu/README.md) | Conversational large language model | LLM | [Demo](https://huggingface.co/spaces/webml-community/phi-3.5-webgpu) | [index.js](./phi-3.5-webgpu/src/index.js) |
| [Llama-3.2 WebGPU](./llama-3.2-webgpu/README.md) | Conversational small language model | LLM | [Demo](https://huggingface.co/spaces/webml-community/llama-3.2-webgpu) | [index.js](./llama-3.2-webgpu/src/index.js) |
| [SmolLM WebGPU](./smollm-webgpu/README.md) | Conversational small language model | LLM | [Demo](https://huggingface.co/spaces/webml-community/smollm-webgpu) | [index.js](./smollm-webgpu/src/index.js) |
| [Segment Anything WebGPU](./segment-anything-webgpu/README.md) | WebGPU image segmentation | Vision | [Demo](https://huggingface.co/spaces/webml-community/segment-anything-webgpu) | [main.js](./segment-anything-webgpu/src/main.js) |
| [Remove Background WebGPU](./remove-background-webgpu/README.md) | WebGPU image background removal | Vision | [Demo](https://huggingface.co/spaces/webml-community/remove-background-webgpu) | [main.js](./remove-background-webgpu/src/main.js) |
| [PGlite Semantic Search](./pglite-semantic-search/README.md) | Semantic search | Embeddings | [Demo](https://huggingface.co/spaces/thorwebdev/pglite-semantic-search) | [index.js](./pglite-semantic-search/src/index.js) |
| [Sapiens](./sapiens-node/README.md) | Image segmentation, depth, and normal estimation in Node.js | Vision | n/a | [index.js](./sapiens-node/src/index.js) |
<!-- END_MODEL_EXAMPLES -->

## Runtime Examples

<!-- BEGIN_RUNTIME_EXAMPLES -->
| Runtime | Example | Description | Demo | Main File |
| ------- | ------- | ----------- | ---- | --------- |
| [Bun](./bun/README.md) | Text Embeddings | Compute text embeddings in [Bun](https://bun.sh/) | n/a | [index.js](./bun/index.js) |
| [Deno](./deno-embed/README.md) | Text Embeddings | Compute text embeddings in [Deno](https://deno.com/) | n/a | [mod.ts](./deno-embed/mod.ts) |
| [Node.js (ESM)](./node-esm/README.md) | Sentiment Analysis | Sentiment analysis in Node.js w/ ECMAScript modules | n/a | [index.js](./node-esm/index.js) |
| [Node.js (CJS)](./node-cjs/README.md) | Sentiment Analysis | Sentiment analysis in Node.js w/ CommonJS | n/a | [index.js](./node-cjs/index.js) |
| [Next.js](./next-server/README.md) | Sentiment Analysis | Sentiment analysis in Next.js | [Demo](https://huggingface.co/spaces/webml-community/next-server-template) | [app/page.tsx](./next-server/app/page.tsx) |
| [SvelteKit](./sveltekit/README.md) | Sentiment Analysis | Sentiment analysis in SvelteKit | [Demo](https://huggingface.co/spaces/webml-community/sveltekit-server-template) | [routes/+page.svelte](./sveltekit/src/routes/+page.svelte) |
<!-- END_RUNTIME_EXAMPLES -->

## Getting Started

Check out the Transformers.js [template](https://huggingface.co/new-space?template=static-templates%2Ftransformers.js) on Hugging Face to get started in one click!

## Hardware Acceleration

Many examples in this repository can utilize WebGPU for hardware acceleration. For optimal performance:

- **GPU Requirements**: Most examples work with modern GPUs with 4GB+ VRAM
- **WebGPU Support**: Use Chrome 113+ or Edge 113+ for browser examples
- **CUDA Support**: For Node.js examples, install [CUDA Toolkit 11.8+](https://developer.nvidia.com/cuda-downloads) for NVIDIA GPUs

## Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for details on how to add your own examples.

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](./LICENSE) file for details.
