// language switching logic

const languages = {
    en: 'English',
    fr: 'Français',
    es: 'Español'
};

let currentLanguage = 'en';

function switchLanguage(lang) {
    if (languages[lang]) {
        currentLanguage = lang;
        console.log(`Language switched to: ${languages[lang]}`);
        // Add logic to update the UI with the new language settings
    } else {
        console.log('Language not supported!');
    }
}

// Example usage:
// switchLanguage('fr');

export { switchLanguage, languages };