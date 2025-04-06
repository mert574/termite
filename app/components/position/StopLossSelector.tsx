import { useCallback } from 'react';
import { usePositionBuilder } from '~/context/PositionBuilderContext';
import { calculateStopLossPrice, formatCurrency, formatPercentage } from '~/utils/riskCalculator';
import type { PositionSideV5 } from 'bybit-api';

const STOP_LOSS_OPTIONS = [1.5, 2.0, 3.0, 'custom'] as const;
type StopLossOption = typeof STOP_LOSS_OPTIONS[number];

// Mock entry price for now - this should come from the order form
const MOCK_ENTRY_PRICE = 43250.5;
const MIN_STOP_LOSS = 0.5;
const STOP_LOSS_INCREMENT = 0.5;
const CUSTOM_INITIAL_VALUE = 3.5;
const CUSTOM_THRESHOLD = 3.0;

const buttonBaseStyles = 'flex flex-col rounded-lg border p-1.5 transition-colors flex-1 min-w-[5.5rem] max-w-[8rem]';
const buttonSelectedStyles = 'border-blue-500 bg-blue-900/50 text-blue-100';
const buttonDefaultStyles = 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600 hover:bg-gray-700';
const adjustButtonStyles = 'rounded bg-gray-700 px-2 py-1 text-xs text-gray-300 hover:bg-gray-600 min-w-[3rem] text-center';

function getStopLossPrice(percentage: number, side: PositionSideV5): number {
  return calculateStopLossPrice({
    entryPrice: MOCK_ENTRY_PRICE,
    stopLossPercentage: percentage,
    side,
  });
}

function getButtonStyles(isSelected: boolean): string {
  return `${buttonBaseStyles} ${isSelected ? buttonSelectedStyles : buttonDefaultStyles}`;
}

function isCustomSelected(stopLossPercentage: number | null): boolean {
  return Boolean(stopLossPercentage && stopLossPercentage > CUSTOM_THRESHOLD);
}

interface StopLossButtonProps {
  option: StopLossOption;
  isSelected: boolean;
  percentage: number | null;
  stopLossPrice: number | null;
  onSelect: () => void;
}

function StopLossButton({ option, isSelected, percentage, stopLossPrice, onSelect }: StopLossButtonProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={getButtonStyles(isSelected)}
    >
      <div className="text-sm font-bold truncate">
        {option === 'custom' ? 'Custom' : formatPercentage(percentage as number)}
      </div>
      {stopLossPrice && (
        <div className="text-xs text-gray-400 truncate">
          {formatCurrency(stopLossPrice)}
        </div>
      )}
    </button>
  );
}

interface StopLossAdjusterProps {
  stopLossPercentage: number;
  side: PositionSideV5;
  onAdjust: (increment: boolean) => void;
}

function StopLossAdjuster({ stopLossPercentage, side, onAdjust }: StopLossAdjusterProps) {
  const stopLossPrice = getStopLossPrice(stopLossPercentage, side);

  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800 p-1.5 gap-2">
      <button
        type="button"
        onClick={() => onAdjust(false)}
        className={adjustButtonStyles}
      >
        -{STOP_LOSS_INCREMENT}%
      </button>
      <div className="text-xs font-medium text-gray-300 text-center flex-1 truncate">
        {formatPercentage(stopLossPercentage)}
        <span className="hidden sm:inline"> ({formatCurrency(stopLossPrice)})</span>
      </div>
      <button
        type="button"
        onClick={() => onAdjust(true)}
        className={adjustButtonStyles}
      >
        +{STOP_LOSS_INCREMENT}%
      </button>
    </div>
  );
}

export default function StopLossSelector() {
  const {
    formState: { stopLossPercentage, side },
    setStopLoss,
  } = usePositionBuilder();

  const handleAdjustStop = useCallback((increment: boolean) => {
    if (!stopLossPercentage) return;
    const newPercentage = increment 
      ? stopLossPercentage + STOP_LOSS_INCREMENT 
      : stopLossPercentage - STOP_LOSS_INCREMENT;
    if (newPercentage >= MIN_STOP_LOSS) {
      setStopLoss(newPercentage);
    }
  }, [stopLossPercentage, setStopLoss]);

  return (
    <div className="space-y-2">
      {/* Stop Loss Options */}
      <div className="flex flex-wrap gap-1">
        {STOP_LOSS_OPTIONS.map((option) => {
          const percentage = option === 'custom' ? null : option;
          const isSelected = option === 'custom' 
            ? isCustomSelected(stopLossPercentage)
            : percentage === stopLossPercentage;

          const stopLossPrice = typeof percentage === 'number' 
            ? getStopLossPrice(percentage, side)
            : null;

          return (
            <StopLossButton
              key={option}
              option={option}
              isSelected={isSelected}
              percentage={percentage}
              stopLossPrice={stopLossPrice}
              onSelect={() => {
                if (option === 'custom') {
                  setStopLoss(CUSTOM_INITIAL_VALUE);
                } else {
                  setStopLoss(option as number);
                }
              }}
            />
          );
        })}
      </div>

      {/* Stop Loss Adjustment */}
      {stopLossPercentage && (
        <StopLossAdjuster
          stopLossPercentage={stopLossPercentage}
          side={side}
          onAdjust={handleAdjustStop}
        />
      )}
    </div>
  );
} 