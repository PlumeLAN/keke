// 配置对象
const config = {
    background: 'assets/backgrounds/default.jpg',
    apiBaseUrl: 'http://localhost:5000/api'
};

let translations = {};
let currentLanguage = 'zh';

// 点赞相关配置
let likeCount = 0;
let currentEmojiIndex = 0;
const maxEmojis = 5;

// 初始化函数
document.addEventListener('DOMContentLoaded', async () => {
    await initLanguage();
    initBackground();
    initLanguageSwitcher();
    initThemeToggle();
    initPlatformCards();
    initStatObserver();
    await initLikeButton();
});

// 加载语言文件
async function initLanguage() {
    try {
        const response = await fetch(`i18n/${currentLanguage}.json`);
        translations = await response.json();
        updateLanguage();
    } catch (error) {
        console.error('Failed to load language file:', error);
    }
}

// 更新语言
function updateLanguage() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (translations[key]) {
            el.textContent = translations[key];
        }
    });
    
    // 更新点赞区域的文本
    const likeTitle = document.querySelector('.like-section h2');
    const hintText = document.getElementById('hintText');
    if (likeTitle && translations['like-title']) {
        likeTitle.textContent = translations['like-title'];
    }
    if (hintText && translations['like-hint']) {
        hintText.textContent = translations['like-hint'];
    }
}

// 语言切换
function initLanguageSwitcher() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentLanguage = e.target.dataset.lang;
            localStorage.setItem('language', currentLanguage);
            await initLanguage();
        });
    });
    
    // 恢复语言设置
    const savedLang = localStorage.getItem('language');
    if (savedLang) {
        currentLanguage = savedLang;
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.lang === currentLanguage) {
                btn.classList.add('active');
            }
        });
    }
}

// 初始化背景
function initBackground() {
    const bgContainer = document.getElementById('bgContainer');
    bgContainer.style.backgroundImage = `url('${config.background}')`;
}

// 主题切换
function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('theme') || 'light';
    
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggle.querySelector('.theme-icon').textContent = '☀️';
    }
    
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        themeToggle.querySelector('.theme-icon').textContent = newTheme === 'dark' ? '☀️' : '🌙';
    });
}

// 平滑滚动
function scrollTo(selector) {
    const element = document.querySelector(selector);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

window.scrollTo = scrollTo;

// 平台卡片交互效果
function initPlatformCards() {
    const platformCards = document.querySelectorAll('.platform-card');
    
    platformCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-12px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
}

// 统计数据动画
function animateCounter(element, finalValue, duration = 1000) {
    const startValue = 0;
    const startTime = Date.now();
    
    const updateCounter = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const match = finalValue.match(/(\d+\.?\d*)/);
        if (match) {
            const numericValue = parseFloat(match[0]);
            const currentValue = startValue + (numericValue - startValue) * progress;
            const unit = finalValue.replace(/[\d.]/g, '');
            element.textContent = currentValue.toFixed(1) + unit;
        }
        
        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        }
    };
    
    updateCounter();
}

// 观察统计卡片
function initStatObserver() {
    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && entry.target.classList.contains('stat-card')) {
                const numberElement = entry.target.querySelector('.stat-number');
                if (numberElement && !numberElement.animated) {
                    animateCounter(numberElement, numberElement.textContent);
                    numberElement.animated = true;
                }
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.stat-card').forEach(card => {
        observer.observe(card);
    });
}

// 点赞功能
async function initLikeButton() {
    const likeBtn = document.getElementById('likeBtn');
    const likeCountEl = document.getElementById('likeCount');
    const likeEmojisEl = document.getElementById('likeEmojis');
    const hintText = document.getElementById('hintText');
    
    // 从 API 获取点赞数据
    try {
        const response = await fetch(`${config.apiBaseUrl}/likes`);
        const data = await response.json();
        likeCount = data.likeCount;
        currentEmojiIndex = data.emojiIndex;
    } catch (error) {
        console.error('Failed to fetch likes:', error);
        likeCount = 0;
        currentEmojiIndex = 0;
    }
    
    // 初始化显示
    likeCountEl.textContent = likeCount;
    
    // 恢复之前显示的表情
    if (currentEmojiIndex > 0) {
        if (hintText) {
            hintText.style.display = 'none';
        }
        addEmojiToDisplay(likeEmojisEl, currentEmojiIndex);
    }
    
    // 点赞按钮点击事件
    likeBtn.addEventListener('click', async () => {
        // 移除提示文字
        if (hintText) {
            hintText.style.display = 'none';
        }
        
        if (currentEmojiIndex === 0) {
            // 当前没有显示，显示第一张
            currentEmojiIndex = 1;
            likeCount++;
            addEmojiToDisplay(likeEmojisEl, currentEmojiIndex);
        } else if (currentEmojiIndex < maxEmojis) {
            // 有显示，且不是最后一张，切换到下一张
            likeEmojisEl.innerHTML = '';
            currentEmojiIndex++;
            likeCount++;
            addEmojiToDisplay(likeEmojisEl, currentEmojiIndex);
        } else {
            // 当前显示第5张，刷新效果
            likeCount++;
            
            // 淡出
            const currentEmoji = likeEmojisEl.querySelector('.emoji-img');
            if (currentEmoji) {
                currentEmoji.style.animation = 'fadeOutLeft 0.3s ease forwards';
                
                // 淡出后淡入
                setTimeout(() => {
                    currentEmoji.style.animation = 'fadeInRight 0.3s ease';
                }, 300);
            }
        }
        
        // 更新到 API
        try {
            await fetch(`${config.apiBaseUrl}/likes`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({action: 'like'})
            });
        } catch (error) {
            console.error('Failed to update likes:', error);
        }
        
        // 更新显示
        likeCountEl.textContent = likeCount;
        
        // 添加动画效果
        likeBtn.style.transform = 'scale(1.2)';
        setTimeout(() => {
            likeBtn.style.transform = 'scale(1)';
        }, 200);
    });
}

function addEmojiToDisplay(container, index) {
    const emojiImg = document.createElement('img');
    emojiImg.src = `assets/icons/emoji${index}.png`;
    emojiImg.alt = `表情${index}`;
    emojiImg.className = 'emoji-img';
    emojiImg.style.animation = 'fadeInRight 0.3s ease';
    container.appendChild(emojiImg);
}

// 返回顶部功能
window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
        // 可以在这里添加返回顶部按钮的显示逻辑
    }
});
