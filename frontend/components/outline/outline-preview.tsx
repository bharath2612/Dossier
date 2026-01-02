'use client';

import { motion } from 'framer-motion';

interface OutlineSlide {
  index: number;
  title: string;
  bullets: string[];
  type: 'intro' | 'content' | 'data' | 'quote' | 'conclusion';
}

interface OutlinePreviewProps {
  title: string;
  slides: OutlineSlide[];
}

const slideTypeLabels = {
  intro: 'Introduction',
  content: 'Content',
  data: 'Data',
  quote: 'Quote',
  conclusion: 'Conclusion',
};

export function OutlinePreview({ title, slides }: OutlinePreviewProps) {
  return (
    <div className="w-full space-y-12">
      {/* Title */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="mb-4 text-5xl font-medium leading-tight">{title}</h2>
        <p className="text-sm text-gray-600">{slides.length} slides</p>
      </motion.div>

      {/* Slides */}
      <div className="space-y-8">
        {slides.map((slide, index) => (
          <motion.div
            key={slide.index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className="border-l-2 border-[#1a1a1a] pl-6 transition-colors hover:border-gray-700"
          >
            {/* Slide header */}
            <div className="mb-4 flex items-baseline space-x-4">
              <span className="text-sm text-gray-700">{String(slide.index + 1).padStart(2, '0')}</span>
              <span className="text-xs uppercase tracking-wider text-gray-700">
                {slideTypeLabels[slide.type]}
              </span>
            </div>

            {/* Slide title */}
            <h3 className="mb-3 text-2xl font-medium leading-tight text-white">{slide.title}</h3>

            {/* Bullets */}
            <ul className="space-y-2">
              {slide.bullets.map((bullet, bulletIndex) => (
                <li key={bulletIndex} className="text-sm leading-relaxed text-gray-500">
                  {bullet}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
