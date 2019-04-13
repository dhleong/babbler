import debug_ from "debug";
const debug = debug_("babbler:queue");

import { IQueueResponse, QUEUE } from "./messages";
import { RpcManager } from "./rpc";

type QueueItem = cast.framework.messages.QueueItem;

export class BabblerQueue extends cast.framework.QueueBase {
    public static create(
        context: cast.framework.CastReceiverContext,
        rpc: RpcManager,
    ) {
        return new BabblerQueue(
            context.getPlayerManager().getQueueManager(),
            rpc,
        );
    }

    constructor(
        private mgr: cast.framework.QueueManager,
        private rpc: RpcManager,
    ) {
        super();
    }

    public async nextItems(itemId?: number): Promise<QueueItem[]> {
        return this.fetchRelativeTo("after", itemId);
    }

    private async fetchRelativeTo(
        mode: "before" | "after",
        itemId?: number,
    ) {
        if (!itemId) return [];

        const items = this.mgr.getItems();
        const fetchAfter = items.find(item => item.itemId === itemId);
        if (!fetchAfter) {
            debug("Couldn't determine which item to fetch after");
            return [];
        }

        if (!fetchAfter.media) {
            throw new Error("No media attached to queue item");
        }

        debug("fetch items after", fetchAfter.media.contentId);
        const result = await this.rpc.send(QUEUE, {
            contentId: fetchAfter.media.contentId,
            mode,
        });

        debug("got", result);
        return result.map(toQueueItem);
    }
}

function toQueueItem(item: IQueueResponse): QueueItem {
    const result = new cast.framework.messages.QueueItem();
    result.media = {
        contentId: item.contentId,
        contentType: "video/mp4", // TODO ?
        contentUrl: item.contentId,
        streamType: "BUFFERED",
    };
    return result;
}
