import { ILicenseService } from "./service";

export interface IClient {
    send(data: any): void;
}

const NS = "urn:x-cast:com.github.dhleong.babbler";

export class Engine {
    constructor(private service: ILicenseService) {}

    public async process(client: IClient, message: any) {
        if (message.namespace !== NS) {
            return;
        }

        const type = message.data.type;
        switch (type) {
        case "LICENSE":
            const { base64 } = message.data;
            const buffer = Buffer.from(base64, "base64");

            const response = await this.service.performRequest(buffer);

            client.send({
                data: {
                    response: response.toString("base64"),
                    type: "LICENSE_RESPONSE",
                },
                namespace: NS,
            });
        }
    }
}
