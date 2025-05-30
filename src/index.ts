import { Hono } from 'hono';
import Replicate from 'replicate';

const app = new Hono<{ Bindings: Env }>();

app.post('/generate-image', async (c) => {
	const replicate = new Replicate({auth: c.env.REPLICATE_API_TOKEN})
	const model = 'black-forest-labs/flux-schnell'  
	const prompt = await c.req.text()
	const output = await replicate.run(model, {
	  input: {
		prompt,
		image_format: 'webp',
	  }
	})
	  
	// Some image models return an array of output files, others just a single file.
	const imageUrl = Array.isArray(output) ? output[0].url() : output.url()
   
	console.log({imageUrl})

	return c.body(imageUrl, {
		headers: {
			'Content-Type': 'image/webp',
		},
	});
});

export default app;
