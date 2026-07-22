const defaultConfig = {
    siteName: 'PlumeLAN',
    background: 'assets/backgrounds/default.jpg',
    portfolioImages: [
        'assets/portfolio/work1.jpg',
        'assets/portfolio/work2.jpg',
        'assets/portfolio/work3.jpg',
        'assets/portfolio/work4.jpg',
        'assets/portfolio/work5.jpg'
    ],
    socialLinks: {
        pixiv: '',
        bilibili: '',
        twitter: '',
        fanbox: '',
        discord: ''
    },
    portfolio: {
        autoPlay: true,
        autoPlayInterval: 5000
    },
    apiBaseUrl: 'auto'
};

let siteConfig = {
    ...defaultConfig,
    socialLinks: { ...defaultConfig.socialLinks },
    portfolio: { ...defaultConfig.portfolio }
};
let translations = {};
let currentLanguage = 'zh';

let likeCount = 0;
let currentEmojiIndex = 0;
const maxEmojis = 5;
let likeRequestPending = false;
let currentSlide = 0;
let totalSlides = 0;
let autoPlayInterval;

document.addEventListener('DOMContentLoaded', async () => {
    currentLanguage = localStorage.getItem('language') || currentLanguage;

    await loadSiteConfig();
    await initLanguage();
    initLanguageSwitcher();
    initThemeToggle();
    initBackground();
    applyConfiguredLinks();
    await initLikeButton();
    initGalleryCarousel();
});

async function loadSiteConfig() {
    try {
        const response = await fetch('config.json', { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`Failed to load config: ${response.status}`);
        }

        const loadedConfig = await response.json();
        siteConfig = {
            ...defaultConfig,
            ...loadedConfig,
            socialLinks: {
                ...defaultConfig.socialLinks,
                ...loadedConfig.socialLinks
            },
            portfolio: {
                ...defaultConfig.portfolio,
                ...loadedConfig.portfolio
            }
        };
    } catch (error) {
        console.error('Failed to load config.json:', error);
    }

    siteConfig.apiBaseUrl = resolveApiBaseUrl(siteConfig.apiBaseUrl);
    document.title = `${siteConfig.siteName} - 个人网站`;
}

function resolveApiBaseUrl(value) {
    if (value && value !== 'auto') {
        return value.replace(/\/$/, '');
    }

    const { protocol, hostname, port, origin } = window.location;
    const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';

    if ((protocol === 'http:' || protocol === 'https:') && isLocalHost && port && port !== '5000') {
        return `${protocol}//${hostname}:5000/api`;
    }

    if (protocol === 'http:' || protocol === 'https:') {
        return new URL('/api', origin).toString().replace(/\/$/, '');
    }

    return '/api';
}

async function initLanguage() {
    try {
        const response = await fetch(`i18n/${currentLanguage}.json`);
        if (!response.ok) {
            throw new Error(`Failed to load language file: ${response.status}`);
        }
        translations = await response.json();
        updateLanguage();
    } catch (error) {
        console.error('Failed to load language file:', error);
    }
}

function updateLanguage() {
    document.documentElement.lang = currentLanguage;
    document.querySelectorAll('[data-i18n]').forEach((el) => {
        const key = el.dataset.i18n;
        if (translations[key]) {
            el.textContent = translations[key];
        }
    });
}

function initLanguageSwitcher() {
    updateLanguageSwitcherState();

    document.querySelectorAll('.lang-btn').forEach((btn) => {
        btn.addEventListener('click', async (event) => {
            currentLanguage = event.currentTarget.dataset.lang;
            localStorage.setItem('language', currentLanguage);
            updateLanguageSwitcherState();
            await initLanguage();
        });
    });
}

function updateLanguageSwitcherState() {
    document.querySelectorAll('.lang-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.lang === currentLanguage);
    });
}

function initBackground() {
    const bgContainer = document.getElementById('bgContainer');
    if (bgContainer) {
        bgContainer.style.backgroundImage = `url('${siteConfig.background}')`;
    }
}

function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) {
        return;
    }

    const savedTheme = localStorage.getItem('theme') || 'light';
    const themeIcon = themeToggle.querySelector('.theme-icon');

    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }

    if (themeIcon) {
        themeIcon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    }

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);

        if (themeIcon) {
            themeIcon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
        }
    });
}

function applyConfiguredLinks() {
    document.querySelectorAll('[data-social-link]').forEach((link) => {
        const href = siteConfig.socialLinks[link.dataset.socialLink];
        if (isSafeExternalUrl(href)) {
            link.href = href;
            link.rel = 'noopener noreferrer';
        } else {
            link.removeAttribute('href');
            link.setAttribute('aria-disabled', 'true');
        }
    });
}

function isSafeExternalUrl(value) {
    try {
        const url = new URL(value);
        return url.protocol === 'https:' || url.protocol === 'http:';
    } catch {
        return false;
    }
}

async function initLikeButton() {
    const likeBtn = document.getElementById('likeBtn');
    const likeCountEl = document.getElementById('likeCount');
    const likeEmojisEl = document.getElementById('likeEmojis');
    const hintText = document.getElementById('hintText');

    if (!likeBtn || !likeCountEl || !likeEmojisEl) {
        return;
    }

    try {
        applyLikeState(await requestLikes());
    } catch (error) {
        console.error('Failed to fetch likes:', error);
        likeBtn.disabled = true;
        likeBtn.title = '点赞服务不可用';
    }

    renderLikeState(likeCountEl, likeEmojisEl, hintText);

    likeBtn.addEventListener('click', async () => {
        if (likeRequestPending) {
            return;
        }

        likeRequestPending = true;
        likeBtn.disabled = true;
        try {
            const response = await fetch(`${siteConfig.apiBaseUrl}/likes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'like' })
            });
            if (!response.ok) {
                throw new Error(`Failed to update likes: ${response.status}`);
            }

            applyLikeState(await response.json());
            renderLikeState(likeCountEl, likeEmojisEl, hintText);
            likeBtn.style.transform = 'scale(1.2)';
            setTimeout(() => {
                likeBtn.style.transform = 'scale(1)';
            }, 200);
        } catch (error) {
            console.error('Failed to update likes:', error);
        } finally {
            likeRequestPending = false;
            likeBtn.disabled = false;
        }
    });
}

async function requestLikes() {
    const response = await fetch(`${siteConfig.apiBaseUrl}/likes`);
    if (!response.ok) {
        throw new Error(`Failed to fetch likes: ${response.status}`);
    }
    return response.json();
}

function applyLikeState(data) {
    if (!data || !Number.isSafeInteger(data.likeCount) || !Number.isSafeInteger(data.emojiIndex)) {
        throw new Error('Invalid likes response');
    }

    likeCount = Math.max(data.likeCount, 0);
    currentEmojiIndex = Math.min(Math.max(data.emojiIndex, 0), maxEmojis);
}

function renderLikeState(likeCountEl, likeEmojisEl, hintText) {
    likeCountEl.textContent = String(likeCount);
    likeEmojisEl.querySelector('.emoji-img')?.remove();

    if (currentEmojiIndex > 0) {
        if (hintText) {
            hintText.style.display = 'none';
        }
        addEmojiToDisplay(likeEmojisEl, currentEmojiIndex);
    } else if (hintText) {
        hintText.style.display = '';
    }
}

function addEmojiToDisplay(container, index) {
    const emojiImg = document.createElement('img');
    emojiImg.src = `assets/icons/emoji${index}.png`;
    emojiImg.alt = `表情${index}`;
    emojiImg.className = 'emoji-img';
    emojiImg.style.animation = 'fadeInRight 0.3s ease';
    container.appendChild(emojiImg);
}

function initGalleryCarousel() {
    const slidesContainer = document.getElementById('carouselSlides');
    const dotsContainer = document.getElementById('carouselDots');
    const prevBtn = document.getElementById('carouselPrev');
    const nextBtn = document.getElementById('carouselNext');
    const carousel = document.querySelector('.gallery-carousel');

    if (!slidesContainer || !dotsContainer || !prevBtn || !nextBtn || !carousel) {
        return;
    }

    const images = Array.isArray(siteConfig.portfolioImages) && siteConfig.portfolioImages.length > 0
        ? siteConfig.portfolioImages
        : defaultConfig.portfolioImages;

    slidesContainer.innerHTML = '';
    dotsContainer.innerHTML = '';
    currentSlide = 0;

    images.forEach((image, index) => {
        const slide = document.createElement('div');
        slide.className = `carousel-slide${index === 0 ? ' active' : ''}`;

        const img = document.createElement('img');
        img.src = image;
        img.alt = `${siteConfig.siteName} artwork ${index + 1}`;

        slide.appendChild(img);
        slidesContainer.appendChild(slide);

        const dot = document.createElement('span');
        dot.className = `carousel-dot${index === 0 ? ' active' : ''}`;
        dot.addEventListener('click', () => goToSlide(index));
        dotsContainer.appendChild(dot);
    });

    totalSlides = images.length;
    const showControls = totalSlides > 1;
    prevBtn.hidden = !showControls;
    nextBtn.hidden = !showControls;
    dotsContainer.hidden = !showControls;

    prevBtn.addEventListener('click', prevSlide);
    nextBtn.addEventListener('click', nextSlide);

    let touchStartX = 0;
    let touchEndX = 0;

    carousel.addEventListener('touchstart', (event) => {
        touchStartX = event.changedTouches[0].screenX;
    });

    carousel.addEventListener('touchend', (event) => {
        touchEndX = event.changedTouches[0].screenX;
        if (touchStartX - touchEndX > 50) {
            nextSlide();
        } else if (touchEndX - touchStartX > 50) {
            prevSlide();
        }
    });

    if (siteConfig.portfolio.autoPlay && totalSlides > 1) {
        startAutoPlay();
    } else {
        clearInterval(autoPlayInterval);
    }
}

function goToSlide(index) {
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.carousel-dot');

    if (!slides.length || !dots.length) {
        return;
    }

    slides[currentSlide].classList.remove('active');
    dots[currentSlide].classList.remove('active');

    currentSlide = index;
    if (currentSlide >= totalSlides) {
        currentSlide = 0;
    }
    if (currentSlide < 0) {
        currentSlide = totalSlides - 1;
    }

    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
}

function nextSlide() {
    if (totalSlides > 1) {
        goToSlide((currentSlide + 1) % totalSlides);
    }
}

function prevSlide() {
    if (totalSlides > 1) {
        goToSlide((currentSlide - 1 + totalSlides) % totalSlides);
    }
}

function startAutoPlay() {
    clearInterval(autoPlayInterval);
    autoPlayInterval = setInterval(nextSlide, Number(siteConfig.portfolio.autoPlayInterval) || 5000);
}
