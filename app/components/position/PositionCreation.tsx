import type { OrderFormValues } from './OrderForm';
import OrderForm from './OrderForm';
import PositionSizeSelector from './PositionSizeSelector';
import StopLossSelector from './StopLossSelector';
import { usePositionBuilder } from '~/context/PositionBuilderContext';

interface PositionCreationProps {
  onCreatePosition: (values: OrderFormValues) => void;
}

export default function PositionCreation({
  onCreatePosition,
}: PositionCreationProps) {
  const {
    formState: { stopLossPercentage },
  } = usePositionBuilder();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-4 text-lg font-medium text-gray-200">Position Builder</h2>
        <div className="space-y-6">
          <PositionSizeSelector />
          <StopLossSelector />
        </div>
      </div>
      {stopLossPercentage && (
        <OrderForm onSubmit={onCreatePosition} />
      )}
    </div>
  );
} 