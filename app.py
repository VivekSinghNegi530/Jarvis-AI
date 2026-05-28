from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from tavily import TavilyClient
from groq import Groq
import os
import pyttsx3
import threading
import time
import joblib
import sklearn


app = Flask(__name__)
CORS(app)
client = Groq(
  api_key="YOUR API KEY"
)
music_words=["play song","please play the song","i want to listen","can you play"]
def clean_music(command,music_words):
    for word in music_words:
        if word in command.lower():
            command = command.lower().replace(word,"").strip()

def app_cmd(command):
    app_words={"chrome":"start /min chrome.exe","calculator":"start /min calc.exe","notepad":"notepad.exe","command prompt":"start cmd.exe"}
    for word in app_words:
        if word in command.lower():
            os.system(app_words[word])

def classify_command(user_message):
    model=joblib.load("intent_model.pkl")
    vectorizer=joblib.load("vectorizer.pkl")
    cmdd=vectorizer.transform([user_message])
    u=model.predict(cmdd)
    print(u)
    return u
def serpent_reply(user_message):
    completion = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {
                "role": "user",
                "content": user_message
            }
        ]
    )
    reply=completion.choices[0].message.content
    return reply


# Initialize TTS engine
tts_engine = pyttsx3.init()
voices = tts_engine.getProperty('voices')
tts_engine.setProperty('voice', voices[1].id if len(voices) > 1 else voices[0].id)
tts_engine.setProperty('rate', 180)

def speak(text):
    """Text to speech in a separate thread"""
    def _speak():
        tts_engine.say(text)
        tts_engine.runAndWait()
    thread = threading.Thread(target=_speak)
    thread.daemon = True
    thread.start()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/command', methods=['POST'])
def process_command():
    try:
        data = request.json
        command = data.get('command', '').lower()
        
        # Simple command processing (extend this for full Jarvis functionality)
        response = process_jarvis_command(command)
        
        # Speak the response
        speak(response)
        
        return jsonify({
            'response': response,
            'success': True
        })
    except Exception as e:
        print(e)
        return jsonify({
            'response': f"Sorry, I encountered an error: {str(e)}",
            'success': False
        })

def process_jarvis_command(command):
    """Process Jarvis commands - extend this logic as needed"""
    
    # Greeting responses
    if any(word in command for word in ['hello', 'hi', 'hey', 'good morning', 'good evening']):
        return "Hello! I'm Jarvis. How can I assist you today?"
    
    # Time-related
    elif 'time' in command:
        from datetime import datetime
        current_time = datetime.now().strftime("%I:%M %p")
        return f"The current time is {current_time}"
    
    # Date-related
    elif 'date' in command:
        from datetime import datetime
        current_date = datetime.now().strftime("%B %d, %Y")
        return f"Today's date is {current_date}"
    
    # Weather (mock response)
    elif 'weather' in command:
        return "The weather is clear with a temperature of 72 degrees Fahrenheit"
    
    # Exit/bye
    elif any(word in command for word in ['bye', 'goodbye', 'exit']):
        return "Goodbye! Have a great day!"
    
    # Default response
    else:
        answer=classify_command(command)
        if answer[0]=="play_music":
            clean_music(command,music_words)
        elif answer[0]=="open_app":
           app_cmd(command)
        else:
            reply=serpent_reply(command)
            return reply
if __name__ == '__main__':
    app.run(debug=True, port=5000)