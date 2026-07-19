<script lang="ts">
	import {
		Activity,
		AirVent,
		Ambulance,
		ArrowLeft,
		Bot,
		Bone,
		Brain,
		BriefcaseMedical,
		ChartNoAxesColumnIncreasing,
		Circle,
		CircleAlert,
		CircleCheckBig,
		CircleDot,
		CircleHelp,
		ChevronRight,
		Clock3,
		ClipboardCheck,
		ClipboardList,
		Construction,
		Cross,
		Droplet,
		Eye,
		Footprints,
		Gauge,
		Hand,
		HeartPulse,
		Hospital,
		House,
		History,
		MessageCircle,
		MessageSquareQuote,
		MessageSquareText,
		PhoneCall,
		Plug,
		Power,
		Radio,
		Ruler,
		Scan,
		ScanFace,
		Search,
		Shield,
		ShieldAlert,
		ShieldCheck,
		Siren,
		Settings,
		Stethoscope,
		StretchHorizontal,
		Thermometer,
		Timer,
		Truck,
		UserPlus,
		UserRound,
		UsersRound,
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
		Bot,
		Bone,
		Brain,
		BriefcaseMedical,
		ChartNoAxesColumnIncreasing,
		CheckCircle: CircleCheckBig,
		Circle,
		CircleDot,
		CircleHelp,
		ChevronRight,
		Clock3,
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
		House,
		History,
		MessageCircle,
		MessageSquareQuote,
		MessageSquareText,
		PhoneCall,
		Plug,
		Power,
		Radio,
		Ruler,
		Scan,
		ScanFace,
		Search,
		Shield,
		ShieldAlert,
		ShieldCheck,
		Siren,
		Settings,
		Stethoscope,
		StarOfLife: Cross,
		StretchHorizontal,
		Thermometer,
		Timer,
		Truck,
		UserPlus,
		UserRound,
		UsersRound,
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
