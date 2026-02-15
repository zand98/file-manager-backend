#!/bin/sh

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Run the seeder
echo "🌱 Running database seeder..."
npm run seed

# Check if seed was successful
if [ $? -eq 0 ]; then
  echo "✅ Database seeded successfully!"
else
  echo "⚠️  Seeding failed, but continuing..."
fi

# Start the application in development mode
echo "🚀 Starting application in development mode..."
npm run start:dev
