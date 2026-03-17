<script>
	import { onMount } from 'svelte';

	let email = '';
	let photoOpen = false;
	let photoReady = false;
	let carouselReady = false;
	let orphReady = false;

	const orphFrames = [
		{ src: '/images/orph/frame_00_delay-0.13s.gif', delay: 130 },
		{ src: '/images/orph/frame_01_delay-0.04s.gif', delay: 40 },
		{ src: '/images/orph/frame_02_delay-0.1s.gif',  delay: 100 },
		{ src: '/images/orph/frame_03_delay-0.03s.gif', delay: 30 },
		{ src: '/images/orph/frame_04_delay-0.1s.gif',  delay: 100 },
		{ src: '/images/orph/frame_05_delay-0.03s.gif', delay: 30 },
		{ src: '/images/orph/frame_06_delay-0.1s.gif',  delay: 100 },
		{ src: '/images/orph/frame_07_delay-0.04s.gif', delay: 40 },
		{ src: '/images/orph/frame_08_delay-0.1s.gif',  delay: 100 },
		{ src: '/images/orph/frame_09_delay-0.03s.gif', delay: 30 },
		{ src: '/images/orph/frame_10_delay-0.1s.gif',  delay: 100 },
		{ src: '/images/orph/frame_11_delay-0.03s.gif', delay: 30 },
		{ src: '/images/orph/frame_12_delay-0.1s.gif',  delay: 100 },
		{ src: '/images/orph/frame_13_delay-0.04s.gif', delay: 40 },
		{ src: '/images/orph/frame_14_delay-0.03s.gif', delay: 30 },
		{ src: '/images/orph/frame_15_delay-0.1s.gif',  delay: 100 },
		{ src: '/images/orph/frame_16_delay-0.03s.gif', delay: 30 },
		{ src: '/images/orph/frame_17_delay-0.1s.gif',  delay: 100 },
		{ src: '/images/orph/frame_18_delay-0.04s.gif', delay: 40 },
		{ src: '/images/orph/frame_19_delay-0.1s.gif',  delay: 100 },
		{ src: '/images/orph/frame_20_delay-0.03s.gif', delay: 30 },
		{ src: '/images/orph/frame_21_delay-0.1s.gif',  delay: 100 },
		{ src: '/images/orph/frame_22_delay-0.03s.gif', delay: 30 },
		{ src: '/images/orph/frame_23_delay-0.04s.gif', delay: 40 },
		{ src: '/images/orph/frame_24_delay-0.1s.gif',  delay: 100 },
		{ src: '/images/orph/frame_25_delay-0.03s.gif', delay: 30 },
		{ src: '/images/orph/frame_26_delay-0.1s.gif',  delay: 100 },
		{ src: '/images/orph/frame_27_delay-0.03s.gif', delay: 30 },
		{ src: '/images/orph/frame_28_delay-0.1s.gif',  delay: 100 },
		{ src: '/images/orph/frame_29_delay-0.04s.gif', delay: 40 },
		{ src: '/images/orph/frame_30_delay-0.1s.gif',  delay: 100 },
		{ src: '/images/orph/frame_31_delay-0.03s.gif', delay: 30 },
		{ src: '/images/orph/frame_32_delay-0.03s.gif', delay: 30 },
		{ src: '/images/orph/frame_33_delay-0.1s.gif',  delay: 100 },
		{ src: '/images/orph/frame_34_delay-0.04s.gif', delay: 40 },
		{ src: '/images/orph/frame_35_delay-0.09s.gif', delay: 90 },
	];

	// Total duration of one Orpheus cycle = one card scroll = 14160ms / 6 cards
	const ORPH_CYCLE_MS = orphFrames.reduce((s, f) => s + f.delay, 0); // 2360ms
	// Cumulative start time of each frame within the cycle
	const orphCumulative = orphFrames.map((_, i) => orphFrames.slice(0, i).reduce((s, f) => s + f.delay, 0));

	function frameForCyclePos(pos) {
		for (let i = orphFrames.length - 1; i >= 0; i--) {
			if (pos >= orphCumulative[i]) return i;
		}
		return 0;
	}

	// Phase offset so orph cycle aligns visually with card edges.
	// User found frame 15 (at 1000ms into cycle) looks right when orph appears at t=500ms,
	// so phase = 1000 - 500 = 500ms.
	const ORPH_PHASE_MS = 500;

	let currentOrphFrame = 0;
	let carouselPaused = false;
	let carouselStartTime = null;
	let totalPausedMs = 0;
	let pauseStartTime = null;
	let rafId = null;

	function pauseCarousel() {
		carouselPaused = true;
		pauseStartTime = performance.now();
	}

	function resumeCarousel() {
		if (pauseStartTime !== null) {
			totalPausedMs += performance.now() - pauseStartTime;
			pauseStartTime = null;
		}
		carouselPaused = false;
	}

	onMount(() => {
		requestAnimationFrame((t) => {
			carouselStartTime = t;
			carouselReady = true;
			setTimeout(() => { orphReady = true; }, 500);
		});

		function tick(now) {
			if (carouselStartTime !== null) {
				const pausing = carouselPaused && pauseStartTime !== null;
				const pausedSoFar = totalPausedMs + (pausing ? now - pauseStartTime : 0);
				const elapsed = now - carouselStartTime - pausedSoFar;
				const cyclePos = (elapsed + ORPH_PHASE_MS) % ORPH_CYCLE_MS;
				currentOrphFrame = frameForCyclePos(cyclePos);
			}
			rafId = requestAnimationFrame(tick);
		}
		rafId = requestAnimationFrame(tick);

		return () => cancelAnimationFrame(rafId);
	});

	const shopItems = [
		{ src: '/images/shop/headphones.png', caption: 'Headphones' },
		{ src: '/images/shop/printer.png', caption: '3D Printer' },
		{ src: '/images/shop/blahaj.png', caption: 'Blahaj' },
		{ src: '/images/shop/stickers.png', caption: 'Stickers' },
		{ src: '/images/shop/framework.png', caption: 'Framework Laptop' },
		{ src: '/images/shop/polaroid.png', caption: 'Polaroid Camera' },
	];
</script>

<style>
	@font-face {
		font-family: 'OnlyTrue';
		src: url('/fonts/OnlyTrue-Neutral.ttf') format('truetype');
		font-stretch: normal;
	}

	:global(body) {
		margin: 0;
		src: url('/fonts/main.otf');
		background-color: #f5e9d8;
		background-image: linear-gradient(rgba(245,233,216,0.88), rgba(245,233,216,0.88)), url('/images/noise.jpg');
		background-blend-mode: normal, soft-light;
		color: #1a1209;
		font-family: Georgia, 'Times New Roman', serif;
		overflow-x: hidden;
	}

	.hero {
		height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-start;
		padding-top: 3vh;
		position: relative;
		
		background-size: cover;
		background-position: center;
	}

	.flag {
		position: absolute;
		top: 0;
		left: 24px;
		z-index: 10;
		transform-origin: top center;
		transition: transform 0.3s ease;
	}

	.flag img {
		width: 160px;
		display: block;
	}

	.flag:hover {
		transform: rotate(10deg);
	}

	.coming-soon {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: #ec3750;
		color: #fff;
		text-align: center;
		padding: 1.2em 2.5em;
		border-radius: 4px;
		box-shadow: 4px 4px 0 rgba(0,0,0,0.25);
		text-decoration: none;
		display: block;
		transition: transform 0.15s ease, box-shadow 0.15s ease;
		white-space: nowrap;
	}

	.coming-soon:hover {
		transform: translate(-50%, -52%);
		box-shadow: 4px 6px 0 rgba(0,0,0,0.25);
	}

	.coming-soon p:first-child {
		font-size: 2rem;
		font-weight: 900;
		margin: 0 0 0.3em 0;
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}

	.coming-soon p:last-child {
		font-size: 1.1rem;
		margin: 0;
		opacity: 0.92;
	}

	h1 {
		font-family: 'OnlyTrue', sans-serif;
		font-size: 5vw;
		line-height: 1;
		white-space: nowrap;
		color: #000;
		font-weight: 1;
		margin-bottom: 0;
	}

	h2 {
		margin-top: 0.2em;
	}

	.scroll {
		position: absolute;
		bottom: 60px;
		left: 50%;
		transform: translateX(-50%);
		width: 40px;
		height: 40px;
		animation: bounce 2s infinite;
	}

	@keyframes bounce {
		0%, 100% { transform: translateX(-50%) translateY(0); }
		50% { transform: translateX(-50%) translateY(10px); }
	}

	.content {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 4vh 2vw;
	}

	.rsvp {
		display: flex;
		align-items: center;
		gap: 0;
	}

	.hero-actions {
		position: absolute;
		bottom: 60px;
		left: 40px;
	}

	.rsvp input {
		padding: 0.7em 1.2em;
		font-size: 1.3rem;
		border: 3px solid #ec3750;
		border-right: none;
		border-radius: 8px 0 0 8px;
		outline: none;
		width: 320px;
		background: rgba(255,255,255,0.85);
	}

	.rsvp input:focus {
		box-shadow: 0 0 0 3px #ec375044;
	}

	.rsvp button {
		padding: 0.7em 1.5em;
		font-size: 1.3rem;
		font-weight: bold;
		border: 3px solid #ec3750;
		border-radius: 0 8px 8px 0;
		cursor: pointer;
		transition: background-color 0.2s, color 0.2s;
		background-color: #ec3750;
		color: #fff;
	}

	.rsvp button:disabled {
		background-color: #aaa;
		border-color: #aaa;
		color: #eee;
		cursor: not-allowed;
	}

	.section {
		padding: 7vh 6vw;
	}

	.section:nth-child(even) {
		background-color: #e8d9c4;
		background-image: linear-gradient(rgba(232,217,196,0.88), rgba(232,217,196,0.88)), url('/images/noise.jpg');
		background-blend-mode: normal, soft-light;
	}

	.section h3 {
		font-size: 2.2rem;
		font-weight: 700;
		margin: 0 0 1rem 0;
		letter-spacing: -0.02em;
	}

	.section p {
		font-size: 1.15rem;
		line-height: 1.8;
		margin: 0;
		max-width: 72ch;
		color: #3a2a1a;
	}

	.how {
		padding: 7vh 6vw;
		background-color: #e8d9c4;
		background-image: linear-gradient(rgba(232,217,196,0.88), rgba(232,217,196,0.88)), url('/images/noise.jpg');
		background-blend-mode: normal, soft-light;
	}

	.how h3 {
		font-size: 2.2rem;
		font-weight: 700;
		margin: 0 0 1rem 0;
		letter-spacing: -0.02em;
	}

	.how > p {
		font-size: 1.15rem;
		line-height: 1.8;
		margin: 0 0 2.5rem 0;
		max-width: 72ch;
		color: #3a2a1a;
	}

	.comic {
		display: flex;
		gap: 0;
		align-items: stretch;
	}

	.panel {
		flex: 1;
		display: flex;
		flex-direction: column;
		border: 3px solid #000;
		margin-right: -3px;
	}

	.panel:last-child {
		margin-right: 0;
	}

	.panel-img {
		width: 100%;
		aspect-ratio: 1 / 1;
		background: #e8ddd0;
		border-bottom: 3px solid #000;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	.panel-img img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.panel-num {
		font-size: 0.7rem;
		font-weight: bold;
		color: #ec3750;
		padding: 0.4em 0.6em 0;
	}

	.panel-caption {
		padding: 0.4em 0.6em 0.7em;
		font-size: 0.95rem;
		font-weight: bold;
		line-height: 1.3;
	}

	.rsvp-bottom {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 8vh 4vw;
		gap: 1.5rem;
		background-color: #1a1209;
		background-image: linear-gradient(rgba(26,18,9,0.88), rgba(26,18,9,0.88)), url('/images/noise.jpg');
		background-blend-mode: normal, soft-light;
	}

	.rsvp-bottom p {
		font-size: 2rem;
		font-weight: bold;
		margin: 0;
		color: #ec3750;
	}

	.rsvp-bottom .rsvp input {
		background: rgba(255,255,255,0.95);
	}

.rsvp-row {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.cal-btn {
		display: flex;
		align-items: center;
		gap: 0.5em;
		padding: 0.7em 1.3em;
		font-size: 1.1rem;
		font-weight: bold;
		background: #ec3750;
		color: #fff;
		border: 3px solid #ec3750;
		border-radius: 8px;
		cursor: pointer;
		text-decoration: none;
		white-space: nowrap;
		transition: background 0.15s, transform 0.15s;
		height: 100%;
	}

	.cal-btn:hover {
		background: #c42f42;
		border-color: #c42f42;
		transform: translateY(-1px);
	}

	.cal-btn img {
		width: 1.4em;
		height: 1.4em;
		display: block;
	}

	.section-row {
		display: flex;
		align-items: flex-start;
		gap: 2rem;
	}

	.section-row p {
		flex: 1;
	}

	footer {
		background-color: #1a1209;
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: flex-start;
		padding: 10px 0;
		margin: 0;
		box-sizing: border-box;
	}

	footer a {
		display: flex;
		align-items: center;
	}

	@keyframes peek-out {
		from { top: -200px; }
		to   { top: -80px; }
	}

	.photo-corner {
		position: absolute;
		top: -80px;
		right: -120px;
		background: none;
		border: none;
		padding: 0;
		transform: rotate(45deg);
		transform-origin: top center;
		cursor: pointer;
		z-index: 10;
		animation: peek-out 0.8s cubic-bezier(0.22, 1, 0.36, 1) 1.2s both;
	}

	.photo-corner.ready {
		transition: transform 0.25s ease;
	}

	.photo-corner.ready:hover {
		transform: rotate(45deg) scale(1.18);
	}

	.photo-frame {
		background: #fff;
		padding: 8px 8px 28px 8px;
		box-shadow: 3px 3px 10px rgba(0,0,0,0.3);
		width: 160px;
	}

	.photo-frame img {
		width: 100%;
		display: block;
	}

	.photo-frame span {
		display: block;
		text-align: center;
		font-family: 'Courier New', monospace;
		font-size: 0.75rem;
		color: #333;
		padding-top: 6px;
	}

	.photo-modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0,0,0,0.6);
		z-index: 100;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.photo-modal {
		background: #fff;
		padding: 12px 12px 24px 12px;
		box-shadow: 8px 8px 0 rgba(0,0,0,0.3);
		max-width: 520px;
		width: 90vw;
		cursor: default;
	}

	.photo-modal img {
		width: 100%;
		display: block;
	}

	.photo-modal p {
		font-family: 'Courier New', monospace;
		font-size: 0.95rem;
		color: #333;
		margin: 12px 0 0 0;
		text-align: center;
		line-height: 1.5;
	}

	footer img {
		height: 70px;
		font-size: larger;
		width: auto;
	}

	.section-split {
		display: flex;
		align-items: flex-start;
		gap: 0;
	}

	.split-left {
		flex: 1;
		padding-right: 3vw;
	}

	.split-divider {
		width: 3px;
		background: #1a1209;
		align-self: stretch;
		opacity: 0.15;
		flex-shrink: 0;
	}

	.split-right {
		flex: 1;
		padding-left: 3vw;
	}

	.shop-carousel {
		padding: 2rem 0 3rem;
		overflow: hidden;
	}

	.orph-runner {
		display: block;
		height: 140px;
		width: auto;
		margin: 0 auto -0px;
	}

	.carousel-belt {
		display: flex;
		gap: 1.5rem;
		width: max-content;
	}

	.carousel-belt.running {
		animation: scroll-left 14.16s linear infinite;
	}

	.carousel-belt.paused {
		animation-play-state: paused;
	}


	@keyframes scroll-left {
		from { transform: translateX(0); }
		to { transform: translateX(-50%); }
	}

	.carousel-card {
		background: #fff;
		box-shadow: 4px 4px 0 rgba(0,0,0,0.15);
		padding: 1rem 1rem 0.75rem;
		flex-shrink: 0;
		width: 220px;
	}

	.carousel-card img {
		width: 100%;
		height: 180px;
		object-fit: contain;
		display: block;
	}

	.carousel-card .card-caption {
		font-family: 'Courier New', monospace;
		font-size: 0.9rem;
		margin: 0.6rem 0 0;
		color: #1a1209;
		text-align: center;
	}
</style>

<div class="hero">
	<button class="photo-corner" class:ready={photoReady} on:animationend={() => photoReady = true} on:click={() => photoOpen = true} aria-label="View Scheveningen">
		<div class="photo-frame">
			<img src="/images/scheveningen-peir.png" alt="Scheveningen pier">
			<span>Scheveningen</span>
		</div>
	</button>
	<a href="https://hackclub.com" class="flag">
		<img src="https://assets.hackclub.com/flag-orpheus-top.svg" alt="Hack Club">
	</a>
	<h1>BUILD A BEEST</h1>
	<h2><u>Code a project, Fly to the Netherlands, Build a mechanical animal!</u></h2>
	<a href="https://hackclub.enterprise.slack.com/archives/C0ALJ3NT1D0" class="coming-soon">
		<p>Coming soon</p>
		<p>Watch me develop in <strong>#beest</strong> on Slack</p>
	</a>
	<div class="hero-actions rsvp-row">
		<div class="rsvp">
			<input type="email" placeholder="your@email.com" bind:value={email} />
			<button disabled={!email}>RSVP</button>
		</div>
		<a href="#" class="cal-btn" aria-label="Add to calendar">
			<img src="https://icons.hackclub.com/api/icons/0xffffff/event-star.svg" alt="">
			Add to Calendar
		</a>
	</div>
	<img src="https://icons.hackclub.com/api/icons/000000/down.svg" class="scroll" alt="scroll down icon">
</div>

{#if photoOpen}
	<div class="photo-modal-backdrop" on:click={() => photoOpen = false}>
		<div class="photo-modal" on:click|stopPropagation>
			<img src="/images/scheveningen-peir.png" alt="Scheveningen pier">
			<p>The event will be at Scheveningen, a cultural center of the Netherlands and the home of the StrandBeests</p>
		</div>
	</div>
{/if}

<div class="section">
<h3>What is this?</h3>
	<div class="section-row">
		<p>Beest is a Hack Club program. A Beest (<a href="https://www.strandbeest.com/">Strandbeest</a>) is a sail powered mechanical animal constructed of just fabric, plastic pipes, zip ties and recycled plastic bottles. I think they are the coolest thing ever, and if you agree, you can join me in building one! Everything (including flights, food and accommodation) is totally free for teenagers who qualify by building a project. From [Date] to [Date] you and [X] teens will fly to the Netherlands to build a StrandBeest, present it to the creator of strandbeests and watch him exhibit the full collection!</p>
	</div>
</div>

<section class="how">
<h3>How does this work?</h3>
	<p>First, join the Hack Club Slack and introduce yourself to a community of teenage makers from around the world. Hang out, learn from peers and make friends who share your passion for building things. Then, build and ship an open source software or hardware project - it's beginner friendly with guides I promise. Once you qualify, we'll fly you out to the Netherlands where you and your new found friends will spend [z] days constructing our own Strandbeest! We will also be there to witness the walking of the beests - Theo Jansen (the original artist behind strand-beests) will be displaying his full collection.</p>
	<div class="comic">
		<div class="panel">
			<div class="panel-img"><img src="/images/step1.png" alt="Join the Hack Club community" /></div>
			<div class="panel-num">01</div>
			<div class="panel-caption">Join the Hack Club community</div>
		</div>
		<div class="panel">
			<div class="panel-img"><img src="/images/step2.png" alt="Learn from peers and make friends" /></div>
			<div class="panel-num">02</div>
			<div class="panel-caption">Learn from peers and make friends</div>
		</div>
		<div class="panel">
			<div class="panel-img"><img src="/images/step3.png" alt="Build an open source project" /></div>
			<div class="panel-num">03</div>
			<div class="panel-caption">Build an open source project</div>
		</div>
		<div class="panel">
			<div class="panel-img"><img src="/images/step4.png" alt="Fly to the Netherlands" /></div>
			<div class="panel-num">04</div>
			<div class="panel-caption">Fly to the Netherlands</div>
		</div>
		<div class="panel">
			<div class="panel-img"><img src="/images/step5.png" alt="Build a Beest" /></div>
			<div class="panel-num">05</div>
			<div class="panel-caption">Build a Beest</div>
		</div>
	</div>
</section>

<div class="section">
<h3>Is Hack Club for real?</h3>
	<p>Yes - and we do this kind of stuff all the time! Hack Club is a non-profit organization and a community of 100k+ teenage makers. We run events online and in-person that reward people making open source projects. Thanks to our donors we are always running crazy events at no cost for teens. Previously we ran;</p>
	<img src="/images/previously.png" alt="three cards showing past hackathons" style="margin-top: 2rem; max-width: 100%;">
</div>

<div class="section section-split">
<div class="split-left">
		<h3>Am I ellegible?</h3>
		<p><b>If you are a teen, yes! </b> The only criteria is being a teenager and building a real open-source software/hardware project for Y hours. We can help you get a visa, cover the cost of your flight or hop on a call with parents! If you aren't sure, join the slack and ask - and if you can't make it, stay for the community! Hack Club is much bigger than Beest, we run events like this every few weeks 😯    </p>
	</div>
	<div class="split-divider"></div>
	<div class="split-right">
		<h3>I can't make it :/</h3>
		<p>You can still win! Alongside the event you can get prizes for logging hours. We will have a shop packed with rewards like laptops, tablets, headphones and merch. These will be delivered straight to you and require no money transfer! Everything is earned just by working on a project. You can see some of the prize selection here ⬇️</p>
	</div>
</div>

<div class="shop-carousel" on:mouseenter={pauseCarousel} on:mouseleave={resumeCarousel}>
	{#if orphReady}
		<img src={orphFrames[currentOrphFrame].src} class="orph-runner" alt="">
	{/if}
	<div class="carousel-belt" class:running={carouselReady} class:paused={carouselPaused}>
		{#each [...shopItems, ...shopItems] as item}
			<div class="carousel-card">
				<img src={item.src} alt={item.caption}>
				<p class="card-caption">{item.caption}</p>
			</div>
		{/each}
	</div>
</div>

<div class="rsvp-bottom">
	<p>Okay, I want in...</p>
	<div class="rsvp-row">
		<div class="rsvp">
			<input type="email" placeholder="your@email.com" bind:value={email} />
			<button disabled={!email}>RSVP</button>
		</div>
		<a href="#" class="cal-btn" aria-label="Add to calendar">
			<img src="https://icons.hackclub.com/api/icons/0xffffff/event-star.svg" alt="">
			Add to Calendar
		</a>
	</div>
</div>

<footer>
	<a href="https://slack.hackclub.com"><img src="https://icons.hackclub.com/api/icons/0xffffff/slack.svg" alt="slack icon"></a>
	<a href="https://github.com/hackclub"><img src="https://icons.hackclub.com/api/icons/0xffffff/github.svg" alt="github icon"></a>
	<a href="https://www.instagram.com/hackclub/"><img src="https://icons.hackclub.com/api/icons/0xffffff/instagram.svg" alt="instagram icon"></a>
	<a href="www.youtube.com/@HackClubHQ"><img src="https://icons.hackclub.com/api/icons/0xffffff/youtube.svg" alt="youtube icon"></a>
	<a href="mailto:euan+beest@hackclub.com"><img src="https://icons.hackclub.com/api/icons/0xffffff/email.svg" alt="email icon"></a>
	<a href="https://github.com/edripper"><p style="padding-left: 1rem; color: #c9b49a; margin: 0;">Made with &lt;3 by teens for teens</p></a>
	<a href="https://hackclub.com/privacy-and-terms/" style="margin-left: auto; padding-right: 1rem; color: #c9b49a; font-size: 0.85rem; text-decoration: underline; white-space: nowrap;">Privacy &amp; Terms</a>
	<a href="https://hackclub.com/safeguarding-policy" style="padding-right: 1.5rem; color: #c9b49a; font-size: 0.85rem; text-decoration: underline; white-space: nowrap;">Safeguarding Policy</a>
</footer>
    