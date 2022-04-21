FROM nemesys/diploi-tiny-template:[template-tag]

# Install application code
WORKDIR /app
COPY project/. ./
RUN npm install
