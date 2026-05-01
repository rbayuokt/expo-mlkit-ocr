import { registerWebModule, NativeModule } from 'expo';
import type { RecognitionResult } from './ExpoMlkitOcr.types';

class ExpoMlkitOcrModule extends NativeModule<{}> {
  async recognizeText(_uri: string): Promise<RecognitionResult> {
    throw new Error('expo-mlkit-ocr is not supported on web.');
  }
}

export default registerWebModule(ExpoMlkitOcrModule, 'ExpoMlkitOcrModule');
