const dropdowns = document.querySelectorAll(".dropdown-container");
const inputLanguageDropdown = document.querySelector("#input-language");
const outputLanguageDropdown = document.querySelector("#output-language");
const inputLanguage = inputLanguageDropdown.querySelector(".selected");
const outputLanguage = outputLanguageDropdown.querySelector(".selected");
const inputTextArea = document.querySelector("#input-text");
const outputTextArea = document.querySelector("#output-text");
const swapButton = document.querySelector(".swap-position");
const uploadInput = document.querySelector("#upload-document");
const uploadTitle = document.querySelector("#upload-title");
const downloadButton = document.querySelector("#download-btn");
const copyButton = document.querySelector("#copy-btn");
const darkModeCheckbox = document.getElementById("dark-mode-btn");
const inputCharacterCount = document.querySelector("#input-chars");

function debounce(callback, delay = 500) {
  let timeoutId;

  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => callback.apply(this, args), delay);
  };
}

function translate() {
  const text = inputTextArea.value.trim();
  const sourceLanguage = inputLanguage.dataset.value;
  const targetLanguage = outputLanguage.dataset.value;

  if (!text) {
    outputTextArea.value = "";
    return;
  }

  outputTextArea.value = "Translating...";

  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLanguage}&tl=${targetLanguage}&dt=t&q=${encodeURI(
    text
  )}`;

  fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((result) => {
      outputTextArea.value = result[0]?.map((item) => item[0]).join("") || "";
    })
    .catch((error) => {
      console.error("Translation Error:", error);
      outputTextArea.value = "Error: Could not translate.";
    });
}

const debouncedTranslate = debounce(translate, 500);

function populateDropdown(dropdown, languages) {
  const menu = dropdown.querySelector("ul");
  menu.innerHTML = "";

  languages.forEach((language) => {
    const option = document.createElement("li");
    option.textContent = `${language.name} (${language.native})`;
    option.dataset.value = language.code;
    option.classList.add("option");

    const isDefaultOutput =
      dropdown.id === "output-language" && language.code === "en";
    const isDefaultInput =
      dropdown.id === "input-language" && language.code === "auto";

    if (isDefaultOutput || isDefaultInput) {
      option.classList.add("active");
    }

    menu.appendChild(option);
  });
}

populateDropdown(inputLanguageDropdown, languages);
populateDropdown(outputLanguageDropdown, languages);

dropdowns.forEach((dropdown) => {
  const toggle = dropdown.querySelector(".dropdown-toggle");
  const menu = dropdown.querySelector(".dropdown-menu");

  toggle.addEventListener("click", () => {
    const isOpen = dropdown.classList.toggle("active");
    toggle.setAttribute("aria-expanded", isOpen);
  });

  menu.addEventListener("click", (event) => {
    if (!event.target.classList.contains("option")) {
      return;
    }

    const selectedLanguage = dropdown.querySelector(".selected");
    menu.querySelector(".option.active")?.classList.remove("active");
    event.target.classList.add("active");
    selectedLanguage.textContent = event.target.textContent;
    selectedLanguage.dataset.value = event.target.dataset.value;
    dropdown.classList.remove("active");
    toggle.setAttribute("aria-expanded", "false");
    translate();
  });
});

document.addEventListener("click", (event) => {
  dropdowns.forEach((dropdown) => {
    if (!dropdown.contains(event.target)) {
      dropdown.classList.remove("active");
      dropdown
        .querySelector(".dropdown-toggle")
        .setAttribute("aria-expanded", "false");
    }
  });
});

swapButton.addEventListener("click", () => {
  if (inputLanguage.dataset.value === "auto") {
    return;
  }

  [inputLanguage.textContent, outputLanguage.textContent] = [
    outputLanguage.textContent,
    inputLanguage.textContent,
  ];
  [inputLanguage.dataset.value, outputLanguage.dataset.value] = [
    outputLanguage.dataset.value,
    inputLanguage.dataset.value,
  ];
  [inputTextArea.value, outputTextArea.value] = [
    outputTextArea.value,
    inputTextArea.value,
  ];

  inputLanguageDropdown
    .querySelector(".option.active")
    ?.classList.remove("active");
  outputLanguageDropdown
    .querySelector(".option.active")
    ?.classList.remove("active");
  inputLanguageDropdown
    .querySelector(`li[data-value="${inputLanguage.dataset.value}"]`)
    ?.classList.add("active");
  outputLanguageDropdown
    .querySelector(`li[data-value="${outputLanguage.dataset.value}"]`)
    ?.classList.add("active");

  translate();
});

inputTextArea.addEventListener("input", () => {
  if (inputTextArea.value.length > 5000) {
    inputTextArea.value = inputTextArea.value.slice(0, 5000);
  }

  inputCharacterCount.textContent = inputTextArea.value.length;
  debouncedTranslate();
});

uploadInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) {
    return;
  }

  if (file.type !== "text/plain") {
    alert("Please upload a valid .txt file.");
    return;
  }

  uploadTitle.textContent = file.name;

  const reader = new FileReader();
  reader.readAsText(file);
  reader.onload = (loadEvent) => {
    inputTextArea.value = loadEvent.target.result;
    inputCharacterCount.textContent = inputTextArea.value.length;
    translate();
  };
  reader.onerror = () => {
    console.error("Error reading file.");
    alert("Error reading file. Please ensure it is a valid text file.");
  };
});

downloadButton.addEventListener("click", () => {
  const text = outputTextArea.value;
  const language = outputLanguage.dataset.value;

  if (!text || !language) {
    return;
  }

  const file = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.download = `translated-to-${language}.txt`;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
});

copyButton.addEventListener("click", () => {
  const text = outputTextArea.value;
  if (!text || text === "Translating..." || text === "Error: Could not translate.") {
    return;
  }

  navigator.clipboard.writeText(text).then(() => {
    const label = copyButton.querySelector("span");
    const icon = copyButton.querySelector("ion-icon");
    const originalLabel = label.textContent;
    const originalIcon = icon.getAttribute("name");

    label.textContent = "Copied!";
    icon.setAttribute("name", "checkmark-outline");

    setTimeout(() => {
      label.textContent = originalLabel;
      icon.setAttribute("name", originalIcon);
    }, 2000);
  });
});

darkModeCheckbox.addEventListener("change", () => {
  document.body.classList.toggle("dark");
});
