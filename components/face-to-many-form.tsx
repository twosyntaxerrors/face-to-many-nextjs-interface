// File: components/face-to-many-form.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FlipWords } from '@/components/ui/flip-words';
import { TextGenerateEffect } from '@/components/ui/text-generate-effect';
import { MultiStepLoader } from '@/components/ui/multi-step-loader';

const styles = {
  "3D": "Hyper-realistic 3D render of {subject}, high detail, cinematic lighting, 8k resolution",
  "Emoji": "Cute emoji style illustration of {subject}, vibrant colors, simple shapes, expressive features",
  "Video game": "pixelated glitchart of close-up of {subject}, ps1 playstation psx gamecube game radioactive dreams screencapture, bryce 3d",
  "Pixels": "8-bit style, Retro pixel art of {subject}, 16-bit style, vibrant colors, nostalgic gaming aesthetic",
  "Clay": "Claymation style sculpture of {subject}, textured surface, soft lighting, stop-motion animation feel",
  "Toy": "Plastic toy figurine of {subject}, glossy finish, primary colors, action figure pose",
};

const loadingStates = [
  { text: "Initializing image generation..." },
  { text: "Applying selected style..." },
  { text: "Processing custom prompt..." },
  { text: "Finalizing image..." },
  { text: "Almost there..." }
];

const ADVANCED_SETTINGS = {
  loraScale: 1,
  negativePrompt: "",
  promptStrength: 5.0,
  denoisingStrength: 0.65,
  instantIdStrength: 0.8,
  controlDepthStrength: 0.8
};

export default function FaceToManyForm() {
  const [imageUrl, setImageUrl] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('Video game');
  const [customPrompt, setCustomPrompt] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isImageValid, setIsImageValid] = useState(false);

  useEffect(() => {
    if (imageUrl) {
      const img = new Image();
      img.onload = () => setIsImageValid(true);
      img.onerror = () => setIsImageValid(false);
      img.src = imageUrl;
    } else {
      setIsImageValid(false);
    }
  }, [imageUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isImageValid) {
      setError("Please enter a valid image URL");
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      console.log('Sending request to API...');
      const basePrompt = styles[selectedStyle as keyof typeof styles];
      const fullPrompt = customPrompt ? `${basePrompt}, ${customPrompt}` : basePrompt;
      
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: "a07f252abbbd832009640b27f063ea52d87d7a23a185ca165bec23b5adc8deaf",
          input: {
            image: imageUrl,
            prompt: fullPrompt,
            style: selectedStyle,
            ...ADVANCED_SETTINGS
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('API response not ok:', response.status, data);
        throw new Error(JSON.stringify(data));
      }

      console.log('API response:', data);
      
      console.log('Polling for result...');
      const resultImage = await pollForResult(data.id);
      setResult(resultImage);
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const pollForResult = async (predictionId: string): Promise<string> => {
    const pollInterval = 5000; // 5 seconds
    const maxAttempts = 60; // 5 minutes total

    for (let i = 0; i < maxAttempts; i++) {
      const response = await fetch(`/api/poll/${predictionId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch prediction result');
      }

      const jsonResponse = await response.json();

      if (jsonResponse.status === 'succeeded') {
        return jsonResponse.output[0];  // Assuming the output is an array with the image URL as the first element
      } else if (jsonResponse.status === 'failed') {
        throw new Error('Prediction failed');
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error('Prediction timed out');
  };

  const handleDownload = () => {
    if (result) {
      const link = document.createElement('a');
      link.href = result;
      link.download = 'generated-image.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleReset = () => {
    setImageUrl('');
    setSelectedStyle('Video game');
    setCustomPrompt('');
    setResult(null);
    setIsLoading(false);
    setError(null);
    setIsImageValid(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">Face-to-Many AI</span>
            <span className="block text-blue-600">
              <FlipWords words={["Transform ", "Stylize ", "Customize ", "Revamp ", "Reimagine ", "Convert ", "Upgrade ", "Rework ", "Personalize "]} className="mr-2" />
              Your Images
            </span>
          </h1>
          <div className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            <TextGenerateEffect
              words="Experience the magic of AI-generated styles. Upload an image and watch it transform!"
              className="text-gray-500 sm:text-lg md:text-xl"
            />
          </div>
        </div>

        <div className="bg-white shadow-2xl rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">
                  Image URL
                </label>
                <Input
                  id="imageUrl"
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Enter image URL"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
              </div>
              <div>
                <label htmlFor="style" className="block text-sm font-medium text-gray-700">
                  Select Style
                </label>
                <Select onValueChange={setSelectedStyle} defaultValue={selectedStyle}>
                  <SelectTrigger id="style" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 flex justify-between items-center">
                    <SelectValue placeholder="Select a style" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 text-gray-900">
                    {Object.keys(styles).map((style) => (
                      <SelectItem key={style} value={style} className="hover:bg-gray-100">
                        {style}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="customPrompt" className="block text-sm font-medium text-gray-700">
                  Custom Prompt (optional)
                </label>
                <Input
                  id="customPrompt"
                  type="text"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Enter custom prompt (optional)"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
              </div>
              <div className="flex space-x-4">
                <Button
                  type="button"
                  onClick={handleReset}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Reset
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || !isImageValid}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {isLoading ? 'Generating...' : 'Generate'}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {isImageValid && (
          <div className="bg-white shadow-2xl rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Images</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Original Image</h3>
                  <img src={imageUrl} alt="Original" className="w-full h-auto rounded-lg shadow-md object-cover aspect-square" />
                </div>
                {result && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Generated Image ({selectedStyle})</h3>
                    <img src={result} alt="Generated" className="w-full h-auto rounded-lg shadow-md object-cover aspect-square" />
                    <Button
                      onClick={handleDownload}
                      className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Download Generated Image
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <MultiStepLoader loadingStates={loadingStates} loading={isLoading} duration={2000} />
      </div>
    </div>
  );
}