import { VideoMap } from "../../common/src/Conference";

export class DirectVideoRsrcs {

    private vid_map: VideoMap;

    constructor(vid_map: VideoMap) {
        this.vid_map = vid_map;
    }

    get_audio(id: string) : MediaStream {
        const vid = this.get_video(id);
        const track = (new AudioContext()).createMediaElementSource(vid);
        //TODO fix interface: returning MediaElementAudioSourceNode is the more generic way
        throw new Error("Method not implemented");
    }
    get_video(id: string): HTMLVideoElement {
        throw new Error("Method not implemented.");
    }

}
