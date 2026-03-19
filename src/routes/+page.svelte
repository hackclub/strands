<script>
	import { onMount } from 'svelte';

	let email = '';
	let rsvpStatus = '';
	let rsvpSubmitting = false;

	async function handleRsvp() {
		const trimmed = email.trim().toLowerCase();
		if (!trimmed) {
			rsvpStatus = 'invalid';
			return;
		}
		const emailRe = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
		if (trimmed.length > 254 || !emailRe.test(trimmed)) {
			rsvpStatus = 'invalid';
			return;
		}
		rsvpSubmitting = true;
		rsvpStatus = '';
		try {
			const res = await fetch('/api/rsvp', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: trimmed })
			});
			const data = await res.json();
			if (res.ok) {
				rsvpStatus = 'success';
				email = '';
			} else if (data.error === 'duplicate') {
				rsvpStatus = 'duplicate';
			} else if (res.status === 400) {
				rsvpStatus = 'invalid';
			} else {
				rsvpStatus = 'error';
			}
		} catch {
			rsvpStatus = 'error';
		} finally {
			rsvpSubmitting = false;
		}
	}

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

	// Target frame index that should play in the gap between cards
	const ORPH_GAP_FRAME = 30;

	let orphPhaseMs = 0;
	let jumpIntensity = 0;
	let currentOrphFrame = 0;
	let carouselPaused = false;
	let visibleCount = 0;
	let howEl;
	let comicEl;
	let shopCarouselEl;
	let carouselStartTime = null;
	let totalPausedMs = 0;
	let pauseStartTime = null;
	let rafId = null;

	// function pauseCarousel() {
	// 	carouselPaused = true;
	// 	pauseStartTime = performance.now();
	// }

	// function resumeCarousel() {
	// 	if (pauseStartTime !== null) {
	// 		totalPausedMs += performance.now() - pauseStartTime;
	// 		pauseStartTime = null;
	// 	}
	// 	carouselPaused = false;
	// }


	function calcOrphPhase() {
		if (!shopCarouselEl) return;
		const belt = shopCarouselEl.querySelector('.carousel-belt');
		if (!belt) return;
		const cards = belt.querySelectorAll('.carousel-card');
		if (cards.length < 1) return;
		// use local co-oords bc skewed axis
		const cardWidth = cards[0].offsetWidth;
		const gap = parseFloat(getComputedStyle(belt).gap) || 0;
		const cellWidth = cardWidth + gap;
		const gapCenter = cardWidth + gap / 2; 

		
		const orphX = shopCarouselEl.clientWidth / 2;


		const posInCell = ((orphX % cellWidth) + cellWidth) % cellWidth;
		const distToGap = ((gapCenter - posInCell) + cellWidth) % cellWidth;
		const timeToFirstGap = distToGap * ORPH_CYCLE_MS / cellWidth;
		const frameMid = orphCumulative[ORPH_GAP_FRAME] + orphFrames[ORPH_GAP_FRAME].delay / 2;
		orphPhaseMs = timeToFirstGap - frameMid;
	}

	onMount(() => {
		requestAnimationFrame(() => {
			carouselReady = true;

			requestAnimationFrame((t) => {
				carouselStartTime = t;
				calcOrphPhase();
			});
			setTimeout(() => { orphReady = true; }, 500);
		});

		function tick(now) {
			if (carouselStartTime !== null) {
				const pausing = carouselPaused && pauseStartTime !== null;
				const pausedSoFar = totalPausedMs + (pausing ? now - pauseStartTime : 0);
				const elapsed = now - carouselStartTime - pausedSoFar;
				const cyclePos = ((elapsed + orphPhaseMs) % ORPH_CYCLE_MS + ORPH_CYCLE_MS) % ORPH_CYCLE_MS;
				currentOrphFrame = frameForCyclePos(cyclePos);

				// Jump starts at frame 0 and ramps up then down over JUMP_DURATION
				const jumpStart = orphCumulative[0];
				const JUMP_DURATION = 800;
				let into = cyclePos - jumpStart;
				if (into < -ORPH_CYCLE_MS / 2) into += ORPH_CYCLE_MS;
				if (into > ORPH_CYCLE_MS / 2) into -= ORPH_CYCLE_MS;
				jumpIntensity = (into >= 0 && into < JUMP_DURATION)
					? Math.sin(Math.PI * into / JUMP_DURATION)
					: 0;
			}
			rafId = requestAnimationFrame(tick);
		}
		rafId = requestAnimationFrame(tick);

		function onResize() { calcOrphPhase(); }
		window.addEventListener('resize', onResize);

		function onScroll() {
			if (!comicEl) return;
			const rect = comicEl.getBoundingClientRect();
			const progress = (window.innerHeight - rect.top) / (rect.height + window.innerHeight * 0.4);
			const newCount = Math.min(5, Math.max(0, Math.floor(progress * 6)));
			visibleCount = Math.max(visibleCount, newCount);
		}
		window.addEventListener('scroll', onScroll, { passive: true });
		onScroll();

		return () => { cancelAnimationFrame(rafId); window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onResize); };
	});

	const steps = [
		{ img: '/images/step1.webp', alt: 'Join the Hack Club community',    caption: 'Join the Hack Club community' },
		{ img: '/images/step2.webp', alt: 'Learn from peers and make friends', caption: 'Learn from peers and make friends' },
		{ img: '/images/step3.webp', alt: 'Build an open source project',     caption: 'Build an open source project' },
		{ img: '/images/step4.webp', alt: 'Fly to the Netherlands',           caption: 'Fly to the Netherlands' },
		{ img: '/images/step5.webp', alt: 'Build a Beest',                    caption: 'Build a Beest' },
	];

	// Fossills
	
	const fossils = [
		{ src: '/images/fossil1.webp', top:  '7%',  left: '92%', rot:   25, size: 60 },
		{ src: '/images/fossil2.webp', top:  '8%',  left: '88%', rot:   15, size: 70 },
		{ src: '/images/fossil1.webp', top:  '9%',  left:  '2%', rot:  -40, size: 65 },
		{ src: '/images/fossil2.webp', top: '11%',  left: '78%', rot:   70, size: 55 },
		{ src: '/images/fossil1.webp', top: '13%',  left: '15%', rot:  -15, size: 50 },
		{ src: '/images/fossil2.webp', top: '14%',  left:  '3%', rot:  -55, size: 55 },
		{ src: '/images/fossil1.webp', top: '22%',  left: '60%', rot:  120, size: 60 },
		{ src: '/images/fossil2.webp', top: '31%',  left: '80%', rot:   80, size: 90 },
		{ src: '/images/fossil1.webp', top: '40%',  left: '18%', rot:  -20, size: 75 },
		{ src: '/images/fossil2.webp', top: '45%',  left:  '6%', rot:  -32, size: 65 },
		{ src: '/images/fossil1.webp', top: '52%',  left: '75%', rot:   60, size: 55 },
		{ src: '/images/fossil2.webp', top: '55%',  left: '91%', rot:   44, size: 75 },
		{ src: '/images/fossil1.webp', top: '63%',  left: '35%', rot:  -70, size: 65 },
		{ src: '/images/fossil2.webp', top: '83%',  left: '20%', rot:   35, size: 80 },
		{ src: '/images/fossil1.webp', top: '85%',  left:  '2%', rot:  -12, size: 85 },
		{ src: '/images/fossil2.webp', top: '80%',  left: '72%', rot:   79, size: 70 },
		//{ src: '/images/fossil1.webp', top: '87%',  left: '48%', rot:  -90, size: 60 },
		{ src: '/images/fossil2.webp', top: '90%',  left: '50%', rot:  -40, size: 60 },
		{ src: '/images/fossil1.webp', top: '95%',  left: '82%', rot:  280, size: 72 },
	];

	const shopItems = [
		{ src: '/images/shop/headphones.webp', caption: 'Headphones' },
		{ src: '/images/shop/printer.webp', caption: '3D Printer' },
		{ src: '/images/shop/blahaj.webp', caption: 'Blahaj' },
		{ src: '/images/shop/stickers.webp', caption: 'Stickers' },
		{ src: '/images/shop/framework.webp', caption: 'Framework Laptop' },
		{ src: '/images/shop/polaroid.webp', caption: 'Polaroid Camera' },
		{ src: '/images/shop/flight-stipend.webp', caption: 'flight stipend' },
		
	];
</script>

<svelte:head>
	<title>Beest</title>
	<link rel="preload" as="image" type="image/webp" href="/images/hero-opt.webp" fetchpriority="high">
	<link rel="preload" as="font" type="font/woff2" href="/fonts/OrelegaOne-Regular.woff2" crossorigin>
	<link rel="preload" as="font" type="font/woff2" href="/fonts/OnlyTrue-Neutral.woff2" crossorigin>
</svelte:head>

<style>
	@font-face {
		font-family: 'OrelegaOne';
		src: url('/fonts/OrelegaOne-Regular.woff2') format('woff2'),
		     url('/fonts/OrelegaOne-Regular.ttf') format('truetype');
		font-weight: normal;
		font-style: normal;
		font-display: swap;
	}

	@font-face {
		font-family: 'OnlyTrue';
		src: url('/fonts/OnlyTrue-Neutral.woff2') format('woff2'),
		     url('/fonts/OnlyTrue-Neutral.ttf') format('truetype');
		font-stretch: normal;
		font-display: swap;
	}

	@font-face {
		font-family: 'OnlyTrueBigBlob';
		src: url('/fonts/OnlyTrue-BigBlob.woff2') format('woff2'),
		     url('/fonts/OnlyTrue-BigBlob.ttf') format('truetype');
		font-stretch: normal;
		font-display: swap;
	}

	@font-face {
		font-family: 'OnlyTrueSmall';
		src: url('/fonts/OnlyTrue-Small.woff2') format('woff2'),
		     url('/fonts/OnlyTrue-Small.ttf') format('truetype');
		font-stretch: normal;
		font-display: swap;
	}

	:global(:root) {
		--noise: url('/images/noise.webp');
	}

	:global(body) {
		margin: 0;
		src: url('/fonts/main.otf');
		background-color: #ffffff;
		background-image: linear-gradient(rgba(245,233,216,0.88), rgba(245,233,216,0.88)), var(--noise);
		background-blend-mode: normal, soft-light;
		color: #3d2a18;
		font-family: 'OrelegaOne', Georgia, serif;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
		overflow-x: hidden;
	}

	:global(a) {
		color: #000;
		text-decoration: underline;
	}

	.hero {
		height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		justify-content: flex-start;
		padding: 1vh 6vw 3vh 6vw;
		position: relative;
		z-index: 8;
		background-color: #919ca8;
		background-image: url('/images/hero-opt.webp');
		background-size: cover;
		background-position: center;
	}

	.hero-img-mobile {
		display: none;
	}

	.hero-content-mobile {
		display: contents;
	}

	.flag {
		position: absolute;
		top: 0;
		left: 24px;
		z-index: 50;
		transform-origin: top center;
		transition: transform 0.3s ease;
	}

	.flag img {
		width: min(260px, 12vh);
		display: block;
	}

	.flag:hover {
		transform: rotate(10deg);
	}

	.coming-soon {
		color: #000;
		text-decoration: none;
		margin-top: 1rem;
		margin-left: -4.5vw;
		display: block;
	}

	.coming-soon p {
		margin: 0;
		font-size: 1.1rem;
		line-height: 1.5;
	}

	.coming-soon p:first-child {
		font-size: 1.4rem;
		font-weight: 700;
	}

	h1 {
		font-family: 'OnlyTrue', sans-serif;
		font-size: 4.2vw;
		line-height: 1;
		white-space: nowrap;
		color: #000;
		font-weight: 1;
		margin-top: 15vh;
		margin-bottom: 0;
		margin-left: -4.8vw;
	}

	h2 {
		margin-top: 0.1em;
		margin-left: -4.5vw;
	}

	.scroll {
		position: absolute;
		bottom: 60px;
		left: 50%;
		transform: translateX(-50%);
		width: 40px;
		height: 40px;
		font-size: 2rem;
		color: #000;
		text-align: center;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
		animation: bounce 2s infinite, scroll-enlarge 0.5s ease 5s forwards;
	}

	@keyframes bounce {
		0%, 100% { transform: translateX(-50%) translateY(0); }
		50% { transform: translateX(-50%) translateY(10px); }
	}

	@keyframes scroll-enlarge {
		to { width: 52px; height: 52px; }
	}

	.content {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 4vh 2vw;
	}


	.section {
		padding: calc(7vh + 30px) 6vw;
		position: relative;
	}

	#s-what {
		background-color: #e0ba8d;
		background-image: linear-gradient(rgba(230,196,155,0.65), rgba(230,196,155,0.65)), var(--noise);
		background-blend-mode: normal, soft-light;
		--brush-color: #e8c9a0;

	}

	#s-real {
		background-color: #c8a878;
		background-image: linear-gradient(rgba(200,168,120,0.65), rgba(200,168,120,0.65)), var(--noise);
		background-blend-mode: normal, soft-light;
		--brush-color: #d4b88c;

	}

	#s-eligible {
		background-color: #b49066;
		background-image: linear-gradient(rgba(155, 112, 64, 0.88), rgba(154,112,64,0.88)), var(--noise);
		background-blend-mode: normal, soft-light;
		--brush-color: #b89060;

	}

	.section h3 {
		font-size: 2.2rem;
		font-weight: 700;
		margin: 0 0 1rem 0;
		letter-spacing: 0.02em;
		font-family: 'OnlyTrue', sans-serif;
		text-transform: uppercase;
	}

	#s-eligible h3,
	.carousel-section h3 {
		font-weight: 900;
		color: #1a0a00;
	}

	.section p,
	.how > p {
		position: relative;
		z-index: 8;
	}

	.section h3,
	.how h3 {
		position: relative;
		z-index: 9;
		width: fit-content;
	}

	.section p::before,
	.how > p::before,
	.section h3::before,
	.how h3::before {
		content: '';
		position: absolute;
		top: -25px;
		bottom: -25px;
		left: -60px;
		right: -60px;
		z-index: -1;
		background: var(--brush-color);
		filter: url(#brush);
		border-radius: 40px / 50%;
	}

	.section h3::before,
	.how h3::before {
		left: -30px;
		right: -30px;
		top: -15px;
		bottom: -15px;
	}

	.split-left p::before,
	.split-right p::before {
		left: -35px;
		right: -20px;
	}

	.split-left h3,
	.split-right h3 {
		margin-left: 1.2rem;
	}

	.section > img {
		position: relative;
		z-index: 8;
	}

	.section p {
		font-size: 1.15rem;
		line-height: 1.8;
		margin: 0;
		max-width: 100%;
		color: #3a2a1a;
	}

	.how {
		padding: calc(7vh + 30px) 6vw 0.5rem;
		position: relative;
		background-color: #ede0b8;
		background-image: linear-gradient(rgba(237,224,184,0.65), rgba(237,224,184,0.65)), var(--noise);
		background-blend-mode: normal, soft-light;
		--brush-color: #ede4c8;

	}

	.how h3 {
		font-size: 2.2rem;
		font-weight: 700;
		margin: 0 0 1rem 0;
		letter-spacing: 0.02em;
		font-family: 'OnlyTrue', sans-serif;
		text-transform: uppercase;
	}

	.how > p:not(.card-caption) {
		font-size: 1.15rem;
		line-height: 1.8;
		margin: 0 0 2.5rem 0;
		max-width: 100%;
		color: #3a2a1a;
	}

	@keyframes panel-pop {
		from { opacity: 0; transform: scale(0.7) rotate(var(--rot)); }
		to   { opacity: 1; transform: scale(1)   rotate(var(--rot)); }
	}

	.comic {
		position: relative;
		z-index: 8;
		height: 580px;
		margin: 2rem 0 0rem;
	}

	.panel {
		position: absolute;
		display: flex;
		flex-direction: column;
		border: 3px solid #000;
		box-shadow: 5px 5px 14px rgba(0,0,0,0.22);
		background: #fff;
		width: 320px;
		opacity: 0;
	}

	.panel:nth-child(1) { left: 0%;   top: 70px;  --rot: -4deg; transform: rotate(-4deg); z-index: 1; }
	.panel:nth-child(2) { left: 17%;  top: 110px; --rot: 6deg;  transform: rotate(6deg);  z-index: 3; }
	.panel:nth-child(3) { left: 37%;  top: 42px;  --rot: -5deg; transform: rotate(-5deg); z-index: 1; }
	.panel:nth-child(4) { left: 58%;  top: 100px; --rot: 4deg;  transform: rotate(4deg);  z-index: 0; }
	.panel:nth-child(5) { left: 78%;  top: 60px;  --rot: -3deg; transform: rotate(-3deg); z-index: 3; }

	.mobile-only { display: none; }

	.panel.visible { animation: panel-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) both; }

	.panel-img {
		width: 100%;
		aspect-ratio: 1 / 1;
		background: #e8ddd0;
		border-bottom: 3px solid #000;
		overflow: hidden;
		position: relative;
	}

	.panel-img img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.panel-num {
		position: absolute;
		top: 6px;
		left: 8px;
		font-family: 'OnlyTrueSmall', sans-serif;
		font-weight: 1;
		font-size: 3.5rem;
		color: #ec3750;
		line-height: 1;
	}

	.panel-caption {
		padding: 0.4em 0.6em 0.7em;
		font-size: 0.95rem;
		font-weight: bold;
		line-height: 1.3;
	}

	.footer-jagged {
		position: relative;
		width: 100%;
		height: 82px;
		margin-top: -80px;
		margin-bottom: -2px;
		z-index: 15;
		background-color: #1a1209;
		clip-path: polygon(
			0% 40%, 6% 5%, 14% 48%, 22% 10%, 31% 52%, 40% 8%, 49% 44%, 58% 2%, 67% 40%, 76% 12%, 84% 50%, 92% 6%, 100% 38%,
			100% 100%, 0% 100%
		);
	}

	.section-row {
		display: flex;
		align-items: flex-start;
		gap: 2rem;
		position: relative;
		z-index: 8;
	}

	.section-row p {
		flex: 1;
	}

	.video-embed {
		position: relative;
		z-index: 8;
		width: 100%;
		max-width: 960px;
		margin: 4rem auto 0;
		aspect-ratio: 16 / 9;
		border-radius: 6px;
		overflow: hidden;
		box-shadow: 5px 5px 14px rgba(0,0,0,0.22);
	}

	.video-embed iframe {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		border: none;
	}

	footer {
		background-color: #1a1209;
		background-image: none;
		isolation: isolate;
		position: relative;
		z-index: 15;
		width: 100%;
		display: flex;
		align-items: flex-end;
		justify-content: flex-start;
		padding: 3rem 0 2rem;
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
		z-index: 50;
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
		height: 55px;
		width: auto;
		margin-bottom: -10px;
	}

	.section-split {
		display: flex;
		align-items: flex-start;
		gap: 0;
	}

	.split-left {
		flex: 1;
		padding-right: 3vw;
		position: relative;
		z-index: 8;
	}

	.split-divider {
		width: 40px;
		align-self: stretch;
		flex-shrink: 0;
		background: url('/images/vertical-pipe.webp') center / 100% 100% no-repeat;
		opacity: 0.6;
		position: relative;
		z-index: 8;
	}

	.split-right {
		flex: 1;
		padding-left: 3vw;
		position: relative;
		z-index: 8;
	}

	.teeth-line {
		position: absolute;
		top: -110px;
		left: 0;
		width: 100%;
		height: 200px;
		pointer-events: none;
		z-index: 11;
		color: fff;
	}

	#s-what::before {
		content: '';
		position: absolute;
		top: -110px;
		left: 0;
		width: 100%;
		height: 200px;
		pointer-events: none;
		z-index: 10;
		background-color: #e0ba8d;
		background-image: linear-gradient(rgba(224,186,141,0.65), rgba(212, 159, 93, 0.65)), var(--noise);
		background-size: auto, auto;
		background-blend-mode: normal, soft-light;
		clip-path: url(#sand-top);
	}

	#s-what::after,
	.how::after,
	#s-real::after,
	#s-eligible::after {
		content: '';
		position: absolute;
		bottom: -40px;
		left: 0;
		width: 100%;
		height: 80px;
		pointer-events: none;
		z-index: 12;
		background-size: auto, auto;
		background-blend-mode: normal, soft-light;
	}

	#s-what::after {
		background-color: #e0ba8d;
		background-image: linear-gradient(to bottom, #e0ba8d, #ede0b8), var(--noise);
		clip-path: polygon(
			0% 30%, 6% 5%, 14% 45%, 22% 8%, 31% 50%, 40% 12%, 49% 42%, 58% 0%, 67% 38%, 76% 10%, 84% 48%, 92% 6%, 100% 35%,
			100% 72%,
			92% 95%, 83% 65%, 74% 100%, 65% 68%, 56% 95%, 46% 60%, 37% 100%, 28% 72%, 19% 96%, 10% 62%, 4% 90%, 0% 68%
		);
	}
	.how::after {
		background-color: #ede0b8;
		background-image: linear-gradient(to bottom, #ede0b8, #c8a878), var(--noise);
		clip-path: polygon(
			0% 15%, 7% 48%, 16% 4%, 25% 40%, 34% 0%, 43% 44%, 52% 8%, 61% 50%, 70% 5%, 79% 42%, 88% 10%, 95% 38%, 100% 18%,
			100% 78%,
			94% 55%, 86% 92%, 76% 60%, 67% 98%, 58% 65%, 48% 92%, 38% 55%, 28% 90%, 18% 62%, 9% 96%, 3% 70%, 0% 82%
		);
	}
	#s-real::after {
		background-color: #c8a878;
		background-image: linear-gradient(to bottom, #c8a878, #9a7040), var(--noise);
		clip-path: polygon(
			0% 40%, 5% 8%, 13% 52%, 21% 15%, 30% 48%, 39% 5%, 48% 45%, 57% 12%, 66% 50%, 75% 8%, 83% 42%, 91% 0%, 100% 30%,
			100% 68%,
			91% 100%, 82% 65%, 73% 95%, 63% 60%, 54% 98%, 44% 68%, 35% 100%, 26% 65%, 17% 95%, 8% 62%, 2% 90%, 0% 72%
		);
	}
	#s-eligible::after {
		background-color: #9a7040;
		background-image: linear-gradient(to bottom, #9a7040, #c0a06a), var(--noise);
		clip-path: polygon(
			0% 22%, 8% 50%, 17% 10%, 26% 44%, 35% 2%, 44% 40%, 53% 15%, 62% 48%, 71% 6%, 80% 45%, 89% 12%, 96% 40%, 100% 20%,
			100% 75%,
			95% 55%, 87% 92%, 77% 58%, 68% 96%, 59% 62%, 49% 94%, 40% 60%, 30% 96%, 21% 62%, 12% 92%, 5% 65%, 0% 80%
		);
	}

	.carousel-section {
		position: relative;
		background-color: #c0a06a;
		background-image: linear-gradient(rgba(192,160,106,0.88), rgba(192,160,106,0.88)), var(--noise);
		background-blend-mode: normal, soft-light;
		padding-bottom: calc(4rem + 80px);
		overflow: hidden;
		--brush-color: #cdb07a;
	}

	.shop-carousel {
		padding: 4rem 0 5rem;
		overflow: hidden;
		transform: rotate(-10deg);
		margin: -2rem -15vw 0;
		width: calc(100% + 30vw);
		position: relative;
		z-index: 8;
	}

	.earn-prizes-title {
		text-align: center;
		font-family: 'OnlyTrue', sans-serif;
		font-weight: normal;
		font-size: 5vw;
		text-transform: uppercase;
		margin: 0 auto;
		padding: 0;
		transform: translateY(13rem);
		color: #1a1209;
		position: relative;
		z-index: 8;
		width: fit-content;
	}

	.earn-prizes-title::before {
		content: '';
		position: absolute;
		top: -15px;
		bottom: -15px;
		left: -30px;
		right: -30px;
		z-index: -1;
		background: var(--brush-color);
		filter: url(#brush);
		border-radius: 40px / 50%;
	}

	.orph-runner {
		display: block;
		height: 140px;
		width: auto;
		margin: 0 auto -0px;
		position: relative;
		z-index: 20;
		transform-origin: bottom center;
	}

	.orph-frame {
		height: 140px;
		width: auto;
	}

	.carousel-belt {
		display: flex;
		gap: 1.5rem;
		width: max-content;
	}

	.carousel-belt.running {
		animation: scroll-left 16.52s linear infinite;
	}

	.carousel-belt.paused {
		animation-play-state: paused;
	}


	@keyframes scroll-left {
		from { transform: translateX(0); }
		to { transform: translateX(-50%); }
	}

	@keyframes scroll-right {
		from { transform: translateX(-50%); }
		to { transform: translateX(0); }
	}

	.shop-carousel-bg {
		padding: 3rem 0 4rem;
		overflow: hidden;
		position: relative;
		top: 28rem;
		transform: rotate(10deg);
		margin: -2rem -20vw 0;
		width: calc(100% + 30vw);
		opacity: 0.5;
	}

	.carousel-belt-bg {
		display: flex;
		gap: 1.5rem;
		width: max-content;
	}

	.carousel-belt-bg.running {
		animation: scroll-right-bg 21s linear infinite;
	}

	@keyframes scroll-right-bg {
		from { transform: translateX(-1288px); } /* exactly 7 × (160px + 24px gap) */
		to   { transform: translateX(0); }
	}

	.carousel-card {
		background: #fff;
		box-shadow: 4px 4px 0 rgba(0,0,0,0.15);
		padding: 1rem 1rem 0.75rem;
		flex-shrink: 0;
		width: 220px;
	}

	.carousel-belt-bg .carousel-card {
		box-shadow: 3px 3px 0 rgba(0,0,0,0.15);
		padding: 0.6rem 0.6rem 0.5rem;
		width: 160px;
	}

	.carousel-belt-bg .carousel-card img {
		height: 131px;
	}

	.carousel-card img {
		width: 100%;
		height: 180px;
		object-fit: contain;
		display: block;
	}

	.page-root {
		position: relative;
		overflow-x: clip;
	}

	.fossils {
		position: absolute;
		inset: 0;
		pointer-events: none;
		overflow: hidden;
		z-index: 5;
	}

	.fossil {
		position: absolute;
		opacity: 0.4;
		pointer-events: auto;
	}

	.carousel-card .card-caption {
		font-family: 'Courier New', monospace;
		font-size: 0.9rem;
		margin: 0.6rem 0 0;
		color: #1a1209;
		text-align: center;
	}

	.rsvp-form {
		position: absolute;
		bottom: 16vh;
		left: 1.2vw;
		z-index: 50;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		background: rgba(0, 0, 0, 0.9);
		padding: 1.2rem 1.5rem;
		border-radius: 8px;
	}

	.rsvp-label {
		font-family: 'OnlyTrue', sans-serif;
		font-size: 2.8rem;
		color: #fff;
		font-weight: 1;
		letter-spacing: 0.04em;
	}

	.rsvp-row {
		display: flex;
		gap: 0;
	}

	.rsvp-input {
		font-family: 'OrelegaOne', Georgia, serif;
		font-size: 1.2rem;
		padding: 0.7rem 1rem;
		border: 2px solid #000;
		border-right: none;
		border-radius: 4px 0 0 4px;
		background: #fff;
		color: #1a0a00;
		outline: none;
		width: 300px;
	}

	.rsvp-input:focus {
		background: #fff;
		border-color: #ec3750;
	}

	.rsvp-input::placeholder {
		color: #9a8a7a;
	}

	.rsvp-btn {
		font-family: 'OnlyTrue', sans-serif;
		font-size: 1.2rem;
		padding: 0.7rem 1.4rem;
		border: 2px solid #000;
		border-radius: 0 4px 4px 0;
		background: #ec3750;
		color: #000;
		cursor: pointer;
		letter-spacing: 0.04em;
		transition: background 0.15s;
	}

	.rsvp-btn:hover:not(:disabled) {
		background: #d42e45;
	}

	.rsvp-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.rsvp-msg {
		margin: 0.2rem 0 0;
		font-size: 0.9rem;
		font-family: 'OrelegaOne', Georgia, serif;
	}

	.rsvp-ok {
		color: #6fdf6f;
	}

	.rsvp-err {
		color: #ff6b7a;
	}

	.rsvp-bottom-section {
		background-color: #c0a06a;
		background-image: linear-gradient(rgba(192,160,106,0.88), rgba(192,160,106,0.88)), var(--noise);
		background-blend-mode: normal, soft-light;
		display: flex;
		justify-content: center;
		padding: 3rem 2rem calc(4rem + 80px);
		position: relative;
		z-index: 15;
	}

	.rsvp-form-bottom {
		position: relative;
		bottom: auto;
		left: auto;
		z-index: 20;
		background: rgba(0, 0, 0, 0.9);
		padding: 1.2rem 1.5rem;
		border-radius: 8px;
	}

	@media (max-width: 768px) {
		/* --- Hero --- */
		.hero {
			height: auto;
			padding: 0 0 3rem 0;
			justify-content: flex-start;
			background: #e6cead;
			background-image: none;
		}

		.hero-img-mobile {
			display: block;
			width: 100%;
			height: auto;
		}

		.hero-content-mobile {
			padding: 1rem 7vw 4rem;
			background-color: #c8b48a;
		}

		h1 {
			font-size: 12vw;
			white-space: normal;
			line-height: 0.95;
			margin: 0 0 0.4rem 0;
			padding: 0 5vw;
		}

		h2 {
			font-size: 1rem;
			line-height: 1.3;
			margin: 0;
			padding: 0 5vw;
		}

		.hero h2 {
			max-width: 90%;
		}

		.flag {
			display: none;
		}

		.coming-soon {
			margin: 0.5rem 0 0 0;
		}

		.coming-soon br {
			display: none;
		}

		.coming-soon p:first-child { font-size: 1rem; }
		.coming-soon p:last-child  { font-size: 0.8rem; }

		.photo-corner {
			display: none;
		}

		.scroll {
			display: none;
		}

		.rsvp-form {
			position: relative;
			bottom: auto;
			left: auto;
			padding: 0 5vw;
			margin-top: 1.2rem;
		}

		.rsvp-input {
			width: 100%;
			flex: 1;
		}

		/* --- Remove noise grain on mobile --- */
		:global(body) {
			background-image: linear-gradient(rgba(245,233,216,0.88), rgba(245,233,216,0.88));
		}

		#s-what,
		#s-real,
		#s-eligible,
		.how,
		.carousel-section,
		.rsvp-bottom-section {
			background-image: none;
		}

		/* --- Sand transition --- */
		#s-what {
			padding-top: 2.5rem;
		}

		#s-what::before {
			top: -25px;
			height: 50px;
			clip-path: url(#sand-top-mobile);
		}

		#s-what::before {
			background-image: linear-gradient(rgba(224,186,141,0.65), rgba(212,159,93,0.65));
		}

		#s-what::after {
			height: 40px;
			bottom: -20px;
			background-image: linear-gradient(to bottom, #e0ba8d, #ede0b8);
		}
		.how::after {
			height: 40px;
			bottom: -20px;
			background-image: linear-gradient(to bottom, #ede0b8, #c8a878);
		}
		#s-real::after {
			height: 40px;
			bottom: -20px;
			background-image: linear-gradient(to bottom, #c8a878, #9a7040);
		}
		#s-eligible::after {
			height: 40px;
			bottom: -20px;
			background-image: linear-gradient(to bottom, #9a7040, #c0a06a);
		}

		.teeth-line {
			display: none;
		}

		/* --- Sections --- */
		.section {
			padding: 2rem 7vw;
		}

		.section h3,
		.how h3 {
			font-size: 1.3rem;
			margin-left: 0 !important;
		}

		.section p,
		.how > p {
			font-size: 0.9rem;
			line-height: 1.35;
			padding: 0 2vw;
		}

		.section p::before,
		.how > p::before {
			left: -15px;
			right: -15px;
		}

		.how {
			padding: 2rem 7vw 1rem;
		}

		/* --- Video --- */
		.video-embed {
			margin-top: 1.5rem;
		}

		.video-embed iframe {
			/* Use nocookie domain for mobile compat */
		}

		/* --- Comic panels --- */
		.comic {
			height: auto;
			display: grid;
			grid-template-columns: 1fr 1fr 1fr;
			gap: 0.5rem;
			margin: 1rem 0 0;
		}

		.panel {
			position: relative;
			left: auto !important;
			top: auto !important;
			width: 100%;
			transform: none !important;
			opacity: 1 !important;
			animation: none !important;
			border-width: 2px;
		}

		.mobile-only {
			display: block;
		}

		.panel-num {
			font-size: 1.5rem;
			top: 3px;
			left: 5px;
		}

		.panel-caption {
			font-size: 0.6rem;
			padding: 0.3rem 0.4rem;
		}

		.panel-img {
			border-bottom-width: 2px;
		}

		/* --- Split sections --- */
		.section-row,
		.section-split {
			flex-direction: column;
			gap: 1rem;
		}

		.split-divider {
			display: none;
		}

		/* --- Carousel --- */
		.carousel-section {
			padding-bottom: calc(2rem + 80px);
		}

		.earn-prizes-title {
			font-size: 8vw;
			transform: translateY(5rem);
		}

		.shop-carousel-bg {
			top: 14rem;
		}

		.orph-runner {
			height: 90px;
		}

		.orph-frame {
			height: 90px;
		}

		.carousel-card {
			width: 140px;
			padding: 0.6rem 0.6rem 0.5rem;
		}

		.carousel-card img {
			height: 115px;
		}

		.carousel-card .card-caption {
			font-size: 0.75rem;
			margin: 0.4rem 0 0;
		}

		/* --- Footer --- */
		footer {
			flex-wrap: wrap;
			gap: 0.5rem;
			padding: 2rem 1rem 3rem;
		}

		footer img {
			height: 35px;
		}

		footer p {
			font-size: 0.75rem !important;
		}

		.fossils {
			display: none;
		}
	}
</style>

<svg width="0" height="0" style="position:absolute">
	<filter id="brush">
		<feTurbulence type="turbulence" baseFrequency="0.003 0.06" numOctaves="3" seed="5" result="warp"/>
		<feDisplacementMap in="SourceGraphic" in2="warp" scale="25" xChannelSelector="R" yChannelSelector="G"/>
	</filter>
	<clipPath id="sand-top" clipPathUnits="objectBoundingBox">
		<path d="
			M 0,0.28
			C 0.03,0.24 0.05,0.06 0.09,0.08
			C 0.13,0.10 0.14,0.30 0.19,0.32
			C 0.23,0.34 0.26,0.12 0.31,0.10
			C 0.35,0.08 0.38,0.40 0.44,0.38
			C 0.49,0.36 0.52,0.03 0.56,0.05
			C 0.60,0.07 0.61,0.28 0.66,0.34
			C 0.71,0.40 0.74,0.14 0.79,0.11
			C 0.83,0.09 0.86,0.32 0.91,0.30
			C 0.95,0.28 0.97,0.18 1.0,0.22
			L 1,0.76
			C 0.97,0.70 0.95,0.58 0.91,0.60
			C 0.86,0.63 0.84,0.90 0.79,0.88
			C 0.74,0.86 0.72,0.56 0.66,0.58
			C 0.61,0.60 0.59,0.94 0.53,0.96
			C 0.48,0.98 0.45,0.62 0.39,0.64
			C 0.34,0.66 0.31,0.88 0.25,0.92
			C 0.20,0.95 0.16,0.66 0.11,0.70
			C 0.07,0.73 0.04,0.90 0,0.74
			Z
		"/>
	</clipPath>
	<clipPath id="sand-top-mobile" clipPathUnits="objectBoundingBox">
		<path d="
			M 0,0.45
			C 0.15,0.40 0.30,0.05 0.50,0.05
			C 0.70,0.05 0.85,0.40 1.0,0.45
			L 1,0.80
			C 0.85,0.85 0.70,0.98 0.50,0.98
			C 0.30,0.98 0.15,0.85 0,0.80
			Z
		"/>
	</clipPath>
</svg>

<div class="page-root">

<div class="fossils">
	{#each fossils as f}
		<img
			class="fossil"
			src={f.src}
			alt="strandbeest fossil"
			title="strandbeest fossil"
			loading="lazy"
			decoding="async"
			style="top:{f.top}; left:{f.left}; width:{f.size}px; transform:rotate({f.rot}deg);"
		/>
	{/each}
</div>

<div class="hero">
	<img class="hero-img-mobile" src="/images/hero-opt.webp" alt="Strandbeest on the beach" />
	<button class="photo-corner" class:ready={photoReady} on:animationend={() => photoReady = true} on:click={() => photoOpen = true} aria-label="View Scheveningen">
		<div class="photo-frame">
			<img src="/images/scheveningen-peir.webp" alt="Scheveningen pier" loading="lazy" decoding="async">
			<span>Scheveningen</span>
		</div>
	</button>
	<a href="https://hackclub.com" class="flag">
		<img src="https://assets.hackclub.com/flag-orpheus-top.svg" alt="Hack Club">
	</a>
	<div class="hero-content-mobile">
		<h1>BUILD A BEEST</h1>
		<h2><u>Code a project, Fly to the Netherlands, Build a mechanical animal!</u></h2>
	</div>
	<form class="rsvp-form" on:submit|preventDefault={handleRsvp}>
		<label for="rsvp-email" class="rsvp-label">RSVP</label>
		<div class="rsvp-row">
			<input
				id="rsvp-email"
				type="email"
				bind:value={email}
				placeholder="your@email.com"
				class="rsvp-input"
				maxlength="254"
				autocomplete="email"
				disabled={rsvpSubmitting}
			/>
			<button type="submit" class="rsvp-btn" disabled={rsvpSubmitting}>
				{rsvpSubmitting ? '...' : 'GO'}
			</button>
		</div>
		{#if rsvpStatus === 'success'}
			<p class="rsvp-msg rsvp-ok">Check your email!</p>
		{:else if rsvpStatus === 'duplicate'}
			<p class="rsvp-msg rsvp-warn">RSVP already found!</p>
		{:else if rsvpStatus === 'invalid'}
			<p class="rsvp-msg rsvp-err">That doesn't look like a valid email.</p>
		{:else if rsvpStatus === 'error'}
			<p class="rsvp-msg rsvp-err">Something went wrong. Try again later.</p>
		{/if}
	</form>
	<span class="scroll">↓</span>
</div>

{#if photoOpen}
	<div class="photo-modal-backdrop" on:click={() => photoOpen = false}>
		<div class="photo-modal" on:click|stopPropagation>
			<img src="/images/scheveningen-peir.webp" alt="Scheveningen pier">
			<p>The event will be at Scheveningen, a cultural center of the Netherlands and the home of the StrandBeests</p>
		</div>
	</div>
{/if}

<div class="section" id="s-what">
<svg class="teeth-line" viewBox="0 0 1000 200" preserveAspectRatio="none">
	<path
		d="M0,56 C30,48 50,12 90,16 C130,20 140,60 190,64 C230,68 260,24 310,20 C350,16 380,80 440,76 C490,72 520,6 560,10 C600,14 610,56 660,68 C710,80 740,28 790,22 C830,18 860,64 910,60 C950,56 970,36 1000,44"
		fill="none"
		stroke="#c9a474"
		stroke-width="3"
		stroke-linejoin="round"
		vector-effect="non-scaling-stroke"
	/>
</svg>
<h3>What is this?</h3>
	<div class="section-row">
		<p>Beest is a Hack Club program. A Beest (<a href="https://www.strandbeest.com/">Strandbeest</a>) is a sail powered mechanical animal constructed of just fabric, plastic pipes, zip ties and recycled plastic bottles. I think they are the coolest thing ever, and if you agree, you can join me in building one! Everything (including flights, food and accommodation) is totally free for teenagers who qualify by building a project. From [Date] to [Date] you and [X] teens will fly to the Netherlands to build a StrandBeest, present it to the creator of strandbeests and watch him exhibit the full collection!</p>
	</div>
	<div class="video-embed">
		<iframe
			src="https://www.youtube-nocookie.com/embed/H5RPsCMl3uM"
			title="Strandbeest"
			frameborder="0"
			allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
			allowfullscreen
		></iframe>
	</div>
</div>

<section class="how" bind:this={howEl}>
<h3>How does this work?</h3>
	<p>First, join the Hack Club Slack and introduce yourself to a community of teenage makers from around the world. Hang out, learn from peers and make friends who share your passion for building things. Then, build and ship an open source software or hardware project - it's beginner friendly with guides I promise. Once you qualify, we'll fly you out to the Netherlands where you and your new found friends will spend [z] days constructing our own Strandbeest! We will also be there to witness the walking of the beests - Theo Jansen (the original artist behind strand-beests) will be displaying his full collection.</p>
	<div class="comic" bind:this={comicEl}>
		{#each steps as step, i}
			<div class="panel" class:visible={i < visibleCount}>
				<div class="panel-img">
					<img src={step.img} alt={step.alt} loading="lazy" decoding="async" />
				</div>
				<div class="panel-caption">{step.caption}</div>
			</div>
		{/each}
		<div class="panel mobile-only">
			<div class="panel-img">
				<img src="https://manifesto.hackclub.com/hero/26.webp" alt="Stick around for the community" loading="lazy" decoding="async" />
			</div>
			<div class="panel-caption">Stick around for the community</div>
		</div>
	</div>
	
</section>

<div class="section" id="s-real">
<h3>Is Hack Club for real?</h3>
	<p>Yes - and we do this kind of stuff all the time! Hack Club is a non-profit organization and a community of 100k+ teenage makers. We run events online and in-person that reward people making open source projects. Thanks to our donors we are always running crazy events at no cost for teens. Previously we ran;</p>
	<img src="/images/previously.webp" alt="three cards showing past hackathons" loading="lazy" decoding="async" style="margin-top: 2rem; width: 100%;">
</div>

<div class="section section-split" id="s-eligible">
<div class="split-left">
		<h3>Am I Eligible?</h3>
		<p><b>If you are a teen, yes! </b> The only criteria is being a teenager and building a real open-source software/hardware project for Y hours. We can help you get a visa, cover the cost of your flight or hop on a call with parents! If you aren't sure, join the slack and ask - and if you can't make it, stay for the community! Hack Club is much bigger than Beest, we run events like this every few weeks!</p>
	</div>
	<div class="split-divider"></div>
	<div class="split-right">
		<h3>I can't make it :/</h3>
		<p>You can still win! Alongside the event you can get prizes for logging hours. We will have a shop packed with rewards like laptops, tablets, headphones and merch. These will be delivered straight to you and require no money transfer! Everything is earned just by working on a project. You can see some of the prize selection here ↓</p>
	</div>
</div>

<div class="carousel-section">
	<h2 class="earn-prizes-title">Earn Prizes</h2>
<div class="shop-carousel-bg">
	<div class="carousel-belt-bg" class:running={carouselReady}>
		{#each [...shopItems, ...shopItems, ...shopItems, ...shopItems] as item}
			<div class="carousel-card">
				<img src={item.src} alt={item.caption} loading="lazy" decoding="async">
				<p class="card-caption">{item.caption}</p>
			</div>
		{/each}
	</div>
</div>
<div class="shop-carousel" bind:this={shopCarouselEl}><!-- on:mouseenter={pauseCarousel} on:mouseleave={resumeCarousel} -->
	{#if orphReady}
		<div class="orph-runner" style="transform: translateY({-jumpIntensity * 30}px) scaleY({1 + jumpIntensity * 0.15})">
			{#each orphFrames as frame, i}
				<img
					src={frame.src}
					alt=""
					class="orph-frame"
					style="display: {i === currentOrphFrame ? 'block' : 'none'}"
				>
			{/each}
		</div>
	{/if}
	<div class="carousel-belt" class:running={carouselReady} class:paused={carouselPaused}>
		{#each [...shopItems, ...shopItems] as item}
			<div class="carousel-card">
				<img src={item.src} alt={item.caption} loading="lazy" decoding="async">
				<p class="card-caption">{item.caption}</p>
			</div>
		{/each}
	</div>
</div>
</div>
<div class="rsvp-bottom-section">
	<form class="rsvp-form rsvp-form-bottom" on:submit|preventDefault={handleRsvp}>
		<label for="rsvp-email-bottom" class="rsvp-label">RSVP</label>
		<div class="rsvp-row">
			<input
				id="rsvp-email-bottom"
				type="email"
				bind:value={email}
				placeholder="your@email.com"
				class="rsvp-input"
				maxlength="254"
				autocomplete="email"
				disabled={rsvpSubmitting}
			/>
			<button type="submit" class="rsvp-btn" disabled={rsvpSubmitting}>
				{rsvpSubmitting ? '...' : 'GO'}
			</button>
		</div>
		{#if rsvpStatus === 'success'}
			<p class="rsvp-msg rsvp-ok">Check your email!</p>
		{:else if rsvpStatus === 'duplicate'}
			<p class="rsvp-msg rsvp-warn">RSVP already found!</p>
		{:else if rsvpStatus === 'invalid'}
			<p class="rsvp-msg rsvp-err">That doesn't look like a valid email.</p>
		{:else if rsvpStatus === 'error'}
			<p class="rsvp-msg rsvp-err">Something went wrong. Try again later.</p>
		{/if}
	</form>
</div>
<div class="footer-jagged"></div>
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

</div><!-- /page-root -->
    