import { requireNativeModule } from 'expo';
import type { RecognitionResult } from './ExpoMlkitOcr.types';

interface ExpoMlkitOcrModuleInterface {
  recognizeText(uri: string): Promise<RecognitionResult>;
}

export default requireNativeModule<ExpoMlkitOcrModuleInterface>(
  'ExpoMlkitOcr'
);
