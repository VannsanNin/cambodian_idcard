# 🇰🇭 Cambodian National ID Card Management System
## ប្រព័ន្ធគ្រប់គ្រងអត្តសញ្ញាណបណ្ណសញ្ជាតិខ្មែរ

A modern, full-stack web application for managing Cambodian National ID cards, featuring deep integration with official Cambodian administrative data (Provinces, Districts, Communes, and Villages) via the Ministry of Economy and Finance (MEF) API.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Python](https://img.shields.io/badge/Python-3.8+-green.svg)
![Flask](https://img.shields.io/badge/Flask-3.0.0-lightgrey.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

---

## ✨ Features

- **📇 ID Card Registration**: Create and manage detailed ID card records including photo URLs, Khmer/Latin names, and family details.
- **🔍 Smart Search**: Powerful search functionality to find individuals by name, ID number, or address.
- **🗺️ MEF API Integration**: Built-in cascading dropdowns for Cambodian addresses (Province → District → Commune → Village) using live data from the MEF Open Data Portal.
- **📊 Real-time Statistics**: Dashboard showing total registrations with gender-based breakdowns.
- **🌓 Theme Management**: Supports both Light and Dark modes for a premium user experience.
- **📱 Responsive Design**: Fully responsive UI built with modern CSS (Glassmorphism, animations) that works on desktops and tablets.
- **🛠️ CRUD Operations**: Full Create, Read, Update, and Delete capabilities via a RESTful API.

---

## 🚀 Technology Stack

### Backend
- **Framework**: [Flask](https://flask.palletsprojects.com/) (Python)
- **Database**: [SQLite](https://www.sqlite.org/) with [SQLAlchemy](https://www.sqlalchemy.org/) ORM
- **API**: RESTful architecture with JSON support for Khmer Unicode
- **CORS**: Enabled for cross-origin resource sharing

### Frontend
- **Structure**: Semantic HTML5
- **Styling**: Vanilla CSS3 (Custom properties, Flexbox, Grid, Glassmorphism)
- **Logic**: Vanilla JavaScript (Async/Await, DOM manipulation)
- **Icons**: [Font Awesome 6](https://fontawesome.com/)
- **Typography**: Inter & Kantumruy Pro (Google Fonts)

---

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd final_project
```

### 2. Create a Virtual Environment (Recommended)
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/macOS
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Run the Application
```bash
python app.py
```
The server will start at `http://localhost:5000`.

---

## 📖 API Documentation

The application exposes a RESTful API at `/api`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| **GET** | `/api/id-cards` | Fetch all registered ID cards |
| **GET** | `/api/id-cards/{id}` | Fetch details of a specific card |
| **GET** | `/api/id-cards/search?q={term}` | Search cards by multiple criteria |
| **POST** | `/api/id-cards` | Register a new ID card |
| **PUT** | `/api/id-cards/{id}` | Update existing card details |
| **DELETE** | `/api/id-cards/{id}` | Delete a card record |
| **GET** | `/api/statistics` | Get summary statistics (Total, M/F) |

---

## 🗺️ Data Source Reference

This project utilizes address data from the **Ministry of Economy and Finance (MEF) Open Data Portal**:
- **Provinces**: [MEF Public Dataset pd_66a8603700604c000123e144](https://data.mef.gov.kh/api/v1/public-datasets/pd_66a8603700604c000123e144/json)
- **Villages/Communes/Districts**: [MEF Public Dataset pd_66a8603a00604c000123e147](https://data.mef.gov.kh/api/v1/public-datasets/pd_66a8603a00604c000123e147/json)

---

## 📄 License

Copyright © 2024 ប្រព័ន្ធគ្រប់គ្រងអត្តសញ្ញាណបណ្ណសញ្ជាតិខ្មែរ | Cambodian National ID System.
Managed by General Department of Digital Economy.

---
*Developed with ❤️ for the Cambodian Digital Economy.*
