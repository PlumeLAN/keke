// 配置对象
const defaultConfig = {
    background: 'assets/backgrounds/default.jpg',
    apiBaseUrl: 'http://localhost:5000/api',
    portfolioImages: [],
    socialLinks: {},
    portfolio: {
        autoPlay: true,
        autoPlayInterval: 4000
    }
};
let config = {...defaultConfig};

let translations = {};
let currentLanguage = 'zh';

// 点赞相关配置
let likeCount = 0;
let currentEmojiIndex = 0;
const EMOJI_FRAME_COUNT = 5;
const MIN_AUTOPLAY_INTERVAL = 1000;

// 初始化函数
document.addEventListener('DOMContentLoaded', async () => {
    await initConfig();
    await initLanguage();
    initBackground();
    initPlatformLinks();
    initLanguageSwitcher();
    initThemeToggle();
    initPlatformCards();
    await initLikeButton();
    initGalleryCarousel();
});

// 加载站点配置
async function initConfig() {
    try {
        const response = await fetch('config.json');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const siteConfig = await response.json();
        config = {
            ...defaultConfig,
            ...siteConfig,
            portfolio: {
                ...defaultConfig.portfolio,
                ...(siteConfig.portfolio || {})
            }
        };
    } catch (error) {
        console.error('Failed to load config file:', error);
        config = {...defaultConfig};
    }
}

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
    const background = isSafeAssetPath(config.background) ? config.background : defaultConfig.background;
    bgContainer.style.backgroundImage = `url('${background}')`;
}

function initPlatformLinks() {
    const socialLinks = {
        ...config.socialLinks,
        twitter: config.socialLinks?.twitter || config.socialLinks?.x
    };

    document.querySelectorAll('.platform-card').forEach(card => {
        const platform = card.dataset.platform;
        const link = card.querySelector('.card-link');

        if (platform && link && socialLinks[platform]) {
            link.href = socialLinks[platform];
        }
    });
}

function isSafeAssetPath(value) {
    return typeof value === 'string' && /^assets\/[A-Za-z0-9/_.-]+$/.test(value);
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
    renderLikeState({
        likeCountEl,
        likeEmojisEl,
        hintText
    });
    
    // 点赞按钮点击事件
    likeBtn.addEventListener('click', async () => {
        const previousEmojiIndex = currentEmojiIndex;
        likeBtn.disabled = true;

        try {
            const response = await fetch(`${config.apiBaseUrl}/likes`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({action: 'like'})
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            likeCount = data.likeCount;
            currentEmojiIndex = Math.min(data.emojiIndex, EMOJI_FRAME_COUNT);
            renderLikeState({
                likeCountEl,
                likeEmojisEl,
                hintText
            });

            if (previousEmojiIndex === EMOJI_FRAME_COUNT && currentEmojiIndex === EMOJI_FRAME_COUNT) {
                animateCurrentEmoji(likeEmojisEl);
            }
        } catch (error) {
            console.error('Failed to update likes:', error);
        } finally {
            likeBtn.disabled = false;
        }

        likeBtn.style.transform = 'scale(1.2)';
        setTimeout(() => {
            likeBtn.style.transform = 'scale(1)';
        }, 200);
    });
}

function renderLikeState({likeCountEl, likeEmojisEl, hintText}) {
    likeCountEl.textContent = likeCount;
    likeEmojisEl.querySelectorAll('.emoji-img').forEach(emoji => emoji.remove());

    if (currentEmojiIndex > 0) {
        if (hintText) {
            hintText.style.display = 'none';
        }
        addEmojiToDisplay(likeEmojisEl, currentEmojiIndex);
        return;
    }

    if (hintText) {
        hintText.style.display = '';
        likeEmojisEl.appendChild(hintText);
    }
}

function animateCurrentEmoji(container) {
    const currentEmoji = container.querySelector('.emoji-img');
    if (!currentEmoji) return;

    currentEmoji.style.animation = 'fadeOutLeft 0.3s ease forwards';
    setTimeout(() => {
        currentEmoji.style.animation = 'fadeInRight 0.3s ease';
    }, 300);
}

function addEmojiToDisplay(container, index) {
    const emojiImg = document.createElement('img');
    emojiImg.src = `assets/icons/emoji${index}.png`;
    emojiImg.alt = `表情${index}`;
    emojiImg.className = 'emoji-img';
    emojiImg.style.animation = 'fadeInRight 0.3s ease';
    container.appendChild(emojiImg);
}

// 作品轮播功能
let currentSlide = 0;
let totalSlides = 0;
let autoPlayInterval;

function initGalleryCarousel() {
    renderPortfolioSlides();

    const slides = document.querySelectorAll('.carousel-slide');
    const dotsContainer = document.getElementById('carouselDots');
    const prevBtn = document.getElementById('carouselPrev');
    const nextBtn = document.getElementById('carouselNext');

    if (slides.length === 0) return;

    totalSlides = slides.length;
    currentSlide = Math.min(currentSlide, totalSlides - 1);
    dotsContainer.innerHTML = '';

    // 创建指示点
    slides.forEach((_, index) => {
        const dot = document.createElement('span');
        dot.className = 'carousel-dot' + (index === currentSlide ? ' active' : '');
        dot.addEventListener('click', () => goToSlide(index));
        dotsContainer.appendChild(dot);
    });

    slides.forEach((slide, index) => {
        slide.classList.toggle('active', index === currentSlide);
    });

    // 左右按钮点击事件
    prevBtn.addEventListener('click', prevSlide);
    nextBtn.addEventListener('click', nextSlide);

    // 触摸滑动支持
    let touchStartX = 0;
    let touchEndX = 0;

    const carousel = document.querySelector('.gallery-carousel');
    carousel.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });

    carousel.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        if (touchStartX - touchEndX > 50) {
            nextSlide();
        } else if (touchEndX - touchStartX > 50) {
            prevSlide();
        }
    });

    // 自动播放
    startAutoPlay();
}

function renderPortfolioSlides() {
    if (!Array.isArray(config.portfolioImages) || config.portfolioImages.length === 0) {
        return;
    }

    const slidesContainer = document.querySelector('.carousel-slides');
    if (!slidesContainer) return;

    const images = config.portfolioImages.filter(isSafeAssetPath);
    if (images.length === 0) {
        console.warn('No valid portfolio images found in config.json');
        return;
    }

    const galleryItemAlt = translations['gallery-item-alt'] || 'Artwork';

    slidesContainer.replaceChildren(
        ...images.map((image, index) => {
            const slide = document.createElement('div');
            slide.className = `carousel-slide${index === 0 ? ' active' : ''}`;

            const img = document.createElement('img');
            img.src = image;
            img.alt = `${galleryItemAlt} ${index + 1}`;

            slide.appendChild(img);
            return slide;
        })
    );
}

function goToSlide(index) {
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.carousel-dot');

    slides[currentSlide].classList.remove('active');
    dots[currentSlide].classList.remove('active');

    currentSlide = index;
    if (currentSlide >= totalSlides) currentSlide = 0;
    if (currentSlide < 0) currentSlide = totalSlides - 1;

    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
}

function nextSlide() {
    goToSlide((currentSlide + 1) % totalSlides);
}

function prevSlide() {
    goToSlide((currentSlide - 1 + totalSlides) % totalSlides);
}

function startAutoPlay() {
    clearInterval(autoPlayInterval);

    if (!config.portfolio?.autoPlay || totalSlides <= 1) {
        return;
    }

    autoPlayInterval = setInterval(
        nextSlide,
        Math.max(Number(config.portfolio.autoPlayInterval) || 4000, MIN_AUTOPLAY_INTERVAL)
    );
}

// 返回顶部功能
window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
        // 可以在这里添加返回顶部按钮的显示逻辑
    }
});
