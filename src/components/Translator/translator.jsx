import React, { useState, useEffect } from 'react';
import axios from 'axios';
import iso6391 from 'iso-639-1';
import { Container } from 'react-bootstrap';
import './style.css';


const TranslatorApp = () => {
  const [location, setLocation] = useState('');
  const [nativeLanguage, setNativeLanguage] = useState('');
  const [speechInput, setSpeechInput] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [languageOptions, setLanguageOptions] = useState([]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        const ACCESS_TOKEN = 'pk.eyJ1IjoicHJhdHl1c2gxMjIzIiwiYSI6ImNsaXQzM2ZwMjAwM2EzZWxmaXZpdjI5NWEifQ.kvEOVqp8qIXe1a6lbDQeVg';
        const GEOCODING_API_URL = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${ACCESS_TOKEN}`;

        axios
          .get(GEOCODING_API_URL)
          .then((response) => {
            const location = response.data.features[0].place_name;
            setLocation(location);
          })
          .catch((error) => {
            console.error('Error retrieving location:', error);
          });
      });
    }
  }, []);

  const handleSpeechRecognition = () => {
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = nativeLanguage;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSpeechInput(transcript);

      detectLanguage(transcript);
    };

    recognition.start();
  };

  const detectLanguage = (text) => {
    const LANGUAGE_DETECT_API_KEY = 'AIzaSyDwbTLVd_lgmjboNcs4P4GhYPVBobiNQZk';
    const LANGUAGE_DETECT_API_URL = `https://translation.googleapis.com/language/translate/v2/detect?key=${LANGUAGE_DETECT_API_KEY}`;

    axios
      .post(LANGUAGE_DETECT_API_URL, {
        q: text,
      })
      .then((response) => {
        const detectedLanguage = response.data.data.detections[0][0].language;
        setNativeLanguage(detectedLanguage);
      })
      .catch((error) => {
        console.error('Error detecting language:', error);
      });
  };

  useEffect(() => {
    if (location) {
      handleSpeechRecognition();
    }
  }, [location]);

  const handleLanguageSelection = async (selectedLanguage) => {
    try {
      const response = await axios.get('https://translation.googleapis.com/language/translate/v2/languages', {
        params: {
          key: 'AIzaSyDwbTLVd_lgmjboNcs4P4GhYPVBobiNQZk',
        },
      });

      const availableLanguages = response.data.data.languages;

      const languageOptions = availableLanguages.map((language) => ({
        value: language.language,
        label: iso6391.getName(language.language),
      }));

      setLanguageOptions(languageOptions);
      setNativeLanguage(selectedLanguage);

      const selectedLanguageName = iso6391.getName(selectedLanguage);
      speak(`Detected language is ${selectedLanguageName}`);
    } catch (error) {
      console.error('Error fetching available languages:', error);
    }
  };

  const handleTextToSpeech = () => {
    const SPEECH_API_KEY = 'AIzaSyDwbTLVd_lgmjboNcs4P4GhYPVBobiNQZk';
    const SPEECH_API_URL = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${SPEECH_API_KEY}`;

    axios
      .post(SPEECH_API_URL, {
        input: {
          text: translatedText,
        },
        voice: {
          languageCode: nativeLanguage,
        },
        audioConfig: {
          audioEncoding: 'LINEAR16',
        },
      })
      .then((response) => {
        const audioData = response.data.audioContent;
        const audio = new Audio(`data:audio/wav;base64,${audioData}`);
        audio.play();
        // Provide spoken feedback for translated text
        speak(`Translated text is ${translatedText}`);
      })
      .catch((error) => {
        console.error('Error generating speech:', error);
      });
  };

  const speak = (message) => {
    const speechSynthesis = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(message);
    speechSynthesis.speak(utterance);
  };

  return (
 <Container fluid className="translator-section">
 
      <Container className='sec'>
    <div className="auto-translator">
      <button className="microphone-btn" onClick={handleSpeechRecognition}>
        <i className="fa fa-microphone"></i>
        <span>Speak up</span>
      </button>

      <div className="divider"></div>

      <input
        type="text"
        className="speech-input"
        value={speechInput}
        onChange={(e) => setSpeechInput(e.target.value)}
        placeholder="Speak or type..."
      />

      <div className="divider"></div>

      <div className="language-feedback">
        {nativeLanguage && <p>Detected language is {iso6391.getName(nativeLanguage)}</p>}
        {translatedText && <p>Translated text: {translatedText}</p>}
      </div>

      <div className="divider"></div>

      <select className="language-select" onChange={(e) => handleLanguageSelection(e.target.value)}>
        <option value="">Select Language</option>
        {languageOptions.map((language) => (
          <option key={language.value} value={language.value}>
            {language.label}
          </option>
        ))}
      </select>

      <div className="divider"></div>

      <button className="speaker-btn" onClick={handleTextToSpeech}>
        <i className="fa fa-volume-up"></i>
        <span>Speak Translation</span>
      </button>
    </div>
     </Container>
    </Container>
  );
};
export default TranslatorApp;