import { VideoMap } from "../../common/src/RessourceMap";
import { MediaManagerI } from "./MediaManagerI";

declare const YT : any;
export class DirectVideoRsrcs implements MediaManagerI<VideoMap> {

    private vid_map: VideoMap;

    constructor(vid_map: VideoMap) {
        this.vid_map = {};
        this.incorporate_update(vid_map);
    }

    get_audio(id: string, audio_ctx: AudioContext) : MediaElementAudioSourceNode | undefined {
        const vid = this.get_video(id);
        if (vid != undefined) {
            return audio_ctx.createMediaElementSource(vid);
        }
        return undefined;
    }

    get_video(id: string): HTMLVideoElement | undefined {
        const src = this.vid_map[id];
        if (src != undefined) {
            const vid_jQ = $(`#vid${id}`);
            const amb_jQ = $(`#amb${id}`);
            if (vid_jQ.length > 0) {
                return vid_jQ[0] as HTMLVideoElement;
            } else if (amb_jQ.length > 0) {
                return undefined;
            } else {
                const is_yt_regexp = /youtube\.com/;
                if (src.search(is_yt_regexp) > -1) {
                    console.warn('In "youtube" branch');
                    this.init_ambient_yt(id, src);
                    //this.init_yt_audio(id, src);
                } else {
                    this.init_video(id, src);
                }
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
        const vid = $(`<video crossorigin='anonymous' loop='true' autoplay='true' id='vid${id}' style='position:absolute; left:0; top:0;' src='${src}'/>`);
        $('#hide').append(vid);
    }

    private init_ambient_yt(id: string, src: string) {
        const elem_id = 'amb' + id;
        const elem_div = $(`<div id=${elem_id}></div>`);
        $('#hide').append(elem_div);
        const search_regex = /\?(v|video_id)=/;
        const video_id = src.split(search_regex)[2];
        const vid = $(`<iframe crossorigin="anonymous" width="200" height="200" src="https://www.youtube.com/embed/${video_id}" id='${elem_id}' frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>`);
        function on_player_ready(event:any) {
            event.target.playVideo();
        }
        const player = new YT.Player(elem_id, {
            height: '200',
            width: '200',
            videoId: video_id,
            host: 'https://www.youtube-nocookie.com',
            playerVars: {
                'playsinline': 1
            },
            events: {
                'onReady': on_player_ready
            }
        });
    }

    private init_yt_audio(id: string, src: string) {
        const search_regex = /\?(v|video_id)=/;
        const videoID = src.split(search_regex)[2]; //1st: ..youtube.., 2nd: v|video_id, 3rd: actual id
        const proxy = 'https://cors-anywhere.herokuapp.com/';
        const yt_prefix = 'https://youtube.com/get_video_info?video_id=';
        // this doesn't work without proxy, you may use your instance of https://github.com/Rob--W/cors-anywhere/
        fetch(/*proxy +*/ yt_prefix + videoID, {mode: "cors"}).then(response => {
            if (response.ok) {
                response.text().then(raw_ytData => {
                    // parse response to find audio info
                    const ytData = this.parse_str(raw_ytData);
                    const getAdaptiveFormats = JSON.parse(ytData.player_response).streamingData.adaptiveFormats;
                    const findAudioInfo = getAdaptiveFormats.findIndex((obj:any) => obj.audioQuality);                
                    // get the URL for the audio file
                    const audioURL = getAdaptiveFormats[findAudioInfo].url;                
                    // update the <audio> element src
                    //const vid = $(`<video crossOrigin='anonymous' autoplay='true id='vid${id}' style='position:absolute; left:0; top:0;' src'${audioURL}'/>`);
                    //$('#hide').append(vid);
                });
            }
        });
    }

    private parse_str(str: string) {
        //MAYDO understand and type correctly
        return str.split('&').reduce(function(params: any, param) {
            const paramSplit = param.split('=').map(function(value) {
                return decodeURIComponent(value.replace('+', ' '));
            });
            params[paramSplit[0]] = paramSplit[1];
            return params;
        }, {});
    }

}
