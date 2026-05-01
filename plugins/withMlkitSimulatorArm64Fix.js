// plugins/withMlkitSimulatorArm64Fix.js
const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const MARKER = "expo-mlkit-ocr: iOS Simulator MLKit handling";

const PATCH_LINES = [
  "# expo-mlkit-ocr: iOS Simulator MLKit handling",
  "#",
  "# Google ML Kit CocoaPods binaries exclude arm64 simulator slices and will fail to link",
  "# on arm64-only simulator runtimes (e.g. iOS 26.x).",
  "#",
  "# You can disable ML Kit pods and use Apple Vision fallback instead by setting:",
  "#   ENV['EXPO_MLKIT_OCR_DISABLE_MLKIT'] = '1'",
  "ENV['EXPO_MLKIT_OCR_DISABLE_MLKIT'] ||= '0'",

  "# If ML Kit is disabled, make sure arm64 simulators are not excluded anywhere.",
  "if ENV['EXPO_MLKIT_OCR_DISABLE_MLKIT'] == '1'",
  "  installer.pods_project.targets.each do |target|",
  "    target.build_configurations.each do |config|",
  "      config.build_settings['EXCLUDED_ARCHS[sdk=iphonesimulator*]'] = ''",
  "      config.build_settings['EXCLUDED_ARCHS'] = ''",
  "    end",
  "  end",
  "",
  "  installer.aggregate_targets.each do |aggregate_target|",
  "    aggregate_target.user_project.native_targets.each do |native_target|",
  "      native_target.build_configurations.each do |config|",
  "        config.build_settings['EXCLUDED_ARCHS[sdk=iphonesimulator*]'] = ''",
  "        config.build_settings['EXCLUDED_ARCHS'] = ''",
  "      end",
  "    end",
  "    aggregate_target.user_project.save",
  "  end",
  "end",
];

function indentLines(lines, indent) {
  return lines
    .map((line) => (line.length ? `${indent}${line}` : ""))
    .join("\n");
}

function stripPreviouslyInjectedBlock(podfile) {
  // Remove a previously injected block that might have ended up outside `post_install`.
  const escapedMarker = MARKER.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const blockRegex =
    new RegExp(`\\n\\s*#\\s*${escapedMarker}[\\s\\S]*?\\n\\s*end\\n`, "g");
  return podfile.replace(blockRegex, "\n");
}

function ensurePatchInsidePostInstall(podfile) {
  const lines = podfile.split(/\r?\n/);
  const postInstallIndex = lines.findIndex((line) =>
    /^\s*post_install do\s*\|\s*installer\s*\|\s*$/.test(line)
  );

  if (postInstallIndex === -1) {
    const patch = PATCH_LINES.join("\n");
    return (
      podfile.trimEnd() + `\n\npost_install do |installer|\n${patch}\nend\n`
    );
  }

  const postIndent = (lines[postInstallIndex].match(/^\s*/) || [""])[0];
  const innerIndent = `${postIndent}  `;
  const alreadyHasPatch = lines
    .slice(postInstallIndex)
    .some((line) => line.includes(MARKER));
  if (alreadyHasPatch) return podfile;

  // Find the matching `end` for this post_install block.
  let endIndex = -1;
  for (let i = postInstallIndex + 1; i < lines.length; i++) {
    if (new RegExp(`^${postIndent}end\\s*$`).test(lines[i])) {
      endIndex = i;
      break;
    }
  }

  if (endIndex === -1) {
    // Fall back to appending a new post_install at EOF.
    const patch = PATCH_LINES.join("\n");
    return (
      podfile.trimEnd() + `\n\npost_install do |installer|\n${patch}\nend\n`
    );
  }

  const patchBlock = indentLines(PATCH_LINES, innerIndent);
  lines.splice(endIndex, 0, patchBlock);
  return lines.join("\n");
}

function resolveIosEngine(props) {
  // Supported values:
  // - auto: defaults to Vision-compatible behavior for simulator friendliness
  // - mlkit: force MLKit pods (may not build on arm64-only simulators)
  // - vision: never install MLKit pods; always use Vision fallback
  const raw = props.iosEngine ?? "auto";
  if (raw === "auto" || raw === "mlkit" || raw === "vision") return raw;
  return "auto";
}

function withMlkitSimulatorArm64Fix(config, props = {}) {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        "Podfile"
      );

      if (!fs.existsSync(podfilePath)) {
        return config;
      }

      let podfile = fs.readFileSync(podfilePath, "utf8");
      podfile = stripPreviouslyInjectedBlock(podfile);
      podfile = ensurePatchInsidePostInstall(podfile);

      const iosEngine = resolveIosEngine(props);

      // Back-compat: `disableMlkitOnSimulator` forces Vision (no MLKit pods).
      // For `auto`, prefer Vision so iOS 26.x arm64 simulator builds work by default.
      const shouldDisableMlkit =
        iosEngine !== "mlkit" || props.disableMlkitOnSimulator === true;

      // Disable MLKit pods entirely (needed for arm64-only simulator runtimes).
      if (shouldDisableMlkit) {
        // Put this near the top so it affects podspec evaluation.
        const disableLine = "ENV['EXPO_MLKIT_OCR_DISABLE_MLKIT'] = '1'";
        if (!podfile.split(/\r?\n/).some((line) => line.trim() === disableLine)) {
          podfile = `${disableLine}\n` + podfile;
        }
      } else {
        // Ensure we don't accidentally keep a previous disable line around.
        podfile = podfile.replace(
          /^\s*ENV\['EXPO_MLKIT_OCR_DISABLE_MLKIT'\]\s*=\s*'1'\s*\r?\n/m,
          ""
        );
      }

      fs.writeFileSync(podfilePath, podfile);
      return config;
    },
  ]);
}

module.exports = withMlkitSimulatorArm64Fix;
