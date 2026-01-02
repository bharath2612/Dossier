'use client';

import { memo } from 'react';
import type { Outline } from '@/store/types';

const slideTypeLabels = {
  intro: 'Introduction',
  content: 'Content',
  data: 'Data',
  quote: 'Quote',
  conclusion: 'Conclusion',
};

interface OutlineLivePreviewProps {
  outline: Outline;
}

export const OutlineLivePreview = memo(function OutlineLivePreview({
  outline,
}: OutlineLivePreviewProps) {
  return (
    <div className="sticky top-24 h-fit">
      <div className="mb-8 border-l-2 border-[#1a1a1a] pl-4">
        <p className="text-sm text-gray-600">Live Preview</p>
      </div>

      <div className="space-y-8">
        {/* Title */}
        <div>
          <h2 className="mb-4 text-4xl font-medium leading-tight">{outline.title}</h2>
          <p className="text-sm text-gray-600">{outline.slides.length} slides</p>
        </div>

        {/* Slides */}
        <div className="space-y-6">
          {outline.slides.map((slide, index) => (
            <div
              key={slide.index}
              className="border-l-2 border-[#1a1a1a] pl-4 transition-colors"
            >
              {/* Slide header */}
              <div className="mb-2 flex items-baseline space-x-3">
                <span className="text-xs text-gray-700">
                  {String(slide.index + 1).padStart(2, '0')}
                </span>
                <span className="text-xs uppercase tracking-wider text-gray-700">
                  {slideTypeLabels[slide.type]}
                </span>
              </div>

              {/* Slide title */}
              <h3 className="mb-2 text-lg font-medium leading-tight text-white">
                {slide.title}
              </h3>

              {/* Bullets */}
              <ul className="space-y-1">
                {slide.bullets.map((bullet, bulletIndex) => (
                  <li key={bulletIndex} className="text-xs leading-relaxed text-gray-600">
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
