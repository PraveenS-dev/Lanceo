import React, { useState } from "react";

export default function MessageInput({ onSend }) {
  const [text, setText] = useState("");

  const send = () => {
    if (text.trim()) {
      onSend(text);
      setText("");
    }
  };

  return (
    <div className="flex items-center">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="flex-1 border rounded-lg px-3 py-1 text-sm focus:outline-none dark:bg-zinc-800 dark:text-white"
        placeholder="Type a message..."
      />
      <button
        onClick={send}
        className="ml-2 px-3 py-1 bg-red-500 text-white rounded-lg"
      >
        Send
      </button>
    </div>
  );
}
