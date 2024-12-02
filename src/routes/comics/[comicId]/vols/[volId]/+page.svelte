<script lang="ts">
	import { i18n } from '$lib/i18n';
	import { comicService } from '$lib/services/comicService';
	import appStore from '$lib/store';
	import InfiniteScroll from '$lib/ui/InfiniteScroll.svelte';
	import type { Vol } from '$types/comic';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	interface VolPage {
		id: string;
		path: string;
		page: number;
	}

	let { data } = $props();
	let vol: Vol | undefined = $state();
	let pages: VolPage[] = $state([]);
	let showNav = $state(false);
	let itemsPerPage = 10;
	let currentPage = $state(1);
	let restoringHistory = $state(true);
	let pageChanging = $state(false);
	let loadingMore = $state(false);
	let imageSize = $state({
		width: 0,
		height: 0
	});

	let changePageTimeout: ReturnType<typeof setTimeout>;
	let scrollToPageChecker: ReturnType<typeof setTimeout>;

	let totalPages = $derived(vol?.pagePaths?.length || 0);

	onMount(async () => {
		vol = await comicService.getVol(data.comicId, data.volId);

		if (vol?.dimensions) {
			imageSize = calculateImageSize(vol.dimensions.width, vol.dimensions.height);
		}

		appStore.setLastVolId(data.comicId, data.volId);

		displayInitPages();
	});

	function calculateImageSize(width: number, height: number) {
		const ratio = width / height;

		return {
			width: window.innerWidth,
			height: Math.floor(window.innerWidth / ratio)
		};
	}

	function displayInitPages() {
		const readingPage = Number(data.lastPage) || 1;
		let endPos = readingPage + itemsPerPage;

		pages = extractPages(0, endPos);

		if (readingPage > 1) {
			scrollToPage(readingPage);
		} else {
			restoringHistory = false;
		}
	}

	function scrollToPage(page: number) {
		if (scrollToPageChecker) {
			clearInterval(scrollToPageChecker);
		}
		scrollToPageChecker = setInterval(() => {
			const element = document.getElementById(`page-${page}`) as HTMLImageElement;
			if (element) {
				clearInterval(scrollToPageChecker);
				element.scrollIntoView();
				restoringHistory = false;
				pageChanging = false;
				savePage(page);
				// element.loading = 'eager';
				// if (!element.complete) {
				// 	return;
				// }
				// setTimeout(() => {
				// 	element.scrollIntoView();
				// 	restoringHistory = false;
				// 	pageChanging = false;
				// 	savePage(page);
				// 	clearInterval(scrollToPageChecker);
				// }, 100);
			}
		}, 50);
	}

	function extractPages(start: number, end: number): VolPage[] {
		return (vol?.pagePaths?.slice(start, end) || []).map((p: string, idx: number) => ({
			id: `page-${start + idx + 1}`,
			path: p,
			page: start + idx
		}));
	}

	function loadMore() {
		if (pageChanging || loadingMore) {
			return;
		}
		loadingMore = true;
		const startPos = pages.length;
		const endPos = startPos + itemsPerPage;
		const newPages = extractPages(0, endPos);
		pages = newPages;
		setTimeout(() => {
			loadingMore = false;
		}, 250);
	}

	function savePage(page: number) {
		if (!pageChanging) {
			appStore.setVolHistory(data.comicId, data.volId, page);
			currentPage = page;
		}
	}

	function changePage(page: number | string) {
		pageChanging = true;
		if (changePageTimeout) {
			clearTimeout(changePageTimeout);
		}
		changePageTimeout = setTimeout(() => {
			pages = extractPages(0, Number(page) + 1);
			scrollToPage(Number(page));
		}, 250);
	}
</script>

{#if restoringHistory}
	<div
		class="fixed left-0 top-0 z-10 flex h-full w-full items-center justify-center bg-black opacity-80"
	>
		<Icon icon="mdi:loading" class="animate-spin text-4xl" />
	</div>
{/if}

{#if showNav}
	<div class="navbar fixed bg-black bg-opacity-50">
		<div class="navbar-start">
			<a class="btn btn-ghost text-xl" href="/comics/{data.comicId}">
				<Icon icon="mdi:arrow-left" />
			</a>
		</div>
		<div class="navbar-center">
			<span class="btn btn-ghost text-xl">{i18n.VOL_NUM(data.volId)}</span>
		</div>
		<div class="navbar-end"></div>
	</div>
{/if}

<div
	class="flex h-full w-full"
	onclick={() => {
		showNav = !showNav;
	}}
	role="presentation"
>
	{#if vol && pages}
		<div class="w-full overflow-auto">
			{#each pages as page}
				<img
					class="w-full"
					src="/api/images?path={page.path}"
					alt={vol.title}
					loading="lazy"
					id={page.id}
					style="min-width: {imageSize.width}px; min-height: {imageSize.height}px;"
				/>
			{/each}
			<InfiniteScroll
				{currentPage}
				totalPage={pages.length}
				hasMore={vol.pagePaths?.length !== pages.length}
				onLoadMore={() => loadMore()}
				onPosChange={(page) => savePage(page)}
			/>
		</div>
	{/if}
</div>

{#if showNav}
	<div
		id="bottom-nav"
		class="navbar fixed bottom-0 left-0 flex flex-col space-y-2 bg-black bg-opacity-50"
	>
		<div class="w-2/3 pt-2">
			<input
				type="range"
				min="1"
				max={totalPages}
				bind:value={currentPage}
				class="range"
				oninput={(e: Event) => changePage((e!.target as HTMLInputElement).value)}
			/>
		</div>
		<div class="pb-4">
			<span>{currentPage} / {totalPages} {i18n.PAGE}</span>
		</div>
	</div>
{/if}

<style>
	#bottom-nav {
		bottom: env(safe-area-inset-bottom);
	}
</style>
