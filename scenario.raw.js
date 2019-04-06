#!/usr/bin/env node

const timeline = [
    {
        time: 987,
        ipcMessage: {
            data: { type: "GET_STATUS" },
            namespace: "urn:x-cast:com.google.cast.media",
            senderId: "7f8b100d-a1fe-e60b-5a35-6feaa22976df.2:sender-l4koe754cbxf",
        },
    },

    {
        time: 1082,
        ipcMessage: {
            data: {
                type: "LOAD",
                sessionId: "46fd154e-f03d-4d58-986d-4998c43639a7",
                media: {
                    contentId: "http://s3.ll.dash.row.aiv-cdn.net/d/2$3bWlFDVIy40FBsNno33PMN4hD-E~/iad_2/fa05/8c49/5a8c/45c9-b4d2-f70ded413599/15ee518d-b23c-44cf-8673-f358e6de9348_corrected.mpd",
                    streamType: "BUFFERED",
                    contentType: "application/dash+xml",
                    metadata: {
                        type: 0,
                        metadataType: 0,
                        title: "Mrs. Maisel",
                        images: [
                            {url: "https://images-na.ssl-images-amazon.com/images/S/sgp-catalog-images/region_US/amazon_studios-MRSM_S1-Full-Image_GalleryCover-en-US-1537284819028._UR1920,1080_RI_UX667_UY375_.jpg"},
                        ],
                    },
                },
                customData: {
                    license: {
                        ipc: true,
                    },
                },
                autoplay: true,
            },
            namespace: "urn:x-cast:com.google.cast.media",
            senderId: "7f8b100d-a1fe-e60b-5a35-6feaa22976df.2:152792770056491611",
        },
    },
];

const fs = require("fs");

class TimelineFormatter {
    constructor(initialRequestId) {
        this.nextRequestId = initialRequestId || 0;
    }

    writeFormatted(timeline, path) {
        const formatted = timeline.map(e => this._format(e));
        fs.writeFileSync(path, JSON.stringify({
            timeline: formatted,
        }, null, "  "));
    }

    // for chromecast-device-emulator:
    // _format(event) {
    //     const formatted = Object.assign({}, event);
    //     formatted.ipcMessage.data.requestId = this.nextRequestId++;
    //     formatted.ipcMessage.data = JSON.stringify(formatted.ipcMessage.data);
    //     formatted.ipcMessage = JSON.stringify(formatted.ipcMessage);
    //     return formatted;
    // }

    _format(event) {
        const formatted = Object.assign({}, event);
        return formatted.ipcMessage;
    }

}

new TimelineFormatter().writeFormatted(timeline, "scenario.json");
