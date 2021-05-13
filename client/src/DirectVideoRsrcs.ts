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
        const src = this.vid_map[id];
        if (src != undefined) {
            const vid_jQ = $(`#vid${id}`);
            if (vid_jQ.length > 0) {
                return vid_jQ[0] as HTMLVideoElement;
            } else {
                this.init_video(id, src);
                const vid_jQ2 = $(`#vid${id}`);
                if (vid_jQ2.length > 0) {
                    return vid_jQ[0] as HTMLVideoElement;
                } else {
                    console.warn('Failure in video retrival of id ' + id + ' with src ' + src);
                    return undefined;
                }
            }
        } else {
            return undefined;
        }
    }

    incorporate_update(new_map: VideoMap) {
        for (let k of Object.keys(this.vid_map)) {
            //remove unused videos
            const target = $(`#vid${k}`);
            if (target.length > 0 && (new_map[k] == undefined || new_map[k] != this.vid_map[k])) {
                target.remove();
            }
        }
        this.vid_map = new_map;
    }

    private init_video(id: string, src: string) {
        const vid = $(`<video crossOrigin='anonymous' autoplay='true' id='vid${id}' style='position:absolute; left:0; top:0;' src='${src}'/>`);
        $('#hide').append(vid);
    }
}
