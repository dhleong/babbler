/* global cast btoa fetch */

const context = cast.framework.CastReceiverContext.getInstance();
const playerManager = context.getPlayerManager();

function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint8Array(buf));
}

// intercept the LOAD request to be able to read in a contentId and get data
playerManager.setMessageInterceptor(
    cast.framework.messages.MessageType.LOAD, async loadRequestData => {
        console.log("LOAD", loadRequestData);

        if (loadRequestData.media && loadRequestData.media.contentId) {
            loadRequestData.media.contentId = loadRequestData.media.contentId.replace(/^http[s]?:/, "");
            console.log("id <-", loadRequestData.media.contentId);
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
        console.log("MEDIA_STATUS event: " + event.type);
        console.log(event);
    });

const playbackConfig = new cast.framework.PlaybackConfig();

async function performIpcLicenseRequest(
    licenseDataBase64,
    licenseUrl,
) {
    // if it was JSON, then we should forward the request through
    // the RPC mechanism
    const url = "http://127.0.0.1:3000/drm";
    const response = await fetch(url, {
        headers: {
            "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
            base64: licenseDataBase64,
            url: licenseUrl,
        }),
    });

    return response.arrayBuffer();
}

playbackConfig.licenseHandler = async data => {
    const asString = ab2str(data);

    let obj;
    try {
        obj = JSON.parse(asString);
    } catch (e) {
        // not JSON? return original response data unmolested
        return data;
    }

    const buffer = await performIpcLicenseRequest(
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

    // hacks for local testing:
    playbackConfig.shakaConfig = {
        drm: {advanced: {
            "com.widevine.alpha": {
                // audioRobustness: "SW_SECURE_CRYPTO",
                // videoRobustness: "SW_SECURE_CRYPTO",
                audioRobustness: "",
                videoRobustness: "",
            },
        }},

        // hacks to force widevine loading:
        manifest: {
            dash: {
                ignoreDrmInfo: true,
            },
        },
    };

    return playbackConfig;
});

context.setLoggerLevel(cast.framework.LoggerLevel.VERBOSE);

context.start({
    // queue: myCastQueue,
    playbackConfig: playbackConfig,
    supportedCommands: cast.framework.messages.Command.ALL_BASIC_MEDIA,
    // supportedCommands: cast.framework.messages.Command.ALL_BASIC_MEDIA |
    //                    cast.framework.messages.Command.QUEUE_PREV |
    //                    cast.framework.messages.Command.QUEUE_NEXT
});
