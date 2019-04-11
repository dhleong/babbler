import debug_ from "debug";
const debug = debug_("babbler:playback");

import { IPlayerManagerEx } from "chromecast-caf-receiver/cast.framework";

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

        // gross, but necessary due to incomplete typings:
        const pmEx = playerManager as unknown as IPlayerManagerEx;
        pmEx.setMessageInterceptor(
            cast.framework.messages.MessageType.LOAD,
            handler.interceptLoadMessage.bind(handler),
        );

        playerManager.setMediaPlaybackInfoHandler(
            handler.handleMediaPlaybackInfo.bind(handler),
        );

        return handler;
    }

    public async interceptLoadMessage(
        loadRequestData: cast.framework.messages.LoadRequestData,
    ) {
        if (loadRequestData.media && loadRequestData.media.contentId) {
            loadRequestData.media.contentId = loadRequestData.media.contentId.replace(/^http[s]?:/, "");
        }

        return loadRequestData;
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
