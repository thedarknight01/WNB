import { Layer, Line, Rect } from 'react-konva';
import { useBoardStore } from '../../core/store/useBoardStore';
import { useSettingsStore } from '../../core/store/useSettingsStore';

export const BackgroundGrid = () => {
  const { camera } = useBoardStore();
  const { gridStyle, gridColor } = useSettingsStore();

  if (gridStyle === 'none') return null;

  const width = window.innerWidth;
  const height = window.innerHeight;

  const baseGridSize = 50;
  let scaleMultiplier = 1;
  if (camera.scale < 0.5) scaleMultiplier = 2;
  if (camera.scale < 0.2) scaleMultiplier = 5;
  if (camera.scale < 0.1) scaleMultiplier = 10;
  
  const GRID_SIZE = baseGridSize * scaleMultiplier;

  const startX = -camera.x / camera.scale;
  const endX = (width - camera.x) / camera.scale;
  const startY = -camera.y / camera.scale;
  const endY = (height - camera.y) / camera.scale;

  const gridStartX = Math.floor(startX / GRID_SIZE) * GRID_SIZE;
  const gridStartY = Math.floor(startY / GRID_SIZE) * GRID_SIZE;

  const gridElements = [];

  if (gridStyle === 'grid') {
    for (let x = gridStartX; x < endX; x += GRID_SIZE) {
      gridElements.push(<Line key={`v-${x}`} points={[x, startY, x, endY]} stroke={gridColor} strokeWidth={1 / camera.scale} />);
    }
    for (let y = gridStartY; y < endY; y += GRID_SIZE) {
      gridElements.push(<Line key={`h-${y}`} points={[startX, y, endX, y]} stroke={gridColor} strokeWidth={1 / camera.scale} />);
    }
  } else if (gridStyle === 'dot') {
    for (let x = gridStartX; x < endX; x += GRID_SIZE) {
      for (let y = gridStartY; y < endY; y += GRID_SIZE) {
        // Small rectangles render faster than circles for dots
        gridElements.push(
          <Rect key={`d-${x}-${y}`} x={x} y={y} width={2 / camera.scale} height={2 / camera.scale} fill={gridColor} cornerRadius={1} />
        );
      }
    }
  }

  return <Layer listening={false}>{gridElements}</Layer>;
};