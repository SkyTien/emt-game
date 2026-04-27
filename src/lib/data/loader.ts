import { parse as parseYaml } from 'yaml';

export function parseYamlText<T>(text: string): T {
	return parseYaml(text) as T;
}

export async function loadYamlFromUrl<T>(url: string): Promise<T> {
	const res = await fetch(url);
	if (!res.ok) {
		throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
	}
	const text = await res.text();
	return parseYamlText<T>(text);
}
