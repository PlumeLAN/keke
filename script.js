// 配置对象
const config = {
    background: 'assets/backgrounds/default.jpg',
    portfolioImages: [
        'assets/portfolio/work1.jpg',
        'assets/portfolio/work2.jpg',
        'assets/portfolio/work3.jpg',
        'assets/portfolio/work4.jpg',
        'assets/portfolio/work5.jpg'
    ],
    socialLinks: {
        github: 'https://github.com/PlumeLAN',
        twitter: 'https://twitter.com/yourhandle',
        bilibili: 'https://space.bilibili.com/yourid',
        email: 'mailto:your.email@example.com'
    }
};

// 多语言配置
const translations = {
    zh: {
        intro: '欢迎来到我的个人网站，这里展示我的作品和想法',
        portfolio: '我的作品'
    },
    en: {
        intro: 'Welcome to my personal website, showcasing my works and thoughts',
        portfolio: 'My Portfolio'
    }
};

let currentLanguage = 'zh';
let currentCarouselIndex = 0;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initBackground();
    initCarousel();
    initLanguageSwitcher();
    initSocialLinks();
});

// 初始化背景
function initBackground() {
    const bgContainer = document.getElementById('bgContainer');
    bgContainer.style.backgroundImage = `url('${config.background}')`;
}

// 初始化轮播
function initCarousel() {
    const carousel = document.getElementById('carousel');
    const dotsContainer = document.getElementById('dots');
    
    // 创建轮播项
    config.portfolioImages.forEach((img, index) => {
        const item = document.createElement('div');
        item.className = 'carousel-item';
        item.innerHTML = `<img src="${img}" alt="作品 ${index + 1}" />`;
        carousel.appendChild(item);
        
        // 创建圆点
        const dot = document.createElement('div');
        dot.className = 'dot' + (index === 0 ? ' active' : '');
        dot.onclick = () => goToSlide(index);
        dotsContainer.appendChild(dot);
    });
    
    // 按钮事件
    document.getElementById('prevBtn').onclick = () => previousSlide();
    document.getElementById('nextBtn').onclick = () => nextSlide();
    
    // 自动播放（可选）
    setInterval(nextSlide, 5000);
}

// 切换到指定幻灯片
function goToSlide(index) {
    const carousel = document.getElementById('carousel');
    const dots = document.querySelectorAll('.dot');
    
    currentCarouselIndex = index;
    carousel.style.transform = `translateX(-${index * 100}%)`;
    
    dots.forEach(dot => dot.classList.remove('active'));
    dots[index].classList.add('active');
}

// 下一张
function nextSlide() {
    const total = config.portfolioImages.length;
    currentCarouselIndex = (currentCarouselIndex + 1) % total;
    goToSlide(currentCarouselIndex);
}

// 上一张
function previousSlide() {
    const total = config.portfolioImages.length;
    currentCarouselIndex = (currentCarouselIndex - 1 + total) % total;
    goToSlide(currentCarouselIndex);
}

// 语言切换
function initLanguageSwitcher() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentLanguage = e.target.dataset.lang;
            updateLanguage();
        });
    });
}

// 更新语言
function updateLanguage() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        el.textContent = translations[currentLanguage][key] || '';
    });
}

// 初始化社交链接
function initSocialLinks() {
    document.querySelectorAll('.social-link').forEach(link => {
        const social = link.dataset.social;
        if (config.socialLinks[social]) {
            link.href = config.socialLinks[social];
            link.target = '_blank';
        }
    });
}