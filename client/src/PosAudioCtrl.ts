import { State } from "../../common/src/State";
import { EuclideanCircle } from "../../common/src/EuclideanCircle";


export class PosAudioCtrl<S extends State> {

    private audio_ctx: AudioContext;
    private track: MediaStreamAudioSourceNode;
    private gain_node: GainNode;
    private stereo_panner: StereoPannerNode;
    private panner_node: PannerNode;

    private static create_default_pannernode(audio_ctx: AudioContext, ref_distance: number) {
        const panner_model = 'HRTF';
        //for now, we don't use cones for simulation of speaking direction. this may be added later on
        //cf. https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Web_audio_spatialization_basics
        //distance models:        
        //linear: A linear distance model calculating the gain induced by the distance according to:
        //  1 - rolloffFactor * (distance - refDistance) / (maxDistance - refDistance)
        //inverse: An inverse distance model calculating the gain induced by the distance according to:
        //  refDistance / (refDistance + rolloffFactor * (Math.max(distance, refDistance) - refDistance))
        //exponential: An exponential distance model calculating the gain induced by the distance according to:
        //  pow((Math.max(distance, refDistance) / refDistance, -rolloffFactor).
        const distance_model = 'inverse';
        const max_distance = 10000; //is ignored in inverse model
        const roll_off = 1; //TODO Parameterize
        const panner = new PannerNode(audio_ctx, {
            panningModel: panner_model,
            distanceModel: distance_model,
            refDistance: ref_distance,
            maxDistance: max_distance,
            rolloffFactor: roll_off
        });
        return panner;
    }

    static create_connect_positional_audio(audio_ctx: AudioContext, stream: MediaStream, ref_dist: number) {
        const gain_node = audio_ctx.createGain();
        const stereo_panner = new StereoPannerNode(audio_ctx, { pan: 0 });
        const track = audio_ctx.createMediaStreamSource(stream);
        const panner = PosAudioCtrl.create_default_pannernode(audio_ctx, ref_dist);
        const audio_ctrl = new PosAudioCtrl(audio_ctx, track, gain_node, stereo_panner, panner);
        audio_ctrl.set_pos_connection();
        return audio_ctrl;
    }

    constructor(audio_ctx: AudioContext, track: MediaStreamAudioSourceNode, gain_node: GainNode,
        stereo_panner: StereoPannerNode, panner_node: PannerNode) {
        this.audio_ctx = audio_ctx;
        this.track = track;
        this.gain_node = gain_node;
        this.stereo_panner = stereo_panner;
        this.panner_node = panner_node;
    }

    set_pos_connection() {
        this.track.connect(this.gain_node)
            .connect(this.stereo_panner)
            .connect(this.panner_node)
            .connect(this.audio_ctx.destination);
    }

    set_pos(x: number, y: number) {
        this.panner_node.positionX.value = x;
        this.panner_node.positionZ.value = y; //z is the new y
    }

    set_max(l_state: State) {
        // move the panner position a little in front of the listener such that
        // we can always here people on the podium clearly and from the front
        // cos & sin of direction construct a small vector in the direction of the listener
        // TODO fix this cast
        const l_pos = (l_state as EuclideanCircle).get_pos();
        const l_dir = (l_state as EuclideanCircle).get_dir();
        const x = l_pos.get_x() + Math.cos(l_dir);
        const y = l_pos.get_y() + Math.sin(l_dir);
        this.set_pos(x, y);
    }

}
