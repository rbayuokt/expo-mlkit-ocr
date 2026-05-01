import ExpoModulesCore
import MLKitTextRecognition
import MLKitVision

public class ExpoMlkitOcrModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoMlkitOcr")

    AsyncFunction("recognizeText") { (uri: String, promise: Promise) in
      guard let url = URL(string: uri), url.scheme == "file" else {
        promise.reject("INVALID_URI", "Invalid file URI: \(uri)")
        return
      }

      let filePath = url.path
      guard let image = UIImage(contentsOfFile: filePath) else {
        promise.reject("IMAGE_LOAD_FAILED", "Failed to load image from: \(filePath)")
        return
      }

      var visionImage = VisionImage(image: image)
      visionImage.orientation = image.imageOrientation

      let textRecognizer = TextRecognizer.textRecognizer()
      textRecognizer.process(visionImage) { result, error in
        if let error = error {
          promise.reject("RECOGNITION_FAILED", "Text recognition failed: \(error.localizedDescription)")
          return
        }

        guard let result = result else {
          promise.reject("RECOGNITION_FAILED", "No recognition result returned")
          return
        }

        let fullText = result.text
        var blocks: [[String: Any]] = []

        for block in result.blocks {
          var blockDict: [String: Any] = [
            "text": block.text,
            "boundingBox": [
              "x": block.frame.origin.x,
              "y": block.frame.origin.y,
              "width": block.frame.width,
              "height": block.frame.height
            ]
          ]

          var lines: [[String: Any]] = []
          for line in block.lines {
            var lineDict: [String: Any] = [
              "text": line.text,
              "boundingBox": [
                "x": line.frame.origin.x,
                "y": line.frame.origin.y,
                "width": line.frame.width,
                "height": line.frame.height
              ]
            ]

            var elements: [[String: Any]] = []
            for element in line.elements {
              let elementDict: [String: Any] = [
                "text": element.text,
                "boundingBox": [
                  "x": element.frame.origin.x,
                  "y": element.frame.origin.y,
                  "width": element.frame.width,
                  "height": element.frame.height
                ]
              ]
              elements.append(elementDict)
            }

            lineDict["elements"] = elements
            lines.append(lineDict)
          }

          blockDict["lines"] = lines
          blocks.append(blockDict)
        }

        promise.resolve([
          "text": fullText,
          "blocks": blocks
        ])
      }
    }
  }
}
