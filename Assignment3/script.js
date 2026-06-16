// Phân loại các nhóm chữ dựa theo ý tưởng tài liệu
let isReversing = false;
const poolOfWords = [
    { text: "excavated slowly?", category: "time" },
    { text: "searching takes time", category: "time" },
    { text: "patience", category: "time" },
    { text: "formation", category: "beauty" },
    { text: "tree rings", category: "time" },
    { text: "gradual unveiling", category: "beauty" },
    { text: "temporal", category: "time" },
    { text: "floral blooming", category: "beauty" },
    { text: "budding", category: "beauty" },
    { text: "slow", category: "beauty" },
    { text: "isolated stars", category: "language" },
    { text: "emerging connections", category: "language" },
    { text: "constellation forms", category: "language" },
    { text: "many languages", category: "language" },
    { text: "human connection", category: "language" }
];

let activeWords = [...poolOfWords];
let foundCount = 0;
const diggingZone = document.getElementById('digging-zone');
const poemList = document.getElementById('poem-list');
const progressPercentage = document.getElementById('progress-percentage');
const centerVisual = document.getElementById('center-visual');
const sparkleContainer = document.getElementById('sparkle-container'); 
const treeRingsContainer = document.getElementById('tree-rings-container');
const cocoonContainer = document.getElementById('cocoon-container');

let wordElementsArray = []; 
let animationFrameId;
let currentClockAngle = 0; 
const rotationSpeed = 0.3; 

// SOUND
const clickSound = new Audio('soundshelfstudio-ui-hover-for-interfaces-519788.mp3');
clickSound.volume = 0.5;

function playClickSound() {
    clickSound.currentTime = 0;
    clickSound.play();
}

// Helper: set transform trên container (giữ translate + scale, chỉ đổi rotate)
function setClockRotation(angleDeg) {
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
        
        if (currentTheme === 'all') {
            wordEl.style.display = 'none';
        }
        
        const angleRadian = (index / totalWords) * 2 * Math.PI - (Math.PI / 2);
        
        let angleDegree = (angleRadian * 180) / Math.PI + 90; 
        if (angleDegree < 0) angleDegree += 360;

        const x = centerX + radius * Math.cos(angleRadian);
        const y = centerY + radius * Math.sin(angleRadian);
        
        wordEl.style.left = `${x}px`;
        wordEl.style.top = `${y}px`;
        
        const delayTime = index * 0.15;
        wordEl.style.setProperty('--unveil-delay', `${delayTime}s`);
        
        wordEl.addEventListener('click', () => {
            playClickSound(); // SOUND
            const totalDiscoverable = activeWords.length;
            if (totalDiscoverable === 0) return;

            let currentPercentage = Math.round((foundCount / totalDiscoverable) * 100);

            if (currentPercentage === 100) {
                isReversing = true;
            }

            if (!isReversing) {
                if (!wordEl.classList.contains('found') && foundCount < totalDiscoverable) {
                    wordEl.classList.add('found');
                    foundCount++;
                    
                    const nextPercentage = Math.round((foundCount / totalDiscoverable) * 100);
                    
                    if (nextPercentage <= 100) {
                        currentClockAngle = angleDegree; 
                        setClockRotation(currentClockAngle);
                    }

                    if (currentTheme === 'time') {
                        updateSVGRings();
                    }

                    updateProgress();
                    addToPoemJournal(item.text);
                }
            } 
            else {
                if (wordEl.classList.contains('found')) {
                    wordEl.classList.remove('found');
                    foundCount--;

                    currentClockAngle = angleDeg;
                    const container = document.querySelector('.clock-hand-container');
                    if (container) container.style.transition = 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)';
                    setClockRotation(currentClockAngle);

                    if (currentTheme === 'time') {
                        updateSVGRings();
                    }

                    updateProgress();
                    removeFromPoemJournal(item.text);

                    let newPercentage = Math.round((foundCount / totalDiscoverable) * 100);
                    if (newPercentage === 0) {
                        isReversing = false;
                    }
                }
            }
        });

        diggingZone.appendChild(wordEl);
        
        wordElementsArray.push({
            element: wordEl,
            targetAngle: angleDegree
        });
    });

    setClockRotation(currentClockAngle);
    updateRadarScan();
}

function updateSVGRings() {
    const totalDiscoverable = activeWords.length;
    if (totalDiscoverable === 0) return;

    const ringsToReveal = Math.floor((foundCount / totalDiscoverable) * 6);

    for (let i = 1; i <= 6; i++) {
        const ringEl = document.getElementById(`svg-ring-${i}`);
        if (ringEl) {
            if (i <= ringsToReveal) {
                ringEl.classList.add('active');
            } else {
                ringEl.classList.remove('active');
            }
        }
    }
}

function updateRadarScan() {
    const normalizedAngle = currentClockAngle % 360;
    wordElementsArray.forEach(item => {
        let angleDiff = Math.abs(normalizedAngle - item.targetAngle);
        if (angleDiff > 180) angleDiff = 360 - angleDiff;

        if (angleDiff < 15) {
            item.element.classList.add('revealed');
        } else {
            item.element.classList.remove('revealed');
        }
    });
}

function animateClockAndRadar() {
    currentClockAngle = currentClockAngle + rotationSpeed;
    const container = document.querySelector('.clock-hand-container');
    if (container) {
        container.style.transition = 'none';
        container.style.transform = `translate(-50%, -100%) rotate(${currentClockAngle}deg)`;
    }
    updateRadarScan();
    animationFrameId = requestAnimationFrame(animateClockAndRadar);
}

function updateProgress() {
    const totalDiscoverable = activeWords.length;
    let percentage = totalDiscoverable > 0 ? Math.round((foundCount / totalDiscoverable) * 100) : 0;
    
    if (percentage > 100) percentage = 100;
    if (percentage < 0) percentage = 0;
    
    progressPercentage.innerText = `${percentage}%`;
    
    const activeOption = document.querySelector('#dropdown-options li.active');
    const currentTheme = activeOption ? activeOption.getAttribute('data-value') : 'all';

    if (cocoonContainer) {
        if (currentTheme === 'language') {
            cocoonContainer.setAttribute('data-stage', String(foundCount));
        } else {
            cocoonContainer.setAttribute('data-stage', '0');
        }
    }

    if (currentTheme === 'all' || currentTheme === 'beauty') {
        const newScale = 0.2 + (percentage / 100) * 1.5; 
        document.documentElement.style.setProperty('--bloom-scale', newScale);
        
        const maxRotationP1P5 = (percentage / 100) * 85; 
        const maxRotationP2P4 = (percentage / 100) * 45; 

        const p1 = document.querySelector('.petal-item.p1');
        const p2 = document.querySelector('.petal-item.p2');
        const p3 = document.querySelector('.petal-item.p3'); 
        const p4 = document.querySelector('.petal-item.p4');
        const p5 = document.querySelector('.petal-item.p5');

        if (p1) p1.style.transform = `translate(-50%, 0) rotate(${-maxRotationP1P5}deg)`;
        if (p2) p2.style.transform = `translate(-50%, 0) rotate(${-maxRotationP2P4}deg)`;
        if (p3) p3.style.transform = `translate(-50%, 0) rotate(0deg)`; 
        if (p4) p4.style.transform = `translate(-50%, 0) rotate(${maxRotationP2P4}deg)`;
        if (p5) p5.style.transform = `translate(-50%, 0) rotate(${maxRotationP1P5}deg)`;
    } 
    else {
        document.documentElement.style.removeProperty('--bloom-scale');
        const petals = document.querySelectorAll('.petal-item');
        petals.forEach(petal => {
            petal.style.transform = ''; 
        });
    }

    const handContainer = document.querySelector('.clock-hand-container');

    if (percentage === 100) {
        if (handContainer) handContainer.classList.add('all-found');

        if (currentTheme === 'beauty') {
            trigger100PercentSparkles();
        }
        if (currentTheme === 'time' && treeRingsContainer) {
            treeRingsContainer.classList.add('pulse-all');
        }
        
        if (currentTheme !== 'beauty' && currentTheme !== 'language') {
            if (!animationFrameId) {
                animateClockAndRadar();
            }
        }
    } 
    else {
        if (handContainer) handContainer.classList.remove('all-found');

        if (treeRingsContainer) {
            treeRingsContainer.classList.remove('pulse-all');
        }
        if (sparkleContainer) {
            sparkleContainer.innerHTML = '';
        }
        
        if (percentage === 0 || currentTheme === 'language') {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
            currentClockAngle = 0;
            const container = document.querySelector('.clock-hand-container');
            if (container) {
                container.style.transition = 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)';
            }
            setClockRotation(0);
        } else {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
            const container = document.querySelector('.clock-hand-container');
            if (container) {
                container.style.transition = 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)';
            }
            setClockRotation(currentClockAngle);
        }
        
        updateRadarScan();
    }
}

function trigger100PercentSparkles() {
    if (!sparkleContainer) return;
    sparkleContainer.innerHTML = ''; 

    const particleCount = 45; 
    for (let i = 0; i < particleCount; i++) {
        const dot = document.createElement('div');
        dot.classList.add('sparkle-dot');
        const size = Math.random() * 8 + 4;
        dot.style.width = `${size}px`;
        dot.style.height = `${size}px`;
        dot.style.left = `${Math.random() * 100}vw`;

        const duration = Math.random() * 4 + 3; 
        const delay = Math.random() * -6; 
        const drift = (Math.random() * 160) - 80; 
        const maxOpacity = Math.random() * 0.5 + 0.5; 

        dot.style.setProperty('--duration', `${duration}s`);
        dot.style.setProperty('--drift', `${drift}px`);
        dot.style.setProperty('--max-opacity', maxOpacity);
        dot.style.animationDelay = `${delay}s`;
        sparkleContainer.appendChild(dot);
    }
}

function addToPoemJournal(text) {
    const hint = poemList.querySelector('.hint');
    if (hint) hint.remove();

    const li = document.createElement('li');
    li.innerText = text;
    poemList.appendChild(li);
}

function removeFromPoemJournal(text) {
    if (!poemList) return;
    const items = poemList.querySelectorAll('li');
    for (let li of items) {
        if (li.innerText === text) {
            li.remove();
            break;
        }
    }
    if (poemList.querySelectorAll('li').length === 0) {
        const hint = document.createElement('li');
        hint.classList.add('hint');
        hint.innerText = "the lines you find will gather here...";
        poemList.appendChild(hint);
    }
}

// DROPDOWN MENU
const customDropdown = document.getElementById('custom-dropdown');
const dropdownSelected = document.getElementById('dropdown-selected');
const dropdownOptions = document.getElementById('dropdown-options');

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
        
        const flowerContainer = document.querySelector('.flower-container');
        if (flowerContainer) {
            flowerContainer.style.transition = 'none';
            document.documentElement.style.setProperty('--bloom-scale', '0.2');
        }

        centerVisual.classList.remove('hide-clock', 'hide-flower');
        document.body.classList.remove('beauty-cursor');
        document.body.classList.remove('show-language');
        
        const cContainer = document.querySelector('.constellation-container');
        if (cContainer) cContainer.classList.remove('show');
        resetConstellation();

        if (cocoonContainer) cocoonContainer.setAttribute('data-stage', '0');

        const handContainer = document.querySelector('.clock-hand-container');
        if (handContainer) handContainer.classList.remove('all-found');

        requestAnimationFrame(() => requestAnimationFrame(() => {
            if (flowerContainer) flowerContainer.style.transition = '';
        }));
        
        if (sparkleContainer) sparkleContainer.innerHTML = '';
        
        if (treeRingsContainer) {
            const allRings = treeRingsContainer.querySelectorAll('.svg-ring');
            allRings.forEach(ring => ring.classList.remove('active'));
            treeRingsContainer.classList.remove('pulse-all');
        }
        
        currentClockAngle = 0;
        isReversing = false; 
        
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        
        if (selectedTheme === 'all') {
            activeWords = [...poolOfWords];
        } else {
            activeWords = poolOfWords.filter(word => word.category === selectedTheme);
            
            if (selectedTheme === 'beauty') {
                centerVisual.classList.add('hide-clock');
                document.body.classList.add('beauty-cursor'); 
            } 
            else if (selectedTheme === 'time') {
                centerVisual.classList.add('hide-flower');
            }
            else if (selectedTheme === 'language') {
                centerVisual.classList.add('hide-clock', 'hide-flower');
                document.body.classList.add('show-language');
                if (cContainer) cContainer.classList.add('show');
            }
        }
        
        foundCount = 0;
        updateProgress();
        
        initOrbitLayout();
        initConstellationInteraction(); 
    });
});

window.addEventListener('click', () => {
    customDropdown.classList.remove('open');
});

window.addEventListener('DOMContentLoaded', () => {
    initOrbitLayout();
    initConstellationInteraction();
});

window.addEventListener('resize', () => {
    initOrbitLayout();
});

// INFORMATION PANEL
const infoBtn = document.getElementById('info-btn');
const infoPanelOverlay = document.getElementById('info-panel-overlay');
const infoCloseBtn = document.getElementById('info-close-btn');

if (infoBtn && infoPanelOverlay) {
    infoBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        infoPanelOverlay.classList.add('open');
    });
}

if (infoCloseBtn && infoPanelOverlay) {
    infoCloseBtn.addEventListener('click', () => {
        infoPanelOverlay.classList.remove('open');
    });
}

if (infoPanelOverlay) {
    infoPanelOverlay.addEventListener('click', (e) => {
        if (e.target === infoPanelOverlay) {
            infoPanelOverlay.classList.remove('open');
        }
    });
}

// ========== CONSTELLATION (LANGUAGE THEME) ==========

let constellationBound = false;

function initConstellationInteraction() {
    if (constellationBound) return;

    const starsGroup = document.getElementById('stars-group')
        || document.querySelector('.constellation-stars');

    if (!starsGroup) return;

    starsGroup.addEventListener('click', (e) => {
        const targetStar = e.target.closest('.constellation-star');
        if (!targetStar) return;

        playClickSound(); // SOUND
        e.stopPropagation();

        if (targetStar.classList.contains('activated-star')) return;

        targetStar.classList.add('activated-star');

        const allStars = Array.from(starsGroup.querySelectorAll('.constellation-star'));
        const clickedIndex = allStars.indexOf(targetStar);

        const allLabels = document.querySelectorAll('.constellation-labels text');
        if (allLabels[clickedIndex]) {
            allLabels[clickedIndex].classList.add('show-label');
        }

        const allLines = document.querySelectorAll('.constellation-lines line');
        allLines.forEach(line => {
            const pair = line.getAttribute('data-pair');
            if (!pair) return;
            const parts = pair.split('-').map(Number);
            const a = parts[0], b = parts[1];
            if (allStars[a] && allStars[b] &&
                allStars[a].classList.contains('activated-star') &&
                allStars[b].classList.contains('activated-star')) {
                line.classList.add('show-line');
            }
        });

        const activatedCount = starsGroup.querySelectorAll('.constellation-star.activated-star').length;
        const percentage = Math.round((activatedCount / allStars.length) * 100);

        const hudProgress = document.getElementById('progress-percentage');
        if (hudProgress) {
            hudProgress.innerText = `${percentage}%`;
        }

        const cContainer = document.querySelector('.constellation-container');
        if (activatedCount === allStars.length && cContainer) {
            cContainer.classList.add('breathing');
        }
    });

    constellationBound = true;
}

function resetConstellation() {
    const cContainer = document.querySelector('.constellation-container');
    if (cContainer) cContainer.classList.remove('breathing');

    const hudProgress = document.getElementById('progress-percentage');
    if (hudProgress) hudProgress.innerText = `0%`;
}

// TỰ ĐỘNG ĐÓN NHẬN TÍN HIỆU ĐIỀU HƯỚNG THEME TỪ TRANG CHỦ
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const receivedTheme = urlParams.get('theme');

    if (receivedTheme) {
        const matchedOption = document.querySelector(`#dropdown-options li[data-value="${receivedTheme}"]`);
        if (matchedOption) {
            matchedOption.click(); 
        }
    }
});