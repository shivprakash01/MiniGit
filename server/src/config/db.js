import mongoose from 'mongoose';
import dns from 'dns';
import { setMemoryMode } from './memoryDb.js';

// Resolve MongoDB SRV DNS queries using reliable public DNS servers
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (err) {
  console.warn('[Database] Custom DNS configuration skipped:', err.message);
}

export const connectDB = async () => {
  const connStr = process.env.MONGODB_URI || 'mongodb+srv://shivpra75_db_user:2cPrMwLyX3BTdVIu@cluster70.frlkkwc.mongodb.net/minigit_wiki?retryWrites=true&w=majority&appName=Cluster70';
  
  try {
    console.log(`[Database] Attempting connection to MongoDB Atlas...`);
    await mongoose.connect(connStr, { serverSelectionTimeoutMS: 5000 });
    console.log(`[Database] Successfully connected to MongoDB Atlas!`);
    setMemoryMode(false);
    return true;
  } catch (error) {
    console.warn(`[Database] External MongoDB unavailable (${error.message}).`);
    console.log(`[Database] Activating High-Performance Pure JavaScript In-Memory Storage Engine.`);
    setMemoryMode(true);
    return false;
  }
};
