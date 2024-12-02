# Stage 1: Build the application using Bun
FROM oven/bun:latest AS build

WORKDIR /app

COPY package.json ./
RUN bun install

COPY . .

RUN bun run build

# Stage 2: Run the application using Bun
FROM oven/bun:alpine

WORKDIR /app

COPY --from=build /app ./

EXPOSE 5555

CMD ["bun", "./build"]
