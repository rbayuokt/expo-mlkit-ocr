export type TextElement = {
  text: string;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

export type TextLine = {
  text: string;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  elements: TextElement[];
};

export type TextBlock = {
  text: string;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  lines: TextLine[];
};

export type RecognitionResult = {
  text: string;
  blocks: TextBlock[];
};
