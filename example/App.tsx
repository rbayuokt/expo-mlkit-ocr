import * as ImagePicker from 'expo-image-picker';
import { recognizeText, RecognitionResult } from 'expo-mlkit-ocr';
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
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

export default function App() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    const uri = picked.assets[0].uri;
    setImageUri(uri);
    setResult(null);
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

          {imageUri && (
            <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
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
  image: { width: '100%', height: 200, borderRadius: 8 },
  spinner: { marginVertical: 16 },
  error: { color: 'red', padding: 8 },
  resultContainer: { gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginTop: 8 },
  fullText: { backgroundColor: '#fff', padding: 12, borderRadius: 6 },
  block: { backgroundColor: '#e8f4f8', padding: 10, borderRadius: 6 },
  blockHeader: { fontWeight: '600', marginBottom: 4 },
  line: { marginLeft: 8, marginTop: 4 },
  lineText: { color: '#333' },
  element: { marginLeft: 16, fontSize: 12, color: '#666' },
});
