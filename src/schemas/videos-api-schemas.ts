import * as z from 'zod';

export const GetVideosUploadResponseSchema = z.object({
  data: z.object({
    videoUploadUrl: z.string(),
    configUploadUrl: z.string(),
  }),
});

export type GetVideosUploadResponseType = z.infer<typeof GetVideosUploadResponseSchema>;

export const VideoProcessingConfigSchema = z.object({
  fromExt: z.string(),
  toExt: z.string().optional(), // Needed for conversion to different format
});

export type VideoProcessingConfigType = z.infer<typeof VideoProcessingConfigSchema>;