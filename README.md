# Foodlyx

Foodlyx is a full-stack web application designed to bridge the gap between food donors and organizations in need. It provides a real-time platform for restaurants, event organizers, and individuals to donate surplus food, which is then intelligently routed to NGOs, animal shelters, or compost units based on an AI-powered classification system.

## ✨ Key Features

*   **Role-Based Dashboards**: Tailored dashboards for Donors, NGOs, Animal Shelters, Compost Units, and Administrators, each with specific functionalities.
*   **Food Classification**: An intelligent system assesses food quality based on its preparation time and category to recommend the most suitable recipient (human, animal, or compost).
*   **Real-Time Food Feed**: A live, auto-updating feed displays all available food donations, allowing organizations to accept requests instantly.
*   **Interactive Community Hub**: A social space for users to share success stories, post updates, and engage with others in the network. Features a like system and an impact-based leaderboard.
*   **Comprehensive Admin Panel**: Administrators have access to platform-wide analytics, user management capabilities (including verification), and a complete history of all donation requests.
*   **Feedback & Rating System**: Receivers can submit detailed feedback and ratings for each donation, helping maintain quality and accountability.
*   **Subscription Management**: A subscription model for receiving organizations (NGOs, Shelters) to manage access and support the platform.
*   **Monetary Donations**: A dedicated charity page for users who wish to support the platform's operational costs through financial contributions.

## 🛠️ Tech Stack

*   **Frontend**: React, Vite, Tailwind CSS, Recharts, Framer Motion
*   **Backend & Database**: Firebase (Firestore, Firebase Authentication)
*   **Security**: Firestore Security Rules
*   **Legacy Backend (Reference)**: Node.js, Express, Socket.IO

## 🚀 Getting Started

To get the project running locally, follow these steps:

### 1. Clone the Repository

```bash
git clone https://github.com/tejasvagupta05/foodlyx.git
cd foodlyx
```

### 2. Set Up Firebase

1.  Create a new project on the [Firebase Console](https://console.firebase.google.com/).
2.  Add a new Web App to your Firebase project.
3.  Go to **Project Settings** > **General** and copy your Firebase configuration object.
4.  Navigate to the `FDD` directory and create a `.env` file by copying the example:

    ```bash
    cd FDD
    cp .env.example .env
    ```

5.  Paste your Firebase configuration into the `.env` file.

### 3. Configure Firestore

1.  In the Firebase Console, go to **Firestore Database** and create a new database in **Test mode** (you will secure it in the next step).
2.  Go to the **Rules** tab in the Firestore console.
3.  Copy the entire content of the `firestore.rules` file from the root of this repository.
4.  Paste the content into the rules editor and click **Publish**.

### 4. Install Dependencies & Run

1.  Install the frontend dependencies:

    ```bash
    # From the FDD/ directory
    npm install
    ```

2.  Start the development server:

    ```bash
    npm run dev
    ```

The application will now be running on `http://localhost:5173` (or another port if 5173 is in use).

### 5. Seed Demo Accounts (Optional)

To quickly populate your Firebase project with demo accounts for all roles, navigate to `/seed` in your running application. Click the "Create Demo Accounts" button to run the seeder script.

## 🧑‍💻 Demo Accounts

You can use the following credentials on the login page to explore the different roles:

| Role             | Email                | Password |
| ---------------- | -------------------- | -------- |
| Donor            | `donor@foodlyx.com`    | `pass123`  |
| NGO              | `ngo@foodlyx.com`      | `pass123`  |
| Animal Shelter   | `animal@foodlyx.com`   | `pass123`  |
| Compost Unit     | `compost@foodlyx.com`  | `pass123`  |
| Admin            | `admin@foodlyx.com`    | `admin123` |

## 📁 Project Structure

The repository is organized into two main directories:

*   **`FDD/`**: The primary frontend application built with React and Vite. It connects directly to the Firebase backend for all data operations.
*   **`server/`**: A legacy Node.js/Express backend that was previously used with a MongoDB database. This is now kept for reference purposes, as the application's logic has been fully migrated to a serverless Firebase architecture.

## ☁️ Backend & Database

The application's backend is powered entirely by Firebase, utilizing:

*   **Firestore**: A NoSQL document database for storing all application data, including users, food requests, and community posts. The detailed schema is documented in `FIRESTORE_SCHEMA.md`.
*   **Firebase Authentication**: Manages user sign-up, login (email/password and Google), and session persistence.
*   **Firestore Security Rules**: The `firestore.rules` file defines the access control logic, ensuring that users can only read and write data according to their assigned roles and permissions.
