const API_URL = "http://localhost:80/rag/query-and-generate/";

const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

// Loader overlay utility
function getOrCreateLoader() {
  let loader = document.getElementById('global-loader');
  if (loader) return loader;
  loader = document.createElement('div');
  loader.id = 'global-loader';
  loader.style.position = 'fixed';
  loader.style.inset = '0';
  loader.style.display = 'none';
  loader.style.alignItems = 'center';
  loader.style.justifyContent = 'center';
  loader.style.background = 'rgba(0,0,0,0.35)';
  loader.style.zIndex = '9999';
  const spinner = document.createElement('div');
  spinner.style.width = '64px';
  spinner.style.height = '64px';
  spinner.style.border = '6px solid rgba(255,255,255,0.2)';
  spinner.style.borderTopColor = '#00d2ff';
  spinner.style.borderRadius = '50%';
  spinner.style.animation = 'spin 0.9s linear infinite';
  if (!document.getElementById('loader-keyframes')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'loader-keyframes';
    styleEl.textContent = '@keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }';
    document.head.appendChild(styleEl);
  }
  loader.appendChild(spinner);
  document.body.appendChild(loader);
  return loader;
}
function showLoader(){ getOrCreateLoader().style.display = 'flex'; }
function hideLoader(){ getOrCreateLoader().style.display = 'none'; }

// Ensure the publicationsBox element exists dynamically
let publicationsBox = document.getElementById("publications-box");
if (!publicationsBox) {
  publicationsBox = document.createElement("div");
  publicationsBox.id = "publications-box";
  publicationsBox.className = "publications-box";
  document.body.appendChild(publicationsBox); // Append it to the body or a specific container
}

sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendMessage();
  }
});

async function sendMessage() {
  const query = userInput.value.trim();
  if (!query) return;

  // Display user message
  addMessage(query, "user");
  userInput.value = "";

  try {
    const thinking = addThinkingIndicator();
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch response from the server");
    }

    const data = await response.json();

    // Replace thinking indicator with bot response
    thinking.stop(data.generated_output);

    // Display publications
    if (data.Publication && data.Publication.length > 0) {
      displayPublications(data.Publication);
    }
  } catch (error) {
    console.error("Error:", error);
    addMessage("Sorry, something went wrong. Please try again.", "bot");
  }
}

function addMessage(text, sender) {
  const message = document.createElement("div");
  message.className = `message ${sender}`;
  message.textContent = text;
  chatBox.appendChild(message);
  chatBox.scrollTop = chatBox.scrollHeight; // Scroll to the bottom
}

// In-chat thinking dots indicator (1–5 dots loop)
function addThinkingIndicator() {
  const message = document.createElement("div");
  message.className = "message bot";
  const base = "Thinking";
  let dots = 0;
  const maxDots = 5;
  message.textContent = `${base}.`;
  chatBox.appendChild(message);
  chatBox.scrollTop = chatBox.scrollHeight;

  const interval = setInterval(() => {
    dots = (dots % maxDots) + 1; // 1..5
    message.textContent = `${base}${".".repeat(dots)}`;
  }, 400);

  return {
    stop(finalText) {
      clearInterval(interval);
      message.textContent = finalText;
      chatBox.scrollTop = chatBox.scrollHeight;
    },
    cancel() {
      clearInterval(interval);
      message.remove();
    }
  };
}

async function fetchDocumentDetails(documentName) {
  try {
    const response = await fetch(`http://localhost:8000/get-document/?doc_name=${encodeURIComponent(documentName)}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch details for document: ${documentName}`);
    }

    const data = await response.json();
    console.log("Document Details:", data);
    // You can add logic here to display the document details in the UI
  } catch (error) {
    console.error(`Error fetching details for document ${documentName}:`, error);
  }
}

function displayPublications(publications) {
  publicationsBox.innerHTML = "<h3>Related Publications</h3>";
  publicationsBox.classList.add('panel');

  publications.forEach((pub) => {
    const pubItem = document.createElement("div");
    pubItem.className = "publication-item";

    const title = document.createElement('span');
    title.className = 'publication-item-title';
    title.textContent = pub;

    pubItem.appendChild(title);

    pubItem.addEventListener("click", () => {
      fetchDocumentDetails(pub);
    });

    publicationsBox.appendChild(pubItem);
  });
}