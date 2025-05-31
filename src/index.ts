import { Hono } from 'hono';
import Replicate from 'replicate';

interface Env {
        REPLICATE_API_TOKEN: string;
}

const app = new Hono<{ Bindings: Env }>();

app.post('/generate-image', async (c) => {
        const replicate = new Replicate({ auth: c.env.REPLICATE_API_TOKEN });
        const model = 'black-forest-labs/flux-kontext-pro';

        const { prompt, input_image } = await c.req.json();
        const output = await replicate.run(model, {
                input: {
                        prompt,
                        input_image,
                },
        });

        return c.text(output as string);
});

export default app;
