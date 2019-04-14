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
                    // contentId: "http://58s3.ll.dash.us.aiv-cdn.net/d/2$CYfJt0qhHtrqVw09GAAnFKsbObI~/8833/9ad1/5836/4aea-ac87-1f217843f566/046090b7-77a5-4951-9a55-7f0776568c25_corrected.mpd",
                    contentId: "http://d2lkq7nlcrdi7q.cloudfront.net/dm/2$CYfJt0qhHtrqVw09GAAnFKsbObI~/1924/968a/9d3c/446f-a7b7-677eb3d75569/f81cf5b3-02d7-4306-b819-ad1811a75038_corrected.mpd",
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
