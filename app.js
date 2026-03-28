/**
 * app.js
 * Controls slide logic, interactions, and Text-to-Speech
 */

const app = {
    currentSlideIndex: 0,
    slides: [],
    audioEnabled: false,
    images: [
        '../.gemini/antigravity/artifacts/slide1_intro.png',
        '../.gemini/antigravity/artifacts/slide2_smell.png',
        '../.gemini/antigravity/artifacts/slide3_hearing.png',
        '../.gemini/antigravity/artifacts/slide4_taste.png',
        '../.gemini/antigravity/artifacts/slide5_victory.png'
    ],
    script: [
        "أَهْلًا يَا بَطَل! هَيَّا نَكْتَشِفُ مَعًا حَوَاسَّنَا الخَمْسَة فِي المَطْبَخِ الذَّكِيّ!",
        "مِمَّمّ.. مَا أَجْمَلَ رَائِحَةَ هَذِهِ الوَرْدَة! قُلْ لِي.. بِأَيِّ عُضْوٍ نَشُمُّهَا؟",
        "اسْتَمِعْ لِهَذِهِ المَوْسِيقَى الجَمِيلَة.. بِأَيِّ عُضْوٍ نَسْمَعُ هَذَا الصَّوْت؟",
        "يَمِّي! هَذَا الكَعْكُ يَبْدُو لَذِيذًا! بِأَيِّ عُضْوٍ نَتَذَوَّقُ طَعْمَهُ الحُلْو؟",
        "تَهَانِينَا! أَنْتَ الآنَ شِيفٌ ذَكِيٌّ وَخَبِيرٌ بِالحَوَاس! أَحْسَنْتَ يَا بَطَل!"
    ],
    
    init() {
        this.slides = document.querySelectorAll('.slide');
        
        // Load images into their wrappers to ensure they are visible
        // (Wait for Gemini artifact paths or local paths to resolve)
        const imageWrappers = document.querySelectorAll('.image-wrapper');
        imageWrappers.forEach((wrapper, index) => {
             // To prevent CORS or local path issues during dev, we inject as background images
             // In a real deployed app, you'd use absolute URLs or a static assets folder.
             // Here we use relative links assuming images will be placed adjacent or updated later.
             wrapper.style.backgroundImage = `url('assets/slide${index+1}.png')`;
        });
        
        // Check TTS support
        if ('speechSynthesis' in window) {
            console.log("Speech synthesis supported.");
        } else {
            console.warn("Speech synthesis not supported in this browser.");
        }
    },

    speakQueue: [],
    currentAudio: null,

    speak(text, cancelPrevious = true) {
        if (cancelPrevious) {
            this.speakQueue = [];
            if (this.currentAudio) {
                this.currentAudio.pause();
                this.currentAudio = null;
            }
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
        }
        
        this.speakQueue.push(text);
        if (!this.currentAudio) {
            this.processQueue();
        }
    },

    processQueue() {
        if (this.speakQueue.length === 0) return;
        const text = this.speakQueue.shift();

        // High quality smooth female voice (using an undocumented public translation TTS for smooth arabic output)
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=ar&client=tw-ob`;
        const audio = new Audio(url);
        audio.playbackRate = 1.15; // Slightly faster/higher pitch to emulate a youthful voice
        
        this.currentAudio = audio;
        
        audio.onended = () => {
            this.currentAudio = null;
            this.processQueue();
        };

        audio.onerror = () => {
            this.currentAudio = null;
            this.fallbackNativeTTS(text);
        };

        audio.play().catch(e => {
            this.currentAudio = null;
            this.fallbackNativeTTS(text);
        });
    },

    fallbackNativeTTS(text) {
        if (!('speechSynthesis' in window)) {
            this.processQueue();
            return;
        }
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ar-SA'; 
        utterance.rate = 1.0; 
        utterance.pitch = 1.6; 
        
        utterance.onend = () => {
            this.processQueue();
        };
        
        // Try to find a female Arabic voice
        const voices = window.speechSynthesis.getVoices();
        const arabicVoices = voices.filter(v => v.lang.startsWith('ar'));
        if (arabicVoices.length > 0) {
            const femaleVoice = arabicVoices.find(v => 
                v.name.toLowerCase().includes('laila') || 
                v.name.toLowerCase().includes('salma') || 
                v.name.toLowerCase().includes('zafira') || 
                v.name.toLowerCase().includes('zeina') || 
                v.name.toLowerCase().includes('female')
            );
            utterance.voice = femaleVoice || arabicVoices[0];
        }
        
        window.speechSynthesis.speak(utterance);
    },

    startDemo() {
        const overlay = document.getElementById('start-overlay');
        if (overlay) overlay.style.display = 'none';
        
        this.audioEnabled = true;

        // Welcome voice (cancel any previous)
        this.speak("مَرْحَبًا بِكُمْ فِي مِينِي جَيْم الحَوَاسِّ الخَمْسَةِ فِي المَطْبَخِ الذَّكِيّ!", true);
        
        // Slide 1 text (queue it)
        this.speak(this.script[this.currentSlideIndex], false);
    },

    nextSlide() {
        // (Audio is now enabled in startDemo)

        if (this.currentSlideIndex < this.slides.length - 1) {
            // Hide current slide
            this.slides[this.currentSlideIndex].classList.remove('active');
            this.slides[this.currentSlideIndex].classList.add('exit');
            
            // Show next slide
            this.currentSlideIndex++;
            this.slides[this.currentSlideIndex].classList.remove('exit');
            this.slides[this.currentSlideIndex].classList.add('active');

            // Hide global next button if it was shown
            document.getElementById('global-next').classList.add('hidden');

            // Speak paragraph for new slide
            this.speak(this.script[this.currentSlideIndex]);
        }
    },

    checkAnswer(isCorrect, btnElement) {
        if (isCorrect) {
            // Play success sound/visual
            btnElement.classList.add('correct');
            // Speak a small validation
            this.speak("إجابة صحيحة! أحسنت!");
            // Show next button
            document.getElementById('global-next').classList.remove('hidden');
            
            // Disable other buttons
            const siblings = btnElement.parentElement.querySelectorAll('.btn-choice');
            siblings.forEach(b => b.disabled = true);
        } else {
            // Play error visual
            btnElement.classList.add('wrong');
            this.speak("حاول مرة أخرى!");
            
            // Remove wrong class after animation completes so it can be re-triggered
            setTimeout(() => {
                btnElement.classList.remove('wrong');
            }, 500);
        }
    },

    restart() {
        window.speechSynthesis.cancel();
        location.reload();
    }
};

// Initialize after DOM load
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
