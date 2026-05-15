// 配置对象
const config = {
    background: 'assets/backgrounds/default.jpg',
    socialLinks: {
        pixiv: 'https://www.pixiv.net/users/27233420',
        x: 'https://x.com/xiaofeiyang678',
        bilibili: 'https://space.bilibili.com/3706955501669233?spm_id_from=333.1007.0.0',
        fanbox: 'https://xiaofeiyang.fanbox.cc/'
    }
};

// 多语言配置
const translations = {
    zh: {
        tagline: '数字绘画师 | 创意设计者 | 内容创作者',
        bio: '欢迎来到我的个人网站，这里是连接我不同平台的枢纽中心。在这里你可以快速访问我的所有创作平台。',
        'nav-platforms': '创作平台',
        'nav-activity': '最新动态',
        'platforms-title': '我的创作平台',
        'pixiv-desc': '专业插画创作平台',
        'bilibili-desc': '绘画教程 & 直播平台',
        'twitter-desc': '日常分享 & 创作动态',
        'fanbox-desc': '创意支持社区',
        'followers': '粉丝',
        'works': '作品',
        'visit': '访问主页',
        'stats-title': '数据总览',
        'total-followers': '总粉丝',
        'total-works': '总作品',
        'total-engagement': '总互动',
        'activity-title': '最新动态',
        'activity-1-title': '新投稿：【原创】樱花少女',
        'activity-2-title': '【教程】人物眼睛绘画技巧',
        'activity-3-title': '分享日常速画过程',
        'view-work': '查看作品 →',
        'view-video': '观看视频 →',
        'view-tweet': '查看推文 →',
        'cta-title': '想要跟随我的创作？',
        'cta-desc': '选择你最喜欢的平台关注我，不错过任何精彩内容',
        'cta-explore': '立即探索所有平台',
        'cta-subscribe': '订阅邮件更新',
        'footer-made': 'Made with ❤️ by PlumeLAN | © 2026'
    },
    en: {
        tagline: 'Digital Artist | Creative Designer | Content Creator',
        bio: 'Welcome to my personal website, the hub connecting all my creative platforms. Here you can quickly access all my work.',
        'nav-platforms': 'Platforms',
        'nav-activity': 'Latest Activity',
        'platforms-title': 'My Platforms',
        'pixiv-desc': 'Professional illustration platform',
        'bilibili-desc': 'Painting tutorials & Live streaming',
        'twitter-desc': 'Daily sharing & Creative updates',
        'fanbox-desc': 'Creative support community',
        'followers': 'Followers',
        'works': 'Works',
        'visit': 'Visit Profile',
        'stats-title': 'Overview',
        'total-followers': 'Total Followers',
        'total-works': 'Total Works',
        'total-engagement': 'Total Engagement',
        'activity-title': 'Latest Activity',
        'activity-1-title': 'New upload: 【Original】Cherry Blossom Girl',
        'activity-2-title': '【Tutorial】Character Eye Drawing Techniques',
        'activity-3-title': 'Sharing daily sketching process',
        'view-work': 'View artwork →',
        'view-video': 'Watch video →',
        'view-tweet': 'View tweet →',
        'cta-title': 'Want to follow my creative work?',
        'cta-desc': 'Choose your favorite platform to follow me and never miss any exciting content',
        'cta-explore': 'Explore All Platforms Now',
        'cta-subscribe': 'Subscribe Email Updates',
        'footer-made': 'Made with ❤️ by PlumeLAN | © 2026'
    }
};

let currentLanguage = 'zh';

// 点赞相关配置
let likeCount = parseInt(localStorage.getItem('likeCount')) || 0;
let currentEmojiIndex = parseInt(localStorage.getItem('emojiIndex')) || 0;
const maxEmojis = 5;

// 初始化函数
document.addEventListener('DOMContentLoaded', initApp);

// 主初始化函数
function initApp() {
    initBackground();
    initLanguageSwitcher();
    initThemeToggle();
    updateLanguage();
    initPlatformCards();
    initStatObserver();
    initLikeButton();
}

// 初始化背景
function initBackground() {
    const bgContainer = document.getElementById('bgContainer');
    bgContainer.style.backgroundImage = `url('${config.background}')`;
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
        if (translations[currentLanguage][key]) {
            el.textContent = translations[currentLanguage][key];
        }
    });
}

// 主题切换
function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('theme') || 'light';
    
    // 设置初始主题
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggle.querySelector('.theme-icon').textContent = '☀️';
    }
    
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // 更新图标
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

// 导出全局函数
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
        
        // 提取数字
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
    
    // 观察所有统计卡片
    document.querySelectorAll('.stat-card').forEach(card => {
        observer.observe(card);
    });
}

// 返回顶部功能（可选）
window.addEventListener('scroll', () => {
    const container = document.querySelector('.container');
    if (window.scrollY > 300) {
        // 可以在这里添加返回顶部按钮的显示逻辑
    }
});

// 点赞功能
function initLikeButton() {
    const likeBtn = document.getElementById('likeBtn');
    const likeCountEl = document.getElementById('likeCount');
    const likeEmojisEl = document.getElementById('likeEmojis');
    
    // 初始化显示
    likeCountEl.textContent = likeCount;
    
    // 恢复之前显示的表情
    if (currentEmojiIndex > 0) {
        addEmojiToDisplay(likeEmojisEl, currentEmojiIndex);
    }
    
    // 点赞按钮点击事件
    likeBtn.addEventListener('click', () => {
        // 清除当前显示
        likeEmojisEl.innerHTML = '';
        
        if (currentEmojiIndex === 0) {
            // 当前没有显示，显示第一张
            currentEmojiIndex = 1;
            likeCount++;
            addEmojiToDisplay(likeEmojisEl, currentEmojiIndex);
        } else if (currentEmojiIndex < maxEmojis) {
            // 显示下一张
            currentEmojiIndex++;
            likeCount++;
            addEmojiToDisplay(likeEmojisEl, currentEmojiIndex);
        } else {
            // 当前显示第5张，点击取消显示
            currentEmojiIndex = 0;
        }
        
        // 保存到 localStorage
        localStorage.setItem('likeCount', likeCount);
        localStorage.setItem('emojiIndex', currentEmojiIndex);
        
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

