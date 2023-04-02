# Use an official Node.js Alpine image as a parent image
FROM node:lts-alpine

# Set the working directory to /app
WORKDIR /app

# Copy package.json and yarn.lock to the container
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy the rest of the application files to the container
COPY . .

# Build the app
RUN yarn build

# Expose the port that the application will listen on
EXPOSE 3000

# Start the application
CMD [ "node", "dist/server.js", "--envPath", "dist/.env" ]