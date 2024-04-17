import axios from 'axios';
import { exec } from 'child_process';
import { Resource } from 'sst';

type BaselimeLog = {
  message: string;
  requestId?: string;
  error?: string;
  data?: any;
  duration?: number;
};

export const baselimeLogger = (namespace: string) => async (logs: BaselimeLog[]) => {
  await axios.post(
    'https://events.baselime.io/v1/logs',
    JSON.stringify(logs),
    {
      headers: {
        'x-api-key': Resource.BaselimeApiKey.value,
        'x-service': 'video-processing-app',
        'x-namespace': namespace,
        'Content-Type': 'application/json',
      },
    }
  );
};