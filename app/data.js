'use server'
const crypto = require('crypto-js');


//let data = {key1:"value1", key2:"value2", key3:-25285}
// Encrypt

let messages = [];

/* Message schema 
{
  "key_tag": string - First three characters of key, used to avoid flooding one user's response with irrelevant responses
  "id": int - Used to avoid repeatedly adding messages to the end-user's log
  "data": {
    "sender": string - Sender display name
    "text": string - The text
  }
}
*/

export async function SendMessage(sender, text, key_tag) {
    messages.push({
        key_tag: key_tag,
        id: Math.floor(Math.random() * 10000000),
        data: {
            sender: sender,
            text: text
        },
        timestamp: new Date()
    });
    if (messages.length > 4) {
        messages.shift();
    }
    return;
}

export async function GetMessages(key_tag) {
    let newMessages = [];

    newMessages = messages.filter(message => message.key_tag == key_tag)

    return newMessages;
}