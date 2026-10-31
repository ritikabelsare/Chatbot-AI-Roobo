import { useEffect, useRef, useState } from 'react';

export default function useVoiceAssistant(voiceLanguage, onTranscript) {
  const [listening, setListening] = useState(false);
  const [handsFree, setHandsFree] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('');

  const recognitionRef = useRef(null);
  const handsFreeRef = useRef(false);
  const waitingForReplyRef = useRef(false);
  const restartTimerRef = useRef(null);

  function queueListeningRestart() {
    if (
      !handsFreeRef.current ||
      waitingForReplyRef.current ||
      restartTimerRef.current
    ) {
      return;
    }

    restartTimerRef.current = window.setTimeout(() => {
      restartTimerRef.current = null;
      if (handsFreeRef.current && !waitingForReplyRef.current) {
        startListening();
      }
    }, 400);
  }

  function resumeHandsFreeAfterReply() {
    waitingForReplyRef.current = false;
    if (handsFreeRef.current) {
      setVoiceStatus('Answer finished. Listening for your next question...');
      queueListeningRestart();
    }
  }

  function startListening() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceStatus(
        'Voice input is not supported in this browser. Please use Chrome or Edge.'
      );
      return;
    }

    handsFreeRef.current = true;
    setHandsFree(true);
    recognitionRef.current?.abort();

    const recognition = new SpeechRecognition();
    recognition.lang = voiceLanguage;
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setListening(true);
      setVoiceStatus('Listening... Please speak now.');
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.trim();
      if (!transcript) return;

      waitingForReplyRef.current = true;
      setVoiceStatus(`You said: ${transcript}`);
      onTranscript(transcript);
    };

    recognition.onerror = (event) => {
      setListening(false);
      if (event.error === 'aborted' && !handsFreeRef.current) return;

      if (event.error === 'not-allowed') {
        handsFreeRef.current = false;
        setHandsFree(false);
        setVoiceStatus(
          'Microphone permission denied. Allow microphone access in your browser.'
        );
      } else if (event.error === 'no-speech') {
        setVoiceStatus('No speech detected. Please try again.');
      } else {
        handsFreeRef.current = false;
        setHandsFree(false);
        setVoiceStatus(`Voice input error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setListening(false);
      queueListeningRestart();
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      setListening(false);
      handsFreeRef.current = false;
      setHandsFree(false);
      setVoiceStatus('Could not start the microphone. Please try again.');
    }
  }

  function stopListening() {
    handsFreeRef.current = false;
    setHandsFree(false);
    waitingForReplyRef.current = false;
    window.clearTimeout(restartTimerRef.current);
    restartTimerRef.current = null;
    recognitionRef.current?.abort();
    setListening(false);
    setVoiceStatus('Hands-free voice chat stopped.');
  }

  function speakReply(text) {
    if (!('speechSynthesis' in window)) {
      setVoiceStatus('Voice output is not supported in this browser.');
      resumeHandsFreeAfterReply();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = voiceLanguage;
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => {
      setSpeaking(false);
      resumeHandsFreeAfterReply();
    };
    utterance.onerror = () => {
      setSpeaking(false);
      setVoiceStatus('Could not play the voice response.');
      resumeHandsFreeAfterReply();
    };
    window.speechSynthesis.speak(utterance);
  }

  function stopSpeaking() {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    setVoiceStatus('Voice playback stopped.');
    resumeHandsFreeAfterReply();
  }

  useEffect(() => () => {
    handsFreeRef.current = false;
    recognitionRef.current?.abort();
    window.clearTimeout(restartTimerRef.current);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }, []);

  return {
    listening,
    handsFree,
    speaking,
    voiceStatus,
    setVoiceStatus,
    startListening,
    stopListening,
    speakReply,
    stopSpeaking,
    resumeHandsFreeAfterReply,
  };
}
