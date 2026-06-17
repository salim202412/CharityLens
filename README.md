# CharityLens

CharityLens is a transparent charity fundraising platform that connects donors with verified beneficiaries. The system allows individuals, mosques, and educational institutions to create fundraising cases, while administrators verify requests using a priority-based verification model before publishing them for donations.

---

## Features

### Beneficiary Features

* Register and login securely
* Submit fundraising cases
* Upload supporting proof documents
* Track fundraising progress
* View donation statistics
* Monitor case verification status

### Donor Features

* Browse verified cases
* Filter cases by category
* View detailed case information
* Donate securely through Razorpay
* Track donation contributions
* Receive real-time fundraising updates

### Administrator Features

* Review submitted cases
* Verify or reject requests
* Assign priority scores
* Emergency case bypass system
* Manage all fundraising campaigns
* Monitor platform activity

---

## Priority-Based Verification System

The platform uses a weighted scoring model:

Priority Score = (Urgency × 0.40) + (Impact × 0.35) + (Sustainability × 0.25)

### Factors

* **Urgency (40%)**

  * How critical the situation is

* **Impact (35%)**

  * Number of people affected

* **Sustainability (25%)**

  * Long-term benefit of the solution

### Emergency Bypass

Cases with very high urgency can automatically receive emergency priority treatment.

---

## Categories Supported

###  Masjid

Mosque construction, repairs, maintenance, and community projects.

###  Dar-ul-Uloom

Islamic educational institutions and related infrastructure.

###  Needy Individuals

Medical assistance, education support, and emergency financial aid.

---

## Technology Stack

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose

### Frontend

* EJS
* HTML5
* CSS3
* JavaScript

### Authentication & Security

* Express Session
* Bcrypt Password Hashing
* Helmet
* Express Rate Limit
* Express Mongo Sanitize
* XSS Clean
* Express Validator

### Payments

* Razorpay Payment Gateway

### Other Tools

* Nodemailer
* Multer
* Socket.IO (Real-time updates)

---

## Security Features

* Password hashing using Bcrypt
* Session-based authentication
* Role-based access control
* Rate limiting
* XSS protection
* NoSQL injection prevention
* Input validation and sanitization
* Secure payment processing

---

## Installation

### Clone Repository

```bash
git clone https://github.com/yourusername/CharityLens.git
cd CharityLens
```

### Install Dependencies

```bash
npm install
```
```
npm install socket.io
```

```bash
npm start
```

### Configure Environment Variables

Create a `.env` file:

```env
PORT=4000

MONGODB_URI=your_mongodb_connection_string

SESSION_SECRET=your_session_secret

EMAIL_USER=your_email
EMAIL_PASS=your_email_password

RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret
```

### Run Development Server

```bash
npm run dev
```

### Run Production Server

```bash
npm start
```

---

## Project Structure

```text
CharityLens/
│
├── config/
├── middleware/
├── models/
├── routes/
├── views/
├── public/
│
├── app.js
├── package.json
└── README.md
```

---

## Main Modules

### Authentication Module

* Registration
* Login
* Password Reset
* OTP Verification

### Case Management Module

* Case Submission
* Verification Workflow
* Priority Assignment
* Fundraising Tracking

### Donation Module

* Razorpay Integration
* Donation Recording
* Progress Tracking

### Dashboard Module

* Donor Dashboard
* Beneficiary Dashboard
* Admin Dashboard

---

## Future Improvements

* AI-assisted fraud detection
* Advanced analytics dashboard
* Donation receipts in PDF format
* Multi-language support
* Mobile application

---

## Authors

Developed as an MCA Project by:

* Salim Rashid
* Shakir Qayoom Bhat
* Rumaisa Ramzan
* Iqra Fayaz

---

## License

This project is developed for educational and research purposes.
