# EMS Portal - Employee Management System (Mobile App)

This is the mobile client for the Employee Management System (EMS), built using **React Native**, **Expo**, and **Expo Router**. It connects to a Laravel backend using Sanctum token-based authentication.

---

## 🚀 Key Features

*   **Secure Session Storage**: Uses `expo-secure-store` to keep sessions active between app launches.
*   **Protected Routes Layout**: Conditionally mounts the tab layout only when a user is logged in. Unauthenticated users are redirected to the Login Screen.
*   **Robust Form Validation**: Automatically binds Laravel validation rules (`422 Unprocessable Content`) to form inputs with defensive checks to prevent runtime errors or app crashes.
*   **Departments CRUD**:
    *   Pull-to-refresh list of all departments.
    *   Add new departments or edit existing ones via smooth bottom sheet modals.
    *   Delete departments with dynamic confirmation prompts.
*   **Employees CRUD**:
    *   Overview of all employees, including their designations, departments, contact info, and annual salaries.
    *   Color-coded active/inactive status badges.
    *   Integrated custom **Department Selector Modal** that reads live departments from the server.
    *   Create, edit, and delete employee configurations.

---

## 📂 Project Directory Structure

```text
EMSOneApp/
├── .env                     # Environment variables (API base URL)
├── app/                     # Expo Router file-system routing directory
│   ├── (tabs)/
│   │   ├── _layout.tsx      # Configures bottom tabs (Departments & Employees)
│   │   ├── index.tsx        # Mounts Departments screen
│   │   └── employees.tsx    # Mounts Employees screen
│   └── _layout.tsx          # Root Stack & AuthContext state gating
├── src/                     # Moved core logic directory
│   ├── context/
│   │   └── AuthContext.tsx  # Global Auth state & SecureStore token management
│   ├── screens/
│   │   ├── LoginScreen.tsx  # Portal Sign-in screen
│   │   ├── DepartmentsScreen.tsx  # Departments lists & CRUD forms
│   │   └── EmployeesScreen.tsx    # Employees lists & CRUD forms
│   ├── services/
│   │   └── api.ts           # Axios client configured with Bearer Token interceptor
│   └── types/
│       └── index.ts         # TypeScript model interfaces (User, Department, Employee)
├── constants/               # Stylesheets, color schemes & design tokens
├── components/              # Reusable UI component elements
├── App.tsx                  # Expo app entrypoint
└── package.json             # NPM dependencies & scripts
```

---

## 🛠️ Installation & Setup

### 1. Prerequisites
Ensure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (v18+)
*   [NPM](https://www.npmjs.com/) or Yarn
*   [Android Studio](https://developer.android.com/studio) (for emulator) or the [Expo Go](https://expo.dev/go) app on a physical device.

### 2. Install Project Dependencies
Run the following command at the project root to install the packages:
```bash
npm install
```

### 3. Expose the Laravel Backend
Ensure your Laravel server is listening on all local network interfaces so your mobile device can reach it:
```bash
php artisan serve --host 0.0.0.0 --port 8000
```

### 4. Configure Environment Variables
Create or edit the `.env` file at the root of the mobile project:
```env
# For Android Emulator:
EXPO_PUBLIC_API_URL=http://10.0.2.2:8000/api

# For Physical Android Device / Expo Go:
# (Replace with your computer's local Wi-Fi IP address and ensure both devices are on the same Wi-Fi network)
# EXPO_PUBLIC_API_URL=http://192.168.X.X:8000/api
```

---

## 🏃 Running the Application

To start the Expo bundler:

```bash
# Start Expo development server
npx expo start

# Start directly on Android Emulator
npm run android
```

Once the development server is running, you can scan the QR code using the **Expo Go** app (Android/iOS) or press `a` in the terminal to launch the app in your Android Emulator.

---

## 🧼 Code Quality & Maintenance

The project is configured with TypeScript and Expo ESLint. To check for any issues, run:

```bash
# Compile and check TypeScript types
npx tsc --noEmit

# Run ESLint check
npm run lint
```
