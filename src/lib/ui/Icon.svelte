<script lang="ts">
	import * as Icons from 'lucide-svelte';

	let {
		name,
		size = 20,
		color = 'currentColor',
		strokeWidth = 2,
		class: className = ''
	} = $props();

	// @ts-ignore
	const Icon = $derived(Icons[name]);
</script>

{#if Icon}
	<Icon {size} {color} {strokeWidth} class={className} />
{/if}
