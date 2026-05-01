import { registerWebModule, NativeModule } from 'expo';
class ExpoMlkitOcrModule extends NativeModule {
    async recognizeText(_uri) {
        throw new Error('expo-mlkit-ocr is not supported on web.');
    }
}
export default registerWebModule(ExpoMlkitOcrModule, 'ExpoMlkitOcrModule');
//# sourceMappingURL=ExpoMlkitOcrModule.web.js.map