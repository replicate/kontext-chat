const starterImages = [
  {
    imageUrl: 'https://replicate.delivery/pbxt/N55l5TWGh8mSlNzW8usReoaNhGbFwvLeZR3TX1NL4pd2Wtfv/replicate-prediction-f2d25rg6gnrma0cq257vdw2n4c.png',
    suggestedPrompt: 'make it into a 90s cartoon',
  },
  {
    imageUrl: 'https://replicate.delivery/pbxt/N5cepICxyaagdvULl0phi7ImdxuFz05TR2l623zqxhNR9q5Y/van-gogh.jpeg',
    suggestedPrompt: 'Using this style, a panda astronaut riding a unicorn',
  },
]

function App() {
  // Use a random starter image for the initial message
  const randomIndex = Math.floor(Math.random() * starterImages.length);
  const [messages, setMessages] = React.useState([
    {
      type: 'image',
      image: starterImages[randomIndex].imageUrl,
      prompt: starterImages[randomIndex].suggestedPrompt,
      from: 'bot',
    },
  ]);
  const [input, setInput] = React.useState(starterImages[randomIndex].suggestedPrompt);
  const [loading, setLoading] = React.useState(false);

  // Ref for chat container
  const chatContainerRef = React.useRef(null);

  // Scroll to bottom when messages change
  React.useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Helper to scroll to bottom (for image onLoad)
  function scrollToBottom() {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }

  // Helper to get the last image URL in the chat
  function getLastImageUrl() {
    // Find the last image message (from bot or user)
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.type === 'image') {
        return msg.image;
      }
    }
    // fallback: first starter image
    return starterImages[0].imageUrl;
  }

  // Handler for sending a message
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg = { type: 'text', text: input, from: 'user' };
    setMessages([...messages, userMsg]);
    setInput('');
    setLoading(true);

    // Show loading bubble
    setMessages(msgs => [
      ...msgs,
      { type: 'loading', from: 'bot' },
    ]);

    // Prepare prompt and input_image
    const prompt = input;
    const input_image = getLastImageUrl();

    try {
      // Send POST request with prompt and input_image as JSON
      const res = await fetch('/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, input_image }),
      });
      const imageUrl = await res.text();
      // Remove loading bubble and add image message
      setMessages(msgs => [
        ...msgs.filter(m => m.type !== 'loading'),
        { type: 'image', image: imageUrl, from: 'bot' },
      ]);
    } catch (err) {
      setMessages(msgs => [
        ...msgs.filter(m => m.type !== 'loading'),
        { type: 'text', text: 'Error generating image.', from: 'bot' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="w-full max-w-3xl mx-auto p-0 flex flex-col h-[90vh] bg-white rounded-lg shadow-md overflow-hidden">
      {/* <img src="/kontext-chat.png" className="w-full h-auto"></img> */}
      
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50" ref={chatContainerRef}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={
              msg.from === 'user'
                ? 'flex justify-end'
                : 'flex justify-start'
            }
          >
            <div
              className={
                'rounded-2xl px-4 py-3 ' +
                (msg.type === 'image'
                  ? 'w-full'
                  : 'max-w-xs') + ' ' +
                (msg.from === 'user'
                  ? 'bg-blue-500 text-white rounded-br-none'
                  : 'bg-gray-200 text-gray-900 rounded-bl-none')
              }
            >
              {msg.type === 'image' ? (
                <img
                  src={msg.image}
                  alt="generated"
                  className="w-full h-auto object-cover rounded-xl mb-2"
                  onLoad={scrollToBottom}
                />
              ) : null}
              {msg.type === 'loading' ? (
                <div className="flex items-center gap-2"><span className="animate-pulse">⏳</span> Generating image...</div>
              ) : null}
              {msg.text}
            </div>
          </div>
        ))}
      </div>
      <form
        onSubmit={handleSend}
        className="p-4 border-t bg-white flex gap-2"
        style={{ boxShadow: '0 -2px 8px rgba(0,0,0,0.03)' }}
      >
        <input
          type="text"
          className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={loading}
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
          disabled={loading}
        >
          Send
        </button>
      </form>
    </main>
  );
} 