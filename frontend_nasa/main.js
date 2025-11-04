import { marked } from 'marked';

// Define the base URL for the API
const API_BASE_URL = "http://localhost:80";

// Loader overlay utility
function getOrCreateLoader() {
  let loader = window.document.getElementById('global-loader');
  if (loader) return loader;

  loader = window.document.createElement('div');
  loader.id = 'global-loader';
  loader.style.position = 'fixed';
  loader.style.inset = '0';
  loader.style.display = 'none';
  loader.style.alignItems = 'center';
  loader.style.justifyContent = 'center';
  loader.style.background = 'rgba(0,0,0,0.35)';
  loader.style.zIndex = '9999';

  const spinner = window.document.createElement('div');
  spinner.style.width = '64px';
  spinner.style.height = '64px';
  spinner.style.border = '6px solid rgba(255,255,255,0.2)';
  spinner.style.borderTopColor = '#00d2ff';
  spinner.style.borderRadius = '50%';
  spinner.style.animation = 'spin 0.9s linear infinite';

  // Keyframes injection once
  if (!window.document.getElementById('loader-keyframes')) {
    const styleEl = window.document.createElement('style');
    styleEl.id = 'loader-keyframes';
    styleEl.textContent = '@keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }';
    window.document.head.appendChild(styleEl);
  }

  loader.appendChild(spinner);
  window.document.body.appendChild(loader);
  return loader;
}

function showLoader() {
  const loader = getOrCreateLoader();
  loader.style.display = 'flex';
}

function hideLoader() {
  const loader = getOrCreateLoader();
  loader.style.display = 'none';
}

// Fetch all documents and display them as the first card
async function fetchAllDocuments() {
  try {
    showLoader();
    const response = await fetch(`${API_BASE_URL}/list-all-documents/`);
    if (!response.ok) {
      throw new Error('Failed to fetch all documents');
    }

    const data = await response.json();
    const documentsBox = document.getElementById('documents-box');

    // Create a card for "All Documents"
    const allDocumentsCard = document.createElement('div');
    allDocumentsCard.className = 'category-card selected'; // Add a "selected" class by default
    allDocumentsCard.textContent = 'All Documents';

    // Add event listener to handle click on "All Documents"
    allDocumentsCard.addEventListener('click', () => {
      console.log('All Documents clicked:', data.documents);
      setSelectedCard(allDocumentsCard);
      displayDocuments(data.documents, null); // Pass null for category since it's "All Documents"
    });

    // Pin the "All Documents" card as the first card
    const categoriesBar = document.getElementById('categories-bar');
    categoriesBar.prepend(allDocumentsCard);

    // Display all documents by default
    console.log('Default selection: All Documents', data.documents);
    displayDocuments(data.documents, null);
  } catch (error) {
    console.error('Error fetching all documents:', error);
  } finally {
    hideLoader();
  }
}

// Fetch categories from the API and display them in the horizontal bar
async function fetchCategories() {
  try {
    showLoader();
    const response = await fetch(`${API_BASE_URL}/list-categories/`);
    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }

    const data = await response.json();
    const categoriesBar = document.getElementById('categories-bar');

    data.categories.forEach(category => {
      const card = document.createElement('div');
      card.className = 'category-card';
      card.textContent = category;
      categoriesBar.appendChild(card);

      // Add event listener to handle click on category cards
      card.addEventListener('click', () => {
        console.log(`${category} clicked`);
        setSelectedCard(card);
        fetchCategoryData(category); // Fetch and display data for the selected category
      });
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
  } finally {
    hideLoader();
  }
}

// Fetch data for a specific category and display it
async function fetchCategoryData(categoryName) {
  try {
    showLoader();
    const response = await fetch(`${API_BASE_URL}/get-category/${categoryName}/`);
    if (!response.ok) {
      throw new Error(`Failed to fetch data for category: ${categoryName}`);
    }

    const data = await response.json();
    const names = data.data.map(item => item.properties.name); // Extract names
    displayDocuments(names, categoryName); // Pass category name for further actions
  } catch (error) {
    console.error(`Error fetching data for category ${categoryName}:`, error);
  } finally {
    hideLoader();
  }
}

// Fetch documents for a specific category and name
async function fetchDocumentsForItem(categoryName, itemName) {
  try {
    showLoader();
    const response = await fetch(`${API_BASE_URL}/list-documents/?category=${categoryName}&name=${itemName}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch documents for ${itemName} in category ${categoryName}`);
    }

    const data = await response.json();
    const documents = data.documents; // Extract documents
    displayDocuments(documents, null); // Display the documents, no category context needed
  } catch (error) {
    console.error(`Error fetching documents for ${itemName} in category ${categoryName}:`, error);
  } finally {
    hideLoader();
  }
}

// Fetch detailed document data and display it
async function fetchDocumentDetails(documentName) {
  try {
    showLoader();
    const response = await fetch(`${API_BASE_URL}/get-document/?doc_name=${documentName}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch details for document: ${documentName}`);
    }

    const data = await response.json();
    const docDetails = data.document; // Avoid shadowing the global document object

    // Display the document details
    const documentsBox = window.document.getElementById('documents-box'); // Explicitly use window.document
    documentsBox.innerHTML = ''; // Clear existing content

    // Create a container for the document details
    const documentContainer = window.document.createElement('div');
    documentContainer.style.position = 'relative';
    documentContainer.style.height = '80vh'; // Set height to 80% of the viewport
    documentContainer.style.overflowY = 'auto'; // Add scroll if content overflows
    documentContainer.style.padding = '10px';

    // Header row containing title (left) and button (right)
    const headerRow = window.document.createElement('div');
    headerRow.style.display = 'flex';
    headerRow.style.alignItems = 'center';
    headerRow.style.justifyContent = 'space-between';
    headerRow.style.gap = '12px';
    headerRow.style.position = 'sticky';
    headerRow.style.top = '0';
    headerRow.style.background = '#1e1e1e';
    headerRow.style.zIndex = '1';
    headerRow.style.padding = '8px 6px';
    headerRow.style.borderBottom = '1px solid #333';

    // Document name
    const nameElement = window.document.createElement('h2');
    nameElement.textContent = docDetails.name;
    nameElement.style.margin = '0';
    nameElement.style.fontSize = '20px';
    nameElement.style.fontWeight = '600';

    // View full document button
    const viewButton = window.document.createElement('button');
    viewButton.textContent = 'View Full Document';
    viewButton.style.margin = '0';
    viewButton.style.whiteSpace = 'nowrap';
    viewButton.addEventListener('click', () => {
      // Remove the summary section
      const summarySection = window.document.getElementById('summary-section');
      if (summarySection) {
        summarySection.remove();
      }

      // Display the full text
      const fullTextElement = window.document.createElement('div');
      fullTextElement.innerHTML = marked.parse(docDetails.text); // Parse markdown
      fullTextElement.style.marginTop = '20px';
      documentContainer.appendChild(fullTextElement);

      // Remove the button after showing the full text
      viewButton.remove();
    });
    headerRow.appendChild(nameElement);
    headerRow.appendChild(viewButton);
    documentContainer.appendChild(headerRow);

    // Display document summary below the button
    const summaryElement = window.document.createElement('div');
    summaryElement.innerHTML = marked.parse(docDetails.summary); // Parse markdown
    summaryElement.id = 'summary-section';
    summaryElement.style.marginTop = '16px';
    documentContainer.appendChild(summaryElement);

    documentsBox.appendChild(documentContainer);
  } catch (error) {
    console.error(`Error fetching details for document ${documentName}:`, error);
  } finally {
    hideLoader();
  }
}

// Utility function to set the selected card
function setSelectedCard(selectedCard) {
  const cards = document.querySelectorAll('.category-card');
  cards.forEach(card => card.classList.remove('selected'));
  selectedCard.classList.add('selected');
}

// Utility function to display documents in the scroll box
function displayDocuments(documents, categoryName) {
  const documentsBox = document.getElementById('documents-box');
  documentsBox.innerHTML = ''; // Clear existing content

  documents.forEach(doc => {
    const docItem = document.createElement('div');
    docItem.className = 'document-item';
    docItem.textContent = doc;
    documentsBox.appendChild(docItem);

    // Add event listener to fetch documents for the selected item
    if (categoryName) {
      docItem.addEventListener('click', () => {
        console.log(`Fetching documents for ${doc} in category ${categoryName}`);
        fetchDocumentsForItem(categoryName, doc);
      });
    } else {
      // Add event listener to fetch document details
      docItem.addEventListener('click', () => {
        console.log(`Fetching details for document: ${doc}`);
        fetchDocumentDetails(doc);
      });
    }
  });
}

// Utility function to clear documents from the scroll box
function clearDocuments() {
  const documentsBox = document.getElementById('documents-box');
  documentsBox.innerHTML = '';
}

// Call the functions to fetch and display data
fetchAllDocuments();
fetchCategories();
