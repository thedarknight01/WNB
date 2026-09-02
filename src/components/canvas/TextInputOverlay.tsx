import React from 'react';
import { BoardContext } from '../../core/store/useBoardStore';

interface Props {
  editingText: { id: string, x: number, y: number, text: string };
  setEditingText: (val: null | { id: string, x: number, y: number, text: string }) => void;
  camera: { x: number, y: number, scale: number };
}

export const TextInputOverlay = ({ editingText, setEditingText, camera }: Props) => {
  const store = React.useContext(BoardContext);
  const { updateObject, objectsById } = store!.getState();
  const obj = objectsById[editingText.id] as any;

  return (
    <textarea
      autoFocus
      value={editingText.text}
      onChange={(e) => {
        setEditingText({ ...editingText, text: e.target.value });
        e.target.style.height = 'auto';
        e.target.style.height = `${e.target.scrollHeight}px`;
      }}
      onBlur={() => {
        updateObject(editingText.id, { text: editingText.text });
        setEditingText(null);
      }}
      style={{
        position: 'absolute', 
        top: editingText.y * camera.scale + camera.y, 
        left: editingText.x * camera.scale + camera.x,
        width: obj ? `${obj.width * camera.scale}px` : 'auto',
        minWidth: `${150 * camera.scale}px`,
        fontSize: obj ? `${obj.fontSize * camera.scale}px` : `${32 * camera.scale}px`, 
        margin: 0, 
        padding: obj ? `${(obj.padding || 0) * camera.scale}px` : 0, 
        border: 'none', 
        outline: 'none',
        background: 'transparent', 
        resize: 'none', 
        lineHeight: obj ? obj.lineHeight : 1.2, 
        fontFamily: obj ? obj.fontFamily : 'Arial', 
        fontStyle: obj ? obj.fontStyle : 'normal',
        fontWeight: obj && obj.fontStyle && obj.fontStyle.includes('bold') ? 'bold' : 'normal',
        textAlign: obj ? obj.align : 'left',
        color: obj ? obj.fill : '#000',
        overflow: 'hidden', 
        whiteSpace: 'pre-wrap', 
        wordWrap: 'break-word',
        zIndex: 20,
      }}
    />
  );
};
