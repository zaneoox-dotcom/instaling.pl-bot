# instaling.pl-bot 🤖

[![MIT license](https://img.shields.io/badge/License-MIT-blue.svg)](https://lbesson.mit-license.org/)

An automated bot designed to streamline the daily exercises on instaling.pl. This project leverages advanced browser automation and AI to provide a seamless learning experience.

## Table of Contents 📜

- [Project Title & Badges](#instalingpl-bot-%EF%B8%8F)
- [Description](#description)
- [Features](#features-%EF%B8%8F)
- [Tech Stack](#tech-stack-%ec%97%b0)
- [Installation](#installation-%EF%B8%8F)
- [Usage](#usage-%EF%B8%8F)
- [Project Structure](#project-structure-%F0%9F%AA%A1)
- [Contributing](#contributing-%EF%B8%8F)
- [License](#license-%F0%9F%93%9C)
- [Footer](#footer-%F0%9F%8E%97%EF%B8%8F)

## Description 📝

The instaling.pl-bot is a sophisticated tool built with Node.js that automates the process of completing daily exercises on the instaling.pl platform. It intelligently uses browser automation (Puppeteer) and an AI model (Google Gemini) to understand and correctly answer vocabulary exercises. The bot is designed to mimic human interaction patterns, making the automation less detectable and more natural.

## Features 🚀

- **Automated Exercise Completion:** Automatically navigates instaling.pl, logs in, and completes daily exercises.
- **AI-Powered Translation:** Utilizes Google Gemini API to translate Polish words and phrases into English, fitting them into provided sentences.
- **Human-like Interaction:** Employs `@nut-tree-fork/nut-js` to simulate human mouse movements, clicks, and typing, including natural delays and even intentional minor errors to avoid detection.
- **Personalized Calibration:** Includes a calibration step (`calibration.js`) to record user's mouse and typing patterns, which are then used by `player.js` to generate a personalized 'persona' for more realistic automation.
- **Caching:** Stores learned translations in `words.json` to speed up future sessions and improve efficiency.
- **Error Handling & Retries:** Implements robust error handling for API calls and browser interactions, with retry mechanisms.
- **Environment Configuration:** Uses `dotenv` to manage sensitive information like API keys and user credentials.

## Tech Stack 💻

- **Languages:** JavaScript
- **Frameworks/Libraries:**
  - Node.js
  - Puppeteer
  - `@nut-tree-fork/nut-js`
  - `dotenv`
  - Google Gemini API (via `fetch`)
- **Other:** Next.js (mentioned in analysis but not directly used in provided code), TypeScript (mentioned in analysis but not directly used in provided code), Python (mentioned in analysis but not directly used in provided code), Express (mentioned in analysis but not directly used in provided code).

## Installation 🛠️

1. **Clone the repository:**
   ```bash
   git clone https://github.com/zaneoox-dotcom/instaling.pl-bot.git
   cd instaling.pl-bot
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root of the project and add your credentials:

   ```env
   GEMINI_API_KEY=YOUR_GEMINI_API_KEY
   GEMINI_MODELS=MODELS_YOU_WANT_TO_USE(EX.gemini-3.5-flash-lite)
   user=YOUR_INSTALING_EMAIL
   password=YOUR_INSTALING_PASSWORD
   ```

4. **Run Calibration (First Time Use):**
   The first time you run the bot, it will prompt you to calibrate. Follow the on-screen instructions to record your mouse and typing patterns.
   ```bash
   node index.js
   ```
   Alternatively, if `rec.json` doesn't exist, it will automatically start calibration.

## Usage 💡

Once installed and configured, you can run the bot to automate your instaling.pl exercises:

1. **Start the bot:**
   ```bash
   node index.js
   ```

   The bot will:
   - Check for `rec.json`. If it doesn't exist, it will run the calibration process.
   - If `rec.json` exists, it will ask if you want to recalibrate.
   - Log in to instaling.pl using the credentials from your `.env` file.
   - Start a new exercise session.
   - Use the AI to translate words and fill in the blanks.
   - Simulate human typing and clicking to complete the exercises.

**Important Notes:**

- Ensure your `.env` file is correctly set up with your Google Gemini API key and instaling.pl credentials.
- The `calibration.js` script is crucial for the bot's ability to mimic human behavior. It's recommended to complete the calibration process thoroughly.
- The bot might ask if you are already logged in. Respond accordingly (`y`, `n`, or `a` for always skip). If you choose 'a', it will assume you are logged in and proceed.

## How to use 🧑‍🏫

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

## Project Structure 📂

```
instaling.pl-bot/
├── .env              # Environment variables (API key, credentials)
├── index.js          # Main entry point, orchestrates the bot's execution
├── package.json      # Project metadata and dependencies
├── README.md         # Project documentation (this file)
├── LICENSE           # Project license information
├── calibration.js    # Script for calibrating human-like interaction patterns
├── persona.js        # Module to build a 'persona' based on calibration data
├── player.js         # Module for simulating human mouse and keyboard actions
├── rec.json          # Stores calibration data (generated after running calibration)
└── words.json        # Cache for learned translations (generated by the bot)
```

## API Reference 🌐

This project primarily interacts with the **Google Generative Language API** (for Gemini models) to perform translations. It also uses browser automation APIs from Puppeteer and input simulation APIs from `@nut-tree-fork/nut-js`.

- **Google Generative Language API:**
  - Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
  - Used for translating Polish vocabulary and fitting them into English sentences.

- **Puppeteer:**
  - Used for browser control, navigating to instaling.pl, interacting with page elements (input fields, buttons), and extracting information.

- **`@nut-tree-fork/nut-js`:**
  - Used for simulating low-level human input (mouse movements, clicks, keyboard typing) to make the bot's actions appear more natural.

## Contributing 🙏

Contributions are welcome! If you'd like to contribute, please:

1. Fork the repository.
2. Create a new branch for your feature or bug fix (`git checkout -b feature/YourFeature`).
3. Make your changes and commit them (`git commit -am 'Add some feature'`).
4. Push to the branch (`git push origin feature/YourFeature`).
5. Open a Pull Request.

Please ensure your code adheres to the existing style and includes tests where appropriate.

## License 📄

This project is licensed under the **MIT License**. See the `LICENSE` file for more details.

## Footer 🌐

**Repository:** [instaling.pl-bot](https://github.com/zaneoox-dotcom/instaling.pl-bot)

**Author:** Zaneoox

**URL:** https://github.com/zaneoox-dotcom/instaling.pl-bot

--- 

> Built with ❤️ and advanced automation.
> 
> Fork this repository, give it a ⭐, and open an issue if you find any bugs or have suggestions!
