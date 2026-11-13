export const isVideoUrl = (url?: string | null): boolean =>
  !!url && /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(url.split('#')[0]);
