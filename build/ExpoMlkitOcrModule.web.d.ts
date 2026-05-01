import { NativeModule } from 'expo';
import type { RecognitionResult } from './ExpoMlkitOcr.types';
declare class ExpoMlkitOcrModule extends NativeModule<{}> {
    recognizeText(_uri: string): Promise<RecognitionResult>;
}
declare const _default: typeof ExpoMlkitOcrModule;
export default _default;
//# sourceMappingURL=ExpoMlkitOcrModule.web.d.ts.map