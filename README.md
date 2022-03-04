# Getting started

## Backend

0. Directory: `cd backend`
1. Install dependencies for backend

```
npm install
```

2. Copy API keys to `.env.local`
3. Start the server

```
npm run dev
```

Visiting `http://localhost:3000`, you should see something like `Welcome to Next.js` which means the server is ready.

## Chrome extension

0. Directory: `cd chrome-extension`

1. Install dependencies

```
yarn
```

2. Start the extension UI in dev mode

```
yarn dev
```

Visiting `http://localhost:3000`, you should see the main UI along with some sample text.

3. Build the extension

```
yarn build
```

This should create a directory called `dist`.

In Chrome, navigate to `chrome://extensions/`, turn on Developer mode.

Click `Load unpacked`, select the aforementioned `dist` directory.

You should be able to see the extension in Chrome. Go to any page, you should see the D_D translate main UI.
