import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
function computeTransform(containerW, containerH, imageW, imageH, resizeMode) {
    const scale = resizeMode === 'cover'
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
function toScreenRect(box, scale, offsetX, offsetY) {
    return {
        x: box.x * scale + offsetX,
        y: box.y * scale + offsetY,
        w: box.width * scale,
        h: box.height * scale,
    };
}
function extractItems(result, level) {
    if (level === 'block') {
        return result.blocks;
    }
    if (level === 'line') {
        return result.blocks.flatMap((block) => block.lines);
    }
    if (level === 'element') {
        return result.blocks.flatMap((block) => block.lines.flatMap((line) => line.elements));
    }
    return [];
}
export const OCRTextOverlay = ({ result, imageWidth, imageHeight, children, highlightLevel = 'line', resizeMode = 'contain', boxColor = '#00BFFF', selectedBoxColor = '#FF6347', boxOpacity = 0.25, strokeWidth = 2, cornerRadius = 4, multiSelect = true, onSelect, style, }) => {
    const [containerSize, setContainerSize] = useState(null);
    const [selectedIdxs, setSelectedIdxs] = useState(new Set());
    const handleLayout = useCallback((event) => {
        const { width, height } = event.nativeEvent.layout;
        setContainerSize({ width, height });
    }, []);
    const items = useMemo(() => extractItems(result, highlightLevel), [
        result,
        highlightLevel,
    ]);
    const itemsWithRects = useMemo(() => {
        if (!containerSize)
            return [];
        const { scale, offsetX, offsetY } = computeTransform(containerSize.width, containerSize.height, imageWidth, imageHeight, resizeMode);
        return items.map((item) => ({
            item,
            screenRect: toScreenRect(item.boundingBox, scale, offsetX, offsetY),
        }));
    }, [containerSize, items, imageWidth, imageHeight, resizeMode]);
    const handleSelectItem = useCallback((idx) => {
        const next = new Set(selectedIdxs);
        if (multiSelect) {
            if (next.has(idx)) {
                next.delete(idx);
            }
            else {
                next.add(idx);
            }
        }
        else {
            if (next.has(idx)) {
                next.clear();
            }
            else {
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
        }
        else {
            onSelect?.(itemsWithRects[idx].item);
        }
    }, [itemsWithRects, multiSelect, selectedIdxs, onSelect]);
    return (<View style={[styles.container, style]} onLayout={handleLayout}>
      {children}
      {containerSize &&
            itemsWithRects.map((iwr, idx) => {
                const isSelected = selectedIdxs.has(idx);
                const color = isSelected ? selectedBoxColor : boxColor;
                const rect = iwr.screenRect;
                return (<TouchableOpacity key={idx} onPress={() => handleSelectItem(idx)} activeOpacity={0.7} style={[
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
                    ]}/>);
            })}
    </View>);
};
const styles = StyleSheet.create({
    container: {
        position: 'relative',
    },
    box: {
        position: 'absolute',
    },
});
//# sourceMappingURL=OCRTextOverlay.js.map