import { VideoMap } from "../../common/src/RessourceMap";
import { MediaManagerI } from "./MediaManagerI";

export class DirectVideoRsrcs implements MediaManagerI<VideoMap> {

    private vid_map: VideoMap;

    constructor(vid_map: VideoMap) {
        this.vid_map = vid_map;
    }

    get_audio(id: string, audio_ctx: AudioContext) : MediaElementAudioSourceNode {
        const vid = this.get_video(id);
        return audio_ctx.createMediaElementSource(vid);
    }

    get_video(id: string): HTMLVideoElement {
        throw new Error("Method not implemented.");
    }

    incorporate_update(vid_map: VideoMap) {
        //TODO fix initialization of video elements
        this.vid_map = vid_map;
    }

}
