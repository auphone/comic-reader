import { env } from '$env/dynamic/private';
import { json, type RequestHandler } from '@sveltejs/kit';
import * as fs from 'fs/promises';
import path from 'path';

export const GET: RequestHandler = async ({ params }) => {
	const files = await fs.readdir(path.join(env.COMIC_ROOT as string, params.comicId!));
	const cover = files.find((file) => file.startsWith('cover'));

	if (!cover) {
		return json({ error: 'Cover not found' }, { status: 400 });
	}

	const coverPath = path.join(env.COMIC_ROOT as string, params.comicId!, cover);
	const coverData = await fs.readFile(coverPath);

	return new Response(coverData, { headers: { 'Content-Type': 'image/jpeg' } });
};
