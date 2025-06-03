# hire_nebula

## Running the Application with Docker Compose

This project uses Docker Compose to orchestrate the backend and frontend services.

### Prerequisites

*   Docker: Make sure you have Docker installed. You can download it from [https://www.docker.com/get-started](https://www.docker.com/get-started).
*   Docker Compose: Docker Compose is included with Docker Desktop for Windows and macOS. For Linux, you might need to install it separately. See the [official documentation](https://docs.docker.com/compose/install/).

### Setup

1.  **Environment Variables for Backend:**
    Navigate to the `backend` directory and create a `.env` file by copying the example or renaming `backend/.env.example` (if one exists). Update it with your specific configurations:
    ```env
    DATABASE_URL="postgresql://user:password@db:5432/dbname" # Example, adjust if using a local or remote DB
    GOOGLE_API_KEY="your_google_api_key"
    ```
    *Note: The `DATABASE_URL` in this example assumes you might add a database service (e.g., PostgreSQL) named `db` to your `docker-compose.yml` later. If your database is external, use its actual connection string.*

2.  **Build and Run:**
    From the root directory of the project, run the following command:
    ```bash
    docker-compose up --build
    ```
    This command will:
    *   Build the Docker images for both the backend and frontend services (if they haven't been built already or if there are changes).
    *   Start the containers for both services.

3.  **Accessing the Applications:**
    *   Frontend: Open your web browser and navigate to [http://localhost:3000](http://localhost:3000)
    *   Backend API: The backend will be accessible at [http://localhost:8000](http://localhost:8000)

### Stopping the Application

To stop the application, press `Ctrl+C` in the terminal where `docker-compose up` is running.
To stop and remove the containers, you can run:
```bash
docker-compose down
```