"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconButton, Input, Typography, Avatar } from "@material-tailwind/react";
import { ChatBubbleLeftRightIcon, PaperAirplaneIcon, XMarkIcon } from "@heroicons/react/24/solid";

export default function FixedPlugin() {
  const [isHovered, setIsHovered] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef(null);

  // Realistic human photo for Alex â€“ friendly young African male doctor/professional
  // Static image, no animation
  const alexAvatar =
    "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isChatOpen) {
      scrollToBottom();
    }
  }, [isChatOpen]);

  const handleSend = () => {
    if (!message.trim()) return;

    console.log("User sent:", message);
    setMessage("");
    scrollToBottom();

    setIsThinking(true);

    setTimeout(() => {
      console.log("Alex: Thanks for your message! How can I assist with your health today?");
      setIsThinking(false);
      scrollToBottom();
    }, 1800);
  };

  return (
    <>
      {/* Floating button */}
      <div className="!fixed bottom-8 right-8 z-[9999]">
        <div className="relative group">
          <motion.div
            className="absolute inset-[-14px] rounded-full bg-blue-500/20 pointer-events-none"
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.4, 0.08, 0.4],
            }}
            transition={{
              duration: 3.4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <motion.div
            whileHover={{ scale: 1.15, y: -6 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <IconButton
              color="blue"
              size="lg"
              ripple={true}
              className="
                rounded-full !shadow-2xl shadow-blue-500/40 
                hover:shadow-blue-600/60 
                relative z-10 transition-all duration-300
              "
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onClick={() => setIsChatOpen(!isChatOpen)}
            >
              <ChatBubbleLeftRightIcon className="h-7 w-7" />
            </IconButton>
          </motion.div>

          <AnimatePresence>
            {isHovered && !isChatOpen && (
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                transition={{ duration: 0.25 }}
                className="
                  absolute bottom-full right-0 mb-4 px-5 py-2.5
                  bg-white text-blue-gray-900 text-sm font-medium
                  rounded-xl shadow-xl border border-blue-gray-100
                  whitespace-nowrap pointer-events-none
                "
              >
                Chat with Alex â€“ your AI health assistant
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Chat popup */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="
              !fixed bottom-28 right-8 z-[9998] w-80 sm:w-96 
              bg-white rounded-2xl shadow-2xl border border-blue-gray-100/80
              overflow-hidden flex flex-col max-h-[70vh] sm:max-h-[80vh]
            "
          >
            {/* Header */}
            <div className="bg-blue-600 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar
                  src={alexAvatar}
                  alt="Alex â€“ AI Health Assistant"
                  size="sm"
                  className="border-2 border-white ring-2 ring-blue-300/50"
                />

                <div>
                  <Typography variant="h6" className="text-white">
                    Alex â€“ AI Health Assistant
                  </Typography>
                  <Typography variant="small" className="opacity-80">
                    {isThinking ? "Thinking..." : "Online â€¢ Answers in seconds"}
                  </Typography>
                </div>
              </div>

              <IconButton
                variant="text"
                color="white"
                size="sm"
                onClick={() => setIsChatOpen(false)}
              >
                <XMarkIcon className="h-6 w-6" />
              </IconButton>
            </div>

            {/* Messages area */}
            <div
              className="
                flex-1 p-5 overflow-y-auto bg-gray-50 
                scroll-smooth scrollbar-thin scrollbar-thumb-blue-300 
                scrollbar-track-gray-100 min-h-[220px]
              "
            >
              <div className="space-y-6">
                {/* Welcome message from Alex */}
                <div className="flex items-start gap-3">
                  <Avatar
                    src={alexAvatar}
                    alt="Alex"
                    size="sm"
                    className="mt-1 flex-shrink-0"
                  />

                  <div className="bg-blue-100 text-blue-gray-900 rounded-2xl rounded-tl-none px-4 py-3 max-w-[75%]">
                    <Typography variant="small" className="font-medium">
                      Hello! I'm Alex, your AI health assistant.
                    </Typography>
                    <Typography variant="small" className="mt-1 opacity-80">
                      How can I help you today?
                    </Typography>
                  </div>
                </div>

                {/* Example user message */}
                <div className="flex items-start justify-end gap-3">
                  <div className="bg-blue-600 text-white rounded-2xl rounded-tr-none px-4 py-3 max-w-[75%]">
                    <Typography variant="small" className="font-medium">
                      I have a headache and feel very tired...
                    </Typography>
                  </div>
                  <Avatar
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=987&q=80"
                    alt="You"
                    size="sm"
                    className="mt-1 flex-shrink-0"
                  />
                </div>

                {/* Example Alex reply */}
                <div className="flex items-start gap-3">
                  <Avatar
                    src={alexAvatar}
                    alt="Alex"
                    size="sm"
                    className="mt-1 flex-shrink-0"
                  />

                  <div className="bg-blue-100 text-blue-gray-900 rounded-2xl rounded-tl-none px-4 py-3 max-w-[75%]">
                    <Typography variant="small" className="font-medium">
                      Sorry to hear that. Can you tell me more?
                    </Typography>
                    <Typography variant="small" className="mt-1 opacity-80">
                      When did the headache start? Any other symptoms like nausea, fever, or sensitivity to light?
                    </Typography>
                  </div>
                </div>

                {/* Alex thinking indicator */}
                <AnimatePresence>
                  {isThinking && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="flex items-start gap-3"
                    >
                      <Avatar
                        src={alexAvatar}
                        alt="Alex thinking"
                        size="sm"
                        className="mt-1 flex-shrink-0 ring-2 ring-blue-400/60"
                      />

                      <div className="bg-blue-100 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1.5 max-w-[75%]">
                        <motion.span
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 0.9, repeat: Infinity, repeatType: "reverse" }}
                          className="text-blue-600 text-xl font-black leading-none"
                        >
                          â€¢
                        </motion.span>
                        <motion.span
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 0.9, delay: 0.3, repeat: Infinity, repeatType: "reverse" }}
                          className="text-blue-600 text-xl font-black leading-none"
                        >
                          â€¢
                        </motion.span>
                        <motion.span
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 0.9, delay: 0.6, repeat: Infinity, repeatType: "reverse" }}
                          className="text-blue-600 text-xl font-black leading-none"
                        >
                          â€¢
                        </motion.span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input area */}
            <div className="border-t border-blue-gray-100 p-4 bg-white">
              <div className="relative flex items-center">
                <Input
                  type="text"
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  className="!pr-12"
                  containerProps={{ className: "min-w-0" }}
                />
                <IconButton
                  size="sm"
                  color="blue"
                  variant="text"
                  className="!absolute right-1"
                  onClick={handleSend}
                  disabled={!message.trim() || isThinking}
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
                </IconButton>
              </div>

              <Typography variant="small" className="mt-2 text-center text-gray-500">
                This is not medical advice â€¢ For emergencies call 112
              </Typography>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
