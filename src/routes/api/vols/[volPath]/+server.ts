import { env } from '$env/dynamic/private';
import type { Vol } from '$types/comic';
import { json, type RequestHandler } from '@sveltejs/kit';
import * as fs from 'fs/promises';
import imageSize from 'image-size';
import path from 'path';
import { promisify } from 'util';

const sizeOf = promisify(imageSize);

export const GET: RequestHandler = async ({ params }) => {
	const { volPath } = params;

	const files = await fs.readdir(path.join(env.COMIC_ROOT as string, volPath!));
	const cover = files.find((file) => file.startsWith('cover'));
	const pages = files
		.filter((file) => !file.startsWith('cover'))
		.sort((a, b) => a.localeCompare(b, undefined));

	const dimensions = await sizeOf(path.join(env.COMIC_ROOT as string, volPath!, cover!));

	return json({
		cover: path.join(volPath!, cover || ''),
		pagePaths: pages.map((page) => path.join(volPath!, page)),
		dimensions: dimensions && {
			width: dimensions.width,
			height: dimensions.height
		}
	} as Vol);
};
