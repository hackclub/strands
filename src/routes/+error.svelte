<script>
	import { page } from '$app/stores';
</script>

<img
	src="https://http.cat/{$page.status}"
	alt="HTTP {$page.status}"
	style="display:block; max-width:500px; width:90%; margin:4rem auto;"
/>
