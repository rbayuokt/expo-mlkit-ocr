import ExpoMlkitOcrModule from './ExpoMlkitOcrModule';
export * from './ExpoMlkitOcr.types';

export async function recognizeText(uri: string) {
  return ExpoMlkitOcrModule.recognizeText(uri);
}
