# expo-mlkit-ocr

Production-ready Expo Module for on-device text recognition (OCR) using **Google ML Kit Text Recognition v2** for both iOS and Android.

## Features

- ✅ **On-device OCR** — no network requests required
- ✅ **ML Kit v2** — official Google ML Kit standalone (not Firebase ML Kit)
- ✅ **Structured output** — blocks, lines, and elements with bounding boxes
- ✅ **iOS & Android** — native implementations using Expo Modules API
- ✅ **TypeScript support** — fully typed API
- ✅ **Expo Config Plugin** — automatic native setup

## Installation

```bash
npx expo install expo-mlkit-ocr expo-image-picker
```

## Setup

### With EAS Build

Add the plugin to your `app.json`:

```json
{
  "expo": {
    "plugins": [
      "expo-mlkit-ocr"
    ]
  }
}
```

Then run:

```bash
eas build --platform ios
eas build --platform android
```

### Development (Local Prebuild)

To test locally with a development client:

```bash
npx expo prebuild --clean
npx expo run:ios
# or
npx expo run:android
```

## Usage

### Basic Example

```typescript
import { recognizeText } from 'expo-mlkit-ocr';
import * as ImagePicker from 'expo-image-picker';

async function pickAndRecognize() {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
  });

  if (result.canceled || !result.assets[0]) return;

  try {
    const recognition = await recognizeText(result.assets[0].uri);
    console.log('Recognized text:', recognition.text);
    console.log('Blocks:', recognition.blocks);
  } catch (error) {
    console.error('Recognition failed:', error);
  }
}
```

### Output Format

The function returns a `RecognitionResult` object with this structure:

```typescript
export type RecognitionResult = {
  text: string; // Full recognized text
  blocks: TextBlock[];
};

export type TextBlock = {
  text: string;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  lines: TextLine[];
};

export type TextLine = {
  text: string;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  elements: TextElement[];
};

export type TextElement = {
  text: string;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};
```

**Bounding box coordinates** are in the image's native coordinate system (top-left origin):
- `x`, `y` — top-left corner
- `width`, `height` — dimensions in pixels

### Example Output

```json
{
  "text": "Hello World\nExample Text",
  "blocks": [
    {
      "text": "Hello World",
      "boundingBox": { "x": 100, "y": 50, "width": 200, "height": 50 },
      "lines": [
        {
          "text": "Hello World",
          "boundingBox": { "x": 100, "y": 50, "width": 200, "height": 50 },
          "elements": [
            {
              "text": "Hello",
              "boundingBox": { "x": 100, "y": 50, "width": 80, "height": 50 }
            },
            {
              "text": "World",
              "boundingBox": { "x": 190, "y": 50, "width": 110, "height": 50 }
            }
          ]
        }
      ]
    }
  ]
}
```

## API Reference

### `recognizeText(uri: string): Promise<RecognitionResult>`

Recognizes text from an image at the provided URI.

**Parameters:**
- `uri` (string) — file URI or content URI to the image (e.g., from `expo-image-picker`)

**Returns:**
- `Promise<RecognitionResult>` — structured text recognition result

**Errors:**
- `INVALID_URI` — provided URI is not valid
- `IMAGE_LOAD_FAILED` — image could not be loaded from the URI
- `RECOGNITION_FAILED` — text recognition failed (rare)

## Common Errors

### `Error: expo-mlkit-ocr is not supported on web.`

The module only works on iOS and Android. For web support, use a third-party OCR service (e.g., Tesseract.js).

```typescript
import { Platform } from 'react-native';
import { recognizeText } from 'expo-mlkit-ocr';

if (Platform.OS !== 'web') {
  const result = await recognizeText(uri);
} else {
  // Use a web-based OCR service
}
```

### `IMAGE_LOAD_FAILED`

- Ensure the URI is valid and the file exists
- Use URIs from `expo-image-picker` or `expo-camera` which are guaranteed to work
- On Android, both `file://` and `content://` URIs are supported

## Development

### Project Structure

```
expo-mlkit-ocr/
├── src/                          # TypeScript source
│   ├── index.ts
│   ├── ExpoMlkitOcr.types.ts
│   ├── ExpoMlkitOcrModule.ts
│   └── ExpoMlkitOcrModule.web.ts
├── ios/
│   ├── ExpoMlkitOcrModule.swift   # ML Kit integration
│   └── ExpoMlkitOcr.podspec
├── android/
│   ├── build.gradle
│   └── src/main/java/.../ExpoMlkitOcrModule.kt
├── plugin/
│   ├── src/index.ts             # Config plugin
│   └── tsconfig.json
├── example/                      # Example app
│   ├── App.tsx
│   └── app.json
└── expo-module.config.json
```

### Building from Source

```bash
# Install dependencies
npm install

# Build the module (src/ → build/)
npm run prepare

# Open the example app (iOS)
npm run open:ios

# Or run the example app with Expo CLI
cd example
npx expo start

# Scan QR code with Expo Go or run on device/simulator
```

### Running the Example App

The example app at `example/` demonstrates:
1. Picking an image from the device library
2. Running OCR with `recognizeText()`
3. Displaying the results (full text, blocks, lines, elements)

## License

MIT

## Contributing

Contributions are welcome! Please ensure:
- TypeScript code compiles without errors
- Native code follows platform conventions
- Example app works on both iOS and Android

## References

- [ML Kit Text Recognition (v2) — iOS](https://developers.google.com/ml-kit/vision/text-recognition/v2/ios)
- [ML Kit Text Recognition (v2) — Android](https://developers.google.com/ml-kit/vision/text-recognition/v2/android)
- [Expo Modules API](https://docs.expo.dev/modules/get-started/)

Made with ❤️ by [rbayuokt](https://github.com/rbayuokt)