import React from 'react';
import type { PositionSideV5 } from 'bybit-api';
import clsx from 'clsx';
import { usePositionBuilder } from '~/context/PositionBuilderContext';

const MIN_RISK = 0.2;
const MAX_RISK = 2.0;
const RISK_STEP = 0.2;
const HIGH_RISK_THRESHOLD = 1.5;
const NORMAL_RISK_THRESHOLD = 1.0;

function getRiskMultiplierStyle(multiplier: number) {
  if (multiplier === 0) return 'text-gray-500';
  if (multiplier >= HIGH_RISK_THRESHOLD) return 'text-red-400';
  if (multiplier > NORMAL_RISK_THRESHOLD) return 'text-yellow-400';
  return 'text-blue-400';
}

function getSliderGradient(multiplier: number) {
  let color;
  if (multiplier >= HIGH_RISK_THRESHOLD) {
    color = 'rgb(239 68 68)'; // red-500
  } else if (multiplier > NORMAL_RISK_THRESHOLD) {
    color = 'rgb(234 179 8)'; // yellow-500
  } else {
    color = 'rgb(59 130 246)'; // blue-500
  }
  const percentage = ((multiplier - MIN_RISK) / (MAX_RISK - MIN_RISK)) * 100;
  return `linear-gradient(to right, ${color} 0%, ${color} ${percentage}%, rgb(55 65 81) ${percentage}%, rgb(55 65 81) 100%)`;
}

function getSideButtonStyle(currentSide: PositionSideV5, buttonSide: PositionSideV5) {
  return clsx(
    'flex h-10 items-center justify-center rounded-lg border text-base font-bold transition-colors',
    {
      'border-green-500 bg-green-500/20 text-green-400': buttonSide === 'Buy' && currentSide === 'Buy',
      'border-red-500 bg-red-500/20 text-red-400': buttonSide === 'Sell' && currentSide === 'Sell',
      'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600 hover:bg-gray-700': currentSide !== buttonSide,
    }
  );
}

export default function PositionSizeSelector() {
  const {
    formState: { side, riskMultiplier },
    setSide,
    setRiskMultiplier,
  } = usePositionBuilder();

  // Calculate the position for 1R label
  const oneRPosition = ((NORMAL_RISK_THRESHOLD - MIN_RISK) / (MAX_RISK - MIN_RISK)) * 100;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            setSide('Buy');
          }}
          className={getSideButtonStyle(side, 'Buy')}
        >
          LONG
        </button>
        <button
          type="button"
          onClick={() => {
            setSide('Sell');
          }}
          className={getSideButtonStyle(side, 'Sell')}
        >
          SHORT
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-300">Risk Size</label>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Current:</span>
            <span className={`text-sm font-bold ${getRiskMultiplierStyle(riskMultiplier)}`}>
              {riskMultiplier.toFixed(1)}R
            </span>
          </div>
        </div>
        <input
          type="range"
          min={MIN_RISK}
          max={MAX_RISK}
          step={RISK_STEP}
          value={riskMultiplier}
          onChange={(e) => setRiskMultiplier(Number(e.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700 accent-blue-500"
          style={{ background: getSliderGradient(riskMultiplier) }}
        />
        <div className="relative flex justify-between text-xs text-gray-400">
          <span>{MIN_RISK}R</span>
          <span className="absolute" style={{ left: `${oneRPosition}%`, transform: 'translateX(-50%)' }}>1R</span>
          <span>{MAX_RISK}R</span>
        </div>
      </div>
    </div>
  );
} 