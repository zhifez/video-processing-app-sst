import { Label } from './ui/label';
import { Button } from './ui/button';
import { ScaleMetric } from '@/schemas/types';

type ScaleMetricSelectorProps = {
  activeType: ScaleMetric;
  onSelect: (type: ScaleMetric) => void;
};

export const ScaleMetricSelector: React.FC<ScaleMetricSelectorProps> = ({
  activeType,
  onSelect,
}) => (
  <>
    <Label>Reduce file size</Label>
    <div className="grid grid-cols-5 gap-2">
      {Object.entries(ScaleMetric)
        .map((value, index) =>
          <Button
            type="button"
            key={index}
            variant={activeType === value[1] ? 'default' : 'secondary'}
            onClick={() => onSelect(value[1])}
          >
            {value[1]}
          </Button>)}
    </div>
  </>
);