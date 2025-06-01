const starterImages = [
  {
    imageUrl: 'https://replicate.delivery/pbxt/N55l5TWGh8mSlNzW8usReoaNhGbFwvLeZR3TX1NL4pd2Wtfv/replicate-prediction-f2d25rg6gnrma0cq257vdw2n4c.png',
    suggestedPrompt: 'make it into a 90s cartoon',
  },
  {
    imageUrl: 'https://replicate.delivery/pbxt/N5cepICxyaagdvULl0phi7ImdxuFz05TR2l623zqxhNR9q5Y/van-gogh.jpeg',
    suggestedPrompt: 'Using this style, a panda astronaut riding a unicorn',
  },
  {
    imageUrl: 'https://replicate.delivery/xezq/OKWfR6jlQwzekkSsfQOppX55O3vaNv6xZ4qY6RfHjwQHOwDTB/tmp9p3v3brc.png',
    suggestedPrompt: 'remove the text from the sweatshirt',
  },
  {
    imageUrl: 'https://replicate.delivery/pbxt/N5trWTJCJQbJVWz5nhLEscS1w16r1hGl5zuWceJhVSnWZfGu/mona-lisa-1024.jpg',
    suggestedPrompt: 'close her eyes',
  },
  {
    imageUrl: 'https://replicate.delivery/mgxm/b033ff07-1d2e-4768-a137-6c16b5ed4bed/d_1.png',
    suggestedPrompt: 'Convert to a high-quality restoration, enhancing details and removing any damage or degradation',
  }
]

function PoweredByBanner() {
  return (
      <a
        href="https://replicate.com/black-forest-labs/flux-kontext-pro?utm_source=project&utm_campaign=kontext-chat"
        target="_blank"
        rel="noopener noreferrer"
        className="bg-orange-500 text-white text-center text-base md:text-lg py-2 rounded-t underline hover:bg-orange-600 transition-colors"
      >
        Powered by FLUX.1 Kontext on Replicate
      </a>
  );
}

function App() {
  // State for upload vs chat mode
  const [showUpload, setShowUpload] = React.useState(true);
  const [messages, setMessages] = React.useState([]);
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  // No need for separate image state - just use what's in the chat!
  const [predictionId, setPredictionId] = React.useState(null);
  const [abortController, setAbortController] = React.useState(null);
  // New: track if a starter image was used (for future logic if needed)
  const [starterUsed, setStarterUsed] = React.useState(false);
  
  // Simple desktop check
  const [isDesktop, setIsDesktop] = React.useState(false);
  React.useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Ref for chat container and file input
  const chatContainerRef = React.useRef(null);
  const fileInputRef = React.useRef(null);

  // Scroll to bottom when messages change
  React.useEffect(() => {
    if (chatContainerRef.current) {
      setTimeout(() => {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }, 50);
    }
  }, [messages]);

  // Lock body scrolling on mobile for a consistent experience across screens
  React.useEffect(() => {
    if (!isDesktop) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isDesktop]);

  // Drag and drop state
  const [dragActive, setDragActive] = React.useState(false);

  // Helper to scroll to bottom (for image onLoad)
  function scrollToBottom() {
    if (chatContainerRef.current) {
      setTimeout(() => {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }, 50);
    }
  }

  // Drag and drop handlers for upload area
  function handleDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files[0] && files[0].type.startsWith('image/')) {
      handleFile(files[0]);
    }
  }

  // Handle file selection
  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
      handleFile(file);
    }
  }

  // Process uploaded file
  async function handleFile(file) {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('Image file is too large. Please select an image under 10MB.');
      return;
    }

    try {
      // Scale down the image to 1 megapixel
      const scaledBlob = await scaleImageTo1Megapixel(file);
      const url = URL.createObjectURL(scaledBlob);

      // Add initial messages
      setMessages([
        { type: 'image', image: url, imageBlob: scaledBlob, from: 'assistant', id: Date.now() },
        { type: 'text', text: 'Image uploaded! How would you like to edit it?', from: 'system', id: Date.now() + 1 }
      ]);

      // Switch to chat mode
      setShowUpload(false);
    } catch (error) {
      alert('Failed to process image: ' + error.message);
    }
  }

  // Handle click on starter image
  async function handleStarterImageClick(starter) {
    // Fetch the image as a blob so it behaves like uploaded images
    try {
      setLoading(true);
      const res = await fetch(starter.imageUrl);
      const blob = await res.blob();
      // Add image as first message
      setMessages([
        { type: 'image', image: starter.imageUrl, imageBlob: blob, from: 'assistant', id: Date.now() },
        { type: 'text', text: "Image loaded! Tell me how you'd like to edit it.", from: 'system', id: Date.now() + 1 }
      ]);
      setShowUpload(false);
      setInput(starter.suggestedPrompt || '');
      setStarterUsed(true);
    } catch (err) {
      alert('Failed to load starter image.');
    } finally {
      setLoading(false);
    }
  }

  // Helper function to convert blob to data URL
  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Get the most recent image from the chat
  function getLastImageBlob() {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].type === 'image' && messages[i].imageBlob) {
        return messages[i].imageBlob;
      }
    }
    return null;
  }

  // Scale image function
  async function scaleImageTo1Megapixel(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        const originalWidth = img.width;
        const originalHeight = img.height;
        const originalPixels = originalWidth * originalHeight;
        const targetPixels = 1000000;

        let newWidth, newHeight;

        if (originalPixels <= targetPixels) {
          newWidth = originalWidth;
          newHeight = originalHeight;
        } else {
          const scaleFactor = Math.sqrt(targetPixels / originalPixels);
          newWidth = Math.round(originalWidth * scaleFactor);
          newHeight = Math.round(originalHeight * scaleFactor);
        }

        canvas.width = newWidth;
        canvas.height = newHeight;
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create scaled image'));
          }
        }, 'image/jpeg', 0.9);
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  // Reset to upload mode
  function resetApp() {
    if (abortController) {
      abortController.abort();
    }
    setShowUpload(true);
    setMessages([]);
    setInput('');
    setPredictionId(null);
    setAbortController(null);
    setLoading(false);
    setStarterUsed(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  // Handle sending a message
  const handleSend = async (e) => {
    e.preventDefault();
    const lastImageBlob = getLastImageBlob();
    if (!input.trim() || loading || !lastImageBlob) return;

    const userMsg = { type: 'text', text: input, from: 'user', id: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Add loading message
    const loadingMsg = { type: 'loading', from: 'assistant', id: Date.now() + 1 };
    setMessages(prev => [...prev, loadingMsg]);

    try {
      // Create abort controller for this request
      const controller = new AbortController();
      setAbortController(controller);

      // Convert blob to data URL for the API
      console.log('Converting blob to data URL...');
      const imageDataUrl = await blobToDataUrl(lastImageBlob);
      console.log('Image data URL length:', imageDataUrl.length);

      console.log('Sending request to /generate-image...');
      const requestBody = {
        prompt: input,
        input_image: imageDataUrl
      };
      console.log('Request body size:', JSON.stringify(requestBody).length);

      const res = await fetch('/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      console.log('Response status:', res.status);
      console.log('Response headers:', Object.fromEntries(res.headers.entries()));

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Error response body:', errorText);
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      // The response is now JSON with the Cloudflare Images URL
      const result = await res.json();
      console.log('Response result:', result);

      if (result.error) {
        throw new Error(result.error);
      }

      const imageUrl = result.imageUrl;
      console.log('Cloudflare Images URL:', imageUrl);

      // Fetch the image to create a blob for local storage/UI purposes
      const imageResponse = await fetch(imageUrl);
      const imageBlob = await imageResponse.blob();
      console.log('Image blob size:', imageBlob.size);

      // Replace loading with image (store blob in message)
      setMessages(prev => prev.map(msg =>
        msg.type === 'loading' ?
          { type: 'image', image: imageUrl, imageBlob: imageBlob, from: 'assistant', id: msg.id } :
          msg
      ));

      // Add delete button to user message
      setMessages(prev => prev.map(msg =>
        msg.id === userMsg.id ? { ...msg, showDelete: true } : msg
      ));

    } catch (err) {
      // Don't show error if request was aborted (cancelled)
      if (err.name !== 'AbortError') {
        setMessages(prev => prev.filter(msg => msg.type !== 'loading'));
        setMessages(prev => [...prev, {
          type: 'text',
          text: 'Sorry, there was an error generating the image: ' + err.message,
          from: 'assistant',
          id: Date.now()
        }]);
      } else {
        console.log('Request was cancelled');
        setMessages(prev => prev.filter(msg => msg.type !== 'loading'));
      }
    } finally {
      setLoading(false);
      setPredictionId(null);
      setAbortController(null);
    }
  };

  // Cancel generation
  function cancelGeneration() {
    console.log('Cancel generation called');

    // Abort the ongoing request
    if (abortController) {
      console.log('Aborting request...');
      abortController.abort();
      setAbortController(null);
    }

    // Stop loading
    setLoading(false);
    setPredictionId(null);

    // Find the most recent user message to restore to input
    const currentMessages = [...messages];
    const lastUserMessage = currentMessages.slice().reverse().find(msg => msg.from === 'user' && msg.type === 'text');
    console.log('Last user message:', lastUserMessage);

    // Remove loading message and the most recent user message
    // This automatically makes the previous image the "last image" again
    setMessages(prev => {
      const filtered = prev.filter(msg =>
        msg.type !== 'loading' &&
        !(lastUserMessage && msg.from === 'user' && msg.type === 'text' && msg.id === lastUserMessage.id)
      );
      console.log('Messages after cancel:', filtered.length);
      return filtered;
    });

    // Restore the cancelled message to input
    if (lastUserMessage) {
      setTimeout(() => {
        console.log('Restoring text to input:', lastUserMessage.text);
        setInput(lastUserMessage.text);
      }, 50);
    }
  }

  // Delete message and all subsequent messages
  function deleteFromMessage(messageId) {
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) return;

    // Keep messages up to the clicked message (excluding it)
    const remainingMessages = messages.slice(0, messageIndex);
    setMessages(remainingMessages);

    // No need to set current image - getLastImageBlob will find it automatically
  }

  // No longer needed - state is derived from chat messages

  // Handle image click for full screen
  function handleImageClick(imageUrl) {
    window.open(imageUrl, '_blank');
  }

  // Attach drag events when in upload mode
  React.useEffect(() => {
    if (showUpload) {
      window.addEventListener('dragenter', handleDrag);
      window.addEventListener('dragover', handleDrag);
      window.addEventListener('dragleave', handleDrag);
      window.addEventListener('drop', handleDrop);
      return () => {
        window.removeEventListener('dragenter', handleDrag);
        window.removeEventListener('dragover', handleDrag);
        window.removeEventListener('dragleave', handleDrag);
        window.removeEventListener('drop', handleDrop);
      };
    }
  }, [showUpload]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e04f0c] to-[#f47020] md:overflow-auto overflow-hidden">
      {/* Main Content */}
      <div className="min-h-screen flex flex-col md:flex md:items-center h-screen md:h-screen">
        {showUpload ? (
          /* Upload Section */
          <div className="w-full md:max-w-4xl bg-white md:shadow-md flex flex-col h-screen md:h-screen overflow-hidden">
            {/* Logo */}
            <div className="p-4">
              <img src="/kontext-chat-rainbow.png" className="w-1/3 mx-auto" alt="Kontext Chat" />
            </div>
            <PoweredByBanner />

            {/* Upload Area */}
            <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto pb-32 md:pb-6" style={{paddingBottom: 'calc(8rem + env(safe-area-inset-bottom))'}}>
              {/* Intro Text */}
              <div className="text-center mb-6">
                <p className="text-gray-700 text-base md:text-lg">
                  Chat with images to edit them.
                </p>
              </div>

              <div
                className={`border-2 border-dashed rounded-2xl p-6 md:p-12 text-center cursor-pointer transition-all duration-300 mb-12 ${
                  dragActive
                    ? 'border-green-400 bg-green-50 text-green-700'
                    : 'border-gray-300 bg-gray-50 hover:border-orange-400 hover:bg-orange-50 text-gray-700 hover:text-orange-700'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="upload-content">
                  <svg className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                  </svg>
                  <h3 className="text-lg md:text-xl mb-1 md:mb-2 font-semibold">Upload an image to get started</h3>
                  <p className="text-base md:text-lg opacity-80">Drag and drop an image here, or click to browse</p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>
              </div>

              {/* Starter Images Section */}
              <div className="text-center text-gray-600 text-base mb-4 font-medium">Or choose a starting image:</div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-stretch">
                {starterImages.map((starter, idx) => (
                  <button
                    key={idx}
                    className="flex flex-col justify-start w-full rounded-xl border shadow border-gray-200 hover:border-orange-400 focus:border-orange-500 transition-all shadow-sm bg-gray-50 group"
                    onClick={() => handleStarterImageClick(starter)}
                    disabled={loading}
                    title={starter.suggestedPrompt}
                  >
                    <div className="aspect-square overflow-hidden rounded-t-xl">
                    <img
                      src={starter.imageUrl}
                      alt={starter.suggestedPrompt}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200"
                    />
                    </div>
                    <p className="text-left text-xs leading-4 p-2 border-t"><span class="text-gray-500">"</span>{starter.suggestedPrompt}<span class="text-gray-500">"</span></p>
                  </button>
                ))}
              </div>

              {/* Footer Text */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-gray-600 text-base md:text-lg leading-relaxed text-center">
                  Kontext Chat is powered by <a href="https://replicate.com/black-forest-labs/flux-kontext-pro?utm_source=project&utm_campaign=kontext-chat" className="underline text-orange-600 hover:text-orange-700">Flux Kontext Pro</a>, a new image model from <a href="https://black-forest-labs.com/" className="underline text-orange-600 hover:text-orange-700">Black Forest Labs</a>, running on <a href="https://replicate.com?utm_source=project&utm_campaign=kontext-chat" className="underline text-orange-600 hover:text-orange-700">Replicate</a>. The app is built with Hono and React, running on <a href="https://workers.dev/" className="underline text-orange-600 hover:text-orange-700">Cloudflare Workers</a>. Learn how to build your own app by taking a look at the <a href="https://github.com/replicate/kontext-chat" className="underline text-orange-600 hover:text-orange-700">source code</a> on GitHub.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Chat Section */
          <div className="w-full md:max-w-4xl bg-white md:shadow-md overflow-hidden flex flex-col h-screen md:h-screen relative">
            {/* Chat Header with Logo */}
            <div className="p-4 bg-white border-b border-gray-200 relative flex items-center flex-shrink-0">
              <button
                onClick={resetApp}
                className="absolute left-4 w-8 h-8 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
                title="Back to upload"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
              </button>
              <img 
                src="/kontext-chat-rainbow.png" 
                className="w-1/3 mx-auto cursor-pointer hover:opacity-90 transition-opacity" 
                alt="Kontext Chat" 
                onClick={resetApp}
                title="Back to upload"
              />
            </div>
            <PoweredByBanner />

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 pb-56 md:pb-6" ref={chatContainerRef}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`relative max-w-sm md:max-w-md ${
                      msg.from === 'user'
                        ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-3xl px-4 py-3'
                        : msg.from === 'system'
                        ? 'bg-blue-50 text-blue-800 rounded-2xl px-4 py-3 italic'
                        : 'bg-gray-100 text-gray-800 rounded-2xl rounded-bl-md px-4 py-3'
                    }`}
                  >
                    {msg.type === 'image' && (
                      <img
                        src={msg.image}
                        alt="Generated image"
                        className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => handleImageClick(msg.image)}
                        onLoad={scrollToBottom}
                      />
                    )}
                    {msg.type === 'loading' && (
                      <div className="flex flex-col items-center gap-4 py-8 px-12">
                        <div className="w-16 h-16 border-4 border-gray-300 border-t-orange-500 rounded-full animate-spin"></div>
                        <span className="text-gray-600">Generating image...</span>
                      </div>
                    )}
                    {msg.text && <div className="text-base md:text-lg">{msg.text}</div>}

                    {/* Delete button for user messages */}
                    {msg.showDelete && (
                      <button
                        onClick={() => deleteFromMessage(msg.id)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                        title="Delete from here and continue editing"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 md:relative md:border-t" style={{paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))'}}>
              <form onSubmit={handleSend} className="flex items-end gap-3 max-w-4xl mx-auto">
                <div className="flex-1 relative">
                  <div className="bg-gray-50 rounded-3xl px-4 py-3 pr-12 border-2 border-transparent focus-within:border-orange-500 transition-colors">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Describe your edit..."
                      className="w-full bg-transparent border-none outline-none resize-none text-base"
                      rows="1"
                      style={{ minHeight: '24px', maxHeight: '120px' }}
                      disabled={loading}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (!loading && input.trim()) {
                            handleSend(e);
                          }
                        }
                      }}
                    />

                    {/* Send/Cancel Button */}
                    {loading ? (
                      <button
                        type="button"
                        onClick={cancelGeneration}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all duration-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={!input.trim() || loading}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white rounded-full flex items-center justify-center transition-all duration-200 disabled:cursor-not-allowed"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Drag and Drop Overlay */}
      {showUpload && dragActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white border-4 border-dashed border-orange-400 rounded-2xl px-12 py-16 text-3xl font-bold text-orange-500 shadow-xl">
            Drop your image here
          </div>
        </div>
      )}
    </div>
  );
}
