
export type AudioSourceNode = MediaElementAudioSourceNode | MediaStreamAudioSourceNode;

export interface MediaManagerI<U> {
    get_audio(id: string, audio_ctx: AudioContext): AudioSourceNode | undefined;
    get_video(id: string): HTMLVideoElement | undefined;
    incorporate_update(update: U): void;
}
