import * as z from 'zod';
import { StatusType } from './types';

export const GetVideosUploadResponseSchema = z.object({
  requestId: z.string(),
  videoUploadUrl: z.string(),
  configUploadUrl: z.string(),
});
export type GetVideosUploadResponseType = z.infer<typeof GetVideosUploadResponseSchema>;

export const VideoProcessingConfigSchema = z.object({
  fromExt: z.string(),
  toExt: z.string().optional(), // Needed for conversion to different format
});
export type VideoProcessingConfigType = z.infer<typeof VideoProcessingConfigSchema>;

export const GetVideoRequestResponseSchema = z.object({
  status: z.nativeEnum(StatusType),
  fileName: z.string().optional(),
  downloadLink: z.string().optional(),
  errorMessage: z.string().optional(),
});
export type GetVideoRequestResponseType = z.infer<typeof GetVideoRequestResponseSchema>;
