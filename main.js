// Voice Translator App - Main JavaScript (Fixed Version)
class VoiceTranslatorApp {
    constructor() {
        this.isRecording = false;
        this.recordingStartTime = 0;
        this.recordingTimer = null;
        this.waveformChart = null;
        this.particleSystem = null;
        this.translationHistory = this.loadTranslationHistory();
        this.recognition = null;
        this.transcriptionText = '';
        this.isSupported = this.checkBrowserSupport();
        
        this.initializeApp();
        this.initializeSpeechRecognition();
    }

    checkBrowserSupport() {
        const hasSpeechRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
        const hasUserMedia = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
        
        if (!hasSpeechRecognition) {
            console.warn('Speech recognition not supported in this browser');
            this.showBrowserSupportMessage();
        }
        
        if (!hasUserMedia) {
            console.warn('getUserMedia not supported');
        }
        
        return hasSpeechRecognition && hasUserMedia;
    }

    showBrowserSupportMessage() {
        const statusText = document.getElementById('recordingStatus');
        if (statusText) {
            statusText.textContent = 'Speech recognition not supported. Please use Chrome, Safari, or Edge.';
        }
    }

    initializeApp() {
        this.setupEventListeners();
        this.initializeParticleSystem();
        this.loadRecentTranslations();
        this.initializeWaveformChart();
        this.setupMicrophoneButton();
    }

    setupEventListeners() {
        // Remove any existing event listeners to prevent conflicts
        this.removeExistingListeners();
        
        // Language swap button
        const swapButton = document.getElementById('swapLanguages');
        if (swapButton) {
            swapButton.addEventListener('click', () => this.swapLanguages());
        }

        // Quick action buttons
        const playButton = document.getElementById('playTranslation');
        const copyButton = document.getElementById('copyTranslation');
        const favoriteButton = document.getElementById('favoriteTranslation');

        if (playButton) playButton.addEventListener('click', () => this.playTranslation());
        if (copyButton) copyButton.addEventListener('click', () => this.copyTranslation());
        if (favoriteButton) favoriteButton.addEventListener('click', () => this.toggleFavorite());

        // Recent translations
        this.setupRecentTranslationsListeners();
    }

    removeExistingListeners() {
        // Remove onclick attribute to prevent conflicts
        const micButton = document.getElementById('microphoneButton');
        if (micButton) {
            micButton.removeAttribute('onclick');
        }
    }

    setupMicrophoneButton() {
        const micButton = document.getElementById('microphoneButton');
        if (micButton) {
            // Add click event listener
            micButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleMicrophoneClick();
            });
            
            // Add touch event for mobile
            micButton.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleMicrophoneClick();
            });
            
            // Style improvements to ensure button is clickable
            micButton.style.cursor = 'pointer';
            micButton.style.userSelect = 'none';
            micButton.style.webkitUserSelect = 'none';
            micButton.style.mozUserSelect = 'none';
            micButton.style.msUserSelect = 'none';
        }
    }

    async handleMicrophoneClick() {
        console.log('Microphone button clicked, isRecording:', this.isRecording);
        
        if (!this.isSupported) {
            this.showBrowserSupportMessage();
            return;
        }

        if (this.isRecording) {
            await this.stopRecording();
        } else {
            await this.startRecordingFlow();
        }
    }

    async startRecordingFlow() {
        try {
            const hasPermission = await this.requestMicrophonePermission();
            if (hasPermission) {
                this.startRecording();
            } else {
                console.log('Microphone permission denied');
                this.showPermissionError();
            }
        } catch (error) {
            console.error('Error starting recording:', error);
            this.showError('Error accessing microphone');
        }
    }

    showPermissionError() {
        const statusText = document.getElementById('recordingStatus');
        if (statusText) {
            statusText.textContent = 'Microphone permission denied. Please enable microphone access.';
        }
        
        // Reset button state
        setTimeout(() => {
            if (statusText) {
                statusText.textContent = 'Tap to start recording';
            }
        }, 3000);
    }

    showError(message) {
        const statusText = document.getElementById('recordingStatus');
        if (statusText) {
            statusText.textContent = message;
        }
        
        setTimeout(() => {
            if (statusText) {
                statusText.textContent = 'Tap to start recording';
            }
        }, 3000);
    }

    startRecording() {
        this.isRecording = true;
        this.recordingStartTime = Date.now();
        this.transcriptionText = '';
        
        const micButton = document.getElementById('microphoneButton');
        const statusText = document.getElementById('recordingStatus');
        const waveformContainer = document.getElementById('waveformContainer');
        const transcriptionDisplay = document.getElementById('transcriptionDisplay');
        
        if (micButton) micButton.classList.add('recording');
        if (statusText) statusText.textContent = 'Recording... Speak now';
        if (waveformContainer) waveformContainer.style.display = 'block';
        if (transcriptionDisplay) {
            transcriptionDisplay.style.display = 'block';
            document.getElementById('transcriptionText').textContent = 'Listening...';
        }
        
        this.startRecordingTimer();
        this.startWaveformAnimation();
        
        // Start speech recognition
        if (this.recognition) {
            const sourceLanguage = document.getElementById('sourceLanguage').value;
            this.recognition.lang = this.getLanguageCodeForSpeechRecognition(sourceLanguage);
            this.recognition.start();
        }
        
        // Auto-stop after 10 seconds
        setTimeout(() => {
            if (this.isRecording) {
                this.stopRecording();
            }
        }, 10000);
    }

    async stopRecording() {
        this.isRecording = false;
        
        const micButton = document.getElementById('microphoneButton');
        const statusText = document.getElementById('recordingStatus');
        const waveformContainer = document.getElementById('waveformContainer');
        
        if (micButton) micButton.classList.remove('recording');
        if (statusText) statusText.textContent = 'Processing...';
        if (waveformContainer) waveformContainer.style.display = 'none';
        
        this.stopRecordingTimer();
        
        // Stop speech recognition
        if (this.recognition) {
            this.recognition.stop();
        }
        
        // Process transcription if available
        if (this.transcriptionText && this.transcriptionText.trim()) {
            await this.processTranscribedText(this.transcriptionText.trim());
        } else {
            // If no transcription, show mock translation for demo
            setTimeout(() => {
                this.processRecording();
            }, 500);
        }
    }

    async processTranscribedText(text) {
        console.log('Processing transcribed text:', text);
        
        const statusText = document.getElementById('recordingStatus');
        if (statusText) statusText.textContent = 'Translating...';
        
        // Simulate translation processing
        setTimeout(() => {
            this.translateText(text);
        }, 1000);
    }

    getLanguageCodeForSpeechRecognition(languageCode) {
        const languageMap = {
            'en': 'en-US',
            'es': 'es-ES',
            'fr': 'fr-FR',
            'de': 'de-DE',
            'it': 'it-IT',
            'pt': 'pt-PT',
            'ru': 'ru-RU',
            'ja': 'ja-JP',
            'zh': 'zh-CN',
            'ar': 'ar-SA',
            'hi': 'hi-IN',
            'gu': 'gu-IN'
        };
        return languageMap[languageCode] || 'en-US';
    }

    startRecordingTimer() {
        this.recordingTimer = setInterval(() => {
            const elapsed = Date.now() - this.recordingStartTime;
            const seconds = Math.floor(elapsed / 1000);
            const minutes = Math.floor(seconds / 60);
            const displaySeconds = seconds % 60;
            
            const timeText = document.getElementById('recordingTime');
            if (timeText) {
                timeText.textContent = `${minutes.toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')}`;
            }
        }, 100);
    }

    stopRecordingTimer() {
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
            this.recordingTimer = null;
        }
        
        const timeText = document.getElementById('recordingTime');
        if (timeText) {
            timeText.textContent = '00:00';
        }
    }

    startWaveformAnimation() {
        if (!this.waveformChart) return;
        
        const data = [];
        const categories = [];
        
        for (let i = 0; i < 50; i++) {
            categories.push(i);
            data.push(Math.random() * 100);
        }
        
        const option = {
            backgroundColor: 'transparent',
            grid: {
                left: 10,
                right: 10,
                top: 10,
                bottom: 10
            },
            xAxis: {
                type: 'category',
                data: categories,
                show: false
            },
            yAxis: {
                type: 'value',
                show: false
            },
            series: [{
                data: data,
                type: 'bar',
                itemStyle: {
                    color: '#14b8a6',
                    borderRadius: [2, 2, 0, 0]
                },
                barWidth: '60%',
                animation: true,
                animationDuration: 100,
                animationEasing: 'linear'
            }]
        };
        
        this.waveformChart.setOption(option);
        
        // Animate waveform during recording
        const animateWaveform = () => {
            if (!this.isRecording) return;
            
            const newData = data.map(() => Math.random() * 100);
            this.waveformChart.setOption({
                series: [{
                    data: newData
                }]
            });
            
            setTimeout(animateWaveform, 100);
        };
        
        animateWaveform();
    }

    processRecording() {
        // Simulate translation processing
        setTimeout(() => {
            this.displayTranslation();
        }, 1500);
    }

    displayTranslation(sourceText = null, translatedText = null) {
        const sourceLanguage = document.getElementById('sourceLanguage').value;
        const targetLanguage = document.getElementById('targetLanguage').value;
        
        // If no text provided, use mock data
        if (!sourceText || !translatedText) {
            const mockTranslations = this.getMockTranslations(sourceLanguage, targetLanguage);
            const sourceTexts = Object.keys(mockTranslations);
            sourceText = sourceTexts[Math.floor(Math.random() * sourceTexts.length)];
            translatedText = mockTranslations[sourceText];
        }
        
        const translationResult = document.getElementById('translationResult');
        const quickActions = document.getElementById('quickActions');
        
        if (translationResult && quickActions) {
            translationResult.innerHTML = `
                <div class="translation-card show">
                    <div class="flex items-center justify-between mb-3">
                        <span class="text-sm font-medium text-gray-500">Original (${this.getLanguageName(sourceLanguage)})</span>
                        <button class="text-gray-400 hover:text-gray-600">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                            </svg>
                        </button>
                    </div>
                    <p class="text-lg text-gray-800 mb-4">${sourceText}</p>
                    
                    <div class="border-t pt-4">
                        <div class="flex items-center justify-between mb-3">
                            <span class="text-sm font-medium text-teal-600">Translation (${this.getLanguageName(targetLanguage)})</span>
                            <div class="flex space-x-2">
                                <span class="text-xs text-gray-400">Confidence: 95%</span>
                            </div>
                        </div>
                        <p class="text-xl font-semibold text-gray-900 mb-2">${translatedText}</p>
                        <div class="flex items-center text-sm text-gray-500">
                            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2"></path>
                            </svg>
                            <span>Pronunciation: ${this.getPronunciationGuide(translatedText, targetLanguage)}</span>
                        </div>
                    </div>
                </div>
            `;
            
            translationResult.style.display = 'block';
            quickActions.style.display = 'flex';
            
            // Save to history
            this.saveTranslation({
                id: Date.now(),
                sourceText: sourceText,
                translatedText: translatedText,
                sourceLanguage: sourceLanguage,
                targetLanguage: targetLanguage,
                timestamp: new Date(),
                isFavorite: false
            });
            
            // Update status
            const statusText = document.getElementById('recordingStatus');
            if (statusText) statusText.textContent = 'Tap to start recording';
            
            // Hide transcription display
            const transcriptionDisplay = document.getElementById('transcriptionDisplay');
            if (transcriptionDisplay) transcriptionDisplay.style.display = 'none';
            
            // Animate the translation card
            anime({
                targets: '.translation-card',
                translateY: [50, 0],
                opacity: [0, 1],
                duration: 600,
                easing: 'easeOutQuart'
            });
        }
    }

    getMockTranslations(sourceLang, targetLang) {
        // Language-specific mock translations
        const translations = {
            'en-es': {
                'Hello world': 'Hola mundo',
                'Good morning': 'Buenos días',
                'Thank you': 'Gracias',
                'How are you': 'Cómo estás',
                'I love you': 'Te amo',
                'Goodbye': 'Adiós',
                'Please': 'Por favor',
                'Excuse me': 'Disculpe',
                'Yes': 'Sí',
                'No': 'No'
            },
            'en-hi': {
                'Hello world': 'नमस्ते दुनिया',
                'Good morning': 'शुभ प्रभात',
                'Thank you': 'धन्यवाद',
                'How are you': 'आप कैसे हैं',
                'I love you': 'मैं तुमसे प्यार करता हूँ',
                'Goodbye': 'अलविदा',
                'Please': 'कृपया',
                'Excuse me': 'माफ़ कीजिए',
                'Yes': 'हाँ',
                'No': 'नहीं'
            },
            'en-gu': {
                'Hello world': 'નમસ્તે વિશ્વ',
                'Good morning': 'શુભ સવાર',
                'Thank you': 'આભાર',
                'How are you': 'તમે કેમ છો',
                'I love you': 'હું તને પ્રેમ કરું છું',
                'Goodbye': 'આવજો',
                'Please': 'કૃપા કરીને',
                'Excuse me': 'માફ કરશો',
                'Yes': 'હા',
                'No': 'ના'
            },
            'hi-en': {
                'नमस्ते': 'Hello',
                'धन्यवाद': 'Thank you',
                'कृपया': 'Please',
                'माफ़ कीजिए': 'Sorry',
                'स्वागत': 'Welcome',
                'अलविदा': 'Goodbye',
                'हाँ': 'Yes',
                'नहीं': 'No',
                'आप कैसे हैं': 'How are you',
                'मैं ठीक हूँ': 'I am fine'
            },
            'gu-en': {
                'નમસ્તે': 'Hello',
                'આભાર': 'Thank you',
                'માફ કરશો': 'Sorry',
                'કૃપા કરીને': 'Please',
                'સ્વાગત': 'Welcome',
                'આવજો': 'Goodbye',
                'હા': 'Yes',
                'ના': 'No',
                'તમે કેમ છો': 'How are you',
                'હું ઠીક છું': 'I am fine'
            }
        };
        
        const key = `${sourceLang}-${targetLang}`;
        return translations[key] || translations['en-es'];
    }

    translateText(text) {
        const sourceLanguage = document.getElementById('sourceLanguage').value;
        const targetLanguage = document.getElementById('targetLanguage').value;
        
        // Simple translation logic (in a real app, this would call a translation API)
        const translations = this.getMockTranslations(sourceLanguage, targetLanguage);
        const translatedText = translations[text] || `[${text} in ${this.getLanguageName(targetLanguage)}]`;
        
        this.displayTranslation(text, translatedText);
    }

    getLanguageName(code) {
        const languages = {
            'en': 'English',
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German',
            'it': 'Italian',
            'pt': 'Portuguese',
            'ru': 'Russian',
            'ja': 'Japanese',
            'zh': 'Chinese',
            'ar': 'Arabic',
            'hi': 'Hindi',
            'gu': 'Gujarati'
        };
        return languages[code] || code;
    }

    getPronunciationGuide(text, language) {
        // Mock pronunciation guide
        const pronunciationGuides = {
            'Hola mundo': 'OH-lah MOON-doh',
            'Buenos días': 'BWAY-nohs DEE-ahs',
            'Gracias': 'GRAH-see-ahs',
            'Cómo estás': 'KOH-moh ehs-TAHS',
            'Te amo': 'teh AH-moh',
            'Adiós': 'ah-dee-OHS',
            'Por favor': 'por fah-VOR',
            'नमस्ते': 'nam-as-teh',
            'धन्यवाद': 'dhun-yuh-vaad',
            'કેમ છો': 'kem cho',
            'આભાર': 'aa-bhaar'
        };
        return pronunciationGuides[text] || text;
    }

    swapLanguages() {
        const sourceSelect = document.getElementById('sourceLanguage');
        const targetSelect = document.getElementById('targetLanguage');
        
        if (sourceSelect && targetSelect) {
            const temp = sourceSelect.value;
            sourceSelect.value = targetSelect.value;
            targetSelect.value = temp;
            
            // Animate the swap
            anime({
                targets: [sourceSelect, targetSelect],
                scale: [1, 1.05, 1],
                duration: 300,
                easing: 'easeInOutQuad'
            });
        }
    }

    async playTranslation() {
        const button = document.getElementById('playTranslation');
        const translationCard = document.querySelector('.translation-card');
        
        if (!button || !translationCard) return;
        
        const originalContent = button.innerHTML;
        const translatedText = translationCard.querySelector('.text-xl').textContent;
        const targetLanguage = document.getElementById('targetLanguage').value;
        
        try {
            button.innerHTML = `
                <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6"></path>
                </svg>
                Playing...
            `;
            button.disabled = true;
            
            // Use Web Speech API for text-to-speech
            const utterance = new SpeechSynthesisUtterance(translatedText);
            utterance.lang = this.getLanguageCodeForSpeechRecognition(targetLanguage);
            utterance.rate = 0.8;
            utterance.pitch = 1;
            
            utterance.onend = () => {
                button.innerHTML = originalContent;
                button.disabled = false;
            };
            
            utterance.onerror = () => {
                this.playBeepSound();
                button.innerHTML = originalContent;
                button.disabled = false;
            };
            
            speechSynthesis.speak(utterance);
            
        } catch (error) {
            console.error('Error playing audio:', error);
            this.playBeepSound();
            button.innerHTML = originalContent;
            button.disabled = false;
        }
    }

    playBeepSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.error('Error playing beep sound:', error);
        }
    }

    copyTranslation() {
        const translationCard = document.querySelector('.translation-card');
        if (!translationCard) return;
        
        const translatedText = translationCard.querySelector('.text-xl').textContent;
        
        navigator.clipboard.writeText(translatedText).then(() => {
            // Show success feedback
            const button = document.getElementById('copyTranslation');
            if (button) {
                const originalContent = button.innerHTML;
                
                button.innerHTML = `
                    <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Copied!
                `;
                
                setTimeout(() => {
                    button.innerHTML = originalContent;
                }, 2000);
            }
        }).catch(err => {
            console.error('Failed to copy text:', err);
        });
    }

    toggleFavorite() {
        const button = document.getElementById('favoriteTranslation');
        if (!button) return;
        
        const isCurrentlyFavorite = button.classList.contains('favorited');
        
        if (isCurrentlyFavorite) {
            button.classList.remove('favorited');
            button.innerHTML = `
                <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                </svg>
                Favorite
            `;
        } else {
            button.classList.add('favorited');
            button.innerHTML = `
                <svg class="w-5 h-5 inline mr-2" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                </svg>
                Favorited
            `;
        }
        
        // Animate the button
        anime({
            targets: button,
            scale: [1, 1.2, 1],
            duration: 300,
            easing: 'easeInOutQuad'
        });
    }

    saveTranslation(translation) {
        this.translationHistory.unshift(translation);
        
        // Keep only last 50 translations
        if (this.translationHistory.length > 50) {
            this.translationHistory = this.translationHistory.slice(0, 50);
        }
        
        this.saveTranslationHistory();
        this.loadRecentTranslations();
    }

    loadTranslationHistory() {
        try {
            const history = localStorage.getItem('voiceTranslatorHistory');
            return history ? JSON.parse(history) : [];
        } catch (error) {
            console.error('Error loading translation history:', error);
            return [];
        }
    }

    saveTranslationHistory() {
        try {
            localStorage.setItem('voiceTranslatorHistory', JSON.stringify(this.translationHistory));
        } catch (error) {
            console.error('Error saving translation history:', error);
        }
    }

    loadRecentTranslations() {
        const container = document.getElementById('recentTranslations');
        if (!container) return;
        
        if (this.translationHistory.length === 0) {
            // Show mock data for demo
            return;
        }
        
        container.innerHTML = '';
        
        this.translationHistory.slice(0, 3).forEach((translation, index) => {
            const timeAgo = this.getTimeAgo(translation.timestamp);
            const translationElement = document.createElement('div');
            translationElement.className = 'recent-translation';
            translationElement.innerHTML = `
                <div class="flex justify-between items-center">
                    <div>
                        <p class="text-white text-sm">"${translation.sourceText}" → "${translation.translatedText}"</p>
                        <p class="text-white text-xs opacity-75">${this.getLanguageName(translation.sourceLanguage)} → ${this.getLanguageName(translation.targetLanguage)} • ${timeAgo}</p>
                    </div>
                    <button class="text-white opacity-50 hover:opacity-100">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                    </button>
                </div>
            `;
            
            translationElement.addEventListener('click', () => this.loadTranslationFromHistory(index));
            container.appendChild(translationElement);
        });
    }

    loadTranslationFromHistory(index) {
        const translation = this.translationHistory[index];
        if (!translation) return;
        
        // Set languages
        document.getElementById('sourceLanguage').value = translation.sourceLanguage;
        document.getElementById('targetLanguage').value = translation.targetLanguage;
        
        // Display translation
        this.displayTranslationFromHistory(translation);
    }

    displayTranslationFromHistory(translation) {
        const translationResult = document.getElementById('translationResult');
        const quickActions = document.getElementById('quickActions');
        
        if (translationResult && quickActions) {
            translationResult.innerHTML = `
                <div class="translation-card show">
                    <div class="flex items-center justify-between mb-3">
                        <span class="text-sm font-medium text-gray-500">Original (${this.getLanguageName(translation.sourceLanguage)})</span>
                        <button class="text-gray-400 hover:text-gray-600">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                            </svg>
                        </button>
                    </div>
                    <p class="text-lg text-gray-800 mb-4">${translation.sourceText}</p>
                    
                    <div class="border-t pt-4">
                        <div class="flex items-center justify-between mb-3">
                            <span class="text-sm font-medium text-teal-600">Translation (${this.getLanguageName(translation.targetLanguage)})</span>
                            <div class="flex space-x-2">
                                <span class="text-xs text-gray-400">Confidence: 95%</span>
                            </div>
                        </div>
                        <p class="text-xl font-semibold text-gray-900 mb-2">${translation.translatedText}</p>
                        <div class="flex items-center text-sm text-gray-500">
                            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2"></path>
                            </svg>
                            <span>Pronunciation: ${this.getPronunciationGuide(translation.translatedText, translation.targetLanguage)}</span>
                        </div>
                    </div>
                </div>
            `;
            
            translationResult.style.display = 'block';
            quickActions.style.display = 'flex';
            
            // Animate the translation card
            anime({
                targets: '.translation-card',
                translateY: [50, 0],
                opacity: [0, 1],
                duration: 600,
                easing: 'easeOutQuart'
            });
        }
    }

    getTimeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffInMinutes = Math.floor((now - time) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
        return `${Math.floor(diffInMinutes / 1440)} days ago`;
    }

    initializeWaveformChart() {
        const container = document.getElementById('waveformChart');
        if (container) {
            this.waveformChart = echarts.init(container);
        }
    }

    initializeSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';
            
            this.recognition.onstart = () => {
                console.log('Speech recognition started');
                this.transcriptionText = '';
            };
            
            this.recognition.onresult = (event) => {
                let interimTranscript = '';
                let finalTranscript = '';
                
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                    } else {
                        interimTranscript += transcript;
                    }
                }
                
                // Update transcription display
                const transcriptionDisplay = document.getElementById('transcriptionText');
                if (transcriptionDisplay) {
                    transcriptionDisplay.textContent = finalTranscript || interimTranscript;
                }
                
                this.transcriptionText = finalTranscript || interimTranscript;
            };
            
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                if (event.error === 'not-allowed') {
                    this.showPermissionError();
                }
                this.stopRecording();
            };
            
            this.recognition.onend = () => {
                console.log('Speech recognition ended');
                if (this.isRecording && this.transcriptionText) {
                    this.processTranscribedText(this.transcriptionText);
                }
            };
        } else {
            console.warn('Speech recognition not supported in this browser');
            this.showBrowserSupportMessage();
        }
    }

    async requestMicrophonePermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            return true;
        } catch (error) {
            console.error('Microphone permission denied:', error);
            return false;
        }
    }

    initializeParticleSystem() {
        // Simple particle system using p5.js
        if (typeof p5 !== 'undefined') {
            new p5((p) => {
                let particles = [];
                
                p.setup = () => {
                    const canvas = p.createCanvas(p.windowWidth, p.windowHeight);
                    canvas.parent('particles');
                    canvas.style('position', 'fixed');
                    canvas.style('top', '0');
                    canvas.style('left', '0');
                    canvas.style('pointer-events', 'none');
                    canvas.style('z-index', '1');
                    
                    // Create particles
                    for (let i = 0; i < 50; i++) {
                        particles.push({
                            x: p.random(p.width),
                            y: p.random(p.height),
                            vx: p.random(-0.5, 0.5),
                            vy: p.random(-0.5, 0.5),
                            size: p.random(2, 6),
                            opacity: p.random(0.1, 0.3)
                        });
                    }
                };
                
                p.draw = () => {
                    p.clear();
                    
                    // Update and draw particles
                    particles.forEach(particle => {
                        particle.x += particle.vx;
                        particle.y += particle.vy;
                        
                        // Wrap around edges
                        if (particle.x < 0) particle.x = p.width;
                        if (particle.x > p.width) particle.x = 0;
                        if (particle.y < 0) particle.y = p.height;
                        if (particle.y > p.height) particle.y = 0;
                        
                        // Draw particle
                        p.fill(255, 255, 255, particle.opacity * 255);
                        p.noStroke();
                        p.circle(particle.x, particle.y, particle.size);
                    });
                };
                
                p.windowResized = () => {
                    p.resizeCanvas(p.windowWidth, p.windowHeight);
                };
            });
        }
    }

    setupRecentTranslationsListeners() {
        const recentTranslations = document.querySelectorAll('.recent-translation');
        recentTranslations.forEach((item, index) => {
            item.addEventListener('click', () => this.loadTranslationFromHistory(index));
        });
    }
}

// Initialize app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    // Ensure all elements are loaded before initializing
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            app = new VoiceTranslatorApp();
        });
    } else {
        app = new VoiceTranslatorApp();
    }
});

// Fallback initialization
window.addEventListener('load', () => {
    if (!app) {
        app = new VoiceTranslatorApp();
    }
});