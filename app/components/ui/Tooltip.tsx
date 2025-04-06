import {
  Tooltip as TooltipPrimitive,
  TooltipContent,
  TooltipTrigger,
  TooltipArrow,
  TooltipPortal,
} from '@radix-ui/react-tooltip';
import type { ReactNode } from 'react';

interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
}

export default function Tooltip({ children, content, side = 'top', sideOffset = 5 }: TooltipProps) {
  return (
    <TooltipPrimitive>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent
          side={side}
          sideOffset={sideOffset}
          collisionPadding={16}
          className="rounded bg-gray-700 px-2 py-1 text-xs text-gray-200 z-[9999]"
        >
          {content}
          <TooltipArrow className="fill-gray-700" />
        </TooltipContent>
      </TooltipPortal>
    </TooltipPrimitive>
  );
} 