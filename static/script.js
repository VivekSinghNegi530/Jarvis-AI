class JarvisAssistant {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.continuousListening = false;
        this.mediaStream = null;

        this.initializeElements();
        this.initializeSpeechRecognition();
        this.bindEvents();
        this.updateStatus('Online');
    }

    initializeElements() {
        this.chatMessages = document.getElementById('chatMessages');
        this.commandInput = document.getElementById('commandInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.voiceBtn = document.getElementById('voiceBtn');
        this.voiceStatus = document.getElementById('voiceStatus');
        this.statusIndicator = document.getElementById('statusIndicator');
        this.continuousToggle = document.getElementById('continuousListening');
    }

    initializeSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;  // Keep listening continuously
            this.recognition.interimResults = true;  // Show partial results
            this.recognition.lang = 'en-US';

            // Handle permission request
            this.recognition.onstart = () => {
                console.log('Speech recognition started');
                this.setListeningState(true);
                this.requestMicPermission();
            };

            // Handle results
            this.recognition.onresult = (event) => {
                let finalTranscript = '';
                let interimTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                    } else {
                        interimTranscript += transcript;
                    }
                }

                // Update input with final result
                if (finalTranscript) {
                    this.commandInput.value = finalTranscript;
                    this.processCommand(finalTranscript);
                } else if (interimTranscript) {
                    this.commandInput.value = interimTranscript;
                }
            };

            // Auto-restart when recognition ends
            this.recognition.onend = () => {
                console.log('Speech recognition ended');
                if (this.continuousListening || this.isListening) {
                    // Restart after short delay
                    setTimeout(() => {
                        if ((this.continuousListening || this.isListening) && this.recognition) {
                            this.recognition.start();
                        }
                    }, 300);
                } else {
                    this.setListeningState(false);
                }
            };

            // Better error handling
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.handleRecognitionError(event.error);
            };

            // Handle audio levels (volume changes)
            if ('audioend' in this.recognition) {
                this.recognition.onaudioend = () => {
                    console.log('Audio capture ended');
                };
            }

        } else {
            console.error('Speech recognition not supported');
            this.voiceBtn.classList.add('inactive');
            this.voiceStatus.textContent = 'Speech recognition not supported in this browser';
        }
    }

    async requestMicPermission() {
        try {
            // Request microphone permission explicitly
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaStream = stream;
            console.log('Microphone permission granted');
        } catch (err) {
            console.error('Microphone permission denied:', err);
            this.showMessage('jarvis', 'Please allow microphone access in your browser settings');
            this.setListeningState(false);
        }
    }

    handleRecognitionError(error) {
        console.error('Recognition error details:', error);

        switch (error) {
            case 'no-speech':
                this.voiceStatus.textContent = 'No speech detected, still listening...';
                break;
            case 'audio-capture':
                this.voiceStatus.textContent = 'No microphone found';
                break;
            case 'not-allowed':
                this.voiceStatus.textContent = 'Microphone permission denied';
                this.showMessage('jarvis', 'Please enable microphone permission and refresh');
                break;
            case 'network':
                this.voiceStatus.textContent = 'Network error, retrying...';
                break;
            default:
                this.voiceStatus.textContent = `Error: ${error}`;
        }

        // Auto-retry for recoverable errors
        if (error !== 'not-allowed') {
            setTimeout(() => this.startListening(), 1000);
        }
    }

    bindEvents() {
        this.sendBtn.addEventListener('click', () => this.processCommand());
        this.commandInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.processCommand();
            }
        });

        this.voiceBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (this.isListening) {
                this.stopListening();
            } else {
                this.startListening();
            }
        });

        this.continuousToggle.addEventListener('change', (e) => {
            this.continuousListening = e.target.checked;
            this.voiceStatus.textContent = this.continuousListening ?
                'Continuous listening ON - Say "Jarvis stop" to pause' : 'Click mic to speak';

            if (this.continuousListening) {
                this.startListening();
            } else {
                this.stopListening();
            }
        });

        // Handle voice commands to stop
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.isListening) {
                e.preventDefault();
            }
        });
    }

    startListening() {
        if (this.recognition && !this.isListening) {
            try {
                this.recognition.start();
                console.log('Starting speech recognition...');
            } catch (error) {
                console.error('Failed to start recognition:', error);
                this.voiceStatus.textContent = 'Failed to start listening';
            }
        }
    }

    stopListening() {
        if (this.recognition) {
            this.recognition.stop();
        }
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }
        this.setListeningState(false);
        this.continuousListening = false;
        this.continuousToggle.checked = false;
    }

    setListeningState(listening) {
        this.isListening = listening;
        this.voiceBtn.classList.toggle('listening', listening);
        this.updateStatus(listening ? 'Listening' : 'Online');

        if (listening) {
            this.voiceStatus.innerHTML = '<i class="fas fa-microphone"></i> Listening... Speak now!';
        } else {
            this.voiceStatus.innerHTML = '<i class="fas fa-microphone-slash"></i> Click to speak';
        }
    }

    updateStatus(status) {
        this.statusIndicator.textContent = status;
        this.statusIndicator.className = `status-${status.toLowerCase().replace(' ', '-')}`;
    }

    async processCommand(command = null) {
        const inputText = command || this.commandInput.value.trim();
        if (!inputText) return;

        // Add user message
        this.addMessage('user', inputText);
        this.commandInput.value = '';

        // Stop listening during processing
        this.stopListening();

        try {
            this.addTypingIndicator();

            const response = await fetch('/api/command', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: inputText })
            });

            const data = await response.json();
            this.removeTypingIndicator();
            this.addMessage('jarvis', data.response);

        } catch (error) {
            this.removeTypingIndicator();
            this.addMessage('jarvis', 'Sorry, I encountered a connection error. Please check if the server is running.');
            console.error('Error:', error);
        }
    }

    addTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message jarvis typing';
        typingDiv.innerHTML = `
            <div class="avatar"><i class="fas fa-robot"></i></div>
            <div class="message-content">
                <div class="typing-indicator">
                    <span></span><span></span><span></span>
                </div>
            </div>
        `;
        this.chatMessages.appendChild(typingDiv);
        this.scrollToBottom();
        this.typingMessage = typingDiv;
    }

    removeTypingIndicator() {
        if (this.typingMessage) {
            this.typingMessage.remove();
            this.typingMessage = null;
        }
    }

    addMessage(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;

        messageDiv.innerHTML = `
            <div class="avatar">
                <i class="fas fa-${sender === 'jarvis' ? 'robot' : 'user'}"></i>
            </div>
            <div class="message-content">
                <p>${this.escapeHtml(text)}</p>
            </div>
        `;

        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    showMessage(sender, text) {
        this.addMessage(sender, text);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Request microphone permission upfront
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            stream.getTracks().forEach(track => track.stop()); // Stop immediately after permission
            console.log('Microphone permission granted');
            new JarvisAssistant();
        })
        .catch(err => {
            console.log('Microphone permission will be requested when needed');
            new JarvisAssistant();
        });
});