<script lang="ts">
	import { i18n } from '$lib/i18n';
	import BottomBar from '$lib/ui/BottomBar.svelte';
	import { onMount } from 'svelte';
	import '../app.css';

	let { children } = $props();
	let toastMsg = $state('');

	async function detectSWUpdate() {
		const registration = await navigator.serviceWorker.ready;

		registration.addEventListener('updatefound', () => {
			const newWorker = registration.installing;

			newWorker?.addEventListener('statechange', () => {
				if (newWorker.state === 'installed') {
					if (navigator.serviceWorker.controller) {
						toastMsg = i18n.SW_UPDATE_MESSAGE;
						setTimeout(() => {
							toastMsg = '';
						}, 5000);
						newWorker.postMessage({ type: 'SKIP_WAITING' });
					}
				}
			});
		});
	}

	onMount(() => {
		detectSWUpdate();
	});
</script>

<svelte:head>
	<title>{i18n.APP_NAME}</title>
</svelte:head>

<main class="h-full">
	{@render children()}
</main>

<BottomBar />

{#if toastMsg}
	<div class="toast">
		<div class="alert alert-info">
			<span>{toastMsg}</span>
		</div>
	</div>
{/if}

<style>
	main {
		margin-bottom: env(safe-area-inset-bottom);
	}
</style>
