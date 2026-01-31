import { Hono } from 'hono';
import { cors } from 'hono/cors';
import PostalMime from 'postal-mime';

// Define the Environment bindings
interface Env {
	DB: D1Database;
	CF_API_TOKEN?: string; // Optional: User must set this via `wrangler secret put`
	CF_ACCOUNT_ID?: string; // Optional: To filter specific account if needed
}

// Define specific types for the Email Handler since they might not be globally available in all setups
interface ForwardableEmailMessage {
	from: string;
	to: string;
	raw: ReadableStream;
	rawSize: number;
	forward: (to: string, headers?: Headers) => Promise<void>;
	setReject: (reason: string) => void;
}

const app = new Hono<{ Bindings: Env }>();

// Enable CORS
app.use('/*', cors());

app.get('/', (c) => c.text('Temp Email Worker API is Running 🚀'));

// API: List available domains automatically from Cloudflare Account
app.get('/api/domains', async (c) => {
	// If no token is provided, return a default hint or empty list
	if (!c.env.CF_API_TOKEN) {
		return c.json({
			domains: ["example.com"],
			warning: "CF_API_TOKEN not set. Please run 'npx wrangler secret put CF_API_TOKEN' with a token having Zone:Read permission."
		});
	}

	try {
		// Fetch zones from Cloudflare API
		const response = await fetch('https://api.cloudflare.com/client/v4/zones?status=active&per_page=50', {
			headers: {
				'Authorization': `Bearer ${c.env.CF_API_TOKEN}`,
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok) {
			console.error('CF API Error', await response.text());
			return c.json({ domains: [], error: 'Failed to fetch domains from Cloudflare' }, 500);
		}

		const data: any = await response.json();
		// Extract domain names
		const domains = data.result.map((zone: any) => zone.name);

		return c.json({ domains });
	} catch (err: any) {
		return c.json({ domains: [], error: err.message }, 500);
	}
});

// API: Get usage stats
app.get('/api/stats', async (c) => {
	try {
		// Count from aliases table (assuming this table tracks created addresses)
		const { results } = await c.env.DB.prepare('SELECT count(*) as count FROM aliases').all();
		const count = results[0]?.count || 0;
		return c.json({ total_emails: count });
	} catch (e) {
		return c.json({ total_emails: 0 }); // Fallback
	}
});

// API: Generate a new random email address (or register a custom one)
app.post('/api/generate', async (c) => {
	let { prefix, domain } = await c.req.json<{ prefix?: string, domain?: string }>().catch(() => ({ prefix: undefined, domain: undefined }));

	// If no prefix provided, generate a random one (6 chars)
	if (!prefix) {
		prefix = Math.random().toString(36).substring(2, 8);
	}

	// Basic sanitization
	prefix = prefix.replace(/[^a-zA-Z0-9._-]/g, '');

	// Default to the provided domain or request the first available one (logic could be improved)
	// For now, we trust the frontend sent a valid domain or we fallback to 'example.com' safely
	const selectedDomain = domain || 'example.com';
	const fullAddress = `${prefix}@${selectedDomain}`;

	// Log creation to DB (optional, mainly to track usage or reserved aliases)
	// We use INSERT OR IGNORE to avoid errors if it already exists
	try {
		await c.env.DB.prepare('INSERT OR IGNORE INTO aliases (address) VALUES (?)')
			.bind(fullAddress)
			.run();
	} catch (e) {
		console.error('Failed to save alias', e);
	}

	return c.json({
		prefix,
		domain: selectedDomain,
		address: fullAddress
	});
});

// API: Get inbox for a specific address
app.get('/api/inbox/:address', async (c) => {
	const address = c.req.param('address');
	const search = c.req.query('search');
	const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!) : 20;

	// Search by exact match on address (or handling catch-all logic)
	// Since we save the specific "To" address in the DB, we can query by it.

	let query = 'SELECT id, sender, subject, body_text, received_at FROM emails WHERE address = ?';
	const params: any[] = [address];

	if (search) {
		query += ' AND (subject LIKE ? OR body_text LIKE ?)';
		params.push(`%${search}%`, `%${search}%`);
	}

	query += ' ORDER BY received_at DESC LIMIT ?';
	params.push(limit);

	const { results } = await c.env.DB.prepare(query).bind(...params).all();
	return c.json({ emails: results });
});

// API: Get full message content
app.get('/api/message/:id', async (c) => {
	const id = c.req.param('id');
	const email = await c.env.DB.prepare('SELECT * FROM emails WHERE id = ?').bind(id).first();

	if (!email) return c.notFound();

	return c.json(email);
});

// API: Delete a message
app.delete('/api/message/:id', async (c) => {
	const id = c.req.param('id');
	try {
		await c.env.DB.prepare('DELETE FROM emails WHERE id = ?').bind(id).run();
		return c.json({ success: true });
	} catch (e) {
		return c.json({ error: 'Failed to delete message' }, 500);
	}
});

export default {
	// HTTP Handler (Hono)
	fetch: app.fetch,

	// Email Handler (Email Routing)
	async email(message: ForwardableEmailMessage, env: Env, ctx: ExecutionContext) {
		try {
			// Parse the email
			// PostalMime expects an ArrayBuffer or similar. `message.raw` is a ReadableStream.
			// We need to convert stream to ArrayBuffer.
			const rawArrayBuffer = await new Response(message.raw).arrayBuffer();
			const parser = new PostalMime();
			const parsedEmail = await parser.parse(rawArrayBuffer);

			const sender = message.from;
			const recipient = message.to; // This is the address the email was sent TO
			const subject = parsedEmail.subject || '(No Subject)';
			const bodyText = parsedEmail.text || '';
			const bodyHtml = parsedEmail.html || '';

			console.log(`Received email for ${recipient} from ${sender}`);

			// Save to D1
			await env.DB.prepare(
				`INSERT INTO emails (address, sender, subject, body_text, body_html) VALUES (?, ?, ?, ?, ?)`
			)
				.bind(recipient, sender, subject, bodyText, bodyHtml)
				.run();

		} catch (error) {
			console.error('Error processing email:', error);
			// We don't want to reject the email necessarily, just log the error.
			// Or we could setReject if critical.
		}
	},

	// Scheduled Handler (Cron Triggers)
	async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
		console.log("Running scheduled cleanup...");
		try {
			// Delete emails older than 30 days
			const result = await env.DB.prepare(
				"DELETE FROM emails WHERE received_at < datetime('now', '-30 days')"
			).run();

			console.log(`Cleanup complete. Deleted rows: ${result.meta.changes}`);
		} catch (e) {
			console.error("Error during scheduled cleanup:", e);
		}
	}
};
