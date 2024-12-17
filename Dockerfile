# Base image
FROM node:18
# Set working directory in the container
WORKDIR /usr/src/app
# Copy package.json and install dependencies
COPY server/package*.json ./
RUN npm install
# Copy the rest of the code
COPY Cure-Cart-Ecommerce/ ./
# Expose the port your backend uses
EXPOSE 5001 
# Command to run the app
CMD ["npm", "start"] 