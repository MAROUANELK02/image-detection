import React, { useRef, useEffect, useState } from 'react';

const EmotionDetector = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [emotion, setEmotion] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    startVideo();
    return () => {
      stopVideo();
    };
  }, []);

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: 640,  // Définir une largeur standard
          height: 480  // Définir une hauteur standard
        } 
      });
      videoRef.current.srcObject = stream;
      setIsCapturing(true);
    } catch (err) {
      console.error("Error accessing webcam:", err);
    }
  };

  const stopVideo = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      setIsCapturing(false);
    }
  };

  const captureAndDetectEmotion = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageBase64 = canvas.toDataURL('image/jpeg');

    try {
      const response = await fetch('https://sentiment-analysis.eastus.cloudapp.azure.com/api/detect-emotion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageBase64 }),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      setEmotion(data);
    } catch (error) {
      console.error('Error detecting emotion:', error);
    }
  };

  // Capture toutes les 2 secondes
  useEffect(() => {
    if (!isCapturing) return;
    const interval = setInterval(captureAndDetectEmotion, 2000); // 2000 ms = 2 secondes
    return () => clearInterval(interval);
  }, [isCapturing]);

  return (
    <div className="emotion-detector" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '20px',
      padding: '20px'
    }}>
      {/* Afficher la vidéo */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: '640px',
          height: '480px',
          border: '2px solid #333',
          borderRadius: '8px'
        }}
      />
      
      {/* Canvas caché mais toujours nécessaire pour la capture */}
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
      />
      
      {/* Affichage de l'émotion dans une boîte stylée */}
      {emotion && (
        <div className="emotion-result" style={{
          padding: '15px',
          backgroundColor: '#f0f0f0',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center',
          width: '100%',
          maxWidth: '640px'
        }}>
          <p style={{ fontSize: '1.2em', fontWeight: 'bold', margin: '5px 0' }}>
            Detected Emotion: {emotion.emotion}
          </p>
          <p style={{ fontSize: '1.1em', color: '#666' }}>
            Confidence: {(emotion.confidence * 100).toFixed(2)}%
          </p>
        </div>
      )}
    </div>
  );
};

export default EmotionDetector;