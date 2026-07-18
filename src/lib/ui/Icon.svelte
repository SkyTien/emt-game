<script lang="ts">
	import {
		Activity,
		AirVent,
		Ambulance,
		ArrowLeft,
		Bone,
		Brain,
		BriefcaseMedical,
		Circle,
		CircleAlert,
		CircleCheckBig,
		CircleDot,
		ClipboardCheck,
		ClipboardList,
		Construction,
		Droplet,
		Eye,
		Footprints,
		Gauge,
		Hand,
		HeartPulse,
		Hospital,
		MessageCircle,
		MessageSquareQuote,
		MessageSquareText,
		PhoneCall,
		Plug,
		Power,
		Ruler,
		Scan,
		ScanFace,
		Search,
		Shield,
		ShieldAlert,
		ShieldCheck,
		StretchHorizontal,
		Thermometer,
		Truck,
		UserPlus,
		UserRoundSearch,
		Utensils,
		Wind,
		X,
		Zap
	} from 'lucide-svelte';
	import type { IconName } from './icon-names';

	function defineIconMap<T extends Record<IconName, unknown>>(icons: T): T {
		return icons;
	}

	const ICONS = defineIconMap({
		Activity,
		Air: AirVent,
		AlertCircle: CircleAlert,
		Ambulance,
		ArrowLeft,
		Bone,
		Brain,
		BriefcaseMedical,
		CheckCircle: CircleCheckBig,
		Circle,
		CircleDot,
		ClipboardCheck,
		ClipboardList,
		Construction,
		Droplet,
		Eye,
		Footprints,
		Gauge,
		Hand,
		HeartPulse,
		Hospital,
		MessageCircle,
		MessageSquareQuote,
		MessageSquareText,
		PhoneCall,
		Plug,
		Power,
		Ruler,
		Scan,
		ScanFace,
		Search,
		Shield,
		ShieldAlert,
		ShieldCheck,
		StretchHorizontal,
		Thermometer,
		Truck,
		UserPlus,
		UserRoundSearch,
		Utensils,
		Wind,
		X,
		Zap
	});

	let {
		name,
		size = 20,
		color = 'currentColor',
		strokeWidth = 2,
		class: className = ''
	}: {
		name: string;
		size?: number;
		color?: string;
		strokeWidth?: number;
		class?: string;
	} = $props();

	const Icon = $derived(ICONS[name as keyof typeof ICONS]);
</script>

{#if Icon}
	<Icon {size} {color} {strokeWidth} class={className} />
{/if}
