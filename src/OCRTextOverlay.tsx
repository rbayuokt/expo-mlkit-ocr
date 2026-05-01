import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, LayoutChangeEvent, ViewStyle, TouchableOpacity } from 'react-native';
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

type ScreenRect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

type ItemWithRect = {
  item: TextBlock | TextLine | TextElement;
  screenRect: ScreenRect;
};

function computeTransform(
  containerW: number,
  containerH: number,
  imageW: number,
  imageH: number,
  resizeMode: OverlayResizeMode
) {
  const scale =
    resizeMode === 'cover'
      ? Math.max(containerW / imageW, containerH / imageH)
      : Math.min(containerW / imageW, containerH / imageH);

  const renderedW = imageW * scale;
  const renderedH = imageH * scale;

  return {
    scale,
    offsetX: (containerW - renderedW) / 2,
    offsetY: (containerH - renderedH) / 2,
  };
}

function toScreenRect(
  box: { x: number; y: number; width: number; height: number },
  scale: number,
  offsetX: number,
  offsetY: number
): ScreenRect {
  return {
    x: box.x * scale + offsetX,
    y: box.y * scale + offsetY,
    w: box.width * scale,
    h: box.height * scale,
  };
}

function extractItems(
  result: RecognitionResult,
  level: HighlightLevel
): (TextBlock | TextLine | TextElement)[] {
  if (level === 'block') {
    return result.blocks;
  }
  if (level === 'line') {
    return result.blocks.flatMap((block) => block.lines);
  }
  if (level === 'element') {
    return result.blocks.flatMap((block) =>
      block.lines.flatMap((line) => line.elements)
    );
  }
  return [];
}

export const OCRTextOverlay: React.FC<OCRTextOverlayProps> = ({
  result,
  imageWidth,
  imageHeight,
  children,
  highlightLevel = 'line',
  resizeMode = 'contain',
  boxColor = '#00BFFF',
  selectedBoxColor = '#FF6347',
  boxOpacity = 0.25,
  strokeWidth = 2,
  cornerRadius = 4,
  multiSelect = true,
  onSelect,
  style,
}) => {
  const [containerSize, setContainerSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [selectedIdxs, setSelectedIdxs] = useState<Set<number>>(new Set());

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setContainerSize({ width, height });
  }, []);

  const items = useMemo(() => extractItems(result, highlightLevel), [
    result,
    highlightLevel,
  ]);

  const itemsWithRects: ItemWithRect[] = useMemo(() => {
    if (!containerSize) return [];

    const { scale, offsetX, offsetY } = computeTransform(
      containerSize.width,
      containerSize.height,
      imageWidth,
      imageHeight,
      resizeMode
    );

    return items.map((item) => ({
      item,
      screenRect: toScreenRect(item.boundingBox, scale, offsetX, offsetY),
    }));
  }, [containerSize, items, imageWidth, imageHeight, resizeMode]);

  const handleSelectItem = useCallback(
    (idx: number) => {
      const next = new Set(selectedIdxs);
      if (multiSelect) {
        if (next.has(idx)) {
          next.delete(idx);
        } else {
          next.add(idx);
        }
      } else {
        if (next.has(idx)) {
          next.clear();
        } else {
          next.clear();
          next.add(idx);
        }
      }

      setSelectedIdxs(next);

      if (multiSelect) {
        const selectedItems = Array.from(next)
          .map((i) => itemsWithRects[i]?.item)
          .filter(Boolean);
        onSelect?.(selectedItems.length > 0 ? selectedItems : []);
      } else {
        onSelect?.(itemsWithRects[idx].item);
      }
    },
    [itemsWithRects, multiSelect, selectedIdxs, onSelect]
  );

  return (
    <View style={[styles.container, style]} onLayout={handleLayout}>
      {children}
      {containerSize &&
        itemsWithRects.map((iwr, idx) => {
          const isSelected = selectedIdxs.has(idx);
          const color = isSelected ? selectedBoxColor : boxColor;
          const rect = iwr.screenRect;

          return (
            <TouchableOpacity
              key={idx}
              onPress={() => handleSelectItem(idx)}
              activeOpacity={0.7}
              style={[
                styles.box,
                {
                  left: rect.x,
                  top: rect.y,
                  width: rect.w,
                  height: rect.h,
                  borderColor: color,
                  borderWidth: strokeWidth,
                  borderRadius: cornerRadius,
                  backgroundColor: color,
                  opacity: isSelected ? boxOpacity * 1.5 : boxOpacity,
                },
              ]}
            />
          );
        })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  box: {
    position: 'absolute',
  },
});
