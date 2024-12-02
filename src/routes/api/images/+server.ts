import { env } from '$env/dynamic/private';
import { type RequestHandler } from '@sveltejs/kit';
import * as fs from 'fs/promises';
import path from 'path';

export const GET: RequestHandler = async ({ url }) => {
	const imagePath = url.searchParams.get('path');
	const image = await fs.readFile(path.join(env.COMIC_ROOT as string, imagePath!));

	return new Response(image, { headers: { 'Content-Type': 'image/jpeg' } });
};
