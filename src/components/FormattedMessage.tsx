import React from 'react';

interface FormattedMessageProps {
  text: string;
}

export const FormattedMessage: React.FC<FormattedMessageProps> = ({ text }) => {
  // Function to format text with better structure
  const formatText = (text: string) => {
    // Split by lines for processing
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let keyCounter = 0; // Use a single counter for all elements

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const uniqueKey = `element-${keyCounter++}`; // Generate unique key for each element
      
      if (!line) {
        // Empty line - add spacing
        elements.push(<div key={uniqueKey} className="h-2" />);
        continue;
      }

      // Headers (lines starting with ##, ###, etc.)
      if (line.startsWith('###')) {
        elements.push(
          <h3 key={uniqueKey} className="text-sm font-semibold text-foreground mt-3 mb-1">
            {line.replace(/^###\s*/, '')}
          </h3>
        );
      } else if (line.startsWith('##')) {
        elements.push(
          <h2 key={uniqueKey} className="text-base font-semibold text-foreground mt-4 mb-2">
            {line.replace(/^##\s*/, '')}
          </h2>
        );
      } else if (line.startsWith('**') && line.endsWith('**')) {
        // Bold text (for key points)
        elements.push(
          <p key={uniqueKey} className="font-semibold text-foreground mb-1">
            {line.replace(/^\*\*|\*\*$/g, '')}
          </p>
        );
      } else if (line.startsWith('- ') || line.startsWith('• ')) {
        // Bullet points
        elements.push(
          <div key={uniqueKey} className="flex items-start gap-2 mb-1">
            <span className="text-primary mt-1">•</span>
            <span className="text-sm text-muted-foreground">
              {line.replace(/^[-•]\s*/, '')}
            </span>
          </div>
        );
      } else if (/^\d+\./.test(line)) {
        // Numbered lists
        const match = line.match(/^(\d+)\.\s*(.+)/);
        if (match) {
          elements.push(
            <div key={uniqueKey} className="flex items-start gap-2 mb-1">
              <span className="text-primary font-medium">{match[1]}.</span>
              <span className="text-sm text-muted-foreground">{match[2]}</span>
            </div>
          );
        }
      } else if (line.includes(':') && line.length < 100) {
        // Key-value pairs or labels
        const [key, ...valueParts] = line.split(':');
        if (valueParts.length > 0) {
          elements.push(
            <div key={uniqueKey} className="mb-1">
              <span className="text-sm font-medium text-foreground">{key.trim()}:</span>
              <span className="text-sm text-muted-foreground ml-1">
                {valueParts.join(':').trim()}
              </span>
            </div>
          );
        } else {
          // Regular paragraph
          elements.push(
            <p key={uniqueKey} className="text-sm text-muted-foreground mb-2 leading-relaxed">
              {line}
            </p>
          );
        }
      } else {
        // Regular paragraph
        elements.push(
          <p key={uniqueKey} className="text-sm text-muted-foreground mb-2 leading-relaxed">
            {line}
          </p>
        );
      }
    }

    return elements;
  };

  return (
    <div className="space-y-1">
      {formatText(text)}
    </div>
  );
};
