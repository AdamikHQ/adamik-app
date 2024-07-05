## Introduction

The Adamik-Client application is a boilerplate implementation of the main Adamik API endpoints. It serves as a starting point for developers looking to integrate with the Adamik API, providing essential functionalities and example usages of the API.
As a truly open-source project licensed under the MIT License, Adamik-Client encourages community contributions and collaboration to enhance and expand its capabilities.

### Useful links

- [Adamik website](https://adamik.io)
- [Adamik Developer Documentation](https://docs.adamik.io)
- [Adamik Application Demo](https://app.adamik.io)
- [Discord](https://discord.com/invite/gsZJR2JfMR)

## Table of Contents

- [Getting Started](#getting-started)
- [Prerequisites](#project-structure)
- [Installation](#installation)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Getting Started

The Adamik Application is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

To get a local copy up and running, follow these simple steps.

### Prerequisites

Make sure you have the following installed on your development machine:

- [Node.js](https://nodejs.org/en/)
- [pnpm](https://pnpm.io/)

### Installation

1. Clone the repo

   ```bash
   git clone https://github.com/your-username/adamik-client.git
   ```

2. Install dependencies

   ```bash
   cd adamik-client
   pnpm install
   ```

3. [Get your API key](https://dashboard.adamik.io/) if you don't already have one and set it in a file named `.env.local` at the root of the project.
   You will also need a Mobula API key to retrieve the price and

   ```
   NEXT_PUBLIC_ADAMIK_API_TEST_URL="https://api.adamik.io/api"
   ADAMIK_API_KEY="<your Adamik API key>"
   COINGECKO_API_KEY="<your CoinGecko API key>"
   MOBULA_API_KEY=""<your Mobula API key>"
   ```

### Running the Development Server

First, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Project Structure

A brief description of the project's structure:

- **/api**: API-related files and functions.
- **/app**: Main application folder, including higher-order components and primary application setup.
- **/components**: React components used throughout the application.
- **/hooks**: Custom React hooks for state and effect management.
- **/providers**: Context providers for state management across the application.
- **/utils**: Utility functions and helper methods.
- **/env.ts**: Environment variable definitions and configurations.

## Contributing

Any contributions you make to the Adamik App are **greatly appreciated**.
Feel free to also contact us through [Discord](https://discord.com/invite/gsZJR2JfMR) to report bugs or express feature requests.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.
