<script lang="ts">
	import { i18n } from '$lib/i18n';
	import { IconName } from '$lib/iconName';
	import Icon from '@iconify/svelte';
</script>

<div class="navbar sticky top-0 z-10 bg-base-200">
	<a class="btn btn-ghost text-xl" href="/">
		<Icon icon={IconName.AppIcon} />
		<span>{i18n.APP_NAME}</span>
	</a>
</div>
