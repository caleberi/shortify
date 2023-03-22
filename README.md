[![Deno](https://github.com/caleberi/deno-url-shortner/actions/workflows/deno.yml/badge.svg)](https://github.com/caleberi/deno-url-shortner/actions/workflows/deno.yml)

# URL Shortener API

This is a URL shortener API built on the Deno platform using TypeScript. It's a simple tool that takes a long URL and turns it into a short, custom URL that you can use however you like. You can even connect your own custom domain to the URL shortener, which acts as a base for all the short links you create.

## Technologies Used

- Deno
- TypeScript

## How to Contribute

To contribute to this project, follow the steps below:

1. Fork this repository.
2. Clone the forked repository to your local machine.
3. Install Deno on your machine.
4. Navigate to the project directory in your terminal.
5. Run `deno run --allow-net --allow-write --allow-read app.ts` to start the server.
6. Make the changes you want and commit them.
7. Push your changes to your forked repository.
8. Create a pull request to the main repository.

## Endpoints

The following endpoints are available in this API:

### User

- POST /users/signup: Create a user profile so that all created shortened links will be associated with your profile.
- GET /users/me: Retrieve user profile via the provided auth token.
- POST /users/login: Logging into user account to retrieve an authorisation token.

### Short URL

- POST /urls: Create a short URL.
- GET /urls/:code: Retrieve a long URL associated with a given code.
- GET /urls/stats/:code: Retrieve statistics for a given short URL code.

## License

This project is licensed under the MIT License.

