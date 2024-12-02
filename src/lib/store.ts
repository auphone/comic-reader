import { browser } from '$app/environment';
import { get, writable } from 'svelte/store';

interface VolHistory {
	downloaded: boolean;
	lastReadingPage: number;
}

interface ComicHistory {
	lastVolId?: string;
	volHistory: {
		[volId: string]: VolHistory;
	};
}

interface ReadingHistory {
	recentComicIds: string[];
	comicHistory: {
		[comicId: string]: ComicHistory;
	};
}

const createAppStore = () => {
	const readingHistory: ReadingHistory = browser
		? JSON.parse(localStorage.getItem('readingHistory') || '{}')
		: {};

	const { subscribe, update } = writable<ReadingHistory>({
		recentComicIds: readingHistory?.recentComicIds || [],
		comicHistory: readingHistory?.comicHistory || {}
	});

	function save(state: ReadingHistory) {
		localStorage.setItem('readingHistory', JSON.stringify(state));
	}

	function ensureComicHistory(state: ReadingHistory, comicId: string): ReadingHistory {
		if (!state.comicHistory[comicId]) {
			state.comicHistory[comicId] = {
				lastVolId: undefined,
				volHistory: {}
			};
		} else {
			if (!state.comicHistory[comicId].volHistory) {
				state.comicHistory[comicId].volHistory = {};
			}
		}
		return state;
	}

	function ensureVolHistory(
		state: ReadingHistory,
		comicId: string,
		volId: number | string
	): ReadingHistory {
		state = ensureComicHistory(state, comicId);
		if (!state.comicHistory[comicId].volHistory[volId.toString()]) {
			state.comicHistory[comicId].volHistory[volId.toString()] = {
				downloaded: false,
				lastReadingPage: 1
			};
		}
		return state;
	}

	function pushRecentReadingComic(state: ReadingHistory, comicId: string): ReadingHistory {
		const comicIds = state.recentComicIds;
		const threshold = 3;
		const index = comicIds.indexOf(comicId);
		if (index === 0) {
			return state;
		}
		// Push to the front of the array
		if (index > 0) {
			comicIds.splice(index, 1);
		}
		comicIds.unshift(comicId);
		// Remove the last comic if it exceeds the threshold
		if (comicIds.length > threshold) {
			comicIds.pop();
		}
		state.recentComicIds = comicIds;
		return state;
	}

	return {
		subscribe,
		setVolHistory: (comicId: string, volId: string | number, page: number) => {
			update((state) => {
				state = ensureVolHistory(state, comicId, volId);

				state.comicHistory[comicId].lastVolId = volId.toString();
				state.comicHistory[comicId].volHistory[volId].lastReadingPage = page;
				state = pushRecentReadingComic(state, comicId);

				save(state);
				return state;
			});
		},
		setVolDownloaded: (comicId: string, volId: string | number, downloaded = true) => {
			update((state) => {
				state = ensureVolHistory(state, comicId, volId);

				state.comicHistory[comicId].volHistory[volId].downloaded = downloaded;

				save(state);
				return state;
			});
		},
		setLastVolId: (comicId: string, volId: number | string) => {
			update((state) => {
				state = ensureVolHistory(state, comicId, volId);
				state = pushRecentReadingComic(state, comicId);

				state.comicHistory[comicId].lastVolId = volId.toString();
				save(state);
				return state;
			});
		},
		getLastVolPage: (comicId: string, volId: string | number) => {
			let state = get({ subscribe });
			state = ensureVolHistory(state, comicId, volId);
			const comicHistory = state.comicHistory[comicId];
			return comicHistory?.volHistory[volId.toString()]?.lastReadingPage || 1;
		},
		getDownloadedVolIds: (comicId: string) => {
			let state = get({ subscribe });
			state = ensureComicHistory(state, comicId);
			const comicHistory = state.comicHistory[comicId];
			return Object.keys(comicHistory.volHistory).filter(
				(volId) => comicHistory.volHistory[volId].downloaded
			);
		}
	};
};

export const appStore = createAppStore();

export default appStore;
