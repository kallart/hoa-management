import React, { useRef, useState, useLayoutEffect } from 'react';

interface AutoShrinkTextProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const AutoShrinkText: React.FC<AutoShrinkTextProps> = ({ children, style }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const updateScale = () => {
      if (containerRef.current && textRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const textWidth = textRef.current.scrollWidth;
        
        if (textWidth > containerWidth) {
          setScale(containerWidth / textWidth);
        } else {
          setScale(1);
        }
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [children]);

  return (
    <div ref={containerRef} style={{ width: '100%', overflow: 'hidden', display: 'flex', justifyContent: 'center', ...style }}>
      <span ref={textRef} style={{ whiteSpace: 'nowrap', transform: `scale(${scale})`, transformOrigin: 'center', display: 'inline-block' }}>
        {children}
      </span>
    </div>
  );
};
