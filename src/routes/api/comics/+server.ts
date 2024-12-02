import { env } from '$env/dynamic/private';
import type { Comic } from '$types/comic';
import { json, type RequestHandler } from '@sveltejs/kit';
import * as fs from 'fs/promises';

export const GET: RequestHandler = async () => {
	try {
		const comics = await fetchComicsData();
		return json(comics);
	} catch {
		return json({ error: 'Failed to fetch comics data' }, { status: 500 });
	}
};

async function fetchComicsData(): Promise<Comic[]> {
	const folders = await fs.readdir(env.COMIC_ROOT as string);
	return parseComics(folders);
}

async function parseComics(filenames: string[]): Promise<Comic[]> {
	const comics: Comic[] = [];

	filenames.forEach((filename) => {
		const comicVol = parseFilename(filename);
		if (!comicVol || comicVol.vol === null) return;

		const { author, title, vol } = comicVol;
		const cover = `/api/comics/${filename}/cover`;

		let comic = comics.find((comic) => comic.title === title.trim());
		if (!comic) {
			comic = {
				comicId: title.trim(),
				title: title.trim(),
				author: author.trim(),
				cover,
				vols: []
			};
			comics.push(comic);
		}

		comic.vols.push({
			volId: Number(vol),
			title: `${title} ${vol ? `Vol. ${vol}` : ''}`.trim(),
			author: author.trim(),
			folder: filename,
			cover
		});
	});

	return comics.map((comic) => ({
		...comic,
		vols: comic.vols.sort((a, b) => a.volId - b.volId)
	}));
}

function parseFilename(filename: string) {
	const regex = /^(.*) - (.*?)(?:, Vol\. (\d+)| \((\d+)\)| (\d+))? ([a-f0-9]{8})(?:\.epub)?$/;
	const match = filename.match(regex);
	if (match) {
		return {
			author: match[1],
			title: match[2],
			vol: match[3] || match[4] || match[5] || null,
			id: match[6]
		};
	}
	return null;
}
