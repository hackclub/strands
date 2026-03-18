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

	// offset to synch animations
	// phase = 500ms.
	const ORPH_PHASE_MS = 500;

	let currentOrphFrame = 0;
	let carouselPaused = false;
	let visibleCount = 0;
	let howEl;
	let comicEl;
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

		function onScroll() {
			if (!comicEl) return;
			const rect = comicEl.getBoundingClientRect();
			const progress = (window.innerHeight - rect.top) / (rect.height + window.innerHeight * 0.4);
			const newCount = Math.min(5, Math.max(0, Math.floor(progress * 6)));
			visibleCount = Math.max(visibleCount, newCount);
		}
		window.addEventListener('scroll', onScroll, { passive: true });
		onScroll();

		return () => { cancelAnimationFrame(rafId); window.removeEventListener('scroll', onScroll); };
	});

	const steps = [
		{ img: '/images/step1.png', alt: 'Join the Hack Club community',    caption: 'Join the Hack Club community' },
		{ img: '/images/step2.png', alt: 'Learn from peers and make friends', caption: 'Learn from peers and make friends' },
		{ img: '/images/step3.png', alt: 'Build an open source project',     caption: 'Build an open source project' },
		{ img: '/images/step4.png', alt: 'Fly to the Netherlands',           caption: 'Fly to the Netherlands' },
		{ img: '/images/step5.png', alt: 'Build a Beest',                    caption: 'Build a Beest' },
	];

	// Fossills
	
	const fossils = [
		{ src: '/images/fossil1.png', top:  '8%',  left: '88%', rot:   15, size: 70 },
		{ src: '/images/fossil2.png', top: '14%',  left:  '3%', rot:  -55, size: 55 },
		{ src: '/images/fossil1.png', top: '22%',  left: '60%', rot:  120, size: 60 },
		{ src: '/images/fossil2.png', top: '33.4%',left: '80%', rot:   80, size: 90 },
		{ src: '/images/fossil1.png', top: '40%',  left: '18%', rot:  -20, size: 75 },
		{ src: '/images/fossil2.png', top: '45%',  left:  '6%', rot:  -32, size: 65 },
		{ src: '/images/fossil1.png', top: '52%',  left: '75%', rot:   60, size: 55 },
		{ src: '/images/fossil2.png', top: '55%',  left: '91%', rot:   44, size: 75 },
		{ src: '/images/fossil1.png', top: '63%',  left: '35%', rot:  -70, size: 65 },
		{ src: '/images/fossil2.png', top: '70%',  left: '12%', rot:   35, size: 80 },
		{ src: '/images/fossil1.png', top: '78%',  left:  '2%', rot:  -12, size: 85 },
		{ src: '/images/fossil2.png', top: '80%',  left: '72%', rot:   27, size: 70 },
		{ src: '/images/fossil1.png', top: '87%',  left: '48%', rot:  -90, size: 60 },
		{ src: '/images/fossil2.png', top: '90%',  left: '50%', rot:  -40, size: 60 },
		{ src: '/images/fossil1.png', top: '95%',  left: '82%', rot:  150, size: 72 },
	];

	const shopItems = [
		{ src: '/images/shop/headphones.png', caption: 'Headphones' },
		{ src: '/images/shop/printer.png', caption: '3D Printer' },
		{ src: '/images/shop/blahaj.png', caption: 'Blahaj' },
		{ src: '/images/shop/stickers.png', caption: 'Stickers' },
		{ src: '/images/shop/framework.png', caption: 'Framework Laptop' },
		{ src: '/images/shop/polaroid.png', caption: 'Polaroid Camera' },
		{ src: '/images/shop/flight-stipend.png', caption: 'flight stipend' },
		
	];
</script>

<style>
	@font-face {
		font-family: 'OrelegaOne';
		src: url('/fonts/OrelegaOne-Regular.ttf') format('truetype');
		font-weight: normal;
		font-style: normal;
	}

	@font-face {
		font-family: 'OnlyTrue';
		src: url('/fonts/OnlyTrue-Neutral.ttf') format('truetype');
		font-stretch: normal;
	}

	@font-face {
		font-family: 'OnlyTrueBigBlob';
		src: url('/fonts/OnlyTrue-BigBlob.ttf') format('truetype');
		font-stretch: normal;
	}

	@font-face {
		font-family: 'OnlyTrueSmall';
		src: url('/fonts/OnlyTrue-Small.ttf') format('truetype');
		font-stretch: normal;
	}

	:global(body) {
		margin: 0;
		src: url('/fonts/main.otf');
		background-color: #ffffff;
		background-image: linear-gradient(rgba(245,233,216,0.88), rgba(245,233,216,0.88)), url('/images/noise.jpg');
		background-blend-mode: normal, soft-light;
		color: #3d2a18;
		font-family: 'OrelegaOne', Georgia, serif;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
		overflow-x: hidden;
	}

	.hero {
		height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		justify-content: flex-start;
		padding: 1vh 6vw 3vh 6vw;
		position: relative;
		background-color: #8eadcf;
		background-image: url('/images/hero.png');
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
		width: 110px;
		display: block;
	}

	.flag:hover {
		transform: rotate(10deg);
	}

	.coming-soon {
		background: #ec3750;
		color: #fff;
		text-align: left;
		padding: 1.2em 2.5em;
		border-radius: 4px;
		box-shadow: 4px 4px 0 rgba(0,0,0,0.25);
		text-decoration: none;
		display: inline-block;
		margin-top: 1.5rem;
		transition: transform 0.15s ease, box-shadow 0.15s ease;
		white-space: nowrap;
	}

	.coming-soon:hover {
		transform: translateY(-2px);
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


	.section {
		padding: calc(7vh + 30px) 6vw;
		position: relative;
	}

	#s-what {
		background-color: #f5edd0;
		background-image: linear-gradient(rgba(245,237,208,0.65), rgba(245,237,208,0.65)), url('/images/noise.jpg');
		background-blend-mode: normal, soft-light;
	}

	#s-real {
		background-color: #c8a878;
		background-image: linear-gradient(rgba(200,168,120,0.65), rgba(200,168,120,0.65)), url('/images/noise.jpg');
		background-blend-mode: normal, soft-light;
	}

	#s-eligible {
		background-color: #b49066;
		background-image: linear-gradient(rgba(155, 112, 64, 0.88), rgba(154,112,64,0.88)), url('/images/noise.jpg');
		background-blend-mode: normal, soft-light;
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
		background-image: linear-gradient(rgba(237,224,184,0.65), rgba(237,224,184,0.65)), url('/images/noise.jpg');
		background-blend-mode: normal, soft-light;
	}

	.how h3 {
		font-size: 2.2rem;
		font-weight: 700;
		margin: 0 0 1rem 0;
		letter-spacing: 0.02em;
		font-family: 'OnlyTrue', sans-serif;
		text-transform: uppercase;
	}

	.how > p {
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
		height: 80px;
		margin-top: -80px;
		z-index: 5;
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
	}

	.section-row p {
		flex: 1;
	}

	footer {
		background-color: #1a1209;
		background-image: none;
		isolation: isolate;
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: flex-start;
		padding: 3rem 0 4rem;
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

	footer img:not(.footer-polka) {
		height: 55px;
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
		width: 40px;
		align-self: stretch;
		flex-shrink: 0;
		background: url('/images/vertical-pipe.png') center / 100% 100% no-repeat;
		opacity: 0.6;
	}

	.split-right {
		flex: 1;
		padding-left: 3vw;
	}

	#s-what::before {
		content: '';
		position: absolute;
		top: -40px;
		left: 0;
		width: 100%;
		height: 80px;
		pointer-events: none;
		z-index: 5;
		background-color: #f5edd0;
		background-image: linear-gradient(rgba(245,237,208,0.65), rgba(245,237,208,0.65)), url('/images/noise.jpg');
		background-size: auto, auto;
		background-blend-mode: normal, soft-light;
		clip-path: polygon(
			0% 25%, 7% 0%, 15% 38%, 24% 5%, 33% 42%, 42% 8%, 51% 35%, 60% 2%, 69% 44%, 78% 12%, 86% 40%, 93% 5%, 100% 28%,
			100% 78%,
			93% 55%, 85% 90%, 76% 62%, 67% 96%, 57% 65%, 48% 98%, 38% 60%, 29% 94%, 20% 65%, 11% 96%, 5% 68%, 0% 75%
		);
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
		z-index: 5;
		background-size: auto, auto;
		background-blend-mode: normal, soft-light;
	}

	#s-what::after {
		background-color: #f5edd0;
		background-image: linear-gradient(to bottom, #f5edd0, #ede0b8), url('/images/noise.jpg');
		clip-path: polygon(
			0% 30%, 6% 5%, 14% 45%, 22% 8%, 31% 50%, 40% 12%, 49% 42%, 58% 0%, 67% 38%, 76% 10%, 84% 48%, 92% 6%, 100% 35%,
			100% 72%,
			92% 95%, 83% 65%, 74% 100%, 65% 68%, 56% 95%, 46% 60%, 37% 100%, 28% 72%, 19% 96%, 10% 62%, 4% 90%, 0% 68%
		);
	}
	.how::after {
		background-color: #ede0b8;
		background-image: linear-gradient(to bottom, #ede0b8, #c8a878), url('/images/noise.jpg');
		clip-path: polygon(
			0% 15%, 7% 48%, 16% 4%, 25% 40%, 34% 0%, 43% 44%, 52% 8%, 61% 50%, 70% 5%, 79% 42%, 88% 10%, 95% 38%, 100% 18%,
			100% 78%,
			94% 55%, 86% 92%, 76% 60%, 67% 98%, 58% 65%, 48% 92%, 38% 55%, 28% 90%, 18% 62%, 9% 96%, 3% 70%, 0% 82%
		);
	}
	#s-real::after {
		background-color: #c8a878;
		background-image: linear-gradient(to bottom, #c8a878, #9a7040), url('/images/noise.jpg');
		clip-path: polygon(
			0% 40%, 5% 8%, 13% 52%, 21% 15%, 30% 48%, 39% 5%, 48% 45%, 57% 12%, 66% 50%, 75% 8%, 83% 42%, 91% 0%, 100% 30%,
			100% 68%,
			91% 100%, 82% 65%, 73% 95%, 63% 60%, 54% 98%, 44% 68%, 35% 100%, 26% 65%, 17% 95%, 8% 62%, 2% 90%, 0% 72%
		);
	}
	#s-eligible::after {
		background-color: #9a7040;
		background-image: linear-gradient(to bottom, #9a7040, #c0a06a), url('/images/noise.jpg');
		clip-path: polygon(
			0% 22%, 8% 50%, 17% 10%, 26% 44%, 35% 2%, 44% 40%, 53% 15%, 62% 48%, 71% 6%, 80% 45%, 89% 12%, 96% 40%, 100% 20%,
			100% 75%,
			95% 55%, 87% 92%, 77% 58%, 68% 96%, 59% 62%, 49% 94%, 40% 60%, 30% 96%, 21% 62%, 12% 92%, 5% 65%, 0% 80%
		);
	}

	.carousel-section {
		background-color: #c0a06a;
		background-image: linear-gradient(rgba(192,160,106,0.88), rgba(192,160,106,0.88)), url('/images/noise.jpg');
		background-blend-mode: normal, soft-light;
		padding-bottom: calc(4rem + 80px);
	}

	.shop-carousel {
		padding: 4rem 0 5rem;
		overflow: hidden;
		transform: rotate(-10deg);
		margin: -2rem -15vw 0;
		width: calc(100% + 30vw);
	}

	.earn-prizes-title {
		text-align: center;
		font-family: 'OnlyTrue', sans-serif;
		font-weight: normal;
		font-size: 5vw;
		text-transform: uppercase;
		margin: 0;
		padding: 0;
		transform: translateY(13rem);
		color: #1a1209;
	}

	.orph-runner {
		display: block;
		height: 140px;
		width: auto;
		margin: 0 auto -0px;
		position: relative;
		z-index: 10;
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
	}

	.fossils {
		position: absolute;
		inset: 0;
		pointer-events: none;
		overflow: hidden;
		z-index: 0;
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

	@media (max-width: 768px) {
		h1 {
			font-size: 13vw;
			white-space: normal;
			line-height: 0.95;
		}

		h2 {
			font-size: 1rem;
			line-height: 1.4;
		}

		.hero {
			padding-top: 6vh;
			justify-content: flex-start;
		}

		.coming-soon {
			white-space: normal;
			padding: 1em 1.5em;
		}

		.coming-soon p:first-child { font-size: 1.4rem; }
		.coming-soon p:last-child  { font-size: 0.9rem; }

		.photo-corner {
			display: none;
		}

		.section {
			padding: 3rem 5vw;
		}

		.section h3,
		.how h3 {
			font-size: 1.6rem;
		}

		.section p,
		.how > p {
			font-size: 1rem;
			line-height: 1.7;
		}

		.how {
			padding: 3rem 5vw 1rem;
		}

		.comic {
			height: auto;
			display: flex;
			flex-direction: column;
			gap: 1.5rem;
			margin: 1.5rem 0 0;
		}

		.panel {
			position: relative;
			left: auto !important;
			top: auto !important;
			width: 100%;
			transform: none !important;
			opacity: 1 !important;
			animation: none !important;
		}

		.section-row,
		.section-split {
			flex-direction: column;
			gap: 1rem;
		}

		footer {
			flex-wrap: wrap;
			gap: 0.5rem;
			padding: 2rem 1rem 3rem;
		}

		footer img:not(.footer-polka) {
			height: 40px;
		}

		.fossils {
			display: none;
		}
	}
</style>

<div class="page-root">

<div class="fossils">
	{#each fossils as f}
		<img
			class="fossil"
			src={f.src}
			alt="strandbeest fossil"
			title="strandbeest fossil"
			style="top:{f.top}; left:{f.left}; width:{f.size}px; transform:rotate({f.rot}deg);"
		/>
	{/each}
</div>

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
		<p>Watch me develop in <strong>#beest</strong> on Slack <br>Nothing here is finalised.</p>
	</a>
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

<div class="section" id="s-what">
<h3>What is this?</h3>
	<div class="section-row">
		<p>Beest is a Hack Club program. A Beest (<a href="https://www.strandbeest.com/">Strandbeest</a>) is a sail powered mechanical animal constructed of just fabric, plastic pipes, zip ties and recycled plastic bottles. I think they are the coolest thing ever, and if you agree, you can join me in building one! Everything (including flights, food and accommodation) is totally free for teenagers who qualify by building a project. From [Date] to [Date] you and [X] teens will fly to the Netherlands to build a StrandBeest, present it to the creator of strandbeests and watch him exhibit the full collection!</p>
	</div>
</div>

<section class="how" bind:this={howEl}>
<h3>How does this work?</h3>
	<p>First, join the Hack Club Slack and introduce yourself to a community of teenage makers from around the world. Hang out, learn from peers and make friends who share your passion for building things. Then, build and ship an open source software or hardware project - it's beginner friendly with guides I promise. Once you qualify, we'll fly you out to the Netherlands where you and your new found friends will spend [z] days constructing our own Strandbeest! We will also be there to witness the walking of the beests - Theo Jansen (the original artist behind strand-beests) will be displaying his full collection.</p>
	<div class="comic" bind:this={comicEl}>
		{#each steps as step, i}
			<div class="panel" class:visible={i < visibleCount}>
				<div class="panel-img">
					<img src={step.img} alt={step.alt} />
					<span class="panel-num">{i + 1}</span>
				</div>
				<div class="panel-caption">{step.caption}</div>
			</div>
		{/each}
	</div>
	
</section>

<div class="section" id="s-real">
<h3>Is Hack Club for real?</h3>
	<p>Yes - and we do this kind of stuff all the time! Hack Club is a non-profit organization and a community of 100k+ teenage makers. We run events online and in-person that reward people making open source projects. Thanks to our donors we are always running crazy events at no cost for teens. Previously we ran;</p>
	<img src="/images/previously.png" alt="three cards showing past hackathons" style="margin-top: 2rem; max-width: 100%;">
</div>

<div class="section section-split" id="s-eligible">
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

<div class="carousel-section">
	<h2 class="earn-prizes-title">Earn Prizes</h2>
<div class="shop-carousel-bg">
	<div class="carousel-belt-bg" class:running={carouselReady}>
		{#each [...shopItems, ...shopItems, ...shopItems, ...shopItems] as item}
			<div class="carousel-card">
				<img src={item.src} alt={item.caption}>
				<p class="card-caption">{item.caption}</p>
			</div>
		{/each}
	</div>
</div>
<div class="shop-carousel"><!-- on:mouseenter={pauseCarousel} on:mouseleave={resumeCarousel} -->
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
    