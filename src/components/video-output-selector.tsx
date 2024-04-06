import { VideoFileType } from '@/utils/utils';

type VideoOutputSelectorProps = {
  activeType: VideoFileType;
  onSelect: (type: VideoFileType) => void;
};

export const VideoOutputSelector: React.FC<VideoOutputSelectorProps> = ({
  activeType,
  onSelect,
}) => (
  <>
    <p className="font-semibold">Output:</p>
    <div className="grid grid-cols-4 gap-2">
      {Object.entries(VideoFileType).map((value, index) =>
        <button
          type="button"
          key={index}
          className={`rounded p-2
          ${activeType === value[1] ?
              'bg-blue-500 text-white' :
              'bg-gray-100 hover:bg-gray-200 active:bg-gray-100'
            }`}
          onClick={() => onSelect(value[1])}
          disabled={activeType === value[1]}
        >
          {value[0]}
        </button>)}
    </div>
  </>
);