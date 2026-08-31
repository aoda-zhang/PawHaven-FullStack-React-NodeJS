import { useEffect } from 'react';

/**
 * Registers a global double-click event listener on the document.
 * Automatically cleans up the listener when the component unmounts.
 *
 * @param onDoubleClick - Callback function to execute when a double-click is detected
 */
export const useDoubleClick = (onDoubleClick: () => void) => {
  useEffect(() => {
    const handleDoubleClick = () => {
      if (onDoubleClick) {
        onDoubleClick();
      }
    };
    document.addEventListener('dblclick', handleDoubleClick);
    return () => {
      document.removeEventListener('dblclick', handleDoubleClick);
    };
  }, [onDoubleClick]);
};
