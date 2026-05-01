import React from 'react';
import { ViewStyle } from 'react-native';
import type { RecognitionResult, TextBlock, TextLine, TextElement } from './ExpoMlkitOcr.types';
export type HighlightLevel = 'block' | 'line' | 'element';
export type OverlayResizeMode = 'contain' | 'cover';
export type OCRTextOverlayProps = {
    result: RecognitionResult;
    imageWidth: number;
    imageHeight: number;
    children: React.ReactNode;
    highlightLevel?: HighlightLevel;
    resizeMode?: OverlayResizeMode;
    boxColor?: string;
    selectedBoxColor?: string;
    boxOpacity?: number;
    strokeWidth?: number;
    cornerRadius?: number;
    multiSelect?: boolean;
    onSelect?: (item: TextBlock | TextLine | TextElement | (TextBlock | TextLine | TextElement)[]) => void;
    style?: ViewStyle;
};
export declare const OCRTextOverlay: React.FC<OCRTextOverlayProps>;
//# sourceMappingURL=OCRTextOverlay.d.ts.map