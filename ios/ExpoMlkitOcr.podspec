require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'ExpoMlkitOcr'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']

  s.platform       = :ios, '16.0'
  s.swift_version  = '5.9'

  s.source         = { git: 'https://github.com/rbayuokt/expo-mlkit-ocr' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  # Google MLKit CocoaPods binaries currently exclude arm64 iOS Simulator slices
  # (see `EXCLUDED_ARCHS[sdk=iphonesimulator*] = arm64` in their podspecs).
  # This makes arm64-only simulator runtimes (e.g. iOS 26.x) fail to link.
  #
  # Set `EXPO_MLKIT_OCR_DISABLE_MLKIT=1` at `pod install` time (via a config plugin)
  # to build the app on arm64 simulator without MLKit (module should handle this at runtime).
  if ENV['EXPO_MLKIT_OCR_DISABLE_MLKIT'] != '1'
    s.dependency 'GoogleMLKit/TextRecognition', '~> 7.0'
  end

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'GCC_WARN_INHIBIT_ALL_WARNINGS' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,swift}"
end
