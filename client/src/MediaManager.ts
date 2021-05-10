import { CallIDEmitter } from "../../common/src/protocol";
import { RessourceMap } from "../../common/src/RessourceMap";
import { DirectVideoRsrcs } from "./DirectVideoRsrcs";
import { JitsiConference } from "./JitsiConference";
import { AudioSourceNode, MediaManagerI } from "./MediaManagerI";

export class MediaManager implements MediaManagerI<RessourceMap> {
    //TODO generalize this class to a list of ressource mappers
    //     - define interface MediaManagerI<RsrcsMap>
    //     - make this class is then a collection of MediaManagers - but with different types
    private j_conf: JitsiConference;
    private direct_vid: DirectVideoRsrcs;
    private user_id: string;

    constructor(res_map: RessourceMap, user_id: string, carrier: CallIDEmitter) {
        const conf = res_map.get_conf();
        this.j_conf = new JitsiConference(conf, user_id, carrier);
        this.direct_vid = new DirectVideoRsrcs(res_map.get_vid_map());
        this.user_id = user_id;
    }

    /**
     * Get the HTMLVideoElement corresponding to this id, if any. Undefined otherwise.
     * @param id of the requested video
     * @returns the video corresponding to `id`
     */
    get_video(id: string) : HTMLVideoElement {
        const jitsi_vid = this.j_conf.get_video(id);
        return jitsi_vid ? jitsi_vid : this.direct_vid.get_video(id);
    }

    /**
     * Get the audio MediaElementAudioSourceNode corresponding to this id, if any. Undefined otherwise.
     * @param id of the requested audio
     * @returns the audio MediaElementAudioSourceNode corresponding to `id`
     */
    get_audio(id: string, audio_ctx: AudioContext) : AudioSourceNode {
        const jitsi_audio = this.j_conf.get_audio(id, audio_ctx);
        return jitsi_audio ? jitsi_audio : this.direct_vid.get_audio(id, audio_ctx);
    }

    /**
     * Update the conference.
     * @param conf the updated conference
     */
    incorporate_update(res_map: RessourceMap) {
        this.j_conf.incorporate_update(res_map.get_conf());
        this.direct_vid.incorporate_update(res_map.get_vid_map());
    }
}
