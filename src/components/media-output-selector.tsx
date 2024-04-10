import { Label } from './ui/label';
import { Button } from './ui/button';
import { VideoFileType } from '@/schemas/types';

type MediaOutputSelectorProps = {
  activeType: VideoFileType;
  onSelect: (type: VideoFileType) => void;
};

export const MediaOutputSelector: React.FC<MediaOutputSelectorProps> = ({
  activeType,
  onSelect,
}) => (
  <>
    <Label>Output</Label>
    <div className="grid grid-cols-4 gap-2">
      {Object.entries(VideoFileType).map((value, index) =>
        <Button
          type="button"
          key={index}
          variant={activeType === value[1] ? 'default' : 'secondary'}
          onClick={() => onSelect(value[1])}
        >
          {value[0]}
        </Button>)}
    </div>
  </>
);