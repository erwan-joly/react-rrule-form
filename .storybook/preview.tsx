import React, { useEffect, type ReactNode } from 'react';
import type { Decorator, Preview } from '@storybook/react-vite';
import './storybook.css';

function ThemeWrapper({ theme, children }: { theme: string; children: ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.body.style.backgroundColor = theme === 'dark' ? '#09090b' : '#ffffff';
  }, [theme]);
  return <>{children}</>;
}

const withTheme: Decorator = (Story, context) => (
  <ThemeWrapper theme={(context.globals.theme as string) ?? 'light'}>
    <Story />
  </ThemeWrapper>
);

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Color scheme',
      toolbar: {
        title: 'Theme',
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'light',
  },
  decorators: [withTheme],
  parameters: {
    layout: 'centered',
    controls: { expanded: true },
  },
};

export default preview;
