class SoundManager {
    constructor() {
        this.audioContext = null;
        this.sounds = new Map();
        this.enabled = true;
        this.volume = 0.3;
        
        // Initialize Web Audio API
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = this.volume;
            this.masterGain.connect(this.audioContext.destination);
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }

    // Play procedurally generated sounds using Web Audio API
    playSound(type, frequency = 440, duration = 0.2, gainValue = 0.1) {
        if (!this.enabled || !this.audioContext) return;

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            // Different waveforms for different sound types
            switch (type) {
                case 'attack':
                    oscillator.type = 'sawtooth';
                    frequency = 200;
                    duration = 0.1;
                    gainValue = 0.15;
                    break;
                case 'levelup':
                    oscillator.type = 'sine';
                    frequency = 523.25; // C5
                    duration = 0.8;
                    gainValue = 0.2;
                    break;
                case 'pickup':
                    oscillator.type = 'square';
                    frequency = 880;
                    duration = 0.1;
                    gainValue = 0.1;
                    break;
                case 'eat':
                    oscillator.type = 'triangle';
                    frequency = 320;
                    duration = 0.3;
                    gainValue = 0.08;
                    break;
                case 'shop':
                    oscillator.type = 'sine';
                    frequency = 659.25; // E5
                    duration = 0.2;
                    gainValue = 0.1;
                    break;
                case 'teleport':
                    oscillator.type = 'sine';
                    frequency = 783.99; // G5
                    duration = 0.5;
                    gainValue = 0.12;
                    break;
                case 'prayer':
                    oscillator.type = 'sine';
                    frequency = 392; // G4
                    duration = 0.4;
                    gainValue = 0.1;
                    break;
                case 'magic':
                    oscillator.type = 'triangle';
                    frequency = 659.25;
                    duration = 0.3;
                    gainValue = 0.12;
                    break;
                case 'death':
                    oscillator.type = 'sawtooth';
                    frequency = 110;
                    duration = 1.0;
                    gainValue = 0.15;
                    break;
                default:
                    oscillator.type = 'sine';
                    break;
            }

            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            
            // Create envelope for more natural sound
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(gainValue, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

            // Connect nodes
            oscillator.connect(gainNode);
            gainNode.connect(this.masterGain);

            // Play sound
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);

        } catch (e) {
            console.log('Error playing sound:', e);
        }
    }

    // Play complex sounds with multiple tones
    playChord(type) {
        if (!this.enabled || !this.audioContext) return;

        switch (type) {
            case 'levelup_chord':
                // Play a major chord for level up
                this.playSound('levelup', 523.25, 1.2, 0.15); // C5
                setTimeout(() => this.playSound('levelup', 659.25, 1.0, 0.12), 100); // E5
                setTimeout(() => this.playSound('levelup', 783.99, 0.8, 0.1), 200); // G5
                break;
            case 'magic_sparkle':
                // Magical sparkle effect
                for (let i = 0; i < 5; i++) {
                    setTimeout(() => {
                        const freq = 500 + Math.random() * 400;
                        this.playSound('magic', freq, 0.2, 0.08);
                    }, i * 50);
                }
                break;
            case 'combat_clash':
                // Combat sound effect
                this.playSound('attack', 150, 0.15, 0.2);
                setTimeout(() => this.playSound('attack', 200, 0.1, 0.15), 50);
                break;
        }
    }

    // Background ambient sounds
    playAmbient(type) {
        if (!this.enabled || !this.audioContext) return;

        // Simple ambient effects could be added here
        // For now, just return - real ambient would need longer audio files
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.value = this.volume;
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    // Resume audio context if it's suspended (browser autoplay policy)
    resumeContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
}

// Global sound manager instance
const soundManager = new SoundManager();

// Resume audio context on first user interaction
document.addEventListener('click', () => {
    soundManager.resumeContext();
}, { once: true });