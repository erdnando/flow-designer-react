import React from 'react';

interface SvgIconProps {
  svgContent: string;
  className?: string;
}

const SvgIcon: React.FC<SvgIconProps> = ({ svgContent, className = '' }) => {
  // Create a function to safely parse SVG content and return it as JSX
  const createSvgContent = () => {
    // For emojis and simple text, just return as is
    if (!svgContent.includes('<svg')) {
      return <span>{svgContent}</span>;
    }

    // For SVG content
    return <div className={className} dangerouslySetInnerHTML={{ __html: svgContent }} />;
  };

  return createSvgContent();
};

export default SvgIcon;
