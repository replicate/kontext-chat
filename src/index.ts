import { Hono } from 'hono';
import Replicate from 'replicate';

// Add Env type for clarity
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

	console.log({ output });

	return c.body(output.url());
});

export default app;
