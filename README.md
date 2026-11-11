# instaling.pl-bot 

[![MIT license](https://img.shields.io/badge/License-MIT-blue.svg)](https://lbesson.mit-license.org/)

An automated bot designed to streamline the daily exercises on instaling.pl. This project leverages advanced browser automation and AI to provide a seamless learning experience.

## Warning 

The bot might not work properly if u have instaling plus purchased

## Table of Contents 

- [Project Title & Badges](#instalingpl-bot)
- [Description](#description)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Usage](#usage)
- [How to Use](#how-to-use)
- [API Reference](#api-reference)
- [Contributing](#contributing)
- [License](#license)

## Description 

The instaling.pl-bot is a sophisticated tool built with Node.js that automates the process of completing daily exercises on the instaling.pl platform. It intelligently uses browser automation (Puppeteer) and an AI model (Google Gemini) to understand and correctly answer vocabulary exercises. The bot is designed to mimic human interaction patterns, making the automation less detectable and more natural.

## Features 

- **Automated Exercise Completion:** Automatically navigates instaling.pl, logs in, and completes daily exercises.
- **AI-Powered Translation:** Utilizes Google Gemini API to translate Polish words and phrases into English, fitting them into provided sentences.
- **Human-like Interaction:** Employs `@nut-tree-fork/nut-js` to simulate human mouse movements, clicks, and typing, including natural delays and even intentional minor errors to avoid detection.
- **Personalized Calibration:** Includes a calibration step (`calibration.js`) to record user's mouse and typing patterns, which are then used by `player.js` to generate a personalized 'persona' for more realistic automation.
- **Caching:** Stores learned translations in `words.json` to speed up future sessions and improve efficiency.
- **Error Handling & Retries:** Implements robust error handling for API calls and browser interactions, with retry mechanisms.
- **Environment Configuration:** Uses `dotenv` to manage sensitive information like API keys and user credentials.

## Tech Stack 

- **Languages:** JavaScript
- **Frameworks/Libraries:**
  - Node.js
  - Puppeteer
  - `@nut-tree-fork/nut-js`
  - `dotenv`
  - Google Gemini API (via `fetch`)
    

## Installation 

1. **Clone the repository:**
   ```bash
   git clone https://github.com/zaneoox-dotcom/instaling.pl-bot.git
   cd instaling.pl-bot
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Get a Google Gemini API Key:**
   * Go to [Google AI Studio API Keys](https://aistudio.google.com/api-keys) and sign in with your Google account.
   * Click **Create API key**, select or create a Google Cloud project, and copy the generated key.

4. **Configure Environment Variables:**
   Create a `.env` file in the root of the project and add your credentials (for `GEMINI_MODELS`, list at least 3 models separated by commas for fallback):

   ```env
   GEMINI_API_KEY=YOUR_GEMINI_API_KEY
   GEMINI_MODELS=gemini-3.5-flash-lite,gemini-3.1-flash-lite,gemini-2.5-flash-lite,gemini-3.8-flash,gemini-3.5-flash
   user=YOUR_INSTALING_EMAIL
   password=YOUR_INSTALING_PASSWORD
   ```

## Usage 

Once installed and configured, you can run the bot to automate your instaling.pl exercises:

1. **Configure Mistake Settings:**
     In `index.js` (lines **23–24**), adjust the maximum number of wrong answers per session and the error probability (`0` to `1` range, where `0.3` is 30% for a word to be wrong).

2. **Start the bot:**
   ```bash
   node index.js
   ```

   The bot will:
   - Run the calibration process.
   - Log in to instaling.pl using the credentials from your `.env` file.
   - Start a new exercise session.
   - Use the AI to translate words and fill in the blanks.
   - Simulate human typing and clicking to complete the exercises.

## How to use 

This bot is designed for users who want to save time on their daily instaling.pl vocabulary practice. By automating the process, users can focus on reviewing rather than the repetitive task of inputting answers.

**Example Workflow:**

1.  Run `node index.js` after setup.
2.  The bot opens a browser window and navigates to instaling.pl.
3.  It logs in.
4.  It starts a vocabulary session.
5.  For each question, it fetches the Polish word and sentence context.
6.  It sends this information to the Google Gemini API for translation.
7.  It then types the predicted English translation into the input field, simulating your typing style.
8.  It checks the answer and proceeds to the next word.
9.  Learned translations are cached for future use.

## API Reference 

This project primarily interacts with the **Google Generative Language API** (for Gemini models) to perform translations. It also uses browser automation APIs from Puppeteer and input simulation APIs from `@nut-tree-fork/nut-js`.

- **Google Generative Language API:**
  - Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
  - Used for translating Polish vocabulary and fitting them into English sentences.

- **Puppeteer:**
  - Used for browser control, navigating to instaling.pl, interacting with page elements (input fields, buttons), and extracting information.

- **`@nut-tree-fork/nut-js`:**
  - Used for simulating low-level human input (mouse movements, clicks, keyboard typing) to make the bot's actions appear more natural.

## Contributing 

Contributions are welcome! If you'd like to contribute, please:

1. Fork the repository.
2. Create a new branch for your feature or bug fix (`git checkout -b feature/YourFeature`).
3. Make your changes and commit them (`git commit -am 'Add some feature'`).
4. Push to the branch (`git push origin feature/YourFeature`).
5. Open a Pull Request.

Please ensure your code adheres to the existing style and includes tests where appropriate.

## License 

This project is licensed under the **MIT License**. See the `LICENSE` file for more details.
