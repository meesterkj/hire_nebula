# Backend Service

This backend service provides API endpoints for the application.

## Setup and Running

[Instructions on how to set up and run the backend will be added here once a Dockerfile is available or further clarification on the setup process is provided.]

## Environment Variables

The backend service requires the following environment variables to be set:

-   `DATABASE_URL`: The connection string for the PostgreSQL database.
    -   Example: `postgresql://user:password@localhost/dbname`
-   `GOOGLE_API_KEY`: Your Google API key for accessing Google services.
    -   Example: `your_google_api_key_here`

These variables can be configured by creating a `.env` file in the `backend` directory with the following format:

```env
DATABASE_URL="your_database_url"
GOOGLE_API_KEY="your_google_api_key"
```
