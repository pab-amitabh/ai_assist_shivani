import React, { useState } from 'react';

const SourceLink = ({ url, text, index }: { url: string, text:string, index: number }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <a 
        href={url} 
        className="bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded px-2.5 py-1.5 text-sm transition-colors duration-300 ease-in-out text-gray-600"
        target="_blank" 
        rel="noopener noreferrer"
      >
        {index + 1}
      </a>
      {isHovered && (
        <div className="absolute bottom-full left-full transform -translate-x-1/2 ml-2 p-2 bg-gray-200 text-black text-xs rounded shadow-lg z-[9999] whitespace-normal max-w-[250px] text-pretty break-words">
          {text}
        </div>
      )}
    </div>
  );
};

export default SourceLink;
