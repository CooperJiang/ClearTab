import { useState, useRef, useCallback } from 'react';

interface DragState {
  isDragging: boolean;
  dragIndex: number | null;
  overIndex: number | null;
}

interface UseDragSortOptions<T> {
  items: T[];
  onReorder: (items: T[]) => void;
  getId: (item: T) => string;
}

export function useDragSort<T>({ items, onReorder, getId }: UseDragSortOptions<T>) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragIndex: null,
    overIndex: null,
  });

  const dragItemRef = useRef<T | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    dragItemRef.current = items[index];
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', getId(items[index]));

    // 添加拖拽样式
    setTimeout(() => {
      setDragState({
        isDragging: true,
        dragIndex: index,
        overIndex: null,
      });
    }, 0);
  }, [items, getId]);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (dragState.dragIndex !== index) {
      setDragState(prev => ({
        ...prev,
        overIndex: index,
      }));
    }
  }, [dragState.dragIndex]);

  const handleDragLeave = useCallback(() => {
    setDragState(prev => ({
      ...prev,
      overIndex: null,
    }));
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    const dragIndex = dragState.dragIndex;
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragState({
        isDragging: false,
        dragIndex: null,
        overIndex: null,
      });
      return;
    }

    const newItems = [...items];
    const [draggedItem] = newItems.splice(dragIndex, 1);
    newItems.splice(dropIndex, 0, draggedItem);

    onReorder(newItems);

    setDragState({
      isDragging: false,
      dragIndex: null,
      overIndex: null,
    });
  }, [items, dragState.dragIndex, onReorder]);

  const handleDragEnd = useCallback(() => {
    setDragState({
      isDragging: false,
      dragIndex: null,
      overIndex: null,
    });
    dragItemRef.current = null;
  }, []);

  const getDragProps = useCallback((index: number) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => handleDragStart(e, index),
    onDragOver: (e: React.DragEvent) => handleDragOver(e, index),
    onDragLeave: handleDragLeave,
    onDrop: (e: React.DragEvent) => handleDrop(e, index),
    onDragEnd: handleDragEnd,
  }), [handleDragStart, handleDragOver, handleDragLeave, handleDrop, handleDragEnd]);

  const getItemClassName = useCallback((index: number, baseClass: string = '') => {
    const classes = [baseClass];
    if (dragState.isDragging && dragState.dragIndex === index) {
      classes.push('dragging');
    }
    if (dragState.overIndex === index && dragState.dragIndex !== index) {
      classes.push('drag-over');
    }
    return classes.filter(Boolean).join(' ');
  }, [dragState]);

  return {
    dragState,
    getDragProps,
    getItemClassName,
    isDragging: dragState.isDragging,
  };
}
