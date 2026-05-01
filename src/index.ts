import ExpoMlkitOcrModule from './ExpoMlkitOcrModule';
export * from './ExpoMlkitOcr.types';
export { OCRTextOverlay } from './OCRTextOverlay';
export type { OCRTextOverlayProps, HighlightLevel, OverlayResizeMode } from './OCRTextOverlay';

export async function recognizeText(uri: string) {
  return ExpoMlkitOcrModule.recognizeText(uri);
}
