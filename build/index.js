import ExpoMlkitOcrModule from './ExpoMlkitOcrModule';
export * from './ExpoMlkitOcr.types';
export { OCRTextOverlay } from './OCRTextOverlay';
export async function recognizeText(uri) {
    return ExpoMlkitOcrModule.recognizeText(uri);
}
//# sourceMappingURL=index.js.map