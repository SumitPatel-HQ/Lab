import React from 'react';

interface ImageTitleProps {
  title?: string;
}

export const ImageTitle: React.FC<ImageTitleProps> = React.memo(({ title }) => {
  if (!title) return null;
  
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent pt-12 pb-4 px-6">
      <h3 className="text-left text-gray-400 text-lg font-small">{title}</h3>
    </div>
  );
});