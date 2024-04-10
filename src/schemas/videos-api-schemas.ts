import * as z from 'zod';
import { ScaleMetric, StatusType } from './types';

export const GetVideosUploadResponseSchema = z.object({
  requestId: z.string(),
  videoUploadUrl: z.string(),
  configUploadUrl: z.string(),
});
export type GetVideosUploadResponseType = z.infer<typeof GetVideosUploadResponseSchema>;

export const VideoProcessingConfigSchema = z.object({
  requestId: z.string(),
  fromExt: z.string(),
  toExt: z.string(), // Needed for conversion to different format
  nextScaleMetric: z.nativeEnum(ScaleMetric),
});
export type VideoProcessingConfigType = z.infer<typeof VideoProcessingConfigSchema>;

export const GetVideoRequestResponseSchema = z.object({
  status: z.nativeEnum(StatusType),
  fileName: z.string().optional(),
  downloadLink: z.string().optional(),
  errorMessage: z.string().optional(),
});
export type GetVideoRequestResponseType = z.infer<typeof GetVideoRequestResponseSchema>;
