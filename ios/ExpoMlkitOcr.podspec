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
  s.platforms      = {
    :ios => '16.0'
  }
  s.swift_version  = '5.9'
  s.source         = { git: 'https://github.com/rbayuokt/expo-mlkit-ocr' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.dependency 'GoogleMLKit/TextRecognition', '~> 7.0'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'GCC_WARN_INHIBIT_ALL_WARNINGS' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,swift}"
end
