import { VideoFileType } from '@/utils/utils';
import { Label } from './ui/label';
import { Button } from './ui/button';

type VideoOutputSelectorProps = {
  activeType: VideoFileType;
  onSelect: (type: VideoFileType) => void;
};

export const VideoOutputSelector: React.FC<VideoOutputSelectorProps> = ({
  activeType,
  onSelect,
}) => (
  <>
    <Label className="font-semibold">Output</Label>
    <div className="grid grid-cols-4 gap-2">
      {Object.entries(VideoFileType).map((value, index) =>
        <Button
          type="button"
          key={index}
          variant={activeType === value[1] ? 'default' : 'ghost'}
          onClick={() => onSelect(value[1])}
        >
          {value[0]}
        </Button>)}
    </div>
  </>
);