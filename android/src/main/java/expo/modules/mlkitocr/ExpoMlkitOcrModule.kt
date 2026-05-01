package expo.modules.mlkitocr

import android.net.Uri
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoMlkitOcrModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoMlkitOcr")

    AsyncFunction("recognizeText") { uri: String, promise: Promise ->
      val context = appContext.reactContext
        ?: return@AsyncFunction promise.reject("NO_CONTEXT", "React context unavailable", null)

      try {
        val inputImage = InputImage.fromFilePath(context, Uri.parse(uri))
        val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)

        recognizer.process(inputImage)
          .addOnSuccessListener { visionText ->
            val blocks = visionText.textBlocks.map { block ->
              mapOf(
                "text" to block.text,
                "boundingBox" to (block.boundingBox?.let {
                  mapOf("x" to it.left, "y" to it.top, "width" to it.width(), "height" to it.height())
                } ?: emptyMap<String, Int>()),
                "lines" to block.lines.map { line ->
                  mapOf(
                    "text" to line.text,
                    "boundingBox" to (line.boundingBox?.let {
                      mapOf("x" to it.left, "y" to it.top, "width" to it.width(), "height" to it.height())
                    } ?: emptyMap<String, Int>()),
                    "elements" to line.elements.map { element ->
                      mapOf(
                        "text" to element.text,
                        "boundingBox" to (element.boundingBox?.let {
                          mapOf("x" to it.left, "y" to it.top, "width" to it.width(), "height" to it.height())
                        } ?: emptyMap<String, Int>()),
                      )
                    }
                  )
                }
              )
            }
            promise.resolve(mapOf("text" to visionText.text, "blocks" to blocks))
          }
          .addOnFailureListener { e ->
            promise.reject("RECOGNITION_FAILED", e.localizedMessage ?: "Text recognition failed", e)
          }
      } catch (e: Exception) {
        promise.reject("IMAGE_LOAD_FAILED", e.localizedMessage ?: "Failed to load image", e)
      }
    }
  }
}
