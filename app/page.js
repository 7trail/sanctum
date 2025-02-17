'use client'
import Image from "next/image";
import { GetMessages, SendMessage } from "./data";
import { useState, useEffect, useRef } from "react";
import { v4 as uuidv4, v6 as uuidv6 } from 'uuid';
const crypto = require('crypto-js');



function useInterval(callback, delay) {
  const savedCallback = useRef();
 
  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
 
  // Set up the interval.
  useEffect(() => {
    function tick() {
      savedCallback.current();
    }
    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

function encode(data, key) {
  let ciphertext = crypto.AES.encrypt(data, key).toString();
  return ciphertext;
}

function decode(data,key) {
  try {
  let bytes  = crypto.AES.decrypt(data, key);
  let originalText = bytes.toString(crypto.enc.Utf8);
  return originalText;
  }
  catch (e) {
    return "";
  }
}

function Message(message, showHeader = true) {
  return <div id={message.id} className={"message " + (showHeader ? "show-header" : "hide-header")} key={message.id}>
    {showHeader && <div className="title-line flex-left">
      <p className="sender">-- {message.sender} --</p>
      <p className="timestamp">{message.timestamp.toLocaleString()}</p>
    </div>}
    <p className={"message-text"}>{message.text}</p>
  </div>
}

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [key, setKey] = useState("");
  const [text, setText] = useState("");
  const [sender, setSender] = useState("");
  const [hideKey, setHideKey] = useState(true);
  const divRef = useRef(null);

  async function UpdateMessages() {
    let newMessages = await GetMessages(key.substring(0, 3));
    let oldMessages = messages;
    let ids = oldMessages.map(msg => msg.id);
    newMessages = newMessages.filter(msg => {
      return !ids.includes(msg.id);  
    })
    oldMessages.push(...newMessages);
    let arrayCopy= [...oldMessages];
    setMessages(arrayCopy);
  }

  useInterval(async () => {
    if (key.length >= 3) {
      await UpdateMessages();
    }
  }, 5000);

  useEffect(() => {
    setKey(uuidv4());
  }, []);

  useEffect(() => {
    if (divRef.current) {
      divRef.current.scrollTop = divRef.current.scrollHeight;
    }
  }, [messages])

  function MessageList() {
    let lastOwner = "";
    let lastNotedTimestamp = 0;
    let msgs = messages.filter(message => decode(message.data.text,key).length > 0).map((message) => {
      let decoded = message;
      decoded.text = decode(message.data.text,key);
      decoded.sender = decode(message.data.sender,key);

      let addHeader = decoded.sender != lastOwner;
      if (decoded.timestamp - lastNotedTimestamp > (1000 * 60 * 5)) {
        addHeader = true;
        lastNotedTimestamp = decoded.timestamp;
      }
      lastOwner = decoded.sender;

      return Message(decoded, addHeader)
    })

    return (
      <div className="message-list" ref={divRef}>
        {msgs}
      </div>
    );
  }

  function Inputs() {
    return (
      <header className="flex-spread">
        <div className="logo">
          <h1>Sanctum</h1>
        </div>
        <div className="inputs">
          <input type={hideKey ? "password" : "text"} value={key} onChange={(e) => setKey(e.target.value)} placeholder="Enter a key min. 3 characters"/>
          <input type="text" value={sender} onChange={(e) => setSender(e.target.value)} placeholder="Your Display Name"/>
          <div className="flex-spread">
            <button onClick={() => navigator.clipboard.writeText(key)}>Copy Key</button>
            <div>
              <label htmlFor="hide-key">Hide Key</label>
              <input id="hide-key" type="checkbox" checked={hideKey} onChange={(e) => setHideKey(e.target.checked)} />
            </div>
          </div>
        </div>
      </header>
    );
  }

  function TextInput() {
    return (
      <input className="text-input" type="text" value={text} onChange={(e) => setText(e.target.value)} onKeyDownCapture={
        async (e) => {
          if (e.key == "Enter" && key.trim().length >= 3) {
            e.preventDefault();
            setText("");
            let encodedSender = encode(sender.trim().length > 0 ? sender : "Anonymous", key);
            let encodedText = encode(text, key);
            await SendMessage(encodedSender, encodedText, key.substring(0, 3));
            await UpdateMessages();
          }
        }
      } maxLength={512} placeholder="Enter a message"/>
    )
  }

  return (
    <div className = "main">
      {Inputs()}
      {MessageList()}
      {TextInput()}
    </div>
  );
}
