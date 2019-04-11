import debug_ from "debug";
const debug = debug_("babbler:playback");

export class PlaybackHandler {
    public static init(
        context: cast.framework.CastReceiverContext,
    ) {
        const handler = new PlaybackHandler();

        const playerManager = context.getPlayerManager();

        if (process.env.NODE_ENV !== "production") {
            playerManager.addEventListener(
                cast.framework.events.category.CORE,
                event => {
                    debug("EVENT", event);
                },
            );

            playerManager.addEventListener(
                cast.framework.events.EventType.MEDIA_STATUS,
                event => {
                    debug("MEDIA_STATUS", event);
                },
            );
        }

        // TODO mediainterceptor

        playerManager.setMediaPlaybackInfoHandler(
            handler.handleMediaPlaybackInfo.bind(handler),
        );

        return handler;
    }

    public handleMediaPlaybackInfo(
        loadRequest: cast.framework.messages.LoadRequestData,
        playbackConfig: cast.framework.PlaybackConfig,
    ) {
        if (loadRequest.customData && loadRequest.customData.license) {
            const { license } = loadRequest.customData;
            if (license.url) {
                playbackConfig.licenseUrl = license.url;
            }

            if (license.ipc) {
                const licenseUrl = playbackConfig.licenseUrl || "";
                const uri = "ipc://" + encodeURIComponent(licenseUrl);
                playbackConfig.licenseUrl = uri;
            }
        }

        (playbackConfig as any).shakaConfig = {
            // hacks to force widevine loading:
            manifest: {
                dash: {
                    ignoreDrmInfo: true,
                },
            },
        };

        // hacks for local testing:
        if (process.env.NODE_ENV !== "production") {
            (playbackConfig as any).shakaConfig.drm = {
                advanced: {
                    "com.widevine.alpha": {
                        audioRobustness: "",
                        videoRobustness: "",
                    },
                },
            };
        }

        return playbackConfig;
    }

}
