<script lang="ts">
	import { goto } from '$app/navigation';
	import { i18n } from '$lib/i18n';
	import { IconName } from '$lib/iconName';
	import { comicService } from '$lib/services/comicService';
	import appStore from '$lib/store';
	import Topnav from '$lib/ui/Topnav.svelte';
	import type { Comic, Vol } from '$types/comic';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	let { data } = $props();

	let comic: Comic | undefined = $state();
	let lastVolId = $appStore.comicHistory[data.comicId]?.lastVolId;
	let downloadMode = $state(false);
	let selectedVolIds: number[] = $state([]);
	let downloading = $state(false);
	let deleting = $state(false);
	let abortController: AbortController;

	onMount(async () => {
		comic = await comicService.getComic(data.comicId);
	});

	function readLastVol() {
		const volId = lastVolId || comic?.vols[0].volId;
		readVol(volId);
	}

	function readVol(volId?: number | string) {
		if (volId) {
			goto(`/comics/${comic!.comicId}/vols/${volId}`);
		}
	}

	function selectVol(volId: number) {
		if (selectedVolIds.includes(volId)) {
			selectedVolIds = selectedVolIds.filter((id) => id !== volId);
		} else {
			selectedVolIds = [...selectedVolIds, volId];
		}
	}

	async function download() {
		downloading = true;
		abortController = new AbortController();

		const vols = comic!.vols.filter((vol) => selectedVolIds.includes(vol.volId));

		for (let bk of vols) {
			const vol = await comicService.getVol(data.comicId, bk.volId);
			if (vol && vol.pagePaths) {
				try {
					await Promise.all(
						vol.pagePaths.map((path) =>
							fetch(`/api/images?path=${path}`, { signal: abortController.signal })
						)
					);
					appStore.setVolDownloaded(data.comicId, bk.volId);
					bk.downloaded = true;
					comic!.vols.find((b) => b.volId === bk.volId)!.downloaded = true;
					unselectVol(bk.volId);
				} catch (err) {
					console.error(err);
				}
			}
		}
		downloading = false;
	}

	async function clearCache() {
		deleting = true;
		const vols = comic!.vols.filter((vol) => selectedVolIds.includes(vol.volId));
		const comicCache = await caches.open('comics');
		const keys = await comicCache.keys();

		for (let bk of vols) {
			for (let key of keys) {
				const cacheImagePath = new URL(key.url).searchParams.get('path');
				if (cacheImagePath?.startsWith(bk.folder)) {
					comicCache.delete(key);
				}
			}
			appStore.setVolDownloaded(data.comicId, bk.volId, false);
			bk.downloaded = false;
			unselectVol(bk.volId);
		}
		deleting = false;
	}

	function unselectVol(volId: string | number) {
		selectedVolIds = selectedVolIds.filter((id) => id !== volId);
	}

	function setDownloadMode() {
		selectedVolIds = [];
		downloadMode = true;
	}

	function cancel() {
		if (abortController) {
			abortController.abort();
		}
		downloading = false;
		downloadMode = false;
	}

	function getDownloadModeBtnColor(vol: Vol) {
		if (selectedVolIds.includes(vol.volId)) {
			return 'btn-secondary';
		}
		if (vol.downloaded) {
			return 'btn-neutral';
		}
		return 'btn-outline';
	}

	function getReadingModeBtnColor(vol: Vol) {
		if (lastVolId === vol.volId.toString()) {
			return 'btn-primary';
		} else if (vol.downloaded) {
			return 'btn-neutral';
		}
	}
</script>

<Topnav />

{#if comic}
	<div class="relative h-[250px]">
		<img src={comic.cover} alt={comic.title} class="h-full w-full object-cover opacity-50" />
		<div class="absolute bottom-0 left-0 w-full bg-black bg-opacity-50 p-2">
			<h1 class="text-2xl font-bold">{comic.title}</h1>
			<h2>{comic.author}</h2>
		</div>
	</div>

	<div class="mt-2 p-2 pb-20">
		<h1 class="mb-2 flex items-center">
			<span>{i18n.VOL}:</span>
			<div class="ml-auto flex items-center space-x-1">
				{#if !downloadMode}
					<button class="btn btn-secondary btn-sm" onclick={() => setDownloadMode()}>
						<Icon icon={IconName.Download} />
					</button>
				{:else}
					<button
						class="btn btn-primary btn-sm"
						disabled={selectedVolIds.length === 0 || downloading || deleting}
						onclick={() => clearCache()}
					>
						<span class="flex items-center">
							{#if deleting}
								<Icon icon={IconName.Loading} class="animate-spin" />
							{:else}
								<Icon icon={IconName.Clear} />
							{/if}
							<span>{i18n.CLEAR_DOWNLOADED}</span></span
						>
					</button>
					<button
						class="btn btn-primary btn-sm"
						disabled={selectedVolIds.length === 0 || downloading || deleting}
						onclick={() => download()}
					>
						<span class="flex items-center">
							{#if downloading}
								<Icon icon={IconName.Loading} class="animate-spin" />
							{:else}
								<Icon icon={IconName.Download} />
							{/if}
							<span>{i18n.DOWNLOAD}</span></span
						>
					</button>
					<button class="btn btn-accent btn-sm" onclick={() => cancel()}>{i18n.FINISH}</button>
				{/if}
			</div>
		</h1>
		<div class="mb-2 grid grid-cols-6 gap-1">
			{#each comic.vols as vol}
				{#if !downloadMode}
					<!-- Read Mode -->
					<div class="indicator flex w-full">
						<button
							class="btn btn-sm grow {getReadingModeBtnColor(vol)}"
							onclick={() => readVol(vol.volId)}>{vol.volId}</button
						>
					</div>
				{:else}
					<!-- Download Mode -->
					<button
						class="btn btn-sm {getDownloadModeBtnColor(vol)}"
						onclick={() => selectVol(vol.volId)}>{vol.volId}</button
					>
				{/if}
			{/each}
		</div>
	</div>
{/if}

<div class="btm-nav bg-base-200 pb-0">
	<a href="/">
		<Icon icon={IconName.Home} />
		<span class="btm-nav-label">{i18n.HOME}</span>
	</a>
	<button class="bg-primary text-primary-content" onclick={() => readLastVol()}>
		<Icon icon={IconName.Read} />
		{#if lastVolId}
			<span class="btm-nav-label">{i18n.CONTINUTE_READING}</span>
		{:else}
			<span class="btm-nav-label">{i18n.START_READING}</span>
		{/if}
	</button>
</div>

<style>
	.btm-nav {
		bottom: env(safe-area-inset-bottom);
	}
</style>
