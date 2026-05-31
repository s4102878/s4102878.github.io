// Phân loại các nhóm chữ dựa theo ý tưởng tài liệu
let isReversing = false; // Biến cờ kiểm soát trạng thái thu hồi ngược
const poolOfWords = [
    { text: "stumble upon words, once found, cannot be forgotten", category: "language" },
    { text: "excavated slowly?", category: "time" },
    { text: "maybe it is our choice what to keep", category: "language" },
    { text: "searching takes time", category: "time" },
    { text: "patience", category: "time" },
    { text: "what we find will follow us", category: "language" },
    { text: "formation", category: "beauty" },
    { text: "tree rings", category: "time" },
    { text: "gradual unveiling", category: "beauty" },
    { text: "temporal", category: "time" },
    { text: "floral blooming", category: "beauty" },
    { text: "budding", category: "beauty" },
    { text: "slow", category: "beauty" },
    { text: "honestly", category: "language" },
    { text: "tell me a story", category: "language" },
    { text: "something", category: "language" }
];

let activeWords = [...poolOfWords]; // Tập hợp các từ hiện tại đang hiển thị
let foundCount = 0;
const diggingZone = document.getElementById('digging-zone');
const poemList = document.getElementById('poem-list');
const progressPercentage = document.getElementById('progress-percentage');
const centerVisual = document.getElementById('center-visual');
const sparkleContainer = document.getElementById('sparkle-container'); 
const treeRingsContainer = document.getElementById('tree-rings-container'); // Container vân gỗ

let wordElementsArray = []; 
let animationFrameId;
let currentClockAngle = 0; 
const rotationSpeed = 0.3; 

function initOrbitLayout() {
    wordElementsArray = []; 
    diggingZone.innerHTML = ''; 
    
    const totalWords = activeWords.length;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const radius = 220; 

    activeWords.forEach((item, index) => {
        const wordEl = document.createElement('span');
        wordEl.innerText = item.text;
        wordEl.classList.add('excavated-word');
        
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
            const totalDiscoverable = activeWords.length;
            if (totalDiscoverable === 0) return;

            let currentPercentage = Math.round((foundCount / totalDiscoverable) * 100);

            // BẬT CHẾ ĐỘ THU HỒI NGƯỢC: Khi chạm ngưỡng đỉnh điểm 100%
            if (currentPercentage === 100) {
                isReversing = true;
            }

            // ==========================================================================
            // QUY TRÌNH 1: KHAI QUẬT (XUÔI) - Chạy khi isReversing đang là false
            // ==========================================================================
            if (!isReversing) {
                if (!wordEl.classList.contains('found') && foundCount < totalDiscoverable) {
                    wordEl.classList.add('found');
                    foundCount++;
                    
                    const nextPercentage = Math.round((foundCount / totalDiscoverable) * 100);
                    if (nextPercentage < 100) {
                        currentClockAngle = angleDegree;
                        const clockHand = document.querySelector('.clock-hand');
                        if (clockHand) {
                            clockHand.style.transform = `rotate(${currentClockAngle}deg)`;
                        }
                    }

                    // Tạo vòng gỗ nếu ở chế độ TIME
                    const activeOption = document.querySelector('#dropdown-options li.active');
                    const currentTheme = activeOption ? activeOption.getAttribute('data-value') : 'all';
                    if (currentTheme === 'time') {
                        createTreeRing(foundCount);
                    }

                    updateProgress();
                    addToPoemJournal(item.text);
                }
            } 
            // ==========================================================================
            // QUY TRÌNH 2: THU HỒI (NGƯỢC ĐẾN 0%) - Chạy khi isReversing đã bật thành true
            // ==========================================================================
            else {
                if (wordEl.classList.contains('found')) {
                    // 1. Gỡ class found để chữ mờ lại như cũ
                    wordEl.classList.remove('found');
                    
                    // 2. Giảm số lượng từ tìm thấy
                    foundCount--;

                    // 3. Xóa vòng gỗ ngoài cùng nếu ở chế độ TIME
                    if (treeRingsContainer && treeRingsContainer.lastChild) {
                        treeRingsContainer.removeChild(treeRingsContainer.lastChild);
                    }

                    // 4. Cập nhật tiến độ, co hoa, và xóa thơ
                    updateProgress();
                    removeFromPoemJournal(item.text);

                    // 5. Tính toán lại phần trăm sau khi giảm để check mốc 0%
                    let newPercentage = Math.round((foundCount / totalDiscoverable) * 100);
                    
                    // Khi đã thu hồi hoàn toàn về tận 0%, tắt hẳn trạng thái thu hồi ngược để chơi lại từ đầu
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

    const clockHand = document.querySelector('.clock-hand');
    if (clockHand && !animationFrameId) {
        clockHand.style.transform = `rotate(${currentClockAngle}deg)`;
    }

    updateRadarScan();
}

function createTreeRing(ringIndex) {
    if (!treeRingsContainer) return;
    const ring = document.createElement('div');
    ring.classList.add('tree-ring');
    const ringSize = 16 + (ringIndex * 45); 
    ring.style.setProperty('--ring-size', `${ringSize}px`);
    ring.style.setProperty('--ring-index', ringIndex);
    treeRingsContainer.appendChild(ring);
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
    const clockHand = document.querySelector('.clock-hand');
    if (clockHand) {
        clockHand.style.transform = `rotate(${currentClockAngle}deg)`;
    }
    updateRadarScan();
    animationFrameId = requestAnimationFrame(animateClockAndRadar);
}

// ==========================================================================
// CẬP NHẬT HÀM TIẾN TRÌNH: HỖ TRỢ CO GIÃN ĐỘNG THEO CẢ 2 CHIỀU TĂNG/GIẢM
// ==========================================================================
function updateProgress() {
    const totalDiscoverable = activeWords.length;
    let percentage = totalDiscoverable > 0 ? Math.round((foundCount / totalDiscoverable) * 100) : 0;
    
    if (percentage > 100) percentage = 100;
    if (percentage < 0) percentage = 0;
    
    progressPercentage.innerText = `${percentage}%`;
    
    // Thu hồi/Xòe kích thước bông hoa tịnh tiến chuẩn xác theo percentage
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

    const activeOption = document.querySelector('#dropdown-options li.active');
    const currentTheme = activeOption ? activeOption.getAttribute('data-value') : 'all';

    // Xử lý kích hoạt trạng thái đỉnh điểm 100%
    if (percentage === 100) {
        if (currentTheme === 'beauty') {
            trigger100PercentSparkles();
        }
        if (currentTheme === 'time' && treeRingsContainer) {
            treeRingsContainer.classList.add('pulse-all');
        }
        if (!animationFrameId) {
            animateClockAndRadar();
        }
    } 
    // Khi rớt khỏi mốc 100% (Quy trình thu hồi ngược đang diễn ra)
    else {
        // Tắt hiệu ứng mạch đập gợn sóng của vân gỗ
        if (treeRingsContainer) {
            treeRingsContainer.classList.remove('pulse-all');
        }
        // Dọn sạch đốm sáng lấp lánh
        if (sparkleContainer) {
            sparkleContainer.innerHTML = '';
        }
        // NẾU GIẢM HOÀN TOÀN VỀ 0%: Dừng kim đồng hồ quay liên tục và reset góc kim về thẳng đứng
        if (percentage === 0) {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
            currentClockAngle = 0;
            const clockHand = document.querySelector('.clock-hand');
            if (clockHand) {
                clockHand.style.transform = `rotate(0deg)`;
            }
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

// ==========================================================================
// DROPDOWN MENU & RESET TRẠNG THÁI KHÔNG GIAN
// ==========================================================================
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
        
        centerVisual.classList.remove('hide-clock', 'hide-flower');
        document.body.classList.remove('beauty-cursor');
        
        if (sparkleContainer) sparkleContainer.innerHTML = '';
        if (treeRingsContainer) {
            treeRingsContainer.innerHTML = '';
            treeRingsContainer.classList.remove('pulse-all');
        }
        
        currentClockAngle = 0;
        isReversing = false; // ĐÃ SỬA: Khởi tạo lại cờ ngược về mặc định khi người dùng chuyển đổi theme menu
        
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
            }
        }
        
        foundCount = 0;
        updateProgress();
        initOrbitLayout();
    });
});

window.addEventListener('click', () => {
    customDropdown.classList.remove('open');
});

window.addEventListener('DOMContentLoaded', initOrbitLayout);
window.addEventListener('resize', () => {
    initOrbitLayout();
});

// ==========================================================================
// LOGIC ĐIỀU KHIỂN SỰ KIỆN ẨN / HIỆN INFORMATION PANEL
// ==========================================================================
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