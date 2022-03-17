FROM nemesys/diploi-nextjs-template@[template-tag]

# Install application code
WORKDIR /app
COPY project/. ./
RUN npm install
