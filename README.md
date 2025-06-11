# MoMo Data Analysis

A fullstack application to process SMS data from MTN MoMo service, clean and categorize the data, store it in a relational database, and build a frontend interface to analyze and visualize the data.

## Features

- Parse XML SMS data from mobile money transactions
- Categorize transactions (deposits, withdrawals, payments, etc.)
- Store data in Neon PostgreSQL database using Drizzle ORM
- Track contacts and transaction history
- Analyze spending patterns and transaction history

## Setup

1. Clone the repository:
   ```
   git clone https://github.com/Mukunzijames/MoMo-Data-Analysis.git
   cd MoMo-Data-Analysis
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```
   # Neon Database Connection
   DATABASE_URL=postgres://username:password@endpoint.neon.tech/dbname
   
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   ```

4. Replace the `DATABASE_URL` with your actual Neon database connection string.

5. Push the database schema to your Neon database:
   ```
   npm run db:push
   ```

## Importing SMS Data

To import your mobile money SMS data from an XML file:

```
npm run import-xml -- path/to/your/modified_sms_v2.xml
```

This command will:
1. Parse the XML file
2. Extract transaction details from SMS messages
3. Store the data in your Neon database
4. Track contacts and transaction history

## Database Schema

The application uses the following tables:

- **transactions**: Stores all mobile money transactions
- **contacts**: Stores unique contacts from transactions
- **categories**: Used for transaction categorization
- **raw_sms**: Stores the original SMS data

## Development

Start the development server:

```
npm run dev
```

## Building for Production

```
npm run build
npm start
```

## License

ISC

## Project Structure

```
MoMo-Data-Analysis/
├── frontend/              # Frontend assets
│   ├── css/               # CSS stylesheets
│   ├── js/                # JavaScript files
│   └── images/            # Images and icons
├── src/
│   ├── data/              # Data processing scripts and raw data
│   ├── database/          # Database connection and models
│   ├── utils/             # Utility functions
│   └── test_db.py         # Database connection test
├── index.html             # Main frontend entry point
├── requirements.txt       # Python dependencies
└── README.md              # Project documentation
```

## Setup Instructions

### Prerequisites
- Python 3.7+
- Neon DB account (PostgreSQL)

### Database Setup
1. Create a database in Neon DB
2. Create a `.env` file in the project root with the following variables:
```
DATABASE_URL=postgresql://[user]:[password]@[neon_hostname]/[dbname]?sslmode=require
```

### Installation
1. Install dependencies:
```
pip install -r requirements.txt
```

2. Run the database setup script:
```
python src/database/schema.py
```

3. Test the database connection and CRUD operations:
```
python src/test_db.py
```

### Frontend Setup
The frontend is built with pure HTML, CSS, and JavaScript without any frameworks. The main entry point is the `index.html` file in the root directory, which makes it easy to deploy to hosting services like Vercel.

To view the frontend locally, simply open the index.html file in your browser:
```
open index.html
```

## Frontend Features

- Responsive design that works on mobile, tablet, and desktop
- Interactive dashboard with transaction statistics
- Collapsible sidebar navigation
- Chart visualization for transaction data
- Table display for recent transactions
- Mobile-friendly interface

## Contributors
- lOIC hIGIRO