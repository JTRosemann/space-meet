import { VideoMap } from "../../common/src/RessourceMap";
import { MediaManagerI } from "./MediaManagerI";

export class DirectVideoRsrcs implements MediaManagerI<VideoMap> {

    private vid_map: VideoMap;

    constructor(vid_map: VideoMap) {
        this.vid_map = {};
        this.incorporate_update(vid_map);
    }

    get_audio(id: string, audio_ctx: AudioContext) : MediaElementAudioSourceNode {
        const vid = this.get_video(id);
        if (vid != undefined) {
            return audio_ctx.createMediaElementSource(vid);
        }
        return undefined;
    }

    get_video(id: string): HTMLVideoElement {
        const vid_jQ = $(`#vid${id}`);
        if (vid_jQ != undefined) {
            return vid_jQ[0] as HTMLVideoElement;
        }
        return undefined;
    }

    incorporate_update(new_map: VideoMap) {
        for (let k of Object.keys(this.vid_map)) {
            //remove unused videos
            const target = $(`#vid${k}`);
            if (target.length > 0 && (new_map[k] == undefined || new_map[k] != this.vid_map[k])) {
                target.remove();
            }
        }
        for (let k of Object.keys(new_map)) {
            const target = $(`#vid${k}`);
            if (target.length == 0 && this.vid_map[k] != undefined) {
                const src = this.vid_map[k];
                const vid = $(`<video autoplay='true' id='vid${k}' style='position:absolute; left:0; top:0;' src='${src}'/>`);
                $('#hide').append(vid);
                (vid[0] as HTMLVideoElement).muted = false;
            }
        }
        this.vid_map = new_map;
    }

}
