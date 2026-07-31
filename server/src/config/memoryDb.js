import bcrypt from 'bcryptjs';

// In-Memory storage collections
export const memoryStore = {
  users: [],
  pages: [],
  versions: [],
  mergeRequests: [],
  auditLogs: [],
};

let isMemoryModeFlag = false;

export function setMemoryMode(val) {
  isMemoryModeFlag = val;
}

export function isMemoryMode() {
  return isMemoryModeFlag;
}

// Generate simple hex ID
export function generateId() {
  const bytes = [];
  for (let i = 0; i < 12; i++) {
    bytes.push(Math.floor(Math.random() * 256).toString(16).padStart(2, '0'));
  }
  return bytes.join('');
}
