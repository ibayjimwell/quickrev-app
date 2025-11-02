// src/appwrite/client.js

import { Client, Account, Databases, Storage } from 'appwrite';

const client = new Client();

client
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT) // Your Appwrite API Endpoint
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID); // Your Project ID

// Export services that the frontend will use
export const appwriteClient = client;
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);