import type { LinksFunction } from '@remix-run/node';
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from '@remix-run/react';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import './styles/tailwind.css';
import './styles/golden-layout.css';
import { useRef } from 'react';
import { useGoldenLayout } from './hooks/useGoldenLayout';

export const links: LinksFunction = () => [
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap",
  },
];

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    layout,
    isReady,
    closedPanels,
    restorePanel,
  } = useGoldenLayout(containerRef);

  return (
    <html lang="en" className="h-full bg-gray-900">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>termite</title>
        <Meta />
        <Links />
      </head>
      <body className="h-full font-mono">
        <TooltipProvider delayDuration={0} skipDelayDuration={0}>
          <Outlet />
        </TooltipProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
