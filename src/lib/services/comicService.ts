import appStore from '$lib/store';
import type { Comic, Vol } from '$types/comic';

class ComicService {
	async fetchComics(): Promise<Comic[]> {
		const response = await fetch('/api/comics');
		return await response.json();
	}

	async getComic(title: string): Promise<Comic | undefined> {
		const comics = await this.fetchComics();
		const comic = comics.find((comic) => comic.title === title);
		const downloadedVolIds = appStore.getDownloadedVolIds(title);
		return comic
			? {
					...comic,
					vols: comic.vols.map((vol) => ({
						...vol,
						downloaded: downloadedVolIds.includes(vol.volId.toString())
					}))
				}
			: undefined;
	}

	async getVol(comicId: string, volId: number): Promise<Vol | undefined> {
		const comic = await this.getComic(comicId);
		const vol = comic?.vols.find((vol) => vol.volId === volId);

		if (!vol) {
			return undefined;
		}

		const response = await fetch(`/api/vols/${vol.folder}`);
		return await response.json();
	}
}

export const comicService = new ComicService();
