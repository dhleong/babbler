/* global cast atob btoa fetch */

const context = cast.framework.CastReceiverContext.getInstance();
const playerManager = context.getPlayerManager();
const NS = "urn:x-cast:com.github.dhleong.babbler";
const DEBUG = false;

function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint8Array(buf));
}

function str2ab(str) {
    return Uint8Array.from(atob(str), c => c.charCodeAt(0));
}

class IpcLicenser {

    constructor() {
        this._nextRequestId = 1;
        this._pendingRequests = {};
    }

    request(
        licenseDataBase64,
        licenseUrl,
    ) {
        const requestId = this._nextRequestId++;
        context.sendCustomMessage(
            NS,
            undefined, // senderId ?
            {
                type: "LICENSE",
                url: licenseUrl,
                base64: licenseDataBase64,
                requestId,
            },
        );

        return new Promise(resolve => {
            this._pendingRequests[requestId] = data => {
                if (data.type !== "LICENSE_RESPONSE") {
                    throw new Error(`Illegal state; got ${data.type}`);
                }

                const buffer = str2ab(data.response);
                resolve(buffer);
            };
        });
    }

    _onMessage(m) {
        if (!m.data) return;

        const handler = this._pendingRequests[m.data.responseTo];
        if (!handler) return;

        delete this._pendingRequests[m.data.responseTo];
        handler(m.data);
    }

    _register() {
        context.addCustomMessageListener(NS, m => this._onMessage(m));
    }
}

const ipcLicenser = new IpcLicenser();
ipcLicenser._register();

// intercept the LOAD request to be able to read in a contentId and get data
playerManager.setMessageInterceptor(
    cast.framework.messages.MessageType.LOAD, async loadRequestData => {
        if (loadRequestData.media && loadRequestData.media.contentId) {
            loadRequestData.media.contentId = loadRequestData.media.contentId.replace(/^http[s]?:/, "");
        }

        return loadRequestData;
    });


// listen to all Core Events
playerManager.addEventListener(
    cast.framework.events.category.CORE, (event) => {
        console.log("EVENT", event);
    });

playerManager.addEventListener(
    cast.framework.events.EventType.MEDIA_STATUS, (event) => {
        console.log("MEDIA_STATUS", event);
    });

const playbackConfig = new cast.framework.PlaybackConfig();

playbackConfig.licenseHandler = async data => {
    const asString = ab2str(data);

    let obj;
    try {
        obj = JSON.parse(asString);
    } catch (e) {
        // not JSON? return original response data unmolested
        return data;
    }

    // if it was JSON, then we should forward the request through
    // the IPC mechanism
    const buffer = await ipcLicenser.request(
        obj.data,
        obj.url,
    );
    return { buffer };
};

playbackConfig.licenseRequestHandler = (requestInfo) => {
    const originalUrl = requestInfo.url;
    if (!/^ipc:\/\//.test(originalUrl)) {
        // just allow the default behavior
        return null;
    }

    // route through IPC
    const dataBase64 = btoa(ab2str(requestInfo.content));
    requestInfo.url = "data://application/json," + JSON.stringify({
        url: originalUrl.substring("ipc://".length),
        data: dataBase64,
    });
};

playerManager.setMediaPlaybackInfoHandler((loadRequest, playbackConfig) => {
    if (loadRequest.customData && loadRequest.customData.license) {
        const { license } = loadRequest.customData;
        if (license.url) {
            playbackConfig.licenseUrl = license.url;
        }

        if (license.ipc) {
            playbackConfig.licenseUrl =
                "ipc://" + encodeURIComponent(playbackConfig.licenseUrl);
        }
    }

    playbackConfig.shakaConfig = {
        // hacks to force widevine loading:
        manifest: {
            dash: {
                ignoreDrmInfo: true,
            },
        },
    };

    // hacks for local testing:
    if (DEBUG) {
        playbackConfig.shakaConfig.drm = {
            advanced: {
                "com.widevine.alpha": {
                    audioRobustness: "",
                    videoRobustness: "",
                },
            },
        };
    }

    return playbackConfig;
});

if (DEBUG) {
    context.setLoggerLevel(cast.framework.LoggerLevel.VERBOSE);
}

context.start({
    // queue: myCastQueue,
    playbackConfig: playbackConfig,
    supportedCommands: cast.framework.messages.Command.ALL_BASIC_MEDIA,
    // supportedCommands: cast.framework.messages.Command.ALL_BASIC_MEDIA |
    //                    cast.framework.messages.Command.QUEUE_PREV |
    //                    cast.framework.messages.Command.QUEUE_NEXT
});
