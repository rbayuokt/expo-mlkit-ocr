import ExpoModulesCore
import UIKit
import Vision

#if canImport(MLKitTextRecognition) && canImport(MLKitVision)
import MLKitTextRecognition
import MLKitVision
#endif

private func cgImageOrientation(from uiOrientation: UIImage.Orientation) -> CGImagePropertyOrientation {
  switch uiOrientation {
  case .up: return .up
  case .down: return .down
  case .left: return .left
  case .right: return .right
  case .upMirrored: return .upMirrored
  case .downMirrored: return .downMirrored
  case .leftMirrored: return .leftMirrored
  case .rightMirrored: return .rightMirrored
  @unknown default: return .up
  }
}

private func denormalizeVisionRect(_ rect: CGRect, imageSize: CGSize) -> [String: CGFloat] {
  // Vision bounding boxes are normalized to [0,1] with origin at bottom-left.
  let x = rect.origin.x * imageSize.width
  let width = rect.size.width * imageSize.width
  let height = rect.size.height * imageSize.height
  let y = (1.0 - rect.origin.y - rect.size.height) * imageSize.height
  return ["x": x, "y": y, "width": width, "height": height]
}

private func unionRects(_ rects: [CGRect]) -> CGRect? {
  guard var result = rects.first else { return nil }
  for r in rects.dropFirst() {
    result = result.union(r)
  }
  return result
}

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

#if canImport(MLKitTextRecognition) && canImport(MLKitVision)
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
#else
      // Fallback for iOS Simulator arm64-only runtimes where ML Kit cannot be linked.
      guard let cgImage = image.cgImage else {
        promise.reject("IMAGE_LOAD_FAILED", "Failed to access CGImage for: \(filePath)")
        return
      }

      let request = VNRecognizeTextRequest { request, error in
        if let error = error {
          promise.reject("RECOGNITION_FAILED", "Text recognition failed: \(error.localizedDescription)")
          return
        }

        let observationsUnsorted = (request.results as? [VNRecognizedTextObservation]) ?? []
        // Keep output stable: sort top-to-bottom, then left-to-right.
        let observations = observationsUnsorted.sorted { a, b in
          if a.boundingBox.minY != b.boundingBox.minY {
            return a.boundingBox.minY > b.boundingBox.minY
          }
          return a.boundingBox.minX < b.boundingBox.minX
        }
        let imageSize = CGSize(width: cgImage.width, height: cgImage.height)

        var lines: [[String: Any]] = []
        var lineRects: [CGRect] = []
        var fullTextParts: [String] = []

        for obs in observations {
          guard let top = obs.topCandidates(1).first else { continue }

          let lineText = top.string
          fullTextParts.append(lineText)

          let lineRectNorm = obs.boundingBox
          lineRects.append(lineRectNorm)

          var elements: [[String: Any]] = []

          // Try to create word-level elements with per-range bounding boxes when available.
          let words = lineText.split(whereSeparator: { $0.isWhitespace }).map(String.init)
          var searchStart = lineText.startIndex

          for word in words {
            guard let range = lineText.range(of: word, range: searchStart..<lineText.endIndex) else {
              continue
            }
            searchStart = range.upperBound

            if let wordRect = try? top.boundingBox(for: range) {
              elements.append([
                "text": word,
                "boundingBox": denormalizeVisionRect(wordRect.boundingBox, imageSize: imageSize)
              ])
            } else {
              // Fallback to line bounding box if Vision can't provide per-word boxes.
              elements.append([
                "text": word,
                "boundingBox": denormalizeVisionRect(lineRectNorm, imageSize: imageSize)
              ])
            }
          }

          lines.append([
            "text": lineText,
            "boundingBox": denormalizeVisionRect(lineRectNorm, imageSize: imageSize),
            "elements": elements
          ])
        }

        let fullText = fullTextParts.joined(separator: "\n")
        let blockRectNorm = unionRects(lineRects) ?? .zero

        let blocks: [[String: Any]] = [
          [
            "text": fullText,
            "boundingBox": denormalizeVisionRect(blockRectNorm, imageSize: imageSize),
            "lines": lines
          ]
        ]

        promise.resolve([
          "text": fullText,
          "blocks": blocks
        ])
      }

      request.recognitionLevel = .accurate
      request.usesLanguageCorrection = true

      let handler = VNImageRequestHandler(
        cgImage: cgImage,
        orientation: cgImageOrientation(from: image.imageOrientation),
        options: [:]
      )

      do {
        try handler.perform([request])
      } catch {
        promise.reject("RECOGNITION_FAILED", "Text recognition failed: \(error.localizedDescription)")
      }
#endif
    }
  }
}
