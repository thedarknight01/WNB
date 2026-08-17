// object.ts

export type ObjectType =
  | "line"
  | "arrow"
  | "rectangle"
  | "circle"
  | "text"
  | "image"
  | "table"
  | "video"
  | "equation"
  | "symbol";

export type FontStyle =
  | "normal"
  | "bold"
  | "italic"
  | "bold italic";

export type TextAlign =
  | "left"
  | "center"
  | "right"
  | "justify";

export type VerticalAlign =
  | "top"
  | "middle"
  | "bottom";


//  Shared Interfaces


export interface StrokeStyle {
  stroke: string;
  strokeWidth: number;
  dash?: number[];
}

export interface ShadowStyle {
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  shadowOpacity: number;
}


export interface BaseObject {
  id: string;
  name: string;
  label?: string;
  type: 'line' | 'rectangle' | 'circle' | 'text' | 'image' | 'table' | 'video' | 'equation' | 'symbol' | 'arrow';
  zIndex: number;      // Layer
  parentId?: string;  // for grouping 
  groupId?: string;  // grouping
  x: number;        //position
  y: number;       //position
  // Transform
  rotation: number;
  scaleX: number;
  scaleY: number;
  // Visibility
  opacity: number;
  visible: boolean;
  // Interaction
  draggable: boolean;
  locked: boolean;
  // Metadata
  createdAt: number;
  updatedAt: number;
}

/* Line*/

export interface LineData extends BaseObject, StrokeStyle, ShadowStyle {
  type: "line";

  points: number[];

  tension: number;
  lineCap: "butt" | "round" | "square";
  lineJoin: "miter" | "round" | "bevel";
}

export interface ArrowData extends BaseObject, StrokeStyle, ShadowStyle {
  type: "arrow";
  points: number[];
  arrowType: "straight" | "orthogonal";
}

/* Rectangle*/

export interface RectangleData
  extends BaseObject,
    StrokeStyle,
    ShadowStyle {
  type: "rectangle";

  width: number;
  height: number;

  fill: string;

  cornerRadius: number;
}

/* Circle */

export interface CircleData
  extends BaseObject,
    StrokeStyle,
    ShadowStyle {
  type: "circle";

  radius: number;

  fill: string;
}


//  Text

export interface TextData
  extends BaseObject,
    StrokeStyle,
    ShadowStyle {
  type: "text";

  width: number;

  text: string;

  fontFamily: string;
  fontSize: number;
  fontStyle: FontStyle;

  fill: string;

  align: TextAlign;
  verticalAlign: VerticalAlign;

  lineHeight: number;
  letterSpacing: number;

  padding: number;

  underline: boolean;
  strikethrough: boolean;
  backgroundColor?: string;
}

export interface ImageData extends BaseObject, ShadowStyle {
  type: "image";
  src: string; // The base64 string of the image
  width: number;
  height: number;
}

export interface TableData extends BaseObject, ShadowStyle {
  type: "table";
  rows: number;
  cols: number;
  data: string[][];
  width: number;
  height: number;
}

export interface VideoData extends BaseObject, ShadowStyle {
  type: "video";
  src: string;
  width: number;
  height: number;
  playing: boolean;
}

export interface EquationData extends BaseObject, ShadowStyle {
  type: "equation";
  latex: string;
  fontSize: number;
  fill: string;
}

export interface SymbolData extends BaseObject, ShadowStyle {
  type: "symbol";
  symbol: string;
  fontSize: number;
  fill: string;
}

/* ===========================
 * Union
 * =========================== */

export type BoardObject =
  | LineData
  | ArrowData
  | RectangleData
  | CircleData
  | TextData
  | ImageData
  | TableData
  | VideoData
  | EquationData
  | SymbolData;