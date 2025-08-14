import React, { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { AgentTag } from "../Dashboard";

interface TagsListProps {
  tags: AgentTag[];
  maxVisibleTags?: number;
  className?: string;
  selectedTags?: AgentTag[];
}

export const TagsList: React.FC<TagsListProps> = ({
  tags,
  maxVisibleTags = 3,
  className = "",
  selectedTags = [],
}) => {
  const [showAll, setShowAll] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!tags || tags.length === 0) return null;

  const visibleTags = tags.slice(0, maxVisibleTags);
  const hiddenCount = tags.length - maxVisibleTags;
  const hasHiddenTags = hiddenCount > 0;

  const getTagClassName = (tag: AgentTag) => {
    const isSelected = selectedTags.includes(tag);
    return `text-xs px-2 py-0.5 border-0 ${
      isSelected ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
    }`;
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div className="flex items-center gap-1 flex-wrap">
        {visibleTags.map((tag) => (
          <Badge key={tag} variant="secondary" className={getTagClassName(tag)}>
            {tag}
          </Badge>
        ))}

        {hasHiddenTags && (
          <div className="relative">
            <Badge
              variant="secondary"
              className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 border-0 cursor-pointer hover:bg-gray-300"
              onMouseEnter={() => setShowAll(true)}
              onMouseLeave={() => setShowAll(false)}
            >
              +{hiddenCount}
            </Badge>

            {showAll && (
              <div
                className="absolute top-full left-0 z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-2 mt-1 min-w-max"
                onMouseEnter={() => setShowAll(true)}
                onMouseLeave={() => setShowAll(false)}
              >
                <div className="flex flex-wrap gap-1 max-w-48">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className={getTagClassName(tag)}>
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
