import * as nf from 'node-fetch';
import { RessourceMap } from '../../common/src/RessourceMap';

/**
 * EXPERIMENTAL
 * This child of the `RessourceMap` is used to enable media from yt, but this has a lot of implications...
 */
export class YtVideoMap extends RessourceMap {
    //MAYDO let this inherit from VideoMap instead of RessourceMap
    
    set_yt_audio(id: string, src: string) {
        const search_regex = /\?(v|video_id)=/;
        const videoID = src.split(search_regex)[2]; //1st: ..youtube.., 2nd: v|video_id, 3rd: actual id
        const proxy = 'https://cors-anywhere.herokuapp.com/';
        const yt_prefix = 'https://youtube.com/get_video_info?video_id=';
        // this doesn't work without proxy, you may use your instance of https://github.com/Rob--W/cors-anywhere/
        // the fetch works, but you can't embed the fetched object
        nf.default(/*proxy +*/ yt_prefix + videoID).then(response => {
            if (response.ok) {
                response.text().then(raw_ytData => {
                    // parse response to find audio info
                    const ytData = this.parse_str(raw_ytData);
                    const getAdaptiveFormats = JSON.parse(ytData.player_response).streamingData.adaptiveFormats;
                    const findAudioInfo = getAdaptiveFormats.findIndex((obj: any) => obj.audioQuality);
                    // get the URL for the audio file
                    const audioURL = getAdaptiveFormats[findAudioInfo].url;
                    // update the <audio> element src
                    this.set_vid(id, audioURL);
                });
            }
        });
    }

    private parse_str(str: string) {
        //MAYDO understand and type correctly
        return str.split('&').reduce(function (params: any, param) {
            const paramSplit = param.split('=').map(function (value) {
                return decodeURIComponent(value.replace('+', ' '));
            });
            params[paramSplit[0]] = paramSplit[1];
            return params;
        }, {});
    }
}
