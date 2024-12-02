<script lang="ts">
	import { onDestroy, onMount } from 'svelte';

	let {
		currentPage,
		totalPage,
		hasMore,
		onLoadMore,
		onPosChange
	}: {
		currentPage: number;
		totalPage: number;
		hasMore: boolean;
		onLoadMore: () => void;
		onPosChange: (page: number) => void;
	} = $props();

	let component: HTMLDivElement;

	onMount(() => {
		const element = component.parentNode;
		if (element) {
			element.addEventListener('scroll', onScroll);
			element.addEventListener('resize', onScroll);
		}
	});

	const onScroll = () => {
		const ele = getElementAtScrollPosition();

		if (ele) {
			const id = ele.getAttribute('id');
			const page = Number(id?.split('-')[1]);
			if (currentPage !== page) {
				currentPage = page;
				onPosChange(page);

				// Buffer 5 pages before the end to load more
				if (hasMore && page >= totalPage - 5) {
					onLoadMore();
				}
			}
		}
	};

	const getElementAtScrollPosition = (): HTMLElement | undefined => {
		const element = component.parentNode as HTMLDivElement;
		if (!element) {
			return undefined;
		}
		const scrollPosition = element.scrollTop;
		const children = Array.from(element.children);
		for (const c of children) {
			const child = c as HTMLElement;
			const rect = child.getBoundingClientRect();
			const childStart = rect.top + element.scrollTop;
			const childEnd = rect.bottom + element.scrollTop - 20; // 20 is the threshold to prevent saving previous page pos on refresh
			if (childStart <= scrollPosition && childEnd >= scrollPosition) {
				return child;
			}
		}
		return undefined;
	};

	onDestroy(() => {
		if (component) {
			const element = component.parentNode;

			if (element) {
				element.removeEventListener('scroll', null);
				element.removeEventListener('resize', null);
			}
		}
	});
</script>

<div bind:this={component} class="w-0"></div>
