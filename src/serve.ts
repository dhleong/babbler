import createFastify from "fastify";
import cors from "fastify-cors";

import { ILicenseService } from "./service";

export async function serve(service: ILicenseService, port?: number) {

    const fastify = createFastify({
        logger: true,
    });

    fastify.register(cors);

    fastify.post("/drm", async (req, res) => {

        res.header("Access-Control-Allow-Origin", "*");

        const asBase64 = req.body.base64;
        const asBuffer = Buffer.from(asBase64, "base64");

        return service.performRequest(asBuffer);
    });

    return new Promise((resolve, reject) => {
        fastify.listen({
            host: "0.0.0.0",
            port,
        }, (err, address) => {
            if (err) return reject(err);
            resolve(address);
        });
    });
}
