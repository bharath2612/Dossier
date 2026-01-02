'use client';

const EXAMPLES = [
  {
    label: 'Pitch Deck',
    prompt: 'Create a pitch deck for a B2B SaaS startup that helps remote teams collaborate more effectively',
  },
  {
    label: 'Sales Presentation',
    prompt: 'Build a sales presentation showcasing how AI can reduce customer support costs by 40%',
  },
  {
    label: 'Training Deck',
    prompt: 'Design a training presentation on data privacy best practices for healthcare professionals',
  },
  {
    label: 'Product Launch',
    prompt: 'Generate a product launch presentation for a sustainable electric vehicle targeting urban professionals',
  },
];

interface ExamplePromptsProps {
  onSelectPrompt: (prompt: string) => void;
}

export function ExamplePrompts({ onSelectPrompt }: ExamplePromptsProps) {
  return (
    <div className="w-full max-w-3xl space-y-4">
      <p className="text-center text-sm font-medium text-gray-600 dark:text-gray-400">
        Or try an example:
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {EXAMPLES.map((example) => (
          <button
            key={example.label}
            onClick={() => onSelectPrompt(example.prompt)}
            className="group rounded-full border-2 border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-all hover:border-gray-900 hover:bg-gray-50 hover:text-gray-900 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300 dark:hover:border-gray-100 dark:hover:bg-gray-900 dark:hover:text-gray-100"
          >
            {example.label}
          </button>
        ))}
      </div>
    </div>
  );
}
