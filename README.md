# 🍔 Food Telegram Bot

A modern and powerful Telegram bot for handling food delivery orders, built with TypeScript and powered by the [grammY](https://grammy.dev) framework. Designed for seamless user experience, robust admin tools, and exportable data — all packed into a minimal deployment setup.

---

## ✨ Features

- 🧾 **Order Creation**: Users can create and manage their food orders via Telegram chat
- 📦 **Order Management**: Admins can view, export, and modify orders easily
- 🗃️ **SQLite Storage**: Lightweight yet powerful local database support
- 📊 **Excel Export**: Download all orders in clean `.xlsx` format
- 🔐 **Admin Validation**: Protect actions with access control
- 🌐 **Timezone & Date Formatting**: Fully localized with `date-fns` & `date-fns-tz`
- 🧠 **Smart Menus**: Dynamic menus with `@grammyjs/menu`
- 💬 **Interactive Conversations**: Step-by-step flows with `@grammyjs/conversations`
- 🎯 **Custom Utilities**: Built-in support for phone formatting, admin dropping, and more

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/kms_food_telegram.git
cd kms_food_telegram
npm install
```

### 2. Environment Setup
Create a .env file in the project root:
```bash
BOT_TOKEN=your_telegram_bot_token
```

### 3. Development
Run the bot in development mode with hot-reloading:
```bash
npm run dev
```

### 4. Production Build
```bash
npm run build
```
---
### ✅ Code Quality

This project uses:
- **eslint** for linting
- **prettier** for code formatting
- **husky** for Git hooks
- **lint-staged** for staged file checks

