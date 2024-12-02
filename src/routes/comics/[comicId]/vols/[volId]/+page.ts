import appStore from '$lib/store';

export function load({ params }) {
	return {
		volId: Number(params.volId),
		title: params.comicId,
		comicId: params.comicId,
		lastPage: appStore.getLastVolPage(params.comicId, params.volId)
	};
}
