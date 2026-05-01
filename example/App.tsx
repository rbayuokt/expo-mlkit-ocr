import * as ImagePicker from 'expo-image-picker';
import { recognizeText, RecognitionResult, OCRTextOverlay } from 'expo-mlkit-ocr';
import { useState } from 'react';
import {
  ActivityIndicator,
  Button,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Clipboard,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

export default function App() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedText, setSelectedText] = useState<string | string[] | null>(null);

  async function pickAndRecognize() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Media library permission is required.');
      return;
    }

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });

    if (picked.canceled || !picked.assets[0]) return;

    const asset = picked.assets[0];
    const uri = asset.uri;
    setImageUri(uri);
    setImageSize({
      width: asset.width || 1920,
      height: asset.height || 1080,
    });
    setResult(null);
    setSelectedText(null);
    setError(null);
    setLoading(true);

    try {
      const recognition = await recognizeText(uri);
      setResult(recognition);
    } catch (e: unknown) {
      console.log("error", JSON.stringify(e instanceof Error ? e.message : 'Recognition failed'))
      setError(e instanceof Error ? e.message : 'Recognition failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.container]}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>ML Kit Text Recognition</Text>

          <Button title="Pick Image & Recognize Text" onPress={pickAndRecognize} />

          {imageUri && imageSize && (
            <View style={styles.imageContainer}>
              <OCRTextOverlay
                result={result || { text: '', blocks: [] }}
                imageWidth={imageSize.width}
                imageHeight={imageSize.height}
                highlightLevel="line"
                boxColor="#09e5f5be"
                selectedBoxColor="#b700c0"
                boxOpacity={0.25}
                strokeWidth={2}
                cornerRadius={4}
                multiSelect={true}
                onSelect={(item) => {
                  if (Array.isArray(item)) {
                    if (item.length === 0) {
                      setSelectedText(null);
                    } else {
                      const texts = item.map(i => i.text).join('\n');
                      setSelectedText(item.length > 1 ? texts.split('\n') : item[0]?.text || null);
                    }
                  } else {
                    setSelectedText(item.text);
                  }
                }}
                style={styles.overlay}
              >
                <Image
                  source={{ uri: imageUri }}
                  style={styles.image}
                  resizeMode="contain"
                />
              </OCRTextOverlay>
            </View>
          )}

          {selectedText && (
            <View style={styles.selectedBanner}>
              <Text style={styles.selectedLabel}>
                Selected Text ({Array.isArray(selectedText) ? selectedText.length : 1}):
              </Text>
              <Text style={styles.selectedText}>
                {Array.isArray(selectedText) ? selectedText.join('\n') : selectedText}
              </Text>
              <Text style={styles.selectedHint}>(copied to clipboard)</Text>
            </View>
          )}

          {loading && <ActivityIndicator size="large" style={styles.spinner} />}

          {error && <Text style={styles.error}>{error}</Text>}

          {result && (
            <View style={styles.resultContainer}>
              <Text style={styles.sectionTitle}>Full Text</Text>
              <Text style={styles.fullText}>{result.text || '(no text detected)'}</Text>

              <Text style={styles.sectionTitle}>
                Blocks ({result.blocks.length})
              </Text>
              {result.blocks.map((block, bi) => (
                <View key={bi} style={styles.block}>
                  <Text style={styles.blockHeader}>Block {bi + 1}: "{block.text}"</Text>
                  {block.lines.map((line, li) => (
                    <View key={li} style={styles.line}>
                      <Text style={styles.lineText}>Line {li + 1}: "{line.text}"</Text>
                      {line.elements.map((el, ei) => (
                        <Text key={ei} style={styles.element}>
                          [{ei}] "{el.text}" @ ({Math.round(el.boundingBox.x)},{Math.round(el.boundingBox.y)})
                        </Text>
                      ))}
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, gap: 16, zIndex: 999 },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
  imageContainer: { width: '100%', height: 450, borderRadius: 8, overflow: 'hidden', backgroundColor: '#fff' },
  overlay: { flex: 1 },
  image: { width: '100%', height: '100%' },
  spinner: { marginVertical: 16 },
  error: { color: 'red', padding: 8 },
  selectedBanner: { backgroundColor: '#fff9e6', padding: 12, borderRadius: 8, gap: 8 },
  selectedLabel: { fontSize: 12, fontWeight: '600', color: '#666' },
  selectedText: { fontSize: 14, color: '#333', fontWeight: '500', lineHeight: 20 },
  selectedHint: { fontSize: 11, color: '#999', fontStyle: 'italic' },
  resultContainer: { gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginTop: 8 },
  fullText: { backgroundColor: '#fff', padding: 12, borderRadius: 6 },
  block: { backgroundColor: '#e8f4f8', padding: 10, borderRadius: 6 },
  blockHeader: { fontWeight: '600', marginBottom: 4 },
  line: { marginLeft: 8, marginTop: 4 },
  lineText: { color: '#333' },
  element: { marginLeft: 16, fontSize: 12, color: '#666' },
});
