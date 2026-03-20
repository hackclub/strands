import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME } = env;

const EMAIL_RE = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/** Sanitise **/
function sanitise(str) {
	// Strip leading formula triggers (=, +, -, @, tab, CR) 
	let s = str.replace(/^[=+\-@\t\r]+/, '');
	// Remove any HTML tags
	s = s.replace(/<[^>]*>/g, '');
	// strip whitespace
	s = s.replace(/\s+/g, ' ').trim();
	return s;
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	let body;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid request body.' }, { status: 400 });
	}

	const rawEmail = typeof body.email === 'string' ? body.email : '';
	const email = sanitise(rawEmail).toLowerCase();

	if (!email) {
		return json({ error: 'Email is required.' }, { status: 400 });
	}

	if (email.length > 254 || !EMAIL_RE.test(email)) {
		return json({ error: 'That doesn\u2019t look like a valid email.' }, { status: 400 });
	}

	const baseUrl = `https://api.airtable.com/v0/${encodeURIComponent(AIRTABLE_BASE_ID)}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`;
	const headers = {
		Authorization: `Bearer ${AIRTABLE_API_KEY}`,
		'Content-Type': 'application/json'
	};

	// Check for existing RSVP with this email
	const filterFormula = `{Email} = "${email.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
	const searchUrl = `${baseUrl}?filterByFormula=${encodeURIComponent(filterFormula)}&maxRecords=1`;

	const checkRes = await fetch(searchUrl, { headers });
	if (checkRes.ok) {
		const checkData = await checkRes.json();
		if (checkData.records && checkData.records.length > 0) {
			return json({ error: 'duplicate' }, { status: 409 });
		}
	}

	// Create the record
	const now = new Date();
	const signUpDate = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${now.getFullYear()}`;

	const res = await fetch(baseUrl, {
		method: 'POST',
		headers,
		body: JSON.stringify({
			records: [
				{
					fields: {
						Email: email,
						Perms: 'User',
						Notes: '',
						'Slack-ID': '',
						'Sign-Up-Date': signUpDate
					}
				}
			]
		})
	});

	if (!res.ok) {
		const err = await res.text();
		console.error('Airtable error:', res.status, err);
		return json({ error: 'Something went wrong. Please try again later.' }, { status: 500 });
	}

	return json({ success: true });
}
