import { useState, useEffect } from 'react';
import { Line, Rect, Circle, Text, Image as KonvaImage, Group, Arrow } from 'react-konva';
import type { BoardObject, LineData, RectangleData, CircleData, TextData, ImageData } from '../../types/objects';
import { useBoardStore } from '../../core/store/useBoardStore';
const CanvasImage = ({ obj, commonProps }: { obj: ImageData, commonProps: any }) => {
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);
  
  useEffect(() => {
    const image = new window.Image();
    image.src = obj.src;
    image.onload = () => setImgElement(image);
  }, [obj.src]);

  return <KonvaImage key={obj.id} {...commonProps} image={imgElement || undefined} width={obj.width} height={obj.height} />;
};

interface Props {
  obj: BoardObject;
  commonProps: any;
  editingTextId?: string;
  setEditingText: (data: any) => void;
  tool: string;
}

const getOrthogonalPoints = (pts: number[]) => {
  if (pts.length < 4) return pts;
  const x1 = pts[0], y1 = pts[1], x2 = pts[pts.length-2], y2 = pts[pts.length-1];
  const midX = (x1 + x2) / 2;
  return [x1, y1, midX, y1, midX, y2, x2, y2];
};

export const ShapeRenderer = ({ obj, commonProps, editingTextId, setEditingText, tool }: Props) => {
  if (obj.type === 'line') {
    const line = obj as LineData;
    return <Line key={obj.id} {...commonProps} points={line.points} stroke={line.stroke} strokeWidth={line.strokeWidth} dash={line.dash} tension={line.tension} lineCap={line.lineCap} lineJoin={line.lineJoin} shadowColor={line.shadowColor} shadowBlur={line.shadowBlur} shadowOffsetX={line.shadowOffsetX} shadowOffsetY={line.shadowOffsetY} shadowOpacity={line.shadowOpacity} />;
  }
  
  if (obj.type === 'rectangle') {
    const rect = obj as RectangleData;
    return <Rect key={obj.id} {...commonProps} width={rect.width} height={rect.height} fill={rect.fill} stroke={rect.stroke} strokeWidth={rect.strokeWidth} dash={rect.dash} cornerRadius={rect.cornerRadius} shadowColor={rect.shadowColor} shadowBlur={rect.shadowBlur} shadowOffsetX={rect.shadowOffsetX} shadowOffsetY={rect.shadowOffsetY} shadowOpacity={rect.shadowOpacity} />;
  }
  
  if (obj.type === 'arrow') {
    const arrow = obj as any;
    const pointsToUse = arrow.arrowType === 'orthogonal' 
      ? getOrthogonalPoints(arrow.points) 
      : [arrow.points[0], arrow.points[1], arrow.points[arrow.points.length-2], arrow.points[arrow.points.length-1]];
    
    return (
      <Arrow
        key={obj.id}
        {...commonProps}
        points={pointsToUse}
        stroke={arrow.stroke}
        strokeWidth={arrow.strokeWidth}
        dash={arrow.dash}
        tension={0}
        lineCap="round"
        lineJoin="round"
        pointerLength={arrow.strokeWidth * 3}
        pointerWidth={arrow.strokeWidth * 3}
        shadowColor={arrow.shadowColor}
        shadowBlur={arrow.shadowBlur}
        shadowOffsetX={arrow.shadowOffsetX}
        shadowOffsetY={arrow.shadowOffsetY}
        shadowOpacity={arrow.shadowOpacity}
      />
    );
  }
  
  if (obj.type === 'circle') {
    const circle = obj as CircleData;
    return <Circle key={obj.id} {...commonProps} radius={circle.radius} fill={circle.fill} stroke={circle.stroke} strokeWidth={circle.strokeWidth} dash={circle.dash} shadowColor={circle.shadowColor} shadowBlur={circle.shadowBlur} shadowOffsetX={circle.shadowOffsetX} shadowOffsetY={circle.shadowOffsetY} shadowOpacity={circle.shadowOpacity} />;
  }
  
  if (obj.type === 'text') {
    const text = obj as TextData;
    const textDecoration = [text.underline ? 'underline' : '', text.strikethrough ? 'line-through' : ''].join(' ').trim();
    
    const textNode = (
      <Text
        {...commonProps}
        x={text.backgroundColor ? 0 : commonProps.x}
        y={text.backgroundColor ? 0 : commonProps.y}
        text={editingTextId === text.id ? '' : text.text} 
        width={text.width}
        fontFamily={text.fontFamily} 
        fontSize={text.fontSize} 
        fontStyle={text.fontStyle}
        fill={text.fill} 
        align={text.align} 
        verticalAlign={text.verticalAlign}
        lineHeight={text.lineHeight} 
        padding={text.padding} 
        stroke={text.stroke} 
        strokeWidth={text.strokeWidth}
        dash={text.dash}
        shadowColor={text.shadowColor}
        shadowBlur={text.shadowBlur}
        shadowOffsetX={text.shadowOffsetX}
        shadowOffsetY={text.shadowOffsetY}
        shadowOpacity={text.shadowOpacity}
        textDecoration={textDecoration || undefined}
        onDblClick={(e) => { 
          e.cancelBubble = true;
          if (tool !== 'eraser'){
            useBoardStore.getState().saveHistory(); 
            setEditingText({ id: text.id, x: text.x, y: text.y, text: text.text }); 
          }
        }}
      />
    );

    if (text.backgroundColor) {
      return (
        <Group key={obj.id} x={commonProps.x} y={commonProps.y} rotation={commonProps.rotation} scaleX={commonProps.scaleX} scaleY={commonProps.scaleY} draggable={commonProps.draggable} onDragStart={commonProps.onDragStart} onDragEnd={commonProps.onDragEnd} onDragMove={commonProps.onDragMove} onMouseDown={commonProps.onMouseDown} onMouseEnter={commonProps.onMouseEnter} onMouseLeave={commonProps.onMouseLeave} onClick={commonProps.onClick} onTransformEnd={commonProps.onTransformEnd}>
          <Rect
            x={0} y={0}
            width={text.width}
            height={(text as any).height || text.fontSize * (text.text.split('\n').length || 1) * text.lineHeight + (text.padding * 2)}
            fill={text.backgroundColor}
            cornerRadius={4}
          />
          {textNode}
        </Group>
      );
    }

    return <>{textNode}</>;
  }

  if (obj.type === 'image') {
    const img = obj as ImageData;
    return <CanvasImage key={obj.id} obj={img} commonProps={{...commonProps, shadowColor: img.shadowColor, shadowBlur: img.shadowBlur, shadowOffsetX: img.shadowOffsetX, shadowOffsetY: img.shadowOffsetY, shadowOpacity: img.shadowOpacity}} />;
  }

  if (['table', 'video', 'equation', 'symbol'].includes(obj.type)) {
    // Render a transparent/placeholder rect so Konva's transformer and selection engine can still grab it
    const rect = obj as any;
    return (
      <Rect 
        key={obj.id} 
        {...commonProps} 
        width={rect.width || 100} 
        height={rect.height || 100} 
        fill="rgba(0,0,0,0.01)" 
        stroke={rect.stroke || 'transparent'} 
        strokeWidth={rect.strokeWidth || 0} 
      />
    );
  }
  
  return null;
};