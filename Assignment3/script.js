// =============================================================================
// EMERGENCE — INTERACT PAGE SCRIPT
// =============================================================================
// Design context: "Emergence" explores the concept of hidden meaning surfacing
// through interaction. The user discovers words by clicking, mimicking the slow
// process of something revealing itself — a flower blooming, tree
// rings forming, a butterfly breaking free from a cocoon. 

// =============================================================================
// 1. STATE & CONSTANTS
// =============================================================================

let isReversing = false;   // When all words are found, clicks begin undoing 
let foundCount = 0;        // How many words the user has discovered
let currentClockAngle = 0; // Tracks the clock hand's rotation angle 
let animationFrameId = null;
let wordElementsArray = [];

const rotationSpeed = 0.4; // Slow rotation 

// Word pool with category tags.
// Keeping text and category data together avoids sync issues
// when filtering words by theme.
const poolOfWords = [
    { text: "accumulation",      category: "time" },
    { text: "searching takes time", category: "time" },
    { text: "growth",            category: "time" },
    { text: "formation",         category: "beauty" },
    { text: "tree rings",        category: "time" },
    { text: "gradual unveiling", category: "beauty" },
    { text: "temporal",          category: "time" },
    { text: "floral blooming",   category: "beauty" },
    { text: "budding",           category: "beauty" },
    { text: "hidden beauty",     category: "beauty" },
    { text: "cocoon",            category: "language" },
    { text: "life cycle",        category: "language" },
    { text: "eclosion",          category: "language" },
    { text: "transformation",    category: "language" },
    { text: "butterfly",         category: "language" }
];
// Active word list is filtered from the pool based on theme selection
let activeWords = [...poolOfWords]; 

// DOM Element Selectors
const diggingZone       = document.getElementById('digging-zone');
const poemList          = document.getElementById('poem-list');
const progressPercentage = document.getElementById('progress-percentage');
const centerVisual      = document.getElementById('center-visual');
const sparkleContainer  = document.getElementById('sparkle-container');
const treeRingsContainer = document.getElementById('tree-rings-container');
const cocoonContainer   = document.getElementById('cocoon-container');


// =============================================================================
// 2. SOUND DESIGN
// =============================================================================
// Sound is used as feedback for discovery.
// Five variations of the same click sound are played in sequence,
// creating a subtle sense of progression.
//
// The original sound is royalty-free and was edited by me in REAPER
// to create a rising tonal scale.


const clickSoundsPool = [
    new Audio('Click1.mov'),
    new Audio('Click2.mov'),
    new Audio('Click3.mov'),
    new Audio('Click4.mov'),
    new Audio('Click5.mov')
];

clickSoundsPool.forEach(sound => { sound.volume = 0.5; });

function playClickSound() {
    // Index is calculated from foundCount BEFORE the state changes,
    // so the sound always matches the step being taken, not the next one.
    const stepIndex = Math.max(0, foundCount - (isReversing ? 1 : 0));
    const targetAudio = clickSoundsPool[stepIndex % clickSoundsPool.length];

    if (targetAudio) {
        targetAudio.currentTime = 0; // Reset allows rapid clicking without audio overlap
        targetAudio.play().catch(() => {});
    }
}

// =============================================================================
// 3. ORBIT LAYOUT
// This removes any visual hierarchy — there is no first or last word.
// Discovery order is entirely driven by the user.
/* ==========================================================================
   AI CITATION: MATH REFLECTION — ASSISTED BY GEMINI
   --------------------------------------------------------------------------
   How the orbital word arrangement math works:
   1. Spacing out the words: (index / totalWords) * 2 * Math.PI takes the total 
      number of words and distributes them evenly around a full 360-degree circle 
      (which is 2 * PI in radians). This prevents words from piling up on top of each other.
      
   2. Setting the starting point: By default, programming circles start on the 
      far right (0 radians). Subtracting Math.PI / 2 (90 degrees) shifts the 
      very first word to the exact top of the circle, aligning it beautifully 
      with a 12 o'clock layout.
      
   3. Plotting the coordinates (Trigonometry): 
      - Math.cos(angle) calculates how far left/right (X-axis) the word should go.
      - Math.sin(angle) calculates how far up/down (Y-axis) the word should go.
      Multiplying these by our radius (220px) pushes them out from the center 
      to form the perfect orbit ring on the screen.
   ========================================================================== */

function setClockRotation(angleDeg) {
    // Preserves translate so only rotation changes, avoids resetting position
    const container = document.querySelector('.clock-hand-container');
    if (container) {
        container.style.transform = `translate(-50%, -100%) rotate(${angleDeg}deg)`;
    }
}

function initOrbitLayout() {
    wordElementsArray = [];
    diggingZone.innerHTML = '';

    const activeOption = document.querySelector('#dropdown-options li.active');
    const currentTheme = activeOption ? activeOption.getAttribute('data-value') : 'all';

    const totalWords = activeWords.length;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const radius = 220;

    activeWords.forEach((item, index) => {
        const wordEl = document.createElement('span');
        wordEl.innerText = item.text;
        wordEl.classList.add('excavated-word');

        // Evenly distribute words around the full circle, starting from top (−π/2)
        const angleRadian = (index / totalWords) * 2 * Math.PI - (Math.PI / 2);
        let angleDegree = (angleRadian * 180) / Math.PI + 90;
        if (angleDegree < 0) angleDegree += 360;
        
        // Position words neatly on the canvas using the radius distance
        wordEl.style.left = `${centerX + radius * Math.cos(angleRadian)}px`;
        wordEl.style.top  = `${centerY + radius * Math.sin(angleRadian)}px`;

        // Creates a sequential cascade reveal effect when entering a theme
        wordEl.style.setProperty('--unveil-delay', `${index * 0.15}s`);

        wordEl.addEventListener('click', () => handleWordClick(wordEl, item, angleDegree, currentTheme));

        diggingZone.appendChild(wordEl);
        wordElementsArray.push({ element: wordEl, targetAngle: angleDegree });
    });

    setClockRotation(currentClockAngle);
    updateRadarScan();
}

function handleWordClick(wordEl, item, angleDegree, currentTheme) {
    const totalDiscoverable = activeWords.length;
    if (totalDiscoverable === 0) return;

// Flip to reversing mode once all words are found.
// The user can then "un-click" words, allowing the visual system to
// retreat back toward its origin state.
// This was a deliberate design choice inspired by biological systems:
// growth is not always linear: things can fold back, decay, or reset.

    if (Math.round((foundCount / totalDiscoverable) * 100) === 100) {
        isReversing = true; // All words clicked → enable reverse interaction mode
    }

    playClickSound(); // Feedback sound for every click 

    if (!isReversing) {
        // Only allow marking a word if it hasn't been clicked yet
        // and the user hasn't reached the full progress
        if (!wordEl.classList.contains('found') && foundCount < totalDiscoverable) {
            wordEl.classList.add('found');
            foundCount++;
            currentClockAngle = angleDegree; // update clock position based on word location
            setClockRotation(currentClockAngle); // rotate clock hand 
            // Visual update depending on theme
            if (currentTheme === 'time') updateSVGRings();
            updateProgress();
        }

// =========================
// REVERSE MODE
// =========================
// In reverse mode, allow user to undo previously clicked words
    } else {
        if (wordEl.classList.contains('found')) {
            wordEl.classList.remove('found');
            foundCount--;
            currentClockAngle = angleDegree;  // update clock position again

            const container = document.querySelector('.clock-hand-container');
            // Smooth transition for clock hand when reversing
            if (container) container.style.transition = 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)';
            setClockRotation(currentClockAngle);

            if (currentTheme === 'time') updateSVGRings();
            updateProgress();

            if (Math.round((foundCount / totalDiscoverable) * 100) === 0) {
                isReversing = false;
            }
        }
    }
}

function updateRadarScan() {
    const normalizedAngle = currentClockAngle % 360;
    wordElementsArray.forEach(item => {
        let diff = Math.abs(normalizedAngle - item.targetAngle);
        if (diff > 180) diff = 360 - diff;
        item.element.classList.toggle('revealed', diff < 15);
    });
}

function animateClockAndRadar() {
    // Continuous rotation loop, only active after 100% progress in "rings" theme.
    // Using requestAnimationFrame keeps the animation in sync with the display
    currentClockAngle += rotationSpeed;
    const container = document.querySelector('.clock-hand-container');
    if (container) {
        container.style.transition = 'none';
        container.style.transform = `translate(-50%, -100%) rotate(${currentClockAngle}deg)`;
    }
    updateRadarScan();
    animationFrameId = requestAnimationFrame(animateClockAndRadar);
}

function stopAnimation() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

// =============================================================================
// 4. PROGRESS & VISUAL FEEDBACK
// =============================================================================
function updateSVGRings() {
    const total = activeWords.length;
    if (total === 0) return;
    const ringsToReveal = Math.floor((foundCount / total) * 6);
    for (let i = 1; i <= 6; i++) {
        const ring = document.getElementById(`svg-ring-${i}`);
        if (ring) ring.classList.toggle('active', i <= ringsToReveal);
    }
}

function updateProgress() {
    const total = activeWords.length;
    let percentage = total > 0 ? Math.round((foundCount / total) * 100) : 0;
    percentage = Math.min(100, Math.max(0, percentage));
    progressPercentage.innerText = `${percentage}%`;

    const activeOption = document.querySelector('#dropdown-options li.active');
    const currentTheme = activeOption ? activeOption.getAttribute('data-value') : 'all';

    // Cocoon stage is driven by raw foundCount 
    // Each words peels back one layer of the cocoon, making the metaphor literal.
    if (cocoonContainer) {
        cocoonContainer.setAttribute('data-stage',
            currentTheme === 'language' ? String(foundCount) : '0'
        );
    }

    // Flower themes: petals spread proportionally to progress.
    // AI-assisted calculation:
    // Rotation values for flower petals were calculated with the help of
    // Google Gemini to ensure symmetrical angular distribution based on
    // progress percentage. The values were then manually adjusted to better
    // match the visual balance of the flower bloom.
    if (currentTheme === 'all' || currentTheme === 'beauty') {
        document.documentElement.style.setProperty('--bloom-scale', 0.2 + (percentage / 100) * 1.5);
        const r1 = (percentage / 100) * 85;
        const r2 = (percentage / 100) * 45;
        const petalRotations = { p1: -r1, p2: -r2, p3: 0, p4: r2, p5: r1 };
        Object.entries(petalRotations).forEach(([cls, deg]) => {
            const el = document.querySelector(`.petal-item.${cls}`);
            if (el) el.style.transform = `translate(-50%, 0) rotate(${deg}deg)`;
        });
    } else {
        document.documentElement.style.removeProperty('--bloom-scale');
        document.querySelectorAll('.petal-item').forEach(p => p.style.transform = '');
    }

    const handContainer = document.querySelector('.clock-hand-container');

    if (percentage === 100) {
        if (handContainer) handContainer.classList.add('all-found');
        if (currentTheme === 'beauty') trigger100PercentSparkles();
        if (currentTheme === 'time' && treeRingsContainer) treeRingsContainer.classList.add('pulse-all');
        // Clock only spins continuously final state
        // completion has its own distinct reward state (sparkles / full cocoon).
        if (currentTheme !== 'beauty' && currentTheme !== 'language') {
            if (!animationFrameId) animateClockAndRadar();
        }
    } else {
        if (handContainer) handContainer.classList.remove('all-found');
        if (treeRingsContainer) treeRingsContainer.classList.remove('pulse-all');
        if (sparkleContainer) sparkleContainer.innerHTML = '';

        stopAnimation();

        const container = document.querySelector('.clock-hand-container');
        if (container) container.style.transition = 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)';

        if (percentage === 0 || currentTheme === 'language') {
            currentClockAngle = 0;
        }

        setClockRotation(currentClockAngle);
        updateRadarScan();
    }
}

/* ==========================================================================
   AI CITATION (ASSISTED BY GEMINI)
   --------------------------------------------------------------------------
   I used Gemini AI to help me map out the initial logic framework, math formulas, 
   and general code layout for this system. After getting the base setup from the 
   AI, I went through the code myself to clean it up and manually adjust the coordinate
   positions, color steps, and animation timings to match the goals and the aesthetic 
   look of my project.
   ========================================================================== */

// This function generates a burst of "sparkle" particles when a completion in flower theme
// The decoration reinforcing the idea of blooming completion
function trigger100PercentSparkles() {
    if (!sparkleContainer) return;
    // Clear previous sparkles before generating a new burst
    sparkleContainer.innerHTML = '';
    // Create multiple sparkle elements to simulate a particle system
    for (let i = 0; i < 45; i++) {
        const dot = document.createElement('div');
        dot.classList.add('sparkle-dot');
        // Randomize size to create visual variety 
        const size = Math.random() * 8 + 4;
        dot.style.width  = `${size}px`;
        dot.style.height = `${size}px`;
        // Spread particles across full viewport width for a "burst" effect
        dot.style.left   = `${Math.random() * 100}vw`;
        // CSS custom properties used to control animation behavior per particle:
        // - duration: how long each sparkle lasts
        // - drift: horizontal floating movement
        // - max-opacity: variation in brightness
        dot.style.setProperty('--duration',   `${Math.random() * 4 + 3}s`);
        dot.style.setProperty('--drift',      `${(Math.random() * 160) - 80}px`);
        dot.style.setProperty('--max-opacity', Math.random() * 0.5 + 0.5);
        dot.style.animationDelay = `${Math.random() * -6}s`;
        sparkleContainer.appendChild(dot);
    }
}

// =============================================================================
// JOURNAL
// =============================================================================

function addToPoemJournal(text) {
    const hint = poemList.querySelector('.hint');
    if (hint) hint.remove();
    const li = document.createElement('li');
    li.innerText = text;
    poemList.appendChild(li);
}

function removeFromPoemJournal(text) {
    if (!poemList) return;
    for (const li of poemList.querySelectorAll('li')) {
        if (li.innerText === text) { li.remove(); break; }
    }
    if (poemList.querySelectorAll('li').length === 0) {
        const hint = document.createElement('li');
        hint.classList.add('hint');
        hint.innerText = "the lines you find will gather here...";
        poemList.appendChild(hint);
    }
}

// =============================================================================
// 5. UI CONTROLS
// =============================================================================
// Dropdown, info panel, URL routing are grouped here 

// --- DROPDOWN ---
// Theme switching resets ALL state: foundCount, animation, visual feedback, and
// word layout. This ensures switching themes always feels like a fresh start

const customDropdown  = document.getElementById('custom-dropdown');
const dropdownSelected = document.getElementById('dropdown-selected');
const dropdownOptions  = document.getElementById('dropdown-options');

dropdownSelected.addEventListener('click', (e) => {
    e.stopPropagation();
    customDropdown.classList.toggle('open');
});

dropdownOptions.querySelectorAll('li').forEach(option => {
    option.addEventListener('click', (e) => {
        e.stopPropagation();

        const selectedTheme = option.getAttribute('data-value');
        dropdownSelected.innerText = option.innerText;
        dropdownOptions.querySelectorAll('li').forEach(li => li.classList.remove('active'));
        option.classList.add('active');
        customDropdown.classList.remove('open');

        // Reset visual state before switching theme
        const flowerContainer = document.querySelector('.flower-container');
        if (flowerContainer) {
            flowerContainer.style.transition = 'none';
            document.documentElement.style.setProperty('--bloom-scale', '0.2');
        }

        centerVisual.classList.remove('hide-clock', 'hide-flower');
        document.body.classList.remove('beauty-cursor', 'show-language');

        const cContainer = document.querySelector('.constellation-container');
        if (cContainer) cContainer.classList.remove('show');
        if (cocoonContainer) cocoonContainer.setAttribute('data-stage', '0');

        const handContainer = document.querySelector('.clock-hand-container');
        if (handContainer) handContainer.classList.remove('all-found');

        // Re-enable flower transition after one frame 
        requestAnimationFrame(() => requestAnimationFrame(() => {
            if (flowerContainer) flowerContainer.style.transition = '';
        }));

        if (sparkleContainer) sparkleContainer.innerHTML = '';
        if (treeRingsContainer) {
            treeRingsContainer.querySelectorAll('.svg-ring').forEach(r => r.classList.remove('active'));
            treeRingsContainer.classList.remove('pulse-all');
        }

        stopAnimation();
        currentClockAngle = 0;
        isReversing = false;

        // Filter words and configure theme-specific visual mode
        activeWords = selectedTheme === 'all'
            ? [...poolOfWords]
            : poolOfWords.filter(w => w.category === selectedTheme);

        if (selectedTheme === 'beauty') {
            centerVisual.classList.add('hide-clock');
            document.body.classList.add('beauty-cursor');
        } else if (selectedTheme === 'time') {
            centerVisual.classList.add('hide-flower');
        } else if (selectedTheme === 'language') {
            centerVisual.classList.add('hide-clock', 'hide-flower');
            document.body.classList.add('show-language');
            if (cContainer) cContainer.classList.add('show');
        }

        foundCount = 0;
        updateProgress();
        initOrbitLayout();
    });
});

window.addEventListener('click', () => customDropdown.classList.remove('open'));
window.addEventListener('resize', () => initOrbitLayout());

// --- INFO PANEL ---
const infoBtn          = document.getElementById('info-btn');
const infoPanelOverlay = document.getElementById('info-panel-overlay');
const infoCloseBtn     = document.getElementById('info-close-btn');

if (infoBtn && infoPanelOverlay) {
    infoBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        infoPanelOverlay.classList.add('open');
    });
}
if (infoCloseBtn) {
    infoCloseBtn.addEventListener('click', () => infoPanelOverlay.classList.remove('open'));
}
if (infoPanelOverlay) {
    infoPanelOverlay.addEventListener('click', (e) => {
        if (e.target === infoPanelOverlay) infoPanelOverlay.classList.remove('open');
    });
}

// --- URL ROUTING ---
// The home page's three node icons are entry points 
// leading directly to that theme interaction

window.addEventListener('DOMContentLoaded', () => {
    initOrbitLayout();

    const receivedTheme = new URLSearchParams(window.location.search).get('theme');
    if (receivedTheme) {
        const matchedOption = document.querySelector(`#dropdown-options li[data-value="${receivedTheme}"]`);
        if (matchedOption) matchedOption.click();
    }
});