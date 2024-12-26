const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const messagesDiv = document.getElementById('messages');
// Variable to hold the typing indicator message
let typingMessage = null; 

// Function to add messages to the chat
function appendMessage(content, role) {
    // Create a new div element for the message
    const messageElement = document.createElement('div');
    // Set the class of the message element based on who sent the message (user or assistant)
    messageElement.className = role;

    // Create a bubble for the message text
    const bubbleElement = document.createElement('div');
    bubbleElement.className = 'message-bubble'; // Class for styling the message bubble
    bubbleElement.textContent = content; // Set the text inside the bubble

    // Append the bubble to the message element
    messageElement.appendChild(bubbleElement);
    
    // Add the message element to the messages display area
    messagesDiv.appendChild(messageElement);
    
    // Scroll to the bottom to show the latest message
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Function to show a typing indicator
function showTypingIndicator() {
    // Create a new div for the typing message
    typingMessage = document.createElement('div');
    
    // Set the class for styling the typing indicator
    typingMessage.className = 'assistant typing';
    
    // Set the text for the typing indicator
    typingMessage.textContent = 'PouncePal is typing...';
    
    // Add the typing indicator to the messages display area
    messagesDiv.appendChild(typingMessage);
    
    // Keep scrolling down to show the typing indicator
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Function to remove the typing indicator
function removeTypingIndicator() {
    // Check if there's a typing message to remove
    if (typingMessage) {
        // Remove the typing message from the display area
        messagesDiv.removeChild(typingMessage);
        
        // Reset the typing message variable
        typingMessage = null;
    }
}

// Handle the form submission event
chatForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent the page from refreshing when the form is submitted
    
    // Get the user's message from the input field
    const userMessage = messageInput.value;

    // Check if the user message is empty
    if (!userMessage.trim()) {
        appendMessage('Hey, please type something!', 'assistant'); // Prompt user to enter a message
        return; // Exit the function early if there's no message
    }

    // Display the user's message in the chat
    appendMessage(userMessage, 'user');
    
    // Clear the input field for the next message
    messageInput.value = ''; 

    // Show the typing indicator while waiting for the assistant's response
    showTypingIndicator();

    // Send the user's message to the server
    try {
        const response = await fetch('https://pouncepal-chatbot.onrender.com/backend/new', {
            method: 'POST', // Use POST method to send data
            headers: {
                'Content-Type': 'application/json', // Specify that we're sending JSON data
            },
            body: JSON.stringify({ 
                content: userMessage,  // Send the user's message content
                role: 'user'           // Include the role as 'user'
            }),
        });

        // Check if the response is not OK (status outside the 200-299 range)
        if (!response.ok) {
            const errorData = await response.json(); // Get error details from the response
            throw new Error(errorData.details || 'Oops! Something went wrong.'); // Throw an error with details
        }

        // Parse the JSON response from the server
        const data = await response.json();
        console.log('Response data:', data); // Log the response for debugging

        // Remove the typing indicator before displaying the response
        removeTypingIndicator();

        // Check if there's a response from the assistant
        if (data.response) {
            appendMessage(data.response, 'assistant'); // Display the assistant's reply
        } else {
            appendMessage('Looks like the assistant has nothing to say.', 'assistant'); // Handle empty response
        }
    } catch (error) {
        console.error('Error occurred:', error); // Log any error that occurs during the fetch
        removeTypingIndicator(); // Remove the typing indicator if there's an error
        
        // Inform the user about the error
        appendMessage('Oops! There was an error. Please try again.', 'assistant');
        console.error('Error message:', error.message); // Log the specific error message
    }
});

