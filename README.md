# JARVIS AI Assistant

An intelligent AI-powered desktop/web assistant built using Python, NLP, Machine Learning, and LLM integration.

JARVIS can understand user commands through voice or text, classify intents using NLP, perform system tasks, and respond conversationally using an LLM.

---

# Features

## Voice Interaction
- Continuous voice input
- Voice output using text-to-speech
- Hands-free interaction

## NLP Intent Classification
- Machine Learning-based intent classification
- Understands user commands intelligently
- Replaced hardcoded command matching with NLP routing

## Music Playback
- Searches and plays songs automatically
- Supports YouTube-based music playback

## App Opening System
- Opens desktop applications through voice/text commands
- Dynamic command handling

## AI Chat System
- Integrated LLM for conversational responses
- Handles general knowledge and chatting

## Weather System
- Fetches real-time weather information

## Utility Functions
- Current time retrieval
- Basic assistant utilities
- Web interaction

---

# Technologies Used

- Python
- Flask
- HTML
- CSS
- JavaScript
- Scikit-learn
- NLP
- Machine Learning
- LLM Integration
- Speech Recognition
- Text-to-Speech

---

# Project Architecture

```text
User Input (Voice/Text)
        ↓
Speech Recognition
        ↓
NLP Intent Classification
        ↓
Intent Router
        ↓
Task Execution / LLM Chat
        ↓
Voice Output

NLP Pipeline
The assistant uses a Machine Learning-based NLP pipeline for understanding commands.
Pipeline includes:
Text preprocessing
Vectorization
Intent classification
Command routing
This architecture provides better scalability and flexibility compared to traditional hardcoded if-else command systems.

## Example Commands:
Open Chrome
Play Shape of You
What is the weather today?
What time is it?
Tell me about Earth

## Future Improvements
Memory system
Advanced NLP entity extraction
Recommendation system
Context awareness
Smart automation
Spotify/YouTube API integration
Database integration
Multi-user support

## Installation
Clone Repository
git clone https://github.com/yourusername/jarvis-ai.git

##Run Project
python app.py

## Requirements
Make sure you have:
Python 3.10+
Microphone access
Internet connection

### Author
Developed by Vivek Singh Negi

##Disclaimer
This project is currently under active development and new features will continue to be added over time.
