<script lang="ts">
	import { i18n } from '$lib/i18n';
	import { comicService } from '$lib/services/comicService';
	import appStore from '$lib/store';
	import Topnav from '$lib/ui/Topnav.svelte';
	import type { Comic } from '$types/comic';
	import { onMount } from 'svelte';

	let comics: Comic[] = $state([]);

	const recentReadingComics: Comic[] | undefined = $derived(
		$appStore.recentComicIds?.length > 0
			? $appStore.recentComicIds
					.map((comicId) => comics.find((comic) => comic.comicId === comicId))
					.filter((comic) => comic !== undefined)
			: undefined
	);

	onMount(async () => {
		comics = await comicService.fetchComics();
	});
</script>

<Topnav />

{#if recentReadingComics}
	{@render ComicList(i18n.RECENT_READING, recentReadingComics)}
{/if}

{@render ComicList(i18n.MANGA_LIST, comics)}

{#snippet ComicList(title: string, comics: Comic[])}
	<div class="flex flex-col space-y-1 p-3">
		<span>{title}</span>
		<div class="grid grid-cols-3 gap-3 lg:grid-cols-5">
			{#each comics as comic}
				<a href="comics/{comic.title}" class="relative shadow-lg">
					<img src={comic.cover} alt={comic.title} class="h-full w-full object-cover" />
					<div class="absolute bottom-0 left-0 w-full bg-black bg-opacity-50 p-1 text-sm">
						{comic.title}
					</div>
				</a>
			{/each}
		</div>
	</div>
{/snippet}
