import * as cast from "chromecast-caf-receiver";

// satisfy the compiler:
export { cast };

type Categories = cast.framework.events.EventType[];

enum Commands {
    PAUSE,
    SEEK,
    STREAM_VOLUME,
    STREAM_MUTE,
    ALL_BASIC_MEDIA,
    QUEUE_NEXT,
    QUEUE_PREV,
    QUEUE_SHUFFLE,
    SKIP_AD,
}

enum EventTypes {
    ERROR = "ERROR",
    MEDIA_STATUS = "MEDIA_STATUS",
}

enum MessageTypes {
    MEDIA_STATUS,
    CLOUD_STATUS,
    QUEUE_CHANGE,
    QUEUE_ITEMS,
    QUEUE_ITEM_IDS,
    GET_STATUS,
    LOAD,
    PAUSE,
    STOP,
    PLAY,
    SKIP_AD,
    PLAY_AGAIN,
    SEEK,
    SET_PLAYBACK_RATE,
    SET_VOLUME,
    EDIT_TRACKS_INFO,
    EDIT_AUDIO_TRACKS,
    PRECACHE,
    PRELOAD,
    QUEUE_LOAD,
    QUEUE_INSERT,
    QUEUE_UPDATE,
    QUEUE_REMOVE,
    QUEUE_REORDER,
    QUEUE_NEXT,
    QUEUE_PREV,
    QUEUE_GET_ITEM_RANGE,
    QUEUE_GET_ITEMS,
    QUEUE_GET_ITEM_IDS,
    QUEUE_SHUFFLE,
    SET_CREDENTIALS,
    LOAD_BY_ENTITY,
    USER_ACTION,
    DISPLAY_STATUS,
    FOCUS_STATE,
    CUSTOM_COMMAND,
}

declare global {
    namespace cast {
        namespace framework {
            namespace events {
                namespace category {
                    export const CORE: Categories;
                }

                export const EventType: typeof EventTypes;
            }

            namespace messages {
                export const Command: typeof Commands;
                export const MessageType: typeof MessageTypes;
            }

            interface IPlayerManagerEx {

                setMessageInterceptor(
                    type: MessageTypes.LOAD,
                    interceptor: (requestData: messages.LoadRequestData) => Promise<messages.LoadRequestData>,
                ): void;

            }
        }
    }
}
